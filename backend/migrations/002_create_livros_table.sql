-- BIMU - Tabela de livros (obra/catálogo)
-- Livros são o catálogo; exemplares são os itens físicos

CREATE TABLE IF NOT EXISTS livros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(500) NOT NULL,
    autor VARCHAR(255),
    isbn VARCHAR(20),
    editora VARCHAR(255),
    ano_publicacao INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_livros_titulo ON livros(titulo);
CREATE INDEX IF NOT EXISTS idx_livros_isbn ON livros(isbn) WHERE isbn IS NOT NULL;

CREATE TRIGGER update_livros_updated_at
    BEFORE UPDATE ON livros
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE livros IS 'Catálogo de obras. Cada exemplar físico referencia um livro (RCC-02).';
