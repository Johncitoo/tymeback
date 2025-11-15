import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateUploadDto } from './dto/create-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { QueryFilesDto } from './dto/query-files.dto';
import { GcsService } from './storage/gcs.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly gcs: GcsService,
  ) {}

  // Health check para GCS
  @Get('health')
  async healthCheck() {
    try {
      // Intenta generar una URL firmada de prueba
      const testUrl = await this.gcs.getSignedUploadUrl({
        bucket: 'test-bucket',
        key: 'test-key',
        contentType: 'text/plain',
        expiresIn: 60,
      });
      return {
        status: 'ok',
        service: 'Google Cloud Storage',
        configured: true,
        message: 'GCS está configurado correctamente',
      };
    } catch (error) {
      return {
        status: 'error',
        service: 'Google Cloud Storage',
        configured: false,
        message: error.message,
        hint: 'Verifica que GOOGLE_APPLICATION_CREDENTIALS esté configurado correctamente',
      };
    }
  }

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
