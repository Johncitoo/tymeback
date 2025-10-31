import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { QueryFilesDto } from './dto/query-files.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  // 1) Presign (PUT) para subir directo a GCS
  @Post('presign')
  presign(@Body() dto: CreateUploadDto) {
    return this.files.createPresignedUpload(dto);
  }

  // 2) Completar subida (marca READY y opcionalmente hace público)
  @Post('complete')
  complete(@Body() dto: CompleteUploadDto) {
    return this.files.completeUpload(dto);
  }

  // 3) Listar
  @Get()
  list(@Query() q: QueryFilesDto) {
    return this.files.findAll(q);
  }

  // 4) Detalle
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.files.findOne(id);
  }

  // 5) Soft delete (status=DELETED)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.files.softDelete(id);
  }

  // 6) (Opcional) URL de descarga temporal firmada
  @Get(':id/download-url')
  downloadUrl(@Param('id') id: string) {
    return this.files.getDownloadUrl(id);
  }
}
