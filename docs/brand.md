# Marca — Aquar.io

**Status:** primeira versão (outubro de 2026), aprovada no checkpoint 032. As imagens são PNG gerados por IA. Quando a marca se firmar, o logotipo será redesenhado como vetor (SVG).

## Conceito

- **Mascote:** um peixe coral com **checks no lugar das escamas**: tarefas cumpridas que viram vida no oceano. É o símbolo principal da marca.
- **Logotipo:** "Aquar.io", com o "A" formado por uma onda e a **bolinha coral no ".io"**. O coral é a mesma "cor de energia" do botão principal do app.
- **Slogan:** **Tudo importa.**

## Arquivos (`docs/design/brand/`)

| Arquivo               | O que é                                         | Onde usar                                     |
| --------------------- | ----------------------------------------------- | --------------------------------------------- |
| `logo-horizontal.png` | Ícone + "Aquar.io" + slogan sobre azul profundo | Banners, README, página de lançamento         |
| `logo-glow.png`       | Logotipo com brilho, fundo transparente         | Destaques sobre fundo escuro                  |
| `logo-short.png`      | Versão curta "Aq.io"                            | Espaços pequenos, marca d'água                |
| `icon-framed.png`     | Ícone com moldura e brilho                      | Material de divulgação (nunca o ícone do app) |
| `icon-mono.png`       | Ícone em tons de cinza                          | Impressão de uma cor, fundos coloridos        |
| `mascot.png`          | O peixe sozinho                                 | Avatar do Discord, figurinhas, estados vazios |

**Atenção:** os PNGs com transparência têm um brilho semitransparente irregular nas bordas, que sobrou de quando o fundo foi removido. Sobre fundo escuro ele aparece como uma névoa. Use-os sobre o azul profundo da marca, ou peça versões sem brilho.

## Ícones do app (`assets/`)

Gerados a partir de `icon-framed.png` e `mascot.png`:

- `icon.png` (1024×1024, opaco): o **interior** do ícone, em quadrado cheio. O iPhone e o Android arredondam os cantos sozinhos, por isso **o ícone do app nunca leva moldura nem brilho**.
- `android-icon-foreground.png` + `android-icon-background.png`: o peixe dentro da área segura (66%), sobre um degradê do oceano. O Android recorta em círculo, gota etc.
- `android-icon-monochrome.png`: silhueta de uma cor só, para o tema de ícones do Android 13+.
- `splash-icon.png`: o peixe na tela de abertura, sobre `#06202A`.
- `favicon.png` (48×48): só o peixe. Em 16 px os checks e as bolhas somem, então o favicon não usa o ícone completo.

## Cores

| Papel             | Marca (logo)       | App (interface)                 |
| ----------------- | ------------------ | ------------------------------- |
| Fundo profundo    | `#011928`          | `deepBottom` `#06202A`          |
| Ciano / água      | ≈ `#00E5F0` (neon) | `ocean` 300 `#5CC3BD`, `lagoon` |
| Coral / energia   | ≈ `#FD7E54`        | `coral` (`#EE8A73` no escuro)   |
| Texto do logotipo | branco             | —                               |

**Decisão:** a interface continua com os tons do design system (`src/design-system/tokens`). O ciano neon fica **só** nas peças de marca, onde chama atenção sem brigar com a leitura. Na versão vetorial, o ciano da marca será levemente aproximado do `ocean`. O coral fica igual nos dois.

## Regras de uso

- Não esticar, girar nem trocar as cores do logotipo.
- Deixar respiro em volta do logotipo de pelo menos a altura do "q".
- Em tamanhos menores que 48 px, usar só o peixe.
- Arte e marca (mascote, logotipo, criaturas) **não** fazem parte de uma futura licença de código aberto. Ver [community.md](community.md).
