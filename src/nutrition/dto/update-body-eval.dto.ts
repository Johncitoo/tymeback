import { PartialType } from '@nestjs/mapped-types';
import { CreateBodyEvalDto } from './create-body-eval.dto';

export class UpdateBodyEvalDto extends PartialType(CreateBodyEvalDto) {}
