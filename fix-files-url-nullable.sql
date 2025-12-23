-- Fix: Hacer que la columna url sea opcional en files
ALTER TABLE files ALTER COLUMN url DROP NOT NULL;

SELECT 'Columna url ahora es nullable' AS status;
