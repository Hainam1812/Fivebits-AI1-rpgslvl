import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  CharacterMeta,
  addCharacter,
  deleteCharacter,
  getCharacterBlob,
  getSelectedId,
  listCharacters,
  renameCharacter,
  updateCharacterScale,
  setSelectedId as persistSelectedId,
} from './characterStorage.js';

interface CharacterLibraryContextValue {
  characters: CharacterMeta[];
  selectedId: string | null;
  selectedCharacter: CharacterMeta | null;
  selectedGifUrl: string | null;
  isInitializing: boolean;
  isSaving: boolean;
  storageError: string | null;
  selectCharacter: (id: string | null) => void;
  addCharacters: (items: { file: File; name?: string; scale?: number }[]) => Promise<{
    added: CharacterMeta[];
    errors: string[];
  }>;
  renameCharacterById: (id: string, newName: string) => Promise<void>;
  updateCharacterScaleById: (id: string, scale: number) => Promise<void>;
  deleteCharacterById: (id: string) => Promise<{ nextSelectedId: string | null }>;
  clearStorageError: () => void;
}

const CharacterLibraryContext = createContext<CharacterLibraryContextValue | null>(null);

export const CharacterLibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<CharacterMeta[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(() => getSelectedId());
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const activeObjectUrlRef = useRef<string | null>(null);

  const revokeActiveUrl = useCallback(() => {
    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }
  }, []);

  // Load character metadata list on mount
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const list = await listCharacters();
        if (!mounted) return;
        setCharacters(list);

        const storedSelected = getSelectedId();
        if (storedSelected && !list.some(c => c.id === storedSelected)) {
          const fallbackId = list.length > 0 ? list[0].id : null;
          persistSelectedId(fallbackId);
          setSelectedIdState(fallbackId);
        } else {
          setSelectedIdState(storedSelected);
        }
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải thư viện nhân vật.';
        setStorageError(msg);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      revokeActiveUrl();
    };
  }, [revokeActiveUrl]);

  // Keep selectedGifUrl synchronized with selectedId without recreating URLs on unrelated renders
  useEffect(() => {
    let cancelled = false;

    const loadSelectedBlob = async () => {
      if (!selectedId) {
        revokeActiveUrl();
        setSelectedGifUrl(null);
        return;
      }

      try {
        const blob = await getCharacterBlob(selectedId);
        if (cancelled) return;

        revokeActiveUrl();
        if (blob) {
          const nextUrl = URL.createObjectURL(blob);
          activeObjectUrlRef.current = nextUrl;
          setSelectedGifUrl(nextUrl);
        } else {
          setSelectedGifUrl(null);
        }
      } catch {
        if (!cancelled) {
          revokeActiveUrl();
          setSelectedGifUrl(null);
        }
      }
    };

    loadSelectedBlob();

    return () => {
      cancelled = true;
    };
  }, [selectedId, revokeActiveUrl]);

  const selectCharacter = useCallback((id: string | null) => {
    persistSelectedId(id);
    setSelectedIdState(id);
  }, []);

  const addCharacters = useCallback(
    async (items: { file: File; name?: string; scale?: number }[]) => {
      setIsSaving(true);
      setStorageError(null);

      const added: CharacterMeta[] = [];
      const errors: string[] = [];

      try {
        for (const item of items) {
          try {
            const record = await addCharacter(item);
            added.push({
              id: record.id,
              name: record.name,
              size: record.size,
              scale: record.scale,
              createdAt: record.createdAt,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi lưu file GIF.';
            errors.push(`${item.file.name}: ${msg}`);
          }
        }

        if (added.length > 0) {
          const updatedList = await listCharacters();
          setCharacters(updatedList);

          const currentSelected = getSelectedId();
          if (!currentSelected || !updatedList.some(c => c.id === currentSelected)) {
            const firstNewId = added[0].id;
            persistSelectedId(firstNewId);
            setSelectedIdState(firstNewId);
          }
        }

        if (errors.length > 0 && added.length === 0) {
          setStorageError(errors[0]);
        }
      } finally {
        setIsSaving(false);
      }

      return { added, errors };
    },
    []
  );

  const renameCharacterById = useCallback(async (id: string, newName: string) => {
    setIsSaving(true);
    setStorageError(null);
    try {
      const updatedList = await renameCharacter(id, newName);
      setCharacters(updatedList);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể đổi tên nhân vật.';
      setStorageError(msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateCharacterScaleById = useCallback(async (id: string, scale: number) => {
    setStorageError(null);
    try {
      const updatedList = await updateCharacterScale(id, scale);
      setCharacters(updatedList);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật kích thước nhân vật.';
      setStorageError(msg);
      throw err;
    }
  }, []);

  const deleteCharacterById = useCallback(async (id: string) => {
    setIsSaving(true);
    setStorageError(null);
    try {
      const res = await deleteCharacter(id);
      setCharacters(res.characters);
      setSelectedIdState(res.nextSelectedId);
      return { nextSelectedId: res.nextSelectedId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa nhân vật.';
      setStorageError(msg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearStorageError = useCallback(() => {
    setStorageError(null);
  }, []);

  const selectedCharacter = selectedId
    ? characters.find(c => c.id === selectedId) || null
    : null;

  return (
    <CharacterLibraryContext.Provider
      value={{
        characters,
        selectedId,
        selectedCharacter,
        selectedGifUrl,
        isInitializing,
        isSaving,
        storageError,
        selectCharacter,
        addCharacters,
        renameCharacterById,
        updateCharacterScaleById,
        deleteCharacterById,
        clearStorageError,
      }}
    >
      {children}
    </CharacterLibraryContext.Provider>
  );
};

export function useCharacterLibrary(): CharacterLibraryContextValue {
  const ctx = useContext(CharacterLibraryContext);
  if (!ctx) {
    throw new Error('useCharacterLibrary must be used within a CharacterLibraryProvider');
  }
  return ctx;
}
