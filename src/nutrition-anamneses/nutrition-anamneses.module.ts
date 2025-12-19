import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionAnamnesesService } from './nutrition-anamneses.service';
import { NutritionAnamnesesController } from './nutrition-anamneses.controller';
import { NutritionAnamnesis } from './entities/nutrition-anamnesis.entity';
import { User } from '../users/entities/user.entity';
import { GymUser } from '../gym-users/entities/gym-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NutritionAnamnesis, User, GymUser])],
  controllers: [NutritionAnamnesesController],
  providers: [NutritionAnamnesesService],
  exports: [NutritionAnamnesesService],
})
export class NutritionAnamnesesModule {}
