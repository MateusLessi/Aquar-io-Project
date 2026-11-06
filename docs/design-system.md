# Design System: Aquatic Glass

> **v3 "O aquário no centro" (Visual 3.4, aprovada em novembro de 2026):** o tanque vivo com as criaturas é o
> coração do app. Três modos (**Escuro**, **Claro** e **Crystal**), todos com as cores da **zona** onde a pessoa está.
> Sem bordas nos cartões (o volume vem de sombra suave e da luz da água), **nenhum emoji** (ícones e criaturas em vetor),
> fonte **Plus Jakarta Sans** e textos curtos. Propostas: `docs/design/proposals/visual-3*.png`.

> **v2 "Profundidade" (Checkpoint 007):** mais ousadia, inspirada nas referências do proprietário (Sunglow, Opal, apps de treino).
> Princípios: um **herói** por tela, **números grandes e confiantes**, navegação em **águas profundas** que se destaca nos dois temas,
> **coral** como cor de energia para a ação principal, e simplicidade para todas as idades (alvos grandes, rótulos claros).

Linguagem visual do Aquar.io: vidro, água, profundidade e luz, em um tom sofisticado e calmo. A água aparece **no comportamento** (luz, movimento, estados), não em ilustrações espalhadas pela interface.

- Código: `src/design-system/`
- Catálogo interativo (somente em desenvolvimento): rota `/dev/design-system`
- Proposta visual aprovada: `docs/design/proposals/aquatic-glass-v1.png` (Checkpoint 004)

## Regras de ouro

1. **Só tokens.** Cores, fontes, espaçamentos e movimentos vêm de `@/design-system`. Cor escrita direto no código (`#hex`, `rgb()`) é bloqueada pelo lint fora de `tokens/`.
2. **Vidro só no cromo.** Barras, sheets e controles flutuantes usam `GlassSurface`. Listas e conteúdo usam `Surface` (sólido), para garantir a legibilidade.
3. **Acessível por padrão.** Com o texto do sistema aumentado (≥ 130%), a barra de abas mostra o nome de todas as abas. Todo controle tem rótulo para leitores de tela, alvo de toque de no mínimo 44 pt e anel de foco para teclado. O texto acompanha o tamanho de fonte do sistema.
4. **Respeita o sistema.** "Reduzir movimento" desliga animações ambientes e transforma molas em transições instantâneas. "Reduzir transparência" troca o vidro por superfície sólida.
5. **Moderação.** Hápticos e efeitos só em momentos que importam.

## Tokens

| Grupo      | Arquivo                | Conteúdo                                                                                     |
| ---------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| Paleta     | `tokens/palette.ts`    | Escalas `ocean` (acento) e `abyss` (neutros azulados), `specular` e `listColors`             |
| Temas      | `tokens/themes.ts`     | Tokens semânticos (`surfaceBase`, `textPrimary`, `accent`...); `colorsFor(modo, zona)`       |
| Zonas      | `tokens/zones.ts`      | A água de cada uma das 9 zonas: tanque, areia, algas, raios, luz (`lamp`) e sala do Escuro   |
| Tipografia | `tokens/typography.ts` | **Plus Jakarta Sans** em tudo (600–800 nos títulos e números); `largeTitle` a `numeric`      |
| Ícones     | `glyphs.tsx`           | Ícones guardáveis de listas, pastas e rotinas (chave + nome falado); emoji antigo vira ícone |
| Layout     | `tokens/layout.ts`     | `spacing` (base 4), `radius`, `touchTarget`, `breakpoints`, níveis de `depth`                |
| Movimento  | `tokens/motion.ts`     | Molas `gentle`, `responsive`, `buoyant`; `durations`; `pressedScale`                         |

### Cores das listas

`lagoon`, `tide`, `coral`, `kelp`, `sand`, `anemone`. Cada uma tem um tom para o light e outro para o dark. A lista guarda o **nome** da cor, nunca o hex.

### Modos e zonas

- **Escuro:** uma sala escura iluminada pelo tanque. O fundo toma o tom da zona (`room`) e o acento é a luz dela (`lamp`). Em volta do tanque há um halo e partículas de luz (desligados no Alto contraste; parados com Reduzir movimento).
- **Claro:** água clara e areia. A zona tinge o topo da tela; o acento continua o petróleo da marca.
- **Crystal:** o aquário ocupa a tela inteira (`OceanBackground`) e os cartões são vidro fosco por cima. A água é escurecida o bastante para o texto branco.
- A zona vem do progresso (`shell/theme/ZoneTheme`) e fica salva (`theme.zone`), para o app abrir já na cor certa.
- **Sem bordas:** `Surface`, chips, vidro e superfícies fundas não desenham contorno. Só o **Alto contraste** desenha bordas.

### Contraste

`src/design-system/__tests__/contrast.test.ts` verifica automaticamente o padrão **WCAG AA** nos temas base e em **todas as 9 zonas × 3 modos** (no Crystal, sobre o vidro composto na água):

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

| Componente              | Para quê                                                                                                             | Estados                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `Text`                  | Todo texto. Títulos viram `header` para leitores de tela.                                                            | tons; `struck` (concluído)                          |
| `Surface`               | Superfície sólida para conteúdo                                                                                      | —                                                   |
| `GlassSurface`          | Vidro para o cromo; fallback sólido automático                                                                       | blur / fallback                                     |
| `OceanBackground`       | Fundo de tela em duas faixas (superfície e profundidade) que se encontram onde as cáusticas somem, sem borda visível | movimento / estático                                |
| `Button`                | Ações (`primary`, `secondary`, `ghost`)                                                                              | pressed, focused, disabled, loading                 |
| `IconButton`            | Ações só com ícone (rótulo obrigatório)                                                                              | pressed, focused, selected, disabled                |
| `FloatingActionButton`  | Criação principal, em forma de gota                                                                                  | pressed, focused, disabled                          |
| `Checkbox`              | Circular; mola, ondulação e háptico ao marcar                                                                        | checked, pressed, focused, disabled                 |
| `TextInput`             | Campo com rótulo e erro anunciado                                                                                    | focused, error, disabled                            |
| `ListItem`              | Linha de lista; o controle à esquerda age de forma independente                                                      | pressed, selected, completed, disabled              |
| `WaterLevel`            | Progresso como água enchendo uma cápsula                                                                             | 0–100% (anunciado como `progressbar`)               |
| `Waterline`             | Onda sutil entre a superfície (cabeçalho) e o conteúdo                                                               | decorativo                                          |
| `Sheet`                 | Painel de vidro que sobe de baixo; fecha arrastando ou tocando fora                                                  | aberto, arrastando, fechado                         |
| `AquariumTank`          | O aquário vivo: a água sobe com a maré do dia, raios, algas, areia, bolhas, régua; recebe as criaturas               | Escuro com halo; Crystal como janela; `progressbar` |
| `TankTag` / `TankChip`  | Etiqueta escura e número em vidro por cima da água                                                                   | —                                                   |
| `Glyph` / `GlyphPicker` | Ícone guardado (ou emoji antigo convertido) e o seletor de ícones                                                    | escolhido                                           |
| `TideHero`              | Maré do dia antiga (substituída pelo tanque no Início)                                                               | vazio, enchendo, cheia                              |
| `RisingBubbles`         | Bolhas subindo em água funda (recife, maré cheia)                                                                    | calmo, festivo; ausente com "Reduzir movimento"     |
| `TimePicker`            | Escolher horário em dois toques: hora e quarto de hora                                                               | —                                                   |
| `Switch`                | Interruptor liga/desliga com mola e háptico                                                                          | ligado, desligado, disabled                         |
| `Grid`                  | Grade em linhas de células iguais (sem largura em pixels, imune a zoom)                                              | —                                                   |

Utilitários: `useTheme()`, `useBreakpoint()`, `haptics.light()` / `.success()` / `.selection()` (ignorados na web).

## Plataformas

| Recurso               | iOS | Android                              | Web                  |
| --------------------- | --- | ------------------------------------ | -------------------- |
| Blur real no vidro    | ✅  | ⚠️ fallback quase opaco (ver abaixo) | ✅ `backdrop-filter` |
| Hápticos              | ✅  | ✅                                   | — (ignorado)         |
| Reduzir transparência | ✅  | —                                    | —                    |
| Reduzir movimento     | ✅  | ✅                                   | ✅                   |

**Android:** o blur real exige um `BlurTargetView` atrás de cada vidro. Como a navegação agora é opaca (águas profundas), o vidro restante (sheets, cabeçalho compacto) usa o fallback quase opaco no Android.

## Status

| Item                                                 | Status                                               |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Tokens, tema, fontes, componentes do lote 1          | REAL, com testes automatizados                       |
| Verificação visual                                   | REAL na web (celular e tablet, light e dark)         |
| Desempenho em aparelho (FPS do blur e das cáusticas) | **Não medido ainda**: precisa de iPhone 11 / Tab S8+ |
| Persistência da preferência de tema                  | TODO (hoje fica só em memória)                       |
| Demais componentes (DatePicker, Tabs, Toast...)      | Criados quando uma etapa precisar deles              |
