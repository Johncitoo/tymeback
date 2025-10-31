import { PartialType } from '@nestjs/mapped-types';
import { CreateClientMetricDto } from './create-client-metric.dto';

export class UpdateClientMetricDto extends PartialType(CreateClientMetricDto) {}
