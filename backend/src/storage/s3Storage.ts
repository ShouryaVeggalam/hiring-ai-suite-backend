import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getConfig } from '../config';
import { getLogger } from '../config/logger';
import type { IStorage, StoredObject, UploadParams } from './IStorage';

export class S3Storage implements IStorage {
  readonly bucket: string;
  private readonly client: S3Client;

  constructor() {
    const config = getConfig();
    const logger = getLogger();
    this.bucket = config.S3_BUCKET;

    // Fail fast if credentials are missing — otherwise the AWS SDK falls back
    // to the default credential chain (env vars → AWS config → IMDS), and the
    // IMDS lookup hangs for ~120s on hosts without an instance metadata
    // service (Render, Vercel, etc.). That manifests as silently stuck
    // uploads with no error in the API logs.
    if (!config.S3_ACCESS_KEY_ID || !config.S3_SECRET_ACCESS_KEY) {
      throw new Error(
        'S3 storage driver selected but S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not set. ' +
          'Either set both env vars or switch STORAGE_DRIVER=local.',
      );
    }
    if (!config.S3_ENDPOINT) {
      logger.warn(
        'S3_ENDPOINT is empty — defaulting to AWS S3. For Cloudflare R2 / MinIO, set S3_ENDPOINT.',
      );
    }

    this.client = new S3Client({
      region: config.S3_REGION,
      endpoint: config.S3_ENDPOINT || undefined,
      forcePathStyle: config.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
      },
      maxAttempts: 3,
    });

    logger.info(
      {
        endpoint: config.S3_ENDPOINT || 'aws-default',
        bucket: this.bucket,
        region: config.S3_REGION,
        forcePathStyle: config.S3_FORCE_PATH_STYLE,
      },
      'S3 storage client initialised',
    );
  }

  async upload(params: UploadParams): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: params.metadata,
      }),
    );
    return { key: params.key, bucket: this.bucket };
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const stream = response.Body;
    if (!stream) {
      throw new Error('Empty S3 object body');
    }
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    const config = getConfig();
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds ?? config.S3_SIGNED_URL_TTL,
    });
  }
}
