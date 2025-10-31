import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Requiere que tu JwtStrategy se registre como 'jwt'
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
