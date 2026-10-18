# Roadmap

A ordem pode mudar, sempre com aprovação do proprietário do produto.
Legenda: `[✓]` concluído · `[●]` em andamento · `[ ]` pendente

## Progresso

```
[✓] Product Vision
[✓] Plataforma (ADR-001)
[✓] Fundação técnica
[✓] Data Strategy
[✓] Design System (Aquatic Glass)
[✓] App Shell & Navigation
[ ] Authentication
[●] To Do Core
[ ] To Do Advanced
[ ] Routines Core
[ ] Routine Intelligence
[ ] Gamification Foundation
[ ] Habits
```

## Etapas

| Etapa | Nome                                                    | Bloco           |
| ----- | ------------------------------------------------------- | --------------- |
| 0     | Descoberta e arquitetura                                | Fundação        |
| 1     | Fundação técnica                                        | Fundação        |
| 2     | Design System (Aquatic Glass)                           | Fundação        |
| 3     | Estrutura principal do aplicativo                       | Fundação        |
| 4     | To Do básico (V1)                                       | Primeiro valor  |
| 5     | To Do avançado (V2)                                     | Primeiro valor  |
| 6     | Routines básico                                         | Tempo           |
| 7     | Routines avançado (conflitos, scheduler determinístico) | Tempo           |
| 8     | Integração To Do + Routines                             | Tempo           |
| 9     | Fundação da Gamificação (Progress Engine, ScoreEngine)  | Vida            |
| 10    | Habits                                                  | Vida            |
| 11    | Criaturas e evolução (CreatureLifecycle)                | Vida            |
| 12    | Ocean Progression                                       | Vida            |
| 13    | Workout                                                 | Corpo e pessoas |
| 14    | Social e colaboração                                    | Corpo e pessoas |
| 15    | Grupos e família                                        | Corpo e pessoas |
| 16    | Loja e economia                                         | Negócio         |
| 17    | Subscriptions                                           | Negócio         |

## Pontos em aberto (para decidir no momento certo)

- **Modo Maré (visualizador na horizontal):** no celular, a interface fica fixa em retrato e só os ícones giram (como no app de câmera). Ao deitar o celular, sobretudo carregando, o app vira um painel de ambiente com relógio, maré do dia e, depois, hábitos e criaturas. No tablet, a rotação muda o layout normalmente. Proposto para depois do To Do V1; os hábitos entram na Etapa 10.

- **Rodada de ousadia visual:** o proprietário achou o design "um pouco tímido" (Etapa 2). Revisitar o Aquatic Glass com decisões mais marcantes depois do To Do V1, quando houver telas reais para calibrar.

- **Sincronização mais cedo:** o proprietário usa 3 aparelhos (iPhone 11, Galaxy Tab S8+, notebook via web). Propor sync logo após o To Do V1.
- **Ranked Seasons:** modo ranqueado opt-in para hábitos, com entrada simbólica e recompensas cosméticas. Ver [gamification.md](gamification.md).

- Em que etapa entra a **autenticação** (Etapa 3 ou antes da sincronização).
- Avaliar se **Habits** deve vir antes de Routines avançado.
