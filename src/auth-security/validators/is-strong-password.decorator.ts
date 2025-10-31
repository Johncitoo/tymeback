import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { checkPasswordPolicy, PasswordPolicyOptions } from '../password-policy';

export function IsStrongPassword(
  options: PasswordPolicyOptions = {},
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsStrongPassword',
      target: object.constructor,
      propertyName,
      options: {
        message: (args: ValidationArguments) => {
          const val = args.value ?? '';
          const res = checkPasswordPolicy(val, options);
          return res.ok ? 'OK' : res.reasons.join(' ');
        },
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          const res = checkPasswordPolicy(value, options);
          return res.ok;
        },
      },
    });
  };
}
