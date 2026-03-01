-- BIMU - Tabela de usuários
-- RCC-06: Limite de empréstimos por usuário é validado em transação
-- RCC-07: Integridade referencial (usuarios referenciados por emprestimos)

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    limite_emprestimos INTEGER NOT NULL DEFAULT 3,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo) WHERE ativo = TRUE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE usuarios IS 'Usuários do sistema BIMU. limite_emprestimos define quantos empréstimos ativos o usuário pode ter (RCC-06).';
