-- BIMU - Tabela de exemplares (itens físicos)
-- RCC-02: Cada exemplar é modelado individualmente
-- Status controlado por ENUM

DO $$ BEGIN
    CREATE TYPE status_exemplar AS ENUM ('DISPONIVEL', 'EMPRESTADO', 'INDISPONIVEL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS exemplares (
    id SERIAL PRIMARY KEY,
    livro_id INTEGER NOT NULL REFERENCES livros(id) ON DELETE RESTRICT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    status status_exemplar NOT NULL DEFAULT 'DISPONIVEL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exemplares_livro_id ON exemplares(livro_id);
CREATE INDEX IF NOT EXISTS idx_exemplares_status ON exemplares(status);
CREATE INDEX IF NOT EXISTS idx_exemplares_status_disponivel ON exemplares(id) WHERE status = 'DISPONIVEL';

CREATE TRIGGER update_exemplares_updated_at
    BEFORE UPDATE ON exemplares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE exemplares IS 'Exemplares físicos individuais. Um exemplar não pode estar emprestado para mais de um usuário (RCC-01, RCC-02).';
