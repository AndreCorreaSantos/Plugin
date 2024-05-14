## PinkWard

Esta extensão para navegador é projetada para melhorar a segurança e a privacidade dos usuários ao navegar na web. Ela monitora e reporta diversas métricas relacionadas à privacidade e segurança, incluindo tentativas de conexão a domínios de terceiros, redirecionamentos suspeitos, uso de `localStorage`, contagem de cookies e tentativas de fingerprinting via canvas. A extensão também calcula uma pontuação de segurança baseada nos dados coletados para informar aos usuários sobre o nível de segurança das páginas que visitam.

## Funcionalidades

### Monitoramento de Conexões de Terceiros

- **Descrição**: Conta as tentativas de conexões a domínios que não são os domínios principais da página carregada pelo usuário.
- **Lógica**: Cada solicitação de rede é interceptada. Se o domínio da solicitação difere do domínio da página, incrementa-se o contador de tentativas de conexões de terceiros.

### Detecção de Redirecionamentos Suspeitos

- **Descrição**: Identifica e alerta o usuário sobre tentativas de redirecionar a navegação para um domínio diferente sem iniciativa do usuário.
- **Lógica**: Intercepta solicitações de rede do tipo "main_frame". Se um redirecionamento ocorrer sem um iniciador, considera-se suspeito e incrementa-se o contador de redirecionamentos suspeitos.

### Gerenciamento do LocalStorage

- **Descrição**: Monitora o tamanho total dos dados armazenados no `localStorage` do navegador.
- **Lógica**: Periodicamente calcula o tamanho total do `localStorage`, assumindo 2 bytes por caractere (UTF-16). Este total é convertido para megabytes e atualizado.

### Contagem de Cookies

- **Descrição**: Mantém uma contagem atualizada de cookies de primeira e terceira partes.
- **Lógica**: Cada cookie armazenado pelo navegador é verificado para determinar se pertence ao domínio da aba atual (primeira parte) ou a outros domínios (terceira parte). A contagem é atualizada sempre que um cookie é adicionado ou removido.

### Detecção de Fingerprinting de Canvas

- **Descrição**: Detecta tentativas de utilizar o elemento canvas do HTML para coletar impressões digitais do dispositivo do usuário.
- **Lógica**: Scripts de conteúdo notificam a extensão quando detectam tentativas de usar APIs de fingerprinting. A extensão então incrementa um contador e alerta o usuário.

### Detecção de Hijacking e Hook

- **Descrição**: Monitora e detecta tentativas de hijacking e hook durante a navegação.
- **Lógica**: A extensão verifica o número da porta de cada solicitação de rede. Se a solicitação usar uma porta que não é padrão (80 ou 443), considera-se uma tentativa de hijacking e o contador é incrementado. Isso ajuda a identificar tentativas de redirecionamento malicioso para portas não convencionais, o que pode indicar um ataque.

### Cálculo de Pontuação de Segurança

- **Descrição**: Calcula uma pontuação de segurança com base em várias métricas coletadas pela extensão.
- **Lógica**: A pontuação começa em 100. Deduções são aplicadas com base nas seguintes métricas:

  - **Conexões de Terceiros**:
    - Mais de 20 tentativas: -20 pontos
    - 10 a 20 tentativas: -10 pontos
    - 1 a 10 tentativas: -5 pontos
  - **Redirecionamentos Suspeitos**:
    - Mais de 5 redirecionamentos: -25 pontos
    - 1 a 5 redirecionamentos: -10 pontos
  - **Uso do localStorage**:
    - Mais de 5 MB: -15 pontos
    - 1 a 5 MB: -5 pontos
  - **Cookies de Terceiros**:
    - Mais de 30 cookies: -20 pontos
    - 10 a 30 cookies: -10 pontos
  - **Supercookies**:
    - Mais de 5 supercookies: -25 pontos
    - 1 a 5 supercookies: -10 pontos
  - **Tentativas de Fingerprinting de Canvas**:
    - Mais de 5 tentativas: -30 pontos
    - 1 a 5 tentativas: -15 pontos
  - **Tentativas de Hijacking**:
    - Cada tentativa de hijacking identificada: -5 pontos

  A pontuação é garantida a não ficar abaixo de 0. Esta lógica permite que os usuários compreendam como diferentes atividades e riscos afetam a sua pontuação de segurança.

### Interface de Usuário e Notificações

- **Descrição**: Fornece feedback visual e alertas para o usuário sobre eventos de segurança e atualizações de status.
- **Lógica**: Usa o sistema de notificações do navegador para informar os usuários sobre eventos críticos e a interface da extensão para exibir a pontuação de segurança atual e estatísticas detalhadas.

## Considerações de Segurança

A extensão requer permissões para acessar dados de navegação, cookies e armazenamento local. Todas as informações são tratadas localmente, e nenhuma dado é enviado para servidores externos, garantindo a privacidade dos usuários.
