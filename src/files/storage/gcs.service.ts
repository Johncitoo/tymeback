import { Injectable, Logger } from '@nestjs/common';
import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';

type UploadArgs = { bucket: string; key: string; contentType: string; expiresIn: number };
type DownloadArgs = { bucket: string; key: string; expiresIn: number };

@Injectable()
export class GcsService {
  private readonly storage: Storage;
  private readonly logger = new Logger(GcsService.name);

  constructor() {
    // Usa GOOGLE_APPLICATION_CREDENTIALS o ADC por defecto
    this.storage = new Storage();
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
