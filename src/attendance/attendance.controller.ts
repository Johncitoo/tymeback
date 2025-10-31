import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Controller('api/attendance')
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
}
