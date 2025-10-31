import { Transform } from 'class-transformer';
import { normalizeRut } from '../utils/rut.util';

/**
 * Normaliza el RUT a "XXXXXXXX-DV" durante la transformación del DTO.
 * Si no es válido, deja el valor original (para que el validador lo capture).
 */
export function NormalizeRut() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const norm = normalizeRut(value);
    return norm ?? value;
  });
}
