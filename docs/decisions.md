# Architecture Decision Records (ADRs)

Registro das decisões importantes do Aquar.io: o que foi decidido, por quê e quais consequências esperamos.
ADRs não são apagados. Se uma decisão mudar, criamos um novo ADR que **substitui** o anterior e marcamos o antigo como `Substituído`.

| ADR | Título | Status | Data |
|---|---|---|---|
| [001](#adr-001) | Plataforma de desenvolvimento: linguagem e framework mobile | Aceito | 2026-10-18 |

---

## ADR-001

**Título:** Plataforma de desenvolvimento — TypeScript + React Native + Expo (Expo Router)

**Status:** Aceito — Checkpoint de Aprovação 001

**Data:** 2026-10-18

### Contexto

O Aquar.io é um aplicativo mobile-first que precisa:

- rodar em iOS e Android com uma equipe pequena;
- ter caminho realista para Web e tablet no futuro;
- entregar uma linguagem visual sofisticada (Aquatic Glass): blur, translucidez, profundidade e animações fluidas a 60/120 fps;
- acessar recursos do aparelho: haptics, notificações, armazenamento local (SQLite);
- ser um projeto de aprendizado de Engenharia de Software para o proprietário do produto.

Esta é a primeira decisão porque todas as demais (banco, testes, componentes, navegação) dependem dela.

### Alternativas

| Alternativa | Prós | Contras |
|---|---|---|
| **React Native + Expo (TypeScript)** | Um código para iOS/Android; usa componentes e materiais nativos do sistema; caminho para Web; ecossistema enorme; TypeScript é transferível para web e backend | Blur no Android exige disciplina de performance; atualizações anuais de SDK |
| Flutter (Dart) | Animação excelente e consistente; um código | Redesenha a UI em vez de usar materiais nativos (o vidro seria imitação); Web mais fraca; Dart tem uso restrito fora do Flutter |
| Nativo (Swift + Kotlin) | Máxima fidelidade visual e acesso total à plataforma | Dois aplicativos, custo dobrado, inviável no momento |
| PWA / Web | Barato, um código | Fraco em haptics, notificações, widgets e efeitos; não sustenta um mobile-first premium |

### Decisão

Adotar **TypeScript** como linguagem e **React Native com Expo** como framework, usando **Expo Router** para navegação baseada em arquivos.

### Motivo

É a opção que melhor equilibra qualidade visual (acesso a materiais nativos + Reanimated + Skia), alcance multiplataforma, velocidade de entrega, custo de manutenção e valor de aprendizado.

### Consequências

**Positivas**
- Bibliotecas das próximas etapas virão do ecossistema React Native/Expo (SQLite, cliente Supabase, testes, animações).
- O mesmo conhecimento de TypeScript servirá para funções de backend e para uma futura versão Web.

**Negativas / a monitorar**
- Efeitos de blur no Android precisarão de um orçamento de performance e fallback sólido (a ser definido na Etapa 2).
- O projeto exigirá atualização periódica de versões do Expo/React Native.
- Algum efeito visual muito específico poderá exigir um módulo nativo customizado.
