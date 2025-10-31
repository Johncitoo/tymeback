import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionBurnDto } from './create-session-burn.dto';

export class UpdateSessionBurnDto extends PartialType(CreateSessionBurnDto) {}
