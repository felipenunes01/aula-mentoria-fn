import numpy as np, wave, sys
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
TOTAL = 24.2
VOZ = {1: 0.9, 2: 6.3, 3: 10.4, 4: 14.5, 5: 21.55}  # início de cada frase (s)
FLASH = [6.2, 6.98, 7.95, 8.83]                     # batidas da cena 2
S3, S4, S5, IMPACT = 10.0, 13.9, 18.9, 21.6
vdir = sys.argv[1]; out = sys.argv[2]
N = int(TOTAL * SR); t = np.arange(N) / SR
rng = np.random.default_rng(7)

def lp(x, f): return sosfilt(butter(4, f, "low", fs=SR, output="sos"), x)
def hp(x, f): return sosfilt(butter(2, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)
def env(a, b, fi=0.5, fo=0.5):
    e = np.clip((t - a) / max(fi, 1e-3), 0, 1) * np.clip((b - t) / max(fo, 1e-3), 0, 1)
    return e
def place(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * gain

L = np.zeros(N); R = np.zeros(N)

# 1) drone grave (lá 55 Hz + quinta), com respiração lenta
drone = (np.sin(2*np.pi*55*t) + .5*np.sin(2*np.pi*82.4*t + 1) + .25*np.sin(2*np.pi*110.3*t)) * (0.6 + 0.4*np.sin(2*np.pi*0.18*t))
dr_env = env(0, IMPACT - 0.05, 3.0, 0.05) * (1 - 0.75*env(S4 - 0.05, S4 + 1.6, 0.05, 1.2)) * (1 + 0.8*np.clip((t - S5) / (IMPACT - S5), 0, 1) * (t < IMPACT))
drone = lp(drone, 400) * dr_env * 0.22
L += drone; R += drone

# 2) textura atmosférica (ruído filtrado, estéreo)
for ch, seed in ((L, 1), (R, 2)):
    n = np.random.default_rng(seed).standard_normal(N)
    pad = bp(n, 300, 2400) * (0.5 + 0.5*np.sin(2*np.pi*0.07*t + seed))
    ch += pad * env(0.5, IMPACT, 4.0, 0.05) * (1 - 0.7*env(S4 - .05, S4 + 1.5, .05, 1.2)) * 0.018

# 3) impactos graves (boom) nas batidas e nas viradas de cena
def boom(dur=2.2, f0=110, f1=34, amp=1.0, noise=0.25):
    tt = np.arange(int(dur * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-tt * 9)
    ph = 2*np.pi*np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-tt * 2.6)
    click = rng.standard_normal(len(tt)) * np.exp(-tt * 40) * noise
    return (s + lp(click, 3000)) * amp
for k, at in enumerate(FLASH):
    b = boom(amp=0.55 if k in (1,) else 0.38); place(L, b, at); place(R, b, at)
for at, a in ((S3, .35), (S4, .5)):
    b = boom(amp=a); place(L, b, at); place(R, b, at)

# 4) pulsação de coração nos bastidores (cena 3)
beat = 0.78; bt = S3 + 0.4
while bt < S4 - 0.3:
    for off, a in ((0, .32), (0.17, .2)):
        b = boom(dur=.45, f0=80, f1=45, amp=a, noise=.05); place(L, b, bt + off); place(R, b, bt + off)
    bt += beat

# 5) riser até o impacto (cena 5) + ruído reverso
rr = (t >= S5 - 1.0) & (t < IMPACT)
x = np.clip((t - (S5 - 1.0)) / (IMPACT - S5 + 1.0), 0, 1)
tone = np.sin(2*np.pi*np.cumsum(70 + 330 * x**2.2) / SR) * x**2 * 0.18
n = rng.standard_normal(N); sweep = np.zeros(N)
seg = np.where(rr)[0]
for i0 in range(seg[0], seg[-1], 2205):
    i1 = min(i0 + 2205, seg[-1]); fc = 300 + 7000 * x[i0]**2
    sweep[i0:i1] = bp(n[i0 - 2000:i1], fc * .7, min(fc * 1.3, 20000))[-(i1 - i0):]
sweep *= x**3 * 0.16
for ch in (L, R): ch += (tone + sweep) * rr

# 6) IMPACTO do "HOJE": boom grande + estalo + cauda
big = boom(dur=3.8, f0=140, f1=28, amp=1.25, noise=.6)
place(L, big, IMPACT); place(R, big, IMPACT)
tail = bp(rng.standard_normal(int(2.6 * SR)), 200, 5000) * np.exp(-np.arange(int(2.6*SR))/SR*2.2) * .12
place(L, tail, IMPACT); place(R, tail[::-1][::-1] * .9, IMPACT + .01)
# acorde final sustentado (brilho)
post = t >= IMPACT
chord = sum(np.sin(2*np.pi*f*t + p) for f, p in ((110, 0), (164.8, 1), (220, 2), (329.6, .5))) * np.exp(-(t - IMPACT).clip(0) * .55) * post * .07
L += chord; R += chord

# reverb da trilha
ir_len = int(2.4 * SR); ir_t = np.arange(ir_len) / SR
for ch, seed in ((L, 11), (R, 12)):
    ir = np.random.default_rng(seed).standard_normal(ir_len) * np.exp(-ir_t * 2.8); ir[0] = 1; ir /= np.abs(ir).sum() ** .5 * 6
    wet = fftconvolve(ch, ir)[:N]; ch[:] = ch * .8 + wet * .35

# VOZ
voice = np.zeros(N)
for i, at in VOZ.items():
    with wave.open(f"{vdir}/v{i}.wav") as w: v = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    place(voice, v * 1.0, at)
ir = np.random.default_rng(3).standard_normal(int(1.2 * SR)) * np.exp(-np.arange(int(1.2*SR))/SR*5); ir[0] = 1; ir /= np.abs(ir).sum()**.5 * 9
voice = voice + fftconvolve(voice, ir)[:N] * .18

# ducking: trilha abaixa quando há voz (exceto no impacto)
ve = np.convolve(np.abs(voice), np.ones(int(.12*SR)) / int(.12*SR), "same")
duck = 1 - 0.45 * np.clip(ve / 0.05, 0, 1)
duck[t >= IMPACT - .02] = np.maximum(duck[t >= IMPACT - .02], .8)
L = L * duck + voice * .95; R = R * duck + voice * .95

# corte seco no final
fade = np.clip((TOTAL - .05 - t) / .05, 0, 1); L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()); L /= peak / .89; R /= peak / .89
st = np.stack([L, R], 1)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print("ok", TOTAL, "s")
