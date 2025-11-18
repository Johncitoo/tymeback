import { Controller, Post, Patch, Get, Body, Param, Query } from '@nestjs/common';
import { SessionBurnsService } from './session-burns.service';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { RedeemQrDto } from './dto/redeem-qr.dto';
import { ManualBurnDto } from './dto/manual-burn.dto';
import { QueryBurnsDto } from './dto/query-burns.dto';
import { QueryQrDto } from './dto/query-qr.dto';

@Controller('session-burns')
export class SessionBurnsController {
  constructor(private readonly service: SessionBurnsService) {}

  // QR
  @Post('qr')
  generateQr(@Body() dto: GenerateQrDto) {
    return this.service.generateQr(dto);
  }

  @Post('qr/redeem')
  redeemQr(@Body() dto: RedeemQrDto) {
    return this.service.redeemQr(dto);
  }

  @Patch('qr/:id/revoke')
  revokeQr(@Param('id') id: string, @Query('gymId') gymId: string, @Query('byUserId') byUserId: string) {
    return this.service.revokeQr(id, gymId, byUserId);
  }

  @Get('qr')
  listQr(@Query() q: QueryQrDto) {
    return this.service.listQr(q);
  }

  // Manual
  @Post('manual')
  manualBurn(@Body() dto: ManualBurnDto) {
    return this.service.manualBurn(dto);
  }

  // Listado de burns
  @Get()
  listBurns(@Query() q: QueryBurnsDto) {
    return this.service.listBurns(q);
  }
}
