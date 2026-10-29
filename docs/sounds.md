# Sons e toque

Oito efeitos curtos, sintetizados do zero para o Aquar.io (sem amostras de terceiros), sempre junto de uma vibração. Os ajustes ficam em **Perfil → Sons e toque** e valem por aparelho.

| Momento                                          | Som                     | Vibração            |
| ------------------------------------------------ | ----------------------- | ------------------- |
| Concluir tarefa                                  | `task` (gota)           | leve (no checkbox)  |
| Hábito feito                                     | `habit` (gota e bolhas) | leve                |
| Subtarefa ou item de rotina                      | `step` (gotinha)        | leve                |
| Conectar (soltar num destino)                    | `connect`               | média               |
| Última tarefa da lista / último item da rotina   | `complete` (três notas) | sucesso             |
| Cronômetro atinge a meta (com o mergulho aberto) | `timer`                 | sucesso             |
| Maré cheia (enquanto o app está aberto)          | `full-tide`             | sucesso             |
| Nova zona de Profundidade                        | `zone`                  | forte + duas suaves |
| Desmarcar, trocar de aba                         | sem som                 | seleção             |

## Como funciona

- `src/design-system/sound.ts`: `sound.play(name)` toca com o `expo-audio` (cria o player na primeira vez e reaproveita). Nunca lança erro; o mesmo som não repete em menos de 80 ms. `preview: true` toca mesmo com os sons desligados (botão "Ouvir um exemplo").
- `src/design-system/feedback.ts`: as preferências (sons, volume, grupos, vibração), aplicadas pelo shell com `useFeedbackSync`. `haptics.*` também respeita a vibração desligada.
- `src/shell/feedback/useFeedbackMoments.ts`: escuta os eventos de domínio (só o que acontece neste aparelho, não o que chega pela sincronização) e escolhe o som com `soundForEvent` (testado em `src/shell/__tests__/feedback.test.ts`). Também toca a maré cheia quando ela enche com o app aberto.
- Conectar, nova zona e cronômetro tocam em `ConnectProvider`, `useCelebrations` e `HabitDive`.
- Modo de áudio: `playsInSilentMode: false` (no iPhone, o silencioso só vibra) e `interruptionMode: 'mixWithOthers'` (não pausa a música).
- O plugin do `expo-audio` em `app.json` está sem microfone e sem reprodução em segundo plano: o app só toca efeitos.

## Gerar os sons de novo

Os arquivos em `assets/sounds/` saem de `scripts/sounds/make_sounds.py` (numpy, semente fixa):

```bash
python3 scripts/sounds/make_sounds.py /tmp/aquar-sounds
for f in /tmp/aquar-sounds/*.wav; do ffmpeg -y -i "$f" -codec:a libmp3lame -b:a 96k "assets/sounds/$(basename "${f%.wav}").mp3"; done
```
