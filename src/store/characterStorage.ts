/**
 * Client-side storage for user-uploaded GIF characters.
 * - Binary GIF Blobs are stored in IndexedDB (avoids localStorage 5MB quota).
 * - Metadata (id, name, size, createdAt) and selectedCharacterId are stored in localStorage.
 */

export const MAX_CHARACTER_GIF_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_CHARACTERS_COUNT = 20;
export const MIN_CHARACTER_SCALE = 0.5;
export const MAX_CHARACTER_SCALE = 2.0;
export const DEFAULT_CHARACTER_SCALE = 1;

export const CHARACTERS_META_KEY = 'solo_levelling_gif_characters_v1';
export const SELECTED_CHARACTER_ID_KEY = 'solo_levelling_selected_gif_character_id_v1';

const DB_NAME = 'SoloLevellingCharacterLibraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'character_gifs';

export interface CharacterMeta {
  id: string;
  name: string;
  size: number;
  scale?: number;
  createdAt: string;
}

export function clampCharacterScale(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_CHARACTER_SCALE;
  }
  const clamped = Math.min(MAX_CHARACTER_SCALE, Math.max(MIN_CHARACTER_SCALE, value));
  return Math.round(clamped * 100) / 100;
}

export interface CharacterRecord extends CharacterMeta {
  blob?: Blob | null;
}

export type GifValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export class CharacterStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CharacterStorageError';
  }
}

export function stripGifExtension(filename: string): string {
  const cleaned = filename.replace(/\.gif$/i, '').trim();
  return cleaned || 'Nhân vật GIF';
}

export async function validateGifFile(file: File): Promise<GifValidationResult> {
  if (!file || file.size <= 0) {
    return { valid: false, error: 'File không phải GIF' };
  }

  if (file.type !== 'image/gif') {
    return { valid: false, error: 'File không phải GIF' };
  }

  if (file.size > MAX_CHARACTER_GIF_BYTES) {
    const limitMb = Math.round(MAX_CHARACTER_GIF_BYTES / (1024 * 1024));
    return { valid: false, error: `File vượt quá ${limitMb}MB` };
  }

  try {
    const headerBuffer = await file.slice(0, 6).arrayBuffer();
    const bytes = new Uint8Array(headerBuffer);
    if (bytes.length < 6) {
      return { valid: false, error: 'File không phải GIF' };
    }
    const signature = String.fromCharCode(...bytes);
    if (signature !== 'GIF87a' && signature !== 'GIF89a') {
      return { valid: false, error: 'File không phải GIF' };
    }
  } catch {
    return { valid: false, error: 'Không thể đọc dữ liệu file GIF' };
  }

  return { valid: true };
}

function readMetaList(): CharacterMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CHARACTERS_META_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CharacterMeta =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.createdAt === 'string'
    ).map(item => ({
      id: item.id,
      name: item.name,
      size: typeof item.size === 'number' ? item.size : 0,
      scale: clampCharacterScale(item.scale),
      createdAt: item.createdAt,
    }));
  } catch {
    return [];
  }
}

function writeMetaList(list: CharacterMeta[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHARACTERS_META_KEY, JSON.stringify(list));
  } catch (err) {
    throw new CharacterStorageError(
      'Không thể lưu danh sách nhân vật (bộ nhớ trình duyệt bị giới hạn hoặc đầy).'
    );
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new CharacterStorageError('Trình duyệt không hỗ trợ IndexedDB để lưu file GIF.'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        reject(new CharacterStorageError('Không thể mở kho lưu trữ IndexedDB.'));
      };
    } catch {
      reject(new CharacterStorageError('Không thể truy cập kho lưu trữ IndexedDB.'));
    }
  });
}

async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, blob, updatedAt: Date.now() });

      req.onerror = () => {
        const errName = req.error?.name || '';
        if (errName === 'QuotaExceededError') {
          reject(new CharacterStorageError('Dung lượng lưu trữ trình duyệt đã đầy. Hãy xóa bớt nhân vật cũ.'));
        } else {
          reject(new CharacterStorageError('Không thể lưu file GIF vào IndexedDB.'));
        }
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        const errName = tx.error?.name || '';
        db.close();
        if (errName === 'QuotaExceededError') {
          reject(new CharacterStorageError('Dung lượng lưu trữ trình duyệt đã đầy. Hãy xóa bớt nhân vật cũ.'));
        } else {
          reject(new CharacterStorageError('Lỗi giao dịch khi lưu GIF vào IndexedDB.'));
        }
      };
    } catch {
      db.close();
      reject(new CharacterStorageError('Không thể ghi dữ liệu GIF vào IndexedDB.'));
    }
  });
}

export async function getCharacterBlob(id: string): Promise<Blob | null> {
  if (!id) return null;
  try {
    const db = await openDb();
    return await new Promise(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const result = req.result;
          resolve(result && result.blob instanceof Blob ? result.blob : null);
        };
        req.onerror = () => resolve(null);
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      } catch {
        db.close();
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

async function removeBlob(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>(resolve => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      } catch {
        db.close();
        resolve();
      }
    });
  } catch {
    // Ignore IDB failure during cleanup
  }
}

function generateUniqueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `gif-char-${crypto.randomUUID()}`;
  }
  return `gif-char-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listCharacters(): Promise<CharacterRecord[]> {
  const metaList = readMetaList();
  return metaList.map(meta => ({ ...meta }));
}

export async function addCharacter(input: {
  file: File;
  name?: string;
  scale?: number;
}): Promise<CharacterRecord> {
  const currentList = readMetaList();
  if (currentList.length >= MAX_CHARACTERS_COUNT) {
    throw new CharacterStorageError(`Đã đạt tối đa ${MAX_CHARACTERS_COUNT} nhân vật`);
  }

  const validation = await validateGifFile(input.file);
  if (validation.valid === false) {
    throw new CharacterStorageError(validation.error);
  }

  const trimmedName = (input.name ?? '').trim() || stripGifExtension(input.file.name);
  const newRecord: CharacterMeta = {
    id: generateUniqueId(),
    name: trimmedName.slice(0, 50),
    size: input.file.size,
    scale: clampCharacterScale(input.scale),
    createdAt: new Date().toISOString(),
  };

  await putBlob(newRecord.id, input.file);

  try {
    const updatedList = [...currentList, newRecord];
    writeMetaList(updatedList);
  } catch (err) {
    await removeBlob(newRecord.id);
    throw err;
  }

  return {
    ...newRecord,
    blob: input.file,
  };
}

export async function renameCharacter(id: string, newName: string): Promise<CharacterMeta[]> {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new CharacterStorageError('Tên nhân vật không được để trống.');
  }

  const currentList = readMetaList();
  const exists = currentList.some(c => c.id === id);
  if (!exists) {
    throw new CharacterStorageError('Không tìm thấy nhân vật cần đổi tên.');
  }

  const updated = currentList.map(c =>
    c.id === id ? { ...c, name: trimmed.slice(0, 50) } : c
  );
  writeMetaList(updated);
  return updated;
}

export async function updateCharacterScale(id: string, scale: number): Promise<CharacterMeta[]> {
  const currentList = readMetaList();
  const exists = currentList.some(c => c.id === id);
  if (!exists) {
    throw new CharacterStorageError('Không tìm thấy nhân vật cần chỉnh kích thước.');
  }

  const nextScale = clampCharacterScale(scale);
  const updated = currentList.map(c =>
    c.id === id ? { ...c, scale: nextScale } : c
  );
  writeMetaList(updated);
  return updated;
}

export async function deleteCharacter(id: string): Promise<{
  characters: CharacterMeta[];
  nextSelectedId: string | null;
}> {
  const currentList = readMetaList();
  const updated = currentList.filter(c => c.id !== id);
  writeMetaList(updated);
  await removeBlob(id);

  const currentSelected = getSelectedId();
  let nextSelectedId = currentSelected;
  if (currentSelected === id) {
    nextSelectedId = updated.length > 0 ? updated[0].id : null;
    setSelectedId(nextSelectedId);
  }

  return {
    characters: updated,
    nextSelectedId,
  };
}

export function getSelectedId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.localStorage.getItem(SELECTED_CHARACTER_ID_KEY);
    return val && val.trim() ? val : null;
  } catch {
    return null;
  }
}

export function setSelectedId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!id) {
      window.localStorage.removeItem(SELECTED_CHARACTER_ID_KEY);
    } else {
      window.localStorage.setItem(SELECTED_CHARACTER_ID_KEY, id);
    }
  } catch {
    // Ignore storage quota errors on small ID write
  }
}
