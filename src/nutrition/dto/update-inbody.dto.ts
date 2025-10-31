import { PartialType } from '@nestjs/mapped-types';
import { CreateInbodyDto } from './create-inbody.dto';

export class UpdateInbodyDto extends PartialType(CreateInbodyDto) {}
