import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private storage: Storage;

  constructor() {
    // Autenticación:
    // 1) GOOGLE_APPLICATION_CREDENTIALS=/path/sa.json
    // 2) O bien variables de entorno de GCP (en Railway secreto como archivo)
    this.storage = new Storage();
  }

  bucket(bucketName: string) {
    return this.storage.bucket(bucketName);
  }

  /**
   * Crea POST policy V4 (acepta restricciones de Content-Type y tamaño).
   */
  async createSignedPostPolicy(params: {
    bucket: string;
    objectKey: string;
    contentType: string;
    minBytes: number;
    maxBytes: number;
    expiresInSec?: number; // default 600 (10min)
  }) {
    const { bucket, objectKey, contentType, minBytes, maxBytes } = params;
    const expiresInSec = params.expiresInSec ?? 600;

    const [policy] = await this.bucket(bucket)
      .file(objectKey)
      .generateSignedPostPolicyV4({
        expires: Date.now() + expiresInSec * 1000,
        conditions: [
          ['content-length-range', minBytes, maxBytes],
          ['eq', '$Content-Type', contentType],
        ],
      });

    return policy; // { url, fields }
  }

  async getSignedReadUrl(params: { bucket: string; objectKey: string; expiresInSec?: number }) {
    const { bucket, objectKey } = params;
    const expiresInSec = params.expiresInSec ?? 3600; // 1h
    const [url] = await this.bucket(bucket)
      .file(objectKey)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInSec * 1000,
      });
    return url;
  }

  async stat(params: { bucket: string; objectKey: string }) {
    const { bucket, objectKey } = params;
    const [meta] = await this.bucket(bucket).file(objectKey).getMetadata();
    return meta; // incluye size, contentType, etc.
  }

  async remove(params: { bucket: string; objectKey: string }) {
    const { bucket, objectKey } = params;
    await this.bucket(bucket).file(objectKey).delete({ ignoreNotFound: true });
  }

  publicUrl(params: { bucket: string; objectKey: string }) {
    const { bucket, objectKey } = params;
    return `https://storage.googleapis.com/${bucket}/${encodeURIComponent(objectKey)}`;
  }
}
