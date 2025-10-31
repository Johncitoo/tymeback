// src/users/dto/rut.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Valida RUT chileno con dígito verificador (formato flexible: 11.111.111-1 / 11111111-1)
 * SUGERENCIA: también validarás server-side en backend (esto mismo) y en el servicio de auth.
 */
export function IsValidRut(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidRut',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (value == null || value === '') return true; // opcional
          const clean = String(value).replace(/\./g, '').replace(/-/g, '').toUpperCase();
          if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
          const body = clean.slice(0, -1);
          const dv = clean.slice(-1);
          let sum = 0;
          let mul = 2;
          for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i], 10) * mul;
            mul = mul === 7 ? 2 : mul + 1;
          }
          const res = 11 - (sum % 11);
          const dvCalc = res === 11 ? '0' : res === 10 ? 'K' : String(res);
          return dvCalc === dv;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'RUT inválido';
        },
      },
    });
  };
}
