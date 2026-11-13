import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  Edit3,
  ImagePlus,
  Loader2,
  MoreVertical,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  Upload,
  X,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import {
  CharacterMeta,
  DEFAULT_CHARACTER_SCALE,
  MAX_CHARACTERS_COUNT,
  MAX_CHARACTER_GIF_BYTES,
  MAX_CHARACTER_SCALE,
  MIN_CHARACTER_SCALE,
  stripGifExtension,
  validateGifFile,
} from '../../store/characterStorage.js';
import { useCharacterLibrary } from '../../store/CharacterLibraryContext.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';
import { Modal } from '../ui/Modal.js';
import { LazyCharacterGif } from './LazyCharacterGif.js';
import { AddCharacterDialog, PendingGifItem } from './AddCharacterDialog.js';

interface ToastState {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const CharacterSelect: React.FC = () => {
  const {
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
  } = useCharacterLibrary();

  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isValidatingFiles, setIsValidatingFiles] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingGifItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<CharacterMeta | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CharacterMeta | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [previewImgError, setPreviewImgError] = useState(false);

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    const id = Date.now();
    setToast({ id, type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(prev => (prev?.id === toast.id ? null : prev));
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (storageError) {
      showToast('error', storageError);
      clearStorageError();
    }
  }, [storageError, showToast, clearStorageError]);

  useEffect(() => {
    setPreviewImgError(false);
  }, [selectedGifUrl, selectedId]);

  // Close open card dropdown menu on outside click or Escape
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = () => setOpenMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const openFilePicker = () => {
    if (characters.length >= MAX_CHARACTERS_COUNT) {
      showToast('error', `Đã đạt tối đa ${MAX_CHARACTERS_COUNT} nhân vật`);
      return;
    }
    fileInputRef.current?.click();
  };

  const processIncomingFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (characters.length >= MAX_CHARACTERS_COUNT) {
      showToast('error', `Đã đạt tối đa ${MAX_CHARACTERS_COUNT} nhân vật`);
      return;
    }

    setIsValidatingFiles(true);
    const errors: string[] = [];
    const validPending: PendingGifItem[] = [];
    let availableSlots = MAX_CHARACTERS_COUNT - characters.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = await validateGifFile(file);

        if (validation.valid === false) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        if (availableSlots <= 0) {
          errors.push(`${file.name}: Đã đạt tối đa ${MAX_CHARACTERS_COUNT} nhân vật`);
          continue;
        }

        availableSlots -= 1;
        const defaultName = stripGifExtension(file.name);
        const normalizedDefault = defaultName.trim().toLowerCase();

        const isDuplicateInExisting = characters.some(
          c => c.name.trim().toLowerCase() === normalizedDefault && c.size === file.size
        );
        const isDuplicateInBatch = validPending.some(
          p => p.defaultName.trim().toLowerCase() === normalizedDefault && p.file.size === file.size
        );

        validPending.push({
          tempId: `pending-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          defaultName,
          name: defaultName,
          scale: DEFAULT_CHARACTER_SCALE,
          isDuplicate: isDuplicateInExisting || isDuplicateInBatch,
          skip: false,
        });
      }

      if (errors.length > 0) {
        const previewErrors = errors.slice(0, 3).join(' | ');
        const extra = errors.length > 3 ? ` (+${errors.length - 3} file khác)` : '';
        showToast('error', `${previewErrors}${extra}`);
      }

      if (validPending.length > 0) {
        setPendingItems(validPending);
        setIsAddDialogOpen(true);
      }
    } finally {
      setIsValidatingFiles(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processIncomingFiles(files);
    }
    // Reset input so selecting the same file again still triggers onChange
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging && e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleConfirmAdd = async (finalItems: { file: File; name: string; scale: number }[]) => {
    const result = await addCharacters(finalItems);
    setIsAddDialogOpen(false);
    setPendingItems([]);

    if (result.added.length > 0 && result.errors.length === 0) {
      showToast(
        'success',
        result.added.length === 1
          ? `Đã thêm nhân vật "${result.added[0].name}"!`
          : `Đã thêm ${result.added.length} nhân vật mới!`
      );
    } else if (result.added.length > 0 && result.errors.length > 0) {
      showToast(
        'warning',
        `Đã thêm ${result.added.length} nhân vật. Lỗi: ${result.errors[0]}`
      );
    } else if (result.errors.length > 0) {
      showToast('error', result.errors[0]);
    }
  };

  const handleSelectCharacter = (char: CharacterMeta) => {
    if (selectedId === char.id) return;
    selectCharacter(char.id);
    showToast('success', `Đã chọn nhân vật "${char.name}"`);
  };

  const handleOpenRename = (char: CharacterMeta) => {
    setOpenMenuId(null);
    setRenameTarget(char);
    setRenameValue(char.name);
    setRenameError(null);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;

    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError('Tên nhân vật không được để trống.');
      return;
    }

    try {
      await renameCharacterById(renameTarget.id, trimmed);
      showToast('success', `Đã đổi tên thành "${trimmed}"`);
      setRenameTarget(null);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Không thể đổi tên nhân vật.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    try {
      const { nextSelectedId } = await deleteCharacterById(target.id);
      if (selectedId === target.id) {
        if (nextSelectedId) {
          showToast('success', `Đã xóa "${target.name}" và tự động chuyển sang nhân vật tiếp theo.`);
        } else {
          showToast('success', `Đã xóa "${target.name}". Thư viện hiện chưa chọn nhân vật nào.`);
        }
      } else {
        showToast('success', `Đã xóa nhân vật "${target.name}".`);
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Không thể xóa nhân vật.');
    }
  };

  const maxMb = Math.round(MAX_CHARACTER_GIF_BYTES / (1024 * 1024));

  return (
    <div className="space-y-6 relative">
      {/* Hidden accessible multi-file GIF input */}
      <label htmlFor={fileInputId} className="sr-only">
        Chọn một hoặc nhiều file GIF nhân vật
      </label>
      <input
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        accept="image/gif,.gif"
        multiple
        onChange={handleFileInputChange}
        className="sr-only"
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-start gap-2.5 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500 text-rose-100'
              : toast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500 text-amber-100'
              : 'bg-cyan-950/95 border-cyan-400 text-cyan-100'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : toast.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-relaxed">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer p-0.5"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2.5">
            <Shirt className="w-6 h-6 text-cyan-400" />
            <span>Tủ Đồ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Thêm file GIF và chọn nhân vật đồng hành của bạn
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="px-3 py-1.5 rounded-xl bg-[#161B40] border border-slate-700/70 text-xs font-pixel text-slate-300">
            {characters.length} / {MAX_CHARACTERS_COUNT} nhân vật
          </span>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={openFilePicker}
            disabled={isSaving || isValidatingFiles}
            icon={
              isSaving || isValidatingFiles ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )
            }
          >
            + Thêm nhân vật
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isInitializing ? (
        <Card variant="surface" className="p-12 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-xs font-pixel text-slate-300">Đang tải thư viện nhân vật...</p>
        </Card>
      ) : characters.length === 0 ? (
        /* Empty State */
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center transition-all flex flex-col items-center justify-center space-y-4 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/25 shadow-[0_0_30px_rgba(6,182,212,0.25)] scale-[1.01]'
              : 'border-slate-700/80 bg-[#161B40]/60 hover:border-violet-500/60'
          }`}
        >
          <div
            onClick={openFilePicker}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openFilePicker();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Khu vực thêm file GIF nhân vật"
            className="w-16 h-16 rounded-2xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300 cursor-pointer hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <ImagePlus className="w-8 h-8 text-cyan-400" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-100">
              Chưa có nhân vật nào
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Kéo thả file GIF vào đây hoặc bấm để thêm
            </p>
            <p className="text-[11px] text-slate-400">
              Chỉ nhận file .gif hợp lệ (tối đa {maxMb}MB mỗi file, tối đa {MAX_CHARACTERS_COUNT} nhân vật).
            </p>
          </div>

          <Button
            type="button"
            variant="cyan"
            size="md"
            onClick={openFilePicker}
            disabled={isSaving || isValidatingFiles}
            icon={<Upload className="w-4 h-4" />}
          >
            + Thêm nhân vật
          </Button>
        </div>
      ) : (
        /* Populated State: Large Preview Panel + Character Grid */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Large Selected Character Preview Panel */}
          <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 z-10">
            <Card variant="surface" className="p-5 border-violet-500/35 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-300 font-pixel flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nhân vật đang chọn</span>
                </span>
                {selectedCharacter && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold font-pixel">
                    Đang chọn
                  </span>
                )}
              </div>

              <div className="w-full aspect-square max-h-64 sm:max-h-72 mx-auto rounded-2xl bg-[#0F132E] border border-slate-700/70 flex items-center justify-center p-4 overflow-hidden relative">
                {selectedCharacter && selectedGifUrl && !previewImgError ? (
                  <img
                    src={selectedGifUrl}
                    alt={selectedCharacter.name}
                    onError={() => setPreviewImgError(true)}
                    style={{ transform: `scale(${selectedCharacter.scale ?? 1})` }}
                    className="w-full h-full object-contain select-none transition-transform duration-150"
                    draggable={false}
                  />
                ) : selectedCharacter ? (
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    <span className="text-xs">Đang hiển thị GIF...</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center">
                    Chưa chọn nhân vật nào
                  </p>
                )}
              </div>

              {selectedCharacter && (
                <div className="space-y-3 pt-1 border-t border-slate-700/60">
                  <div>
                    <div className="text-base font-bold font-heading text-slate-100 truncate" title={selectedCharacter.name}>
                      {selectedCharacter.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Đã thêm: {new Date(selectedCharacter.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {/* Quick Size Adjustment for Selected Character */}
                  <div className="p-2.5 rounded-xl bg-[#0F132E] border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300">Kích thước hiển thị:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-pixel text-cyan-300">
                          {Math.round((selectedCharacter.scale ?? 1) * 100)}%
                        </span>
                        {(selectedCharacter.scale ?? 1) !== DEFAULT_CHARACTER_SCALE && (
                          <button
                            type="button"
                            onClick={() => updateCharacterScaleById(selectedCharacter.id, DEFAULT_CHARACTER_SCALE)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Đặt lại kích thước 100%"
                            aria-label="Đặt lại kích thước 100%"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={(selectedCharacter.scale ?? 1) <= MIN_CHARACTER_SCALE}
                        onClick={() =>
                          updateCharacterScaleById(selectedCharacter.id, (selectedCharacter.scale ?? 1) - 0.1)
                        }
                        className="p-1.5 rounded-lg bg-[#161B40] hover:bg-[#1F2656] text-slate-200 border border-slate-700/70 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Thu nhỏ 10%"
                        aria-label="Thu nhỏ nhân vật"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="range"
                        min={MIN_CHARACTER_SCALE}
                        max={MAX_CHARACTER_SCALE}
                        step={0.05}
                        value={selectedCharacter.scale ?? 1}
                        onChange={e =>
                          updateCharacterScaleById(selectedCharacter.id, parseFloat(e.target.value))
                        }
                        aria-label="Thanh điều chỉnh kích thước nhân vật"
                        className="flex-1 cursor-pointer"
                      />

                      <button
                        type="button"
                        disabled={(selectedCharacter.scale ?? 1) >= MAX_CHARACTER_SCALE}
                        onClick={() =>
                          updateCharacterScaleById(selectedCharacter.id, (selectedCharacter.scale ?? 1) + 0.1)
                        }
                        className="p-1.5 rounded-lg bg-[#161B40] hover:bg-[#1F2656] text-slate-200 border border-slate-700/70 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Phóng to 10%"
                        aria-label="Phóng to nhân vật"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenRename(selectedCharacter)}
                    >
                      Đổi tên
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setDeleteTarget(selectedCharacter)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Character Grid Dropzone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 w-full rounded-3xl p-1 transition-all relative ${
              isDragging
                ? 'ring-2 ring-cyan-400 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                : ''
            }`}
          >
            {isDragging && (
              <div className="absolute inset-0 z-30 rounded-3xl bg-[#0A0E27]/85 border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center gap-2 pointer-events-none">
                <Upload className="w-10 h-10 text-cyan-400 animate-bounce" />
                <p className="text-sm font-bold font-heading text-cyan-200">
                  Thả file GIF vào đây để thêm nhân vật
                </p>
              </div>
            )}

            <div
              role="radiogroup"
              aria-label="Thư viện nhân vật GIF"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {characters.map(char => {
                const isSelected = selectedId === char.id;
                const isMenuOpen = openMenuId === char.id;

                return (
                  <div
                    key={char.id}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Nhân vật ${char.name}${isSelected ? ' (Đang chọn)' : ''}`}
                    tabIndex={0}
                    onClick={() => handleSelectCharacter(char)}
                    onKeyDown={e => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectCharacter(char);
                      }
                    }}
                    className={`group relative rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between select-none focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                      isSelected
                        ? 'bg-[#1F2656] border-violet-400 rpg-border-glow shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                        : 'bg-[#161B40] border-slate-700/70 hover:border-violet-500/50 hover:bg-[#1A204C]'
                    }`}
                  >
                    {/* Top badges & menu */}
                    <div className="flex items-center justify-between gap-2 mb-2 min-h-[24px]">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600/30 border border-violet-400/60 text-violet-200 text-[10px] font-bold font-pixel">
                          <Check className="w-3 h-3 text-cyan-300" />
                          <span>Đang chọn</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setOpenMenuId(prev => (prev === char.id ? null : char.id));
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                          aria-label={`Tùy chọn cho ${char.name}`}
                          aria-haspopup="menu"
                          aria-expanded={isMenuOpen}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 mt-1 w-36 bg-[#0F132E] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 flex flex-col gap-1"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleOpenRename(char)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Đổi tên</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeleteTarget(char);
                              }}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition-colors text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GIF Thumbnail (object-contain, lazy-loaded) */}
                    <div className="w-full h-36 sm:h-40 rounded-xl bg-[#0F132E] border border-slate-800/90 flex items-center justify-center p-2 overflow-hidden">
                      <LazyCharacterGif
                        characterId={char.id}
                        name={char.name}
                        scale={char.scale ?? 1}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-contain"
                      />
                    </div>

                    {/* Name & Select Button */}
                    <div className="mt-3 space-y-2.5">
                      <div
                        className="font-bold text-sm text-slate-100 font-heading truncate text-center"
                        title={char.name}
                      >
                        {char.name}
                      </div>

                      <Button
                        type="button"
                        variant={isSelected ? 'secondary' : 'primary'}
                        size="sm"
                        fullWidth
                        aria-pressed={isSelected}
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectCharacter(char);
                        }}
                      >
                        {isSelected ? 'Đang chọn' : 'Chọn'}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* "+" Card at end of grid */}
              <button
                type="button"
                onClick={openFilePicker}
                disabled={isSaving || isValidatingFiles}
                className="min-h-[250px] rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-cyan-400/70 bg-[#161B40]/40 hover:bg-[#161B40]/80 p-4 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#0F132E] border border-slate-700 group-hover:border-cyan-400/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold font-heading text-slate-200 group-hover:text-cyan-300">
                    Thêm nhân vật
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Chọn hoặc kéo thả file GIF
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Character Naming Dialog */}
      <AddCharacterDialog
        isOpen={isAddDialogOpen}
        items={pendingItems}
        isSaving={isSaving}
        onClose={() => {
          setIsAddDialogOpen(false);
          setPendingItems([]);
        }}
        onConfirm={handleConfirmAdd}
      />

      {/* Rename Modal */}
      <Modal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Đổi Tên Nhân Vật"
        maxWidth="sm"
      >
        <form onSubmit={handleConfirmRename} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="rename-character-input" className="text-xs font-bold text-slate-300">
              Tên nhân vật mới:
            </label>
            <input
              id="rename-character-input"
              type="text"
              value={renameValue}
              maxLength={50}
              autoFocus
              onChange={e => {
                setRenameValue(e.target.value);
                if (renameError) setRenameError(null);
              }}
              placeholder="Nhập tên nhân vật..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
            />
            {renameError && (
              <p className="text-xs text-rose-400 font-medium">{renameError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRenameTarget(null)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSaving}>
              Lưu tên mới
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Xác Nhận Xóa Nhân Vật"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa nhân vật{' '}
            <strong className="text-white font-bold">"{deleteTarget?.name}"</strong>? File GIF sẽ bị xóa khỏi thiết bị này.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isSaving}
              onClick={handleConfirmDelete}
            >
              Xóa nhân vật
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
