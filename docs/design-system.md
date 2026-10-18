# Design System: Aquatic Glass

Linguagem visual do Aquar.io: vidro, água, profundidade e luz, em um tom sofisticado e calmo. A água aparece **no comportamento** (luz, movimento, estados), não em ilustrações espalhadas pela interface.

- Código: `src/design-system/`
- Catálogo interativo (somente em desenvolvimento): rota `/dev/design-system`
- Proposta visual aprovada: `docs/design/proposals/aquatic-glass-v1.png` (Checkpoint 004)

## Regras de ouro

1. **Só tokens.** Cores, fontes, espaçamentos e movimentos vêm de `@/design-system`. Cor escrita direto no código (`#hex`, `rgb()`) é bloqueada pelo lint fora de `tokens/`.
2. **Vidro só no cromo.** Barras, sheets e controles flutuantes usam `GlassSurface`. Listas e conteúdo usam `Surface` (sólido), para garantir a legibilidade.
3. **Acessível por padrão.** Todo controle tem rótulo para leitores de tela, alvo de toque de no mínimo 44 pt e anel de foco para teclado. O texto acompanha o tamanho de fonte do sistema.
4. **Respeita o sistema.** "Reduzir movimento" desliga animações ambientes e transforma molas em transições instantâneas. "Reduzir transparência" troca o vidro por superfície sólida.
5. **Moderação.** Hápticos e efeitos só em momentos que importam.

## Tokens

| Grupo      | Arquivo                | Conteúdo                                                                                    |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| Paleta     | `tokens/palette.ts`    | Escalas `ocean` (acento) e `abyss` (neutros azulados), `specular` e `listColors`            |
| Temas      | `tokens/themes.ts`     | Tokens semânticos (`surfaceBase`, `textPrimary`, `accent`...) para light e dark             |
| Tipografia | `tokens/typography.ts` | **Outfit** (títulos e números) + **Manrope** (texto); variantes de `largeTitle` a `numeric` |
| Layout     | `tokens/layout.ts`     | `spacing` (base 4), `radius`, `touchTarget`, `breakpoints`, níveis de `depth`               |
| Movimento  | `tokens/motion.ts`     | Molas `gentle`, `responsive`, `buoyant`; `durations`; `pressedScale`                        |

### Cores das listas

`lagoon`, `tide`, `coral`, `kelp`, `sand`, `anemone`. Cada uma tem um tom para o light e outro para o dark. A lista guarda o **nome** da cor, nunca o hex.

### Contraste

`src/design-system/__tests__/contrast.test.ts` verifica automaticamente o padrão **WCAG AA** em ambos os temas:

- texto (primário, secundário, terciário, acento, prioridade e semânticas) sobre as superfícies: ≥ 4.5:1;
- `onAccent` sobre `accent`: ≥ 4.5:1;
- cores de lista como elementos gráficos: ≥ 3:1.

Se alguém mudar uma cor e quebrar a legibilidade, a CI falha.

### Breakpoints

| Nome       | Largura  | Aparelhos                                  |
| ---------- | -------- | ------------------------------------------ |
| `compact`  | < 600    | iPhone 11                                  |
| `medium`   | 600–1023 | tablets em retrato, janelas pequenas       |
| `expanded` | ≥ 1024   | Galaxy Tab S8+ em paisagem, notebook (web) |

### Profundidade

| Nível | Uso                  | Material              |
| ----- | -------------------- | --------------------- |
| 0     | Conteúdo             | Sólido, sem sombra    |
| 1     | Barras flutuantes    | Vidro, blur 60        |
| 2     | Sheets               | Vidro, blur 70        |
| 3     | Modais e menus       | Vidro, blur 85        |
| 4     | Gamificação (futuro) | A definir na Etapa 9+ |

## Componentes

| Componente             | Para quê                                                            | Estados                                |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------- |
| `Text`                 | Todo texto. Títulos viram `header` para leitores de tela.           | tons; `struck` (concluído)             |
| `Surface`              | Superfície sólida para conteúdo                                     | —                                      |
| `GlassSurface`         | Vidro para o cromo; fallback sólido automático                      | blur / fallback                        |
| `OceanBackground`      | Fundo de tela com gradiente de profundidade + cáusticas animadas    | movimento / estático                   |
| `Button`               | Ações (`primary`, `secondary`, `ghost`)                             | pressed, focused, disabled, loading    |
| `IconButton`           | Ações só com ícone (rótulo obrigatório)                             | pressed, focused, selected, disabled   |
| `FloatingActionButton` | Criação principal, em forma de gota                                 | pressed, focused, disabled             |
| `Checkbox`             | Circular; mola, ondulação e háptico ao marcar                       | checked, pressed, focused, disabled    |
| `TextInput`            | Campo com rótulo e erro anunciado                                   | focused, error, disabled               |
| `ListItem`             | Linha de lista; o controle à esquerda age de forma independente     | pressed, selected, completed, disabled |
| `WaterLevel`           | Progresso como água enchendo uma cápsula                            | 0–100% (anunciado como `progressbar`)  |
| `Waterline`            | Onda sutil entre a superfície (cabeçalho) e o conteúdo              | decorativo                             |
| `Sheet`                | Painel de vidro que sobe de baixo; fecha arrastando ou tocando fora | aberto, arrastando, fechado            |

Utilitários: `useTheme()`, `useBreakpoint()`, `haptics.light()` / `.success()` / `.selection()` (ignorados na web).

## Plataformas

| Recurso               | iOS | Android                              | Web                  |
| --------------------- | --- | ------------------------------------ | -------------------- |
| Blur real no vidro    | ✅  | ⚠️ fallback quase opaco (ver abaixo) | ✅ `backdrop-filter` |
| Hápticos              | ✅  | ✅                                   | — (ignorado)         |
| Reduzir transparência | ✅  | —                                    | —                    |
| Reduzir movimento     | ✅  | ✅                                   | ✅                   |

**Android:** o blur real exige um `BlurTargetView` atrás do vidro. O shell já o fornece para a barra de abas, mas o efeito fica **desligado por padrão** até ser validado no Galaxy Tab S8+. Para testar, use Ajustes → Desenvolvimento → "Blur real no Android (experimental)".

## Status

| Item                                                 | Status                                               |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Tokens, tema, fontes, componentes do lote 1          | REAL, com testes automatizados                       |
| Verificação visual                                   | REAL na web (celular e tablet, light e dark)         |
| Desempenho em aparelho (FPS do blur e das cáusticas) | **Não medido ainda**: precisa de iPhone 11 / Tab S8+ |
| Persistência da preferência de tema                  | TODO (hoje fica só em memória)                       |
| Demais componentes (DatePicker, Tabs, Toast...)      | Criados quando uma etapa precisar deles              |
