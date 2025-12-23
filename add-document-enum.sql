-- Agregar 'DOCUMENT' al enum file_purpose_enum
-- Este script es seguro de ejecutar múltiples veces

ALTER TYPE file_purpose_enum ADD VALUE IF NOT EXISTS 'DOCUMENT';

-- Verificar valores del enum
SELECT unnest(enum_range(NULL::file_purpose_enum)) AS purpose_values;
