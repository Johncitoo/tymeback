import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionPlansService } from './nutrition-plans.service';
import { NutritionPlansController } from './nutrition-plans.controller';
import { NutritionPlan } from './entities/nutrition-plan.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NutritionPlan, User])],
  controllers: [NutritionPlansController],
  providers: [NutritionPlansService],
  exports: [TypeOrmModule, NutritionPlansService],
})
export class NutritionPlansModule {}
