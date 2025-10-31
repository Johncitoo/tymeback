import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { normalizeRut, validateRut } from '../utils/rut.util';

export function IsRut(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsRut',
      target: object.constructor,
      propertyName,
      options: {
        message: (args: ValidationArguments) => {
          const value = args.value ?? '';
          if (typeof value !== 'string') return 'RUT inválido.';
          const norm = normalizeRut(value);
          if (!norm || !validateRut(norm)) return 'RUT inválido.';
          return 'RUT inválido.';
        },
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const norm = normalizeRut(value);
          return !!norm && validateRut(norm);
        },
      },
    });
  };
}
