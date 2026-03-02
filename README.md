# BIMU — Biblioteca Municipal Unificada

Sistema de gerenciamento de biblioteca compartilhada para bibliotecas municipais. O BIMU permite o cadastro de usuários, livros, exemplares, empréstimos e multas em um ambiente unificado e moderno.

---

## Visão geral

O BIMU é uma aplicação full-stack desenvolvida como Trabalho de Conclusão de Curso (TCC), oferecendo:

- **Gestão de usuários** — Cadastro e controle de leitores
- **Catálogo de livros** — Cadastro de títulos, autores, ISBN, editora e ano
- **Exemplares** — Controle de cópias físicas e disponibilidade
- **Empréstimos** — Registro e acompanhamento de empréstimos
- **Multas** — Gestão de multas por atraso na devolução

---

## Tecnologias

| Camada | Stack |
|--------|-------|
| **Frontend** | React 19, TypeScript, Vite 7, Ant Design, React Router |
| **Backend** | Node.js, Express, TypeScript |
| **Banco de dados** | PostgreSQL 18 |
| **Armazenamento** | MinIO (S3-compatible) |
| **Infraestrutura** | Docker, Docker Compose |

---

## Estrutura do projeto

```
bimu/
├── backend/                 # API REST
│   ├── src/
│   │   ├── config/          # Configurações e variáveis de ambiente
│   │   ├── database/        # Pool de conexão PostgreSQL
│   │   ├── routes/          # Rotas da API (usuarios, livros, exemplares, emprestimos, multas)
│   │   ├── storage/         # Integração MinIO
│   │   └── main.ts
│   ├── migrations/          # Scripts SQL de criação de tabelas
│   ├── docker-compose.yml   # PostgreSQL + MinIO + API
│   └── Dockerfile
├── frontend/                # Interface web
│   ├── src/
│   │   ├── api/             # Cliente HTTP para a API
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   └── App.tsx
│   └── vite.config.ts
└── README.md
```

---

## Pré-requisitos

- **Node.js** ≥ 20
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (para rodar banco e MinIO)
- **PostgreSQL 18** (se rodar sem Docker)

---

## Como executar

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repositorio>
cd bimu

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Configurar variáveis de ambiente

**Backend** — Copie o exemplo e preencha:

```bash
cp backend/.env.example backend/.env
```

Principais variáveis:
- `DATABASE_URL` — URL de conexão PostgreSQL
- `POSTGRES_*` — Credenciais do banco
- `MINIO_*` — Configurações do MinIO
- `API_PORT` — Porta da API (padrão: 3000)

**Frontend** — Configure a URL da API:

```bash
cp frontend/.env.example frontend/.env
```

Defina `VITE_API_URL` (ex.: `http://localhost:3000`).

### 3. Subir a infraestrutura (PostgreSQL + MinIO)

```bash
cd backend
docker compose up -d
```

### 4. Rodar o backend

```bash
cd backend
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

### 5. Rodar o frontend

```bash
cd frontend
npm run dev
```

O frontend ficará em `http://localhost:5173`.

---

## API

### Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Informações da API |
| GET | `/health` | Health check |
| CRUD | `/usuarios` | Usuários |
| CRUD | `/livros` | Livros |
| CRUD | `/exemplares` | Exemplares |
| CRUD | `/emprestimos` | Empréstimos |
| CRUD | `/multas` | Multas |

O frontend usa proxy em `/api` apontando para `http://localhost:3000`.

---

## Scripts úteis

**Backend**
- `npm run dev` — Desenvolvimento com hot reload
- `npm run build` — Build para produção
- `npm run start` — Executar build de produção
- `npm run typecheck` — Verificar tipos TypeScript

**Frontend**
- `npm run dev` — Servidor de desenvolvimento
- `npm run build` — Build para produção
- `npm run preview` — Preview do build
- `npm run lint` — Linter

---

## Licença

Projeto acadêmico — TCC.
