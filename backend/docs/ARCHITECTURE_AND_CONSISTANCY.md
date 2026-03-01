# 📄 BIMU – Arquitetura e Estratégia de Consistência
## 1. Visão Geral do Projeto

O **BIMU (Biblioteca Municipal Unificada)** é um sistema de gerenciamento de biblioteca compartilhada entre escolas municipais.

Este sistema é o objeto de estudo do TCC com o tema:

> *Especificação e Validação de Requisitos para Garantia de Consistência em um Sistema de Biblioteca Compartilhada.*

O foco principal do projeto NÃO é apenas implementar funcionalidades, mas garantir e validar:
- Consistência transacional
- Integridade de dados
- Controle de concorrência
- Prevenção de anomalias

## 2. Stack Tecnológica

- **Backend**: Node.js + TypeScript
- **Banco de Dados**: PostgreSQL
- **Controle Transacional**: Transações explícitas via driver pg
- **Modelo de Dados**: Relacional com enforcement estrutural de consistência

O PostgreSQL é utilizado como mecanismo central de garantia de propriedades ACID.

## 3. Princípios Arquiteturais

1. O banco de dados é a fonte de verdade.
2. Regras críticas devem ser garantidas estruturalmente (constraints).
3. Operações críticas devem ser transacionais.
4. A aplicação nunca deve confiar apenas em validação em memória.
5. Concorrência deve ser tratada explicitamente.

## 4. Requisitos Críticos de Consistência (RCC)

### RCC-01 — Exclusividade de Empréstimo por Exemplar

- *Um exemplar físico não pode estar emprestado para mais de um usuário simultaneamente.*

Garantia técnica:

- Índice único parcial em `emprestimos(exemplar_id)` onde `status = 'ATIVO'`.
- Uso de transação no fluxo de empréstimo.

### RCC-02 — Integridade Estrutural de Exemplares

- *Cada exemplar é modelado individualmente, eliminando contagem negativa de estoque.*

Garantia técnica:
- Modelagem física por exemplar.
- Status controlado por ENUM.

### RCC-03 — Atomicidade do Empréstimo

- *A operação de empréstimo deve ser atômica.*

Inclui:
- Lock do exemplar
- Criação do empréstimo
- Atualização do status
- Commit único

Garantia técnica:
- `BEGIN` / `COMMIT` explícito
- `ROLLBACK` em caso de erro

### RCC-04 — Devolução Consistente

- *Um exemplar só pode ser devolvido se estiver emprestado.*

Garantia técnica:
- Validação dentro de transação
- Atualização simultânea de empréstimo e exemplar

### RCC-05 — Multa Única por Empréstimo

- *Não pode existir mais de uma multa para o mesmo empréstimo.*

Garantia técnica:
- Constraint `UNIQUE (emprestimo_id)` na tabela multas

### RCC-06 — Limite de Empréstimos por Usuário

- *Um usuário não pode ultrapassar seu limite de empréstimos ativos.*

Garantia técnica:
- Consulta dentro de transação antes da criação do empréstimo
- Validação sob controle transacional

### RCC-07 — Integridade Referencial Rígida

- *Não pode existir empréstimo sem usuário ou exemplar válidos.*

Garantia técnica:
- Foreign keys com `ON DELETE RESTRICT`

### RCC-08 — Isolamento entre Transações

- *Transações concorrentes não devem gerar decisões inconsistentes.*

Garantia técnica:

- Uso de `READ COMMITTED` como padrão
- Lock explícito com `SELECT FOR UPDATE` em operações críticas

## 5. Estratégia de Controle de Concorrência

O sistema utiliza estratégia híbrida composta por:
- Constraints estruturais
- Índices únicos parciais
- Foreign keys
- Transações explícitas
- Row-level locking (SELECT FOR UPDATE)

Nível de isolamento padrão:
`READ COMMITTED`

Para fins acadêmicos, o sistema poderá ser testado sob `SERIALIZABLE` para comparação de comportamento.

## 6. Modelo de Dados Simplificado

Entidades principais:
- usuarios
- livros
- exemplares
- emprestimos
- multas

Decisões críticas:
- Exemplares são físicos e individuais
- Histórico de empréstimos é preservado
- Apenas um empréstimo ativo por exemplar
- Multas não podem duplicar
- Exclusões são restritas

## 7. Fluxo Transacional Oficial — Empréstimo

Passos obrigatórios:
1. `BEGIN`
2. `SELECT` exemplar `FOR UPDATE`
3. Validar `status = DISPONIVEL`
4. Validar limite de empréstimos do usuário
5. Inserir registro em emprestimos
6. Atualizar `status` do exemplar para `EMPRESTADO`
7. `COMMIT`

Se qualquer etapa falhar:
`ROLLBACK`

## 8. Objetivo Acadêmico

Este sistema será utilizado para:
- Simulação de concorrência
- Testes de carga
- Análise de anomalias transacionais
- Validação de consistência estrutural

O BIMU não é apenas um sistema funcional, mas um estudo experimental sobre controle de concorrência em ambientes compartilhados.

## 9. Diretriz para Desenvolvimento

Durante a implementação:
- Nunca criar operação crítica fora de transação.
- Nunca confiar apenas em validação no backend.
- Sempre priorizar garantias estruturais no banco.
- Manter rastreabilidade entre RCC e código implementado.