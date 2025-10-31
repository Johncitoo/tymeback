import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientMetricsService } from './client-metrics.service';
import { ClientMetricsController } from './client-metrics.controller';
import { ClientMetric } from './entities/client-metric.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientMetric])],
  controllers: [ClientMetricsController],
  providers: [ClientMetricsService],
  exports: [TypeOrmModule, ClientMetricsService],
})
export class ClientMetricsModule {}
