import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';

type UploadArgs = { bucket: string; key: string; contentType: string; expiresIn: number };
type DownloadArgs = { bucket: string; key: string; expiresIn: number };

@Injectable()
export class GcsService {
  private readonly storage: Storage;
  private readonly logger = new Logger(GcsService.name);

  constructor(private readonly config: ConfigService) {
    const projectId = this.config.get<string>('GCS_PROJECT_ID');
    const privateKey = this.config.get<string>('GCS_PRIVATE_KEY');
    const clientEmail = this.config.get<string>('GCS_SERVICE_ACCOUNT_EMAIL');

    this.logger.debug(`🔍 GCS Config - ProjectID: ${projectId ? 'SET' : 'MISSING'}, Email: ${clientEmail ? 'SET' : 'MISSING'}, Key: ${privateKey ? 'SET' : 'MISSING'}`);

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn('⚠️  GCS credentials not configured - file functionality disabled');
      // Inicializar sin credenciales (fallará en operaciones pero no en startup)
      this.storage = new Storage();
    } else {
      // Configurar con las credenciales de la cuenta de servicio
      // La private key puede venir con \n escapados, hay que reemplazarlos
      const formattedKey = privateKey.includes('\\n') 
        ? privateKey.replace(/\\n/g, '\n')
        : privateKey;

      this.storage = new Storage({
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: formattedKey,
        },
      });
      this.logger.log(`✅ GCS configured for project: ${projectId}`);
    }
  }

  async getSignedUploadUrl(args: UploadArgs) {
    const file = this.storage.bucket(args.bucket).file(args.key);
    const cfg: GetSignedUrlConfig = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + args.expiresIn * 1000,
      contentType: args.contentType,
    };
    const [url] = await file.getSignedUrl(cfg);
    return url;
  }

  async getSignedDownloadUrl(args: DownloadArgs) {
    const file = this.storage.bucket(args.bucket).file(args.key);
    const cfg: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + args.expiresIn * 1000,
    };
    const [url] = await file.getSignedUrl(cfg);
    return url;
  }

  async makePublic(bucket: string, key: string) {
    const file = this.storage.bucket(bucket).file(key);
    try {
      await file.makePublic();
      return true;
    } catch (e) {
      this.logger.warn(`makePublic fallo: gs://${bucket}/${key} → ${String(e)}`);
      throw e;
    }
  }

  async exists(bucket: string, key: string) {
    const file = this.storage.bucket(bucket).file(key);
    const [exists] = await file.exists();
    return exists;
  }
}
