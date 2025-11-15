import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { SalesSeriesDto } from './dto/sales-series.dto';
import { RecentPaymentsDto } from './dto/recent-payments.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  async summary(@Query() q: DashboardSummaryDto) {
    const data = await this.service.summary(q);
    
    // Transformar al formato que espera el frontend (DashboardStats)
    return {
      activeMembers: data.people.activeMembers,
      totalRevenue: data.sales.monthly.grossClp,
      sessionsThisMonth: 0, // TODO: calcular desde attendance
      activeClients: data.people.inside,
      expiringMemberships: 0, // TODO: calcular desde memberships
      pendingPayments: 0, // TODO: implementar
      revenueGrowth: data.sales.lastMonth.grossClp > 0 
        ? ((data.sales.monthly.grossClp - data.sales.lastMonth.grossClp) / data.sales.lastMonth.grossClp) * 100 
        : 0,
      memberGrowth: 0, // TODO: implementar
    };
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
