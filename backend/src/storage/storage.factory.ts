import { getConfig } from '../config';
import type { IStorage } from './IStorage';
import { LocalStorage } from './localStorage';
import { S3Storage } from './s3Storage';

let storageInstance: IStorage | null = null;

export function createStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }

  const config = getConfig();
  storageInstance = config.STORAGE_DRIVER === 'local' ? new LocalStorage() : new S3Storage();
  return storageInstance;
}

export function resetStorageForTests(): void {
  storageInstance = null;
}
