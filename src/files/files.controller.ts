import { Body, Controller, Delete, Get, Param, Post, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  // 1) Upload directo vía backend (más seguro)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  async uploadDirect(
    @UploadedFile() file: Express.Multer.File,
    @Body('gymId') gymId: string,
    @Body('purpose') purpose: string,
    @Body('ownerUserId') ownerUserId?: string,
    @Body('makePublic') makePublic?: string,
  ) {
    console.log('🔍 Upload endpoint hit:', {
      hasFile: !!file,
      fileDetails: file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      } : null,
      gymId,
      purpose,
      ownerUserId,
      makePublic,
    });

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    return this.files.uploadDirectToGCS({
      gymId,
      ownerUserId,
      file,
      purpose: purpose as any,
      makePublic: makePublic === 'true',
    });
  }

  // 2) Presign (PUT) para subir directo a GCS - DEPRECADO, usar /upload
  @Post('presign')
  presign(@Body() dto: CreateUploadDto) {
    return this.files.createPresignedUpload(dto);
  }

  // 3) Completar subida (marca READY y opcionalmente hace público)
  @Post('complete')
  complete(@Body() dto: CompleteUploadDto) {
    return this.files.completeUpload(dto);
  }

  // 4) Listar
  @Get()
  list(@Query() q: QueryFilesDto) {
    return this.files.findAll(q);
  }

  // 5) Detalle
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.files.findOne(id);
  }

  // 6) Soft delete (status=DELETED)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.files.softDelete(id);
  }

  // 7) URL de descarga temporal firmada (10 min) - requiere autenticación
  // TODO: Agregar @UseGuards(JwtAuthGuard) cuando esté implementado
  @Get(':id/download-url')
  async downloadUrl(
    @Param('id') id: string,
    // @CurrentUser() user: any, // Descomentar cuando tengas JwtAuthGuard
  ) {
    // TODO: Validar que el usuario pertenezca al mismo gym del archivo
    // const file = await this.files.findOne(id);
    // if (file.gymId !== user.gymId) throw new ForbiddenException();
    return this.files.getDownloadUrl(id);
  }
}
