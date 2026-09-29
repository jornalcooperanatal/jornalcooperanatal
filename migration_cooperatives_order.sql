-- Execute UMA VEZ no D1 já existente
ALTER TABLE cooperatives ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 100;

-- Opcional: coloca a ordem atual em sequência pelo nome
-- UPDATE cooperatives SET sort_order = id;
