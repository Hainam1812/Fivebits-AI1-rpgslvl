import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import {
  DEFAULT_CHARACTER_SCALE,
  MAX_CHARACTER_SCALE,
  MIN_CHARACTER_SCALE,
  clampCharacterScale,
} from '../../store/characterStorage.js';
import { AlertTriangle, Check, Loader2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

export interface PendingGifItem {
  tempId: string;
  file: File;
  defaultName: string;
  name: string;
  scale: number;
  isDuplicate: boolean;
  skip: boolean;
}

interface AddCharacterDialogProps {
  isOpen: boolean;
  items: PendingGifItem[];
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (finalItems: { file: File; name: string; scale: number }[]) => Promise<void>;
}

export const AddCharacterDialog: React.FC<AddCharacterDialogProps> = ({
  isOpen,
  items,
  isSaving,
  onClose,
  onConfirm,
}) => {
  const [draftItems, setDraftItems] = useState<PendingGifItem[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Sync draft items & manage temporary preview Object URLs
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      setDraftItems([]);
      setPreviewUrls(prev => {
        Object.values(prev).forEach(url => URL.revokeObjectURL(url));
        return {};
      });
      setFormError(null);
      return;
    }

    setDraftItems(items);
    setFormError(null);

    const urls: Record<string, string> = {};
    for (const item of items) {
      urls[item.tempId] = URL.createObjectURL(item.file);
    }
    setPreviewUrls(urls);

    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [isOpen, items]);

  if (!isOpen) return null;

  const activeItems = draftItems.filter(item => !item.skip);

  const handleNameChange = (tempId: string, value: string) => {
    setDraftItems(prev =>
      prev.map(item => (item.tempId === tempId ? { ...item, name: value } : item))
    );
    if (formError) setFormError(null);
  };

  const handleScaleChange = (tempId: string, nextScale: number) => {
    const clamped = clampCharacterScale(nextScale);
    setDraftItems(prev =>
      prev.map(item => (item.tempId === tempId ? { ...item, scale: clamped } : item))
    );
  };

  const handleToggleSkip = (tempId: string) => {
    setDraftItems(prev =>
      prev.map(item => (item.tempId === tempId ? { ...item, skip: !item.skip } : item))
    );
    if (formError) setFormError(null);
  };

  const handleSaveWithCustomNames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0) {
      onClose();
      return;
    }

    const prepared = activeItems.map(item => ({
      file: item.file,
      name: item.name.trim() || item.defaultName,
      scale: clampCharacterScale(item.scale),
    }));

    await onConfirm(prepared);
  };

  const handleSkipNamingUseDefault = async () => {
    if (activeItems.length === 0) {
      onClose();
      return;
    }

    const prepared = activeItems.map(item => ({
      file: item.file,
      name: item.defaultName,
      scale: clampCharacterScale(item.scale),
    }));

    await onConfirm(prepared);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title={`Thêm Nhân Vật GIF (${activeItems.length}/${draftItems.length})`}
      maxWidth="md"
    >
      <form onSubmit={handleSaveWithCustomNames} className="space-y-4">
        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
          Đặt tên và điều chỉnh kích thước hiển thị cho nhân vật vừa chọn, hoặc bấm{' '}
          <strong className="text-[var(--gold)]">Bỏ qua & Dùng tên mặc định</strong> để giữ nguyên tên từ file GIF.
        </p>

        <div className="space-y-3 max-h-[54vh] overflow-y-auto pr-1">
          {draftItems.map(item => {
            const url = previewUrls[item.tempId];
            const scalePercent = Math.round(item.scale * 100);

            return (
              <div
                key={item.tempId}
                className={`p-3 rounded-[2px] border-2 transition-all ${
                  item.skip
                    ? 'bg-[var(--bg)] border-[#3B4474] opacity-60'
                    : item.isDuplicate
                    ? 'bg-[var(--panel-2)] border-[var(--gold)]'
                    : 'bg-[var(--bg)] border-[#3B4474]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Scaled Thumbnail Preview */}
                  <div className="w-20 h-20 shrink-0 rounded-[2px] bg-[var(--panel)] border-2 border-[#3B4474] flex items-center justify-center overflow-hidden p-1.5">
                    {url ? (
                      <img
                        src={url}
                        alt={item.name || item.defaultName}
                        style={{ transform: `scale(${item.scale})` }}
                        className="w-full h-full object-contain transition-transform duration-150"
                      />
                    ) : null}
                  </div>

                  {/* Name input, size slider & metadata */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`char-name-${item.tempId}`}
                        className="text-xs font-semibold text-[var(--muted)] truncate"
                      >
                        {item.file.name} ({formatSize(item.file.size)})
                      </label>

                      <button
                        type="button"
                        onClick={() => handleToggleSkip(item.tempId)}
                        disabled={isSaving}
                        className={`px-2 py-0.5 rounded-[2px] text-xs font-semibold border-2 transition-colors cursor-pointer shrink-0 ${
                          item.skip
                            ? 'bg-[var(--panel-2)] border-[var(--sky)] text-[var(--sky)] hover:text-[var(--text)]'
                            : 'bg-[var(--panel)] border-[#3B4474] text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        {item.skip ? 'Thêm lại' : 'Bỏ file này'}
                      </button>
                    </div>

                    <input
                      id={`char-name-${item.tempId}`}
                      type="text"
                      value={item.name}
                      disabled={item.skip || isSaving}
                      maxLength={50}
                      onChange={e => handleNameChange(item.tempId, e.target.value)}
                      placeholder={item.defaultName}
                      className="pixel-input w-full px-3 py-2 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] disabled:opacity-50"
                    />

                    {/* Scale / Size Adjustment Controls */}
                    <div className="p-2 rounded-[2px] bg-[var(--panel)] border-2 border-[var(--ink)] space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`char-scale-${item.tempId}`}
                          className="text-xs font-semibold text-[var(--muted)]"
                        >
                          Kích thước nhân vật:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-num text-[var(--gold)] px-1.5 py-0.5 rounded-[2px] bg-[var(--bg)] border border-[var(--gold)]">
                            {scalePercent}%
                          </span>
                          {item.scale !== DEFAULT_CHARACTER_SCALE && (
                            <button
                              type="button"
                              disabled={item.skip || isSaving}
                              onClick={() => handleScaleChange(item.tempId, DEFAULT_CHARACTER_SCALE)}
                              className="p-1 rounded-[2px] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-colors cursor-pointer disabled:opacity-40"
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
                          disabled={item.skip || isSaving || item.scale <= MIN_CHARACTER_SCALE}
                          onClick={() => handleScaleChange(item.tempId, item.scale - 0.1)}
                          className="p-1.5 rounded-[2px] bg-[var(--bg)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="Thu nhỏ 10%"
                          aria-label={`Thu nhỏ ${item.name || item.defaultName}`}
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>

                        <input
                          id={`char-scale-${item.tempId}`}
                          type="range"
                          min={MIN_CHARACTER_SCALE}
                          max={MAX_CHARACTER_SCALE}
                          step={0.05}
                          value={item.scale}
                          disabled={item.skip || isSaving}
                          onChange={e => handleScaleChange(item.tempId, parseFloat(e.target.value))}
                          className="flex-1 cursor-pointer disabled:opacity-50"
                        />

                        <button
                          type="button"
                          disabled={item.skip || isSaving || item.scale >= MAX_CHARACTER_SCALE}
                          onClick={() => handleScaleChange(item.tempId, item.scale + 0.1)}
                          className="p-1.5 rounded-[2px] bg-[var(--bg)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                          title="Phóng to 10%"
                          aria-label={`Phóng to ${item.name || item.defaultName}`}
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {item.isDuplicate && !item.skip && (
                      <div className="flex items-start gap-1.5 text-xs text-[var(--gold)] bg-[var(--bg)] border border-[var(--gold)] rounded-[2px] px-2.5 py-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--gold)]" />
                        <span>
                          File này trùng tên và dung lượng với nhân vật đã có. Bạn có thể bấm "Bỏ file này" hoặc giữ nguyên để thêm bản sao.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {formError && (
          <p className="text-xs text-[var(--danger)] font-medium">{formError}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t-2 border-[var(--ink)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
            icon={<X className="w-4 h-4" />}
          >
            Hủy
          </Button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSkipNamingUseDefault}
              disabled={isSaving || activeItems.length === 0}
            >
              Bỏ qua & Dùng tên mặc định
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving || activeItems.length === 0}
              icon={
                isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )
              }
            >
              {isSaving
                ? 'Đang lưu GIF...'
                : `Thêm (${activeItems.length}) nhân vật`}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
