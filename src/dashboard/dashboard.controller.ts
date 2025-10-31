import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { SalesSeriesDto } from './dto/sales-series.dto';
import { RecentPaymentsDto } from './dto/recent-payments.dto';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  summary(@Query() q: DashboardSummaryDto) {
    return this.service.summary(q);
  }

  @Get('sales-series')
  salesSeries(@Query() q: SalesSeriesDto) {
    return this.service.salesSeries(q);
  }

  @Get('recent-payments')
  recentPayments(@Query() q: RecentPaymentsDto) {
    return this.service.recentPayments(q);
  }
}
