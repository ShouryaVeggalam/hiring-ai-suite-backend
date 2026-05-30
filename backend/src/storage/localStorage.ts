import { createReadStream } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { getConfig } from '../config';
import type { IStorage, StoredObject, UploadParams } from './IStorage';

export class LocalStorage implements IStorage {
  readonly bucket = 'local';
  private readonly basePath: string;

  constructor() {
    const config = getConfig();
    this.basePath = path.resolve(config.LOCAL_STORAGE_PATH);
  }

  private resolvePath(key: string) {
    const full = path.join(this.basePath, key);
    if (!full.startsWith(this.basePath)) {
      throw new Error('Invalid storage key');
    }
    return full;
  }

  async upload(params: UploadParams): Promise<StoredObject> {
    const filePath = this.resolvePath(params.key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, params.body);
    return { key: params.key, bucket: this.bucket };
  }

  async download(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolvePath(key), { force: true });
  }

  async getSignedUrl(key: string): Promise<string> {
    const config = getConfig();
    return `${config.APP_URL}/local-files/${encodeURIComponent(key)}`;
  }

  /** Dev helper — not exposed as HTTP route in Phase 3. */
  createReadStream(key: string) {
    return createReadStream(this.resolvePath(key));
  }
}
