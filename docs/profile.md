# Perfil

O Perfil (`/profile`) mostra o **cartão** da pessoa, a **vitrine**, os **selos** e os atalhos para Estatísticas e Ajustes.

- **Cartão** (`src/shell/profile/ProfileHeader.tsx`): faixa na cor do perfil terminando em onda, criatura-avatar, nome, frase e zona (some se "Mostrar Profundidade" estiver desligado). A cor do perfil pinta só o cartão e a vitrine; o destaque do app continua o turquesa da marca. Sem cor escolhida, vale a cor da criatura.
- **Editar:** nome, frase, cor, avatar e **quem vê o quê** (nome, frase, zona e Profundidade, vitrine e selos, estatísticas). Cada cadeado alterna Só eu → Amigos → Público. Padrão: **Só eu**. Hoje nenhum perfil é visível para outras pessoas; as escolhas valem quando a comunidade abrir.
- **Vitrine** (`Showcase.tsx`): até 3 destaques, na ordem escolhida: sequência, marés cheias, tarefas, dias no Aquar.io, criatura favorita (uma por hábito) ou um selo já ganho. Só as escolhas são guardadas; os valores são calculados.
- **Selos** (`achievements.ts`, testado em `src/shell/__tests__/achievements.test.ts`): 14, ganhos do que foi feito de verdade. Marés cheias (1, 10, 50), sequências (7, 30, 100 dias), zonas (Costeiras, Recife, Mar Aberto, Crepúsculo, Meia-Noite), 100 tarefas, primeira criatura adulta e primeira conexão. Os bloqueados dizem o que falta.

Ficaram para depois: @usuário (precisa de nomes únicos no servidor), selo Founding Diver (etapa 10) e ver perfis de outras pessoas.
