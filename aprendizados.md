# Aprendizados

Registre aqui, com data, o que funcionou, o que não funcionou e o que o dono pediu para não repetir.

- 2026-10-21: O gestor de tráfego (subagente `trafego-pago`) passa a usar sempre a skill
  `traffic-masters` (16 especialistas, 9 tasks, 2 workflows, benchmarks e checklist). Campanha
  nova segue `wf-campaign-launch`. Origem: pedido do dono, zip Gestor-trafego-Xquads.
- 2026-10-21: Meta não aceita conjunto com orçamento diário rodando menos de 24h, e não deixa trocar
  orçamento diário <-> vitalício numa campanha já criada. Para teste curto com teto fixo, criar já
  como CBO vitalício com fim >= 24h. Origem: criação da [TESTE-AULA-FN] na CA 02 | Edu.
- 2026-10-21: Token Meta está como variável de ambiente (META_ACCESS_TOKEN), não como Network secret;
  META_AD_ACCOUNT_ID não existe. Conta usada nos testes: CA 02 | Edu (act_829367608660058),
  página Edunocorre + @edunocorre, Pixel Edu Corre. Origem: teste de acesso à Graph API.
- 2026-10-21: Regras de otimização do dono (CPA-meta, CPA máx., janela de 72h menos 6h, 24h depois de alterações)
  estão registradas em entregas/trafego-pago/2026-10-21-otimizacao-ca02-edu.md. A conta "teste123"
  não existe: confirmar a conta pelo nome ou act_ antes de qualquer pausa. Origem: pedido de otimização.
