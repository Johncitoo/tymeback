import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private storage: Storage;

  constructor() {
    // Autenticación mediante variables de entorno
    const projectId = process.env.GCS_PROJECT_ID;
    const clientEmail = process.env.GCS_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GCS_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Faltan variables de entorno de GCS: GCS_PROJECT_ID, GCS_SERVICE_ACCOUNT_EMAIL, GCS_PRIVATE_KEY');
    }

    this.storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Railway puede escapar los saltos de línea
      },
    });
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
