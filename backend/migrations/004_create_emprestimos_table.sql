-- BIMU - Tabela de empréstimos
-- RCC-01: Índice único parcial - um exemplar não pode ter mais de um empréstimo ATIVO
-- RCC-03: Operação atômica (BEGIN, SELECT FOR UPDATE, INSERT, UPDATE, COMMIT)
-- RCC-07: FK com ON DELETE RESTRICT

DO $$ BEGIN
    CREATE TYPE status_emprestimo AS ENUM ('ATIVO', 'DEVOLVIDO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS emprestimos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    exemplar_id INTEGER NOT NULL REFERENCES exemplares(id) ON DELETE RESTRICT,
    data_emprestimo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_prevista_devolucao DATE NOT NULL,
    data_devolucao TIMESTAMP,
    status status_emprestimo NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- RCC-01: Garantia estrutural - apenas um empréstimo ATIVO por exemplar
CREATE UNIQUE INDEX IF NOT EXISTS idx_emprestimos_exemplar_ativo_unique
    ON emprestimos(exemplar_id)
    WHERE status = 'ATIVO';

CREATE INDEX IF NOT EXISTS idx_emprestimos_usuario_id ON emprestimos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_exemplar_id ON emprestimos(exemplar_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_status ON emprestimos(status);
CREATE INDEX IF NOT EXISTS idx_emprestimos_usuario_ativo ON emprestimos(usuario_id) WHERE status = 'ATIVO';

CREATE TRIGGER update_emprestimos_updated_at
    BEFORE UPDATE ON emprestimos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE emprestimos IS 'Histórico de empréstimos. Índice único parcial garante RCC-01 (um exemplar, um empréstimo ativo).';
