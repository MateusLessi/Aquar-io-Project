# Aviso de privacidade do Aquar.io

**Versão de testes (First Dive), novembro de 2026.** Este texto descreve o que o app faz hoje, de verdade. Quando algo mudar, ele muda junto, e a data acima também.

## Em poucas palavras

- O Aquar.io funciona **primeiro no seu aparelho**, mesmo sem internet.
- Seus dados só vão para a nuvem **se você criar uma conta**, e só para sincronizar entre os seus aparelhos.
- **Sem anúncios, sem rastreio, sem análise de uso, sem venda de dados.** O app não tem nenhuma biblioteca de analytics.
- Você pode **exportar** ou **apagar** tudo quando quiser.

## O que fica só no aparelho

Fica num banco de dados local (SQLite) e nunca sobe para a nuvem:

- **ajustes** deste aparelho: tema, sons, lembretes, acessibilidade, calendário;
- a **faixa de idade** escolhida no quiz de boas-vindas (opcional; nunca a data de nascimento), usada só para sugerir nomes de listas;
- os **lembretes** agendados: eles são notificações locais do aparelho, sem servidor de push.

## O que sincroniza, se você criar uma conta

Com uma conta, estes dados vão para o **Supabase** (o banco de dados na nuvem do Aquar.io) para aparecer nos seus outros aparelhos:

- listas, pastas, tarefas e subtarefas;
- hábitos, as marcações de cada dia e o progresso parcial;
- rotinas, seus passos e marcações;
- as ligações entre eles (o modo Conectar);
- o **perfil**: nome, frase, cor, criatura, vitrine e as suas escolhas de privacidade de cada campo;
- o **e-mail** da conta, usado só para entrar.

As regras do banco (Row Level Security) fazem com que **só a sua conta** consiga ler e escrever esses dados. Hoje o perfil também não é mostrado para mais ninguém: os campos "Amigos" e "Público" já guardam a sua escolha para quando existirem recursos sociais.

## O que o app não coleta

- Localização, contatos, fotos, microfone ou câmera.
- Identificadores de publicidade.
- Dados de uso, cliques ou telas vistas.

## Links para fora

Em **Ajustes → Comunidade e feedback**, os botões abrem o **Discord** e o **GitHub** no navegador. O botão de relatar um problema preenche **a versão do app e o sistema do aparelho** no formulário. Nada é enviado sem você conferir e publicar. Lembre que o GitHub é público.

## Seus direitos

- **Exportar:** Ajustes → Conta e dados → Exportar (JSON com tudo e CSV das tarefas).
- **Apagar deste aparelho:** Ajustes → Conta e dados.
- **Apagar a conta:** Ajustes → Conta e dados → Apagar conta. Apaga a conta e todos os dados dela na nuvem.

## Idade

O Aquar.io pede só a **faixa** de idade, de forma opcional, e ela não sai do aparelho. Antes de abrir o app para o público amplo, a política de idade mínima vai ser revista com cuidado (LGPD art. 14 e ECA Digital).

## Contato

Dúvidas sobre privacidade: abra uma conversa no Discord da comunidade ou uma issue no GitHub do projeto.
