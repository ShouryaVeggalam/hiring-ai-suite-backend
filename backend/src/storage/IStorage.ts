export interface UploadParams {
  key: string;
  body: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StoredObject {
  key: string;
  bucket: string;
}

export interface IStorage {
  readonly bucket: string;
  upload(params: UploadParams): Promise<StoredObject>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
