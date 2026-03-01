-- BIMU - Tabela de multas
-- RCC-05: Constraint UNIQUE(emprestimo_id) - no máximo uma multa por empréstimo

CREATE TABLE IF NOT EXISTS multas (
    id SERIAL PRIMARY KEY,
    emprestimo_id INTEGER NOT NULL UNIQUE REFERENCES emprestimos(id) ON DELETE RESTRICT,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
    data_aplicacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paga BOOLEAN DEFAULT FALSE NOT NULL,
    data_pagamento TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_multas_emprestimo_id ON multas(emprestimo_id);
CREATE INDEX IF NOT EXISTS idx_multas_paga ON multas(paga) WHERE paga = FALSE;

CREATE TRIGGER update_multas_updated_at
    BEFORE UPDATE ON multas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE multas IS 'Multas por atraso. UNIQUE(emprestimo_id) garante RCC-05 (uma multa por empréstimo).';
