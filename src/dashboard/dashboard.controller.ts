import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { SalesSeriesDto } from './dto/sales-series.dto';
import { RecentPaymentsDto } from './dto/recent-payments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUser } from '../auth/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  async summary(@Query() q: DashboardSummaryDto, @CurrentUser() user: JwtUser) {
    const data = await this.service.summary({ ...q, gymId: user.gymId });
    
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
  salesSeries(@Query() q: SalesSeriesDto, @CurrentUser() user: JwtUser) {
    return this.service.salesSeries({ ...q, gymId: user.gymId });
  }

  @Get('recent-payments')
  recentPayments(@Query() q: RecentPaymentsDto, @CurrentUser() user: JwtUser) {
    return this.service.recentPayments({ ...q, gymId: user.gymId });
  }
}
