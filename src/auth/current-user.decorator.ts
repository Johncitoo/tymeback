import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoleEnum } from '../users/entities/user.entity';

export interface JwtUser {
  sub: string;     // user id
  gymId: string;
  role: RoleEnum;
  email?: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as JwtUser;
  },
);
