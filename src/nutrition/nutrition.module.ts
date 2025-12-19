import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { NutritionAnamnesis } from './entities/nutrition-anamnesis.entity';
import { BodyEvaluation } from './entities/body-evaluation.entity';
import { InbodyScan } from './entities/inbody-scan.entity';
import { NutritionPlan } from './entities/nutrition-plan.entity';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NutritionAnamnesis,
      BodyEvaluation,
      InbodyScan,
      NutritionPlan,
      User,
      GymUser,
    ]),
  ],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [TypeOrmModule, NutritionService],
})
export class NutritionModule {}
