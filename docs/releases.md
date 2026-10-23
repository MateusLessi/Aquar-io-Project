# Versões, atualizações e expansões

Como o Aquar.io chega aos aparelhos e como muda depois de instalado.

## As duas formas de atualizar

|                      | **Atualização pelo ar (OTA)**                                 | **Novo build (novo instalador)**                                                                        |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Ferramenta           | EAS Update                                                    | EAS Build                                                                                               |
| O que muda           | Código JavaScript, telas, textos, regras, imagens             | Também a parte nativa: bibliotecas novas com código nativo, permissões, ícone, nome, versão do Expo SDK |
| Como chega           | Sozinha: o app baixa ao abrir e aplica na próxima abertura    | A pessoa instala o novo arquivo (Android) ou atualiza pela loja                                         |
| Tempo                | Minutos                                                       | Build: ~15–30 min; lojas: revisão de horas a alguns dias                                                |
| Exemplos no Aquar.io | Nova tela, ajuste de pontos, novo componente, correção de bug | Câmera, GPS, saúde do celular, compras dentro do app, atualizar o SDK                                   |

O **runtime version** diz quais atualizações OTA servem para qual build: uma OTA só chega aos aparelhos cujo build tem a mesma parte nativa. Assim uma atualização nunca quebra um app antigo que não tem a biblioteca nativa que ela precisa.

## Como cada aparelho recebe o app hoje

| Aparelho       | V1 (agora)                                             | Depois                                             |
| -------------- | ------------------------------------------------------ | -------------------------------------------------- |
| Tablet Android | Instalador `.apk` por link (EAS, distribuição interna) | Google Play (taxa única de US$ 25)                 |
| iPhone         | Expo Go (desenvolvimento) e a versão web publicada     | App Store / TestFlight (conta Apple de US$ 99/ano) |
| Notebook       | Versão web publicada (link)                            | —                                                  |

## Comandos (no seu computador, logado na sua conta Expo)

Uma vez só:

```powershell
npx eas-cli@latest login            # entrar na conta Expo (expo.dev, gratuita)
npx eas-cli@latest init             # liga o projeto à sua conta (grava o projectId no app.json)
npx eas-cli@latest update:configure # liga as atualizações pelo ar (grava a URL no app.json)
```

Instalador Android para o tablet (gera um link e um QR code para baixar o `.apk`):

```powershell
npx eas-cli@latest build --platform android --profile preview
```

Atualização pelo ar para quem já instalou esse build:

```powershell
npx eas-cli@latest update --channel preview --message "o que mudou"
```

Versão web (Netlify, arrastando a pasta): `npm run export:web` e arrastar a pasta `dist` em https://app.netlify.com/drop. Os arquivos `public/_headers` e `public/_redirects` já configuram o que a versão web precisa (o banco no navegador exige os cabeçalhos de isolamento). Use sempre `npm run export:web`, não `npx expo export` direto: o Netlify ignora pastas chamadas `node_modules`, e é nelas que a exportação padrão põe o banco (wasm) e as fontes; o script as renomeia para `assets/vendor`.

## O caminho de uma expansão

1. **Checkpoint de aprovação** com o plano.
2. **Branch** próprio (`feat/...`), com testes.
3. **Merge na `main`** depois do OK; a CI roda tudo de novo.
4. **Publicação:**
   - só JavaScript → `eas update` (todos recebem ao abrir o app);
   - mexeu na parte nativa → `eas build`, novo instalador, nova versão nas lojas.
5. **Banco na nuvem:** quando a expansão cria tabelas ou colunas, o SQL novo de `supabase/migrations/` roda **antes** de publicar.

## Regras para nunca perder dados

- **Banco do aparelho:** cada mudança é uma migration numerada que roda uma vez ao abrir a versão nova. Nada é apagado.
- **Banco na nuvem:** mudanças só **somam** (tabela ou coluna nova), nunca removem ou renomeiam. Aparelhos com versões antigas continuam sincronizando: quando a nuvem não manda uma coluna, o aparelho mantém o valor local (`syncEngine.apply`).
- **Exclusões são "suaves"** (`deleted_at`), então dá para recuperar.

## Versões

- Formato `MAIOR.MENOR.CORREÇÃO`: `1.0.0` é a V1; uma expansão sobe o do meio (`1.1.0`); uma correção sobe o último (`1.0.1`).
- Se uma atualização OTA der problema, dá para republicar a anterior (rollback) em minutos.

## Custos

O EAS tem um plano gratuito com limites mensais de builds e de pessoas recebendo atualizações. O Supabase também tem plano gratuito. Para o uso atual cabe nos planos gratuitos; os limites exatos ficam nas páginas de preços de cada serviço e mudam com o tempo.
