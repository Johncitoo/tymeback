import { PartialType } from '@nestjs/mapped-types';
import { CreateNutritionAnamnesisDto } from './create-nutrition-anamnesis.dto';

export class UpdateNutritionAnamnesisDto extends PartialType(CreateNutritionAnamnesisDto) {}
