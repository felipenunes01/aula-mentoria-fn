// Banco do Bandit. SQLite embutido no Node (node:sqlite) para a demonstração
// rodar sem instalar nada. Em produção, o mesmo esquema vai para Postgres
// (ver README, seção "Produção"): uma visita de quiz grava umas 30 linhas.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const ESQUEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projetos (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  dominio TEXT NOT NULL DEFAULT '',
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY,
  projeto_id INTEGER NOT NULL REFERENCES projetos(id),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  objetivo TEXT NOT NULL DEFAULT 'venda' CHECK (objetivo IN ('venda','lead')),
  modo TEXT NOT NULL DEFAULT 'auto' CHECK (modo IN ('auto','fixo')),
  inicio TEXT NOT NULL,
  queda_url TEXT NOT NULL DEFAULT '',
  origens TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','pausado')),
  tipo TEXT NOT NULL DEFAULT 'quiz' CHECK (tipo IN ('quiz','pagina')),
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS produtos_do_link (
  link_id INTEGER NOT NULL REFERENCES links(id),
  produto TEXT NOT NULL,
  PRIMARY KEY (link_id, produto)
);

CREATE TABLE IF NOT EXISTS bracos (
  id INTEGER PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links(id),
  ordem INTEGER NOT NULL DEFAULT 0,
  letra TEXT NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  cor TEXT NOT NULL,
  muda TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('ativo','pausado','rascunho')),
  peso_fixo REAL NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- teste = 1: modo revisão, venda de teste, evento de teste da plataforma.
-- As contas leem só das views *_validas, nunca da tabela crua.
CREATE TABLE IF NOT EXISTS visitas (
  vid TEXT PRIMARY KEY,
  link_id INTEGER NOT NULL,
  braco_id INTEGER NOT NULL,
  criado_em TEXT NOT NULL,
  utms TEXT NOT NULL DEFAULT '{}',
  teste INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS visitas_link ON visitas(link_id, criado_em);

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY,
  vid TEXT NOT NULL,
  tipo TEXT NOT NULL,
  passo INTEGER NOT NULL DEFAULT 0,
  nome TEXT NOT NULL DEFAULT '',
  email_h TEXT,
  tel_h TEXT,
  criado_em TEXT NOT NULL,
  teste INTEGER NOT NULL DEFAULT 0,
  UNIQUE (vid, tipo, passo)
);
CREATE INDEX IF NOT EXISTS eventos_email ON eventos(email_h);
CREATE INDEX IF NOT EXISTS eventos_tel ON eventos(tel_h);

CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY,
  projeto_id INTEGER NOT NULL,
  pedido TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('aprovado','reembolsado','chargeback','pendente')),
  valor_reais REAL,
  campo_valor TEXT,
  unidade TEXT,
  produto TEXT,
  vid TEXT,
  link_id INTEGER,
  braco_id INTEGER,
  degrau TEXT,
  motivo TEXT,
  email_h TEXT,
  tel_h TEXT,
  teste INTEGER NOT NULL DEFAULT 0,
  mapa_campos TEXT NOT NULL DEFAULT '[]',
  criado_em TEXT NOT NULL,
  UNIQUE (plataforma, pedido, status)
);

CREATE TABLE IF NOT EXISTS webhook_log (
  id INTEGER PRIMARY KEY,
  quando TEXT NOT NULL,
  projeto_id INTEGER,
  plataforma TEXT,
  evento TEXT,
  status TEXT,
  valor REAL,
  casou INTEGER,
  degrau TEXT,
  erro TEXT,
  http INTEGER,
  teste INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gasto_meta (
  dia TEXT NOT NULL,
  conta TEXT NOT NULL,
  anuncio TEXT NOT NULL,
  anuncio_nome TEXT NOT NULL DEFAULT '',
  destino TEXT NOT NULL DEFAULT '',
  link_id INTEGER,
  valor REAL NOT NULL,
  PRIMARY KEY (dia, conta, anuncio)
);

CREATE TABLE IF NOT EXISTS leituras_meta (
  id INTEGER PRIMARY KEY,
  projeto_id INTEGER NOT NULL,
  quando TEXT NOT NULL,
  ok INTEGER NOT NULL,
  erro TEXT
);

CREATE TABLE IF NOT EXISTS pesos (
  link_id INTEGER NOT NULL,
  braco_id INTEGER NOT NULL,
  alfa REAL NOT NULL,
  beta REAL NOT NULL,
  peso REAL NOT NULL,
  fatia_pct REAL NOT NULL,
  chance_melhor_pct REAL NOT NULL,
  calculado_em TEXT NOT NULL,
  PRIMARY KEY (link_id, braco_id)
);

-- configurações por projeto (segredo do webhook, token da Meta...).
-- Valores sensíveis vão cifrados (lib/cofre.js).
CREATE TABLE IF NOT EXISTS config (
  projeto_id INTEGER NOT NULL,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  PRIMARY KEY (projeto_id, chave)
);

CREATE TABLE IF NOT EXISTS sessoes (
  token TEXT PRIMARY KEY,
  criado_em TEXT NOT NULL
);

-- O filtro de teste mora aqui, uma vez só.
CREATE VIEW IF NOT EXISTS visitas_validas AS
  SELECT v.* FROM visitas v JOIN links l ON l.id = v.link_id
  WHERE v.teste = 0 AND v.criado_em >= l.inicio;

CREATE VIEW IF NOT EXISTS eventos_validos AS
  SELECT e.*, v.link_id, v.braco_id FROM eventos e
  JOIN visitas_validas v ON v.vid = e.vid
  WHERE e.teste = 0;

-- venda que conta: aprovada, não é teste, sem reembolso nem chargeback do
-- mesmo pedido. O reembolso fica gravado como linha própria, marcada.
CREATE VIEW IF NOT EXISTS vendas_validas AS
  SELECT s.* FROM vendas s
  LEFT JOIN links l ON l.id = s.link_id
  WHERE s.status = 'aprovado' AND s.teste = 0
    AND (l.id IS NULL OR s.criado_em >= l.inicio)
    AND NOT EXISTS (SELECT 1 FROM vendas r WHERE r.plataforma = s.plataforma
      AND r.pedido = s.pedido AND r.status IN ('reembolsado','chargeback') AND r.teste = 0);
`;

export function abreBanco(arquivo) {
  if (arquivo !== ':memory:') fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const db = new DatabaseSync(arquivo);
  db.exec(ESQUEMA);
  return db;
}

export const agora = () => new Date().toISOString();

// executa várias escritas como uma só
export function transacao(db, fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}
