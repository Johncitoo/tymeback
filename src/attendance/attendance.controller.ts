import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() dto: CheckInDto) {
    return this.service.checkIn(dto);
  }

  @Patch(':id/check-out')
  checkOut(@Param('id') id: string, @Body() dto: CheckOutDto) {
    return this.service.checkOut(id, dto);
  }

  @Get()
  list(@Query() q: QueryAttendanceDto) {
    return this.service.list(q);
  }

  @Get('active')
  async activeEntries(@Query('gymId') gymId?: string) {
    const query: QueryAttendanceDto = { openOnly: 'true' };
    if (gymId) query.gymId = gymId;
    const result = await this.service.list(query);
    return result.data; // Frontend espera array, no { data, total }
  }
}
