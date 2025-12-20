import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AppFile, FilePurposeEnum, FileStatusEnum } from './entities/file.entity';
import { CreateUploadDto } from './dto/create-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { QueryFilesDto } from './dto/query-files.dto';
import { GcsService } from './storage/gcs.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
]);

function slugifyBase(name: string) {
  return name
    .trim()
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function extOf(name: string) {
  const m = name.match(/\.([a-zA-Z0-9]{1,10})$/);
  return m ? m[1].toLowerCase() : '';
}

@Injectable()
export class FilesService {
  private readonly bucket: string;
  private readonly putTtl: number;
  private readonly maxBytes: number;

  constructor(
    @InjectRepository(AppFile) private readonly repo: Repository<AppFile>,
    private readonly gcs: GcsService,
    private readonly config: ConfigService,
  ) {
    this.bucket = this.config.get<string>('GCS_BUCKET_NAME') || '';
    // GCS opcional - si no está configurado, los uploads fallarán pero el backend iniciará
    if (!this.bucket) {
      console.warn('⚠️  GCS_BUCKET_NAME no configurado - funcionalidad de archivos deshabilitada');
    }
    this.putTtl = Number(this.config.get<string>('GCS_SIGNED_PUT_TTL_SECONDS') ?? '900'); // 15m
    this.maxBytes = Number(this.config.get<string>('UPLOAD_MAX_BYTES') ?? String(10 * 1024 * 1024)); // 10MB
  }

  private now() { return new Date(); }

  private buildKey(gymId: string, purpose: FilePurposeEnum, originalName: string) {
    const d = new Date();
    const yyyy = String(d.getUTCFullYear());
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const base = slugifyBase(originalName);
    const ext = extOf(originalName);
    const id = randomUUID();
    const safeExt = ext ? `.${ext}` : '';
    return `${gymId}/${purpose}/${yyyy}/${mm}/${id}-${base}${safeExt}`;
  }

  // 1) Crear URL firmada (PUT) + fila PENDING
  async createPresignedUpload(dto: CreateUploadDto) {
    if (!ALLOWED_MIME.has(dto.mimeType)) {
      throw new BadRequestException('MIME no permitido');
    }
    if (dto.sizeBytes > this.maxBytes) {
      throw new BadRequestException(`Archivo excede límite (${this.maxBytes} bytes)`);
    }

    const key = this.buildKey(dto.gymId, dto.purpose, dto.originalName);

    const row = this.repo.create({
      gymId: dto.gymId,
      uploadedByUserId: dto.ownerUserId ?? null,
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      // BIGINT seguro: guardamos como string
      sizeBytes: String(dto.sizeBytes),
      storageBucket: this.bucket,
      storageKey: key,
      publicUrl: null,
      purpose: dto.purpose,
      status: FileStatusEnum.PENDING,
    });
    const saved = await this.repo.save(row);

    const uploadUrl = await this.gcs.getSignedUploadUrl({
      bucket: this.bucket,
      key,
      contentType: dto.mimeType,
      expiresIn: this.putTtl,
    });

    return {
      fileId: saved.id,
      uploadUrl,
      expiresAt: new Date(Date.now() + this.putTtl * 1000).toISOString(),
      storageBucket: this.bucket,
      storageKey: key,
      headers: { 'Content-Type': dto.mimeType }, // Úsalo en el PUT
      status: saved.status,
    };
  }

  // 2) Completar (opcionalmente hacerlo público)
  async completeUpload(dto: CompleteUploadDto) {
    const row = await this.repo.findOne({ where: { id: dto.fileId, gymId: dto.gymId } });
    if (!row) throw new NotFoundException('Archivo no encontrado');

    // Verificar que el objeto existe en GCS
    const exists = await this.gcs.exists(row.storageBucket, row.storageKey);
    if (!exists) {
      throw new BadRequestException('Objeto no encontrado en almacenamiento (subida no realizada)');
    }

    let publicUrl: string | null = row.publicUrl;
    if (dto.makePublic === true) {
      // No llamar a makePublic() porque el bucket tiene Uniform Bucket-Level Access
      // En su lugar, generar la URL pública directamente
      publicUrl = `https://storage.googleapis.com/${row.storageBucket}/${encodeURIComponent(row.storageKey)}`;
    }

    row.publicUrl = publicUrl;
    row.status = FileStatusEnum.READY;
    const saved = await this.repo.save(row);

    return saved;
  }

  // 3) Listado
  async findAll(q: QueryFilesDto) {
    const where: any = { gymId: q.gymId };
    if (q.ownerUserId) where.uploadedByUserId = q.ownerUserId;
    if (q.purpose) where.purpose = q.purpose;
    if (q.status) where.status = q.status;
    const take = Math.min(Math.max(q.limit ?? 20, 1), 100);
    const skip = Math.max(q.offset ?? 0, 0);

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    return { data, total };
  }

  // 4) Detalle
  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Archivo no encontrado');
    return row;
  }

  // 5) Soft delete
  async softDelete(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Archivo no encontrado');
    row.status = FileStatusEnum.DELETED;
    // DeleteDateColumn se actualiza vía repo.softRemove o update manual:
    await this.repo.softRemove(row);
    // softRemove no guarda cambios en otras columnas; por eso hacemos update del status después:
    await this.repo.update({ id: row.id }, { status: FileStatusEnum.DELETED });
    return { ok: true };
  }

  // 6) URL de descarga firmada (GET) por 10 minutos
  async getDownloadUrl(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Archivo no encontrado');
    if (row.status !== FileStatusEnum.READY) {
      throw new BadRequestException('Archivo no listo para descarga');
    }
    const url = await this.gcs.getSignedDownloadUrl({
      bucket: row.storageBucket,
      key: row.storageKey,
      expiresIn: 600, // 10m
    });
    return { url, expiresIn: 600 };
  }
}
