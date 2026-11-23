import React from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useGame } from '../../store/GameContext.js';
import { saveStateToStorageImmediate } from '../../store/persistence.js';
import { ZoomIn, ZoomOut, Move, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface CharacterAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterAdjustModal: React.FC<CharacterAdjustModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state, dispatch } = useGame();

  const scale = state.profile.characterScale ?? 1;
  const offsetX = state.profile.characterOffsetX ?? 0;
  const offsetY = state.profile.characterOffsetY ?? 0;

  const updateTransform = (newScale?: number, newX?: number, newY?: number) => {
    const s = newScale !== undefined ? Math.min(2.2, Math.max(0.5, Math.round(newScale * 100) / 100)) : scale;
    const x = newX !== undefined ? Math.min(80, Math.max(-80, Math.round(newX))) : offsetX;
    const y = newY !== undefined ? Math.min(80, Math.max(-80, Math.round(newY))) : offsetY;

    dispatch({
      type: 'UPDATE_CHARACTER_TRANSFORM',
      payload: { scale: s, offsetX: x, offsetY: y },
    });
    saveStateToStorageImmediate({
      ...state,
      profile: {
        ...state.profile,
        characterScale: s,
        characterOffsetX: x,
        characterOffsetY: y,
      },
    });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_CHARACTER_TRANSFORM' });
    saveStateToStorageImmediate({
      ...state,
      profile: {
        ...state.profile,
        characterScale: 1,
        characterOffsetX: 0,
        characterOffsetY: 0,
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Căn Chỉnh & Thu Phóng Nhân Vật" maxWidth="sm">
      <div className="space-y-5">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Tùy chỉnh kích thước (phóng to, thu nhỏ) và vị trí căn lề của nhân vật để hiển thị đẹp nhất trên sân khấu.
        </p>

        {/* Zoom Section */}
        <div className="p-3.5 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[var(--gold)] flex items-center gap-1.5 uppercase tracking-wider font-pixel">
              <ZoomIn className="w-3.5 h-3.5 text-[var(--sky)]" />
              <span>Thu phóng (Kích thước)</span>
            </span>
            <span className="text-[var(--gold)] font-num text-xs px-2 py-0.5 rounded-[2px] bg-[var(--panel-2)] border border-[var(--gold)]">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateTransform(scale - 0.1)}
              disabled={scale <= 0.5}
              className="p-2 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Thu nhỏ 10%"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={scale}
              onChange={e => updateTransform(parseFloat(e.target.value))}
              className="flex-1 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => updateTransform(scale + 0.1)}
              disabled={scale >= 2.0}
              className="p-2 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Phóng to 10%"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alignment / Directional Section */}
        <div className="p-3.5 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] space-y-3">
          <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
            <span className="text-[var(--gold)] flex items-center gap-1.5 uppercase tracking-wider font-pixel">
              <Move className="w-3.5 h-3.5 text-[var(--sky)]" />
              <span>Căn chỉnh vị trí (Dời hình)</span>
            </span>
            <span className="text-[var(--muted)] font-num text-[10px]">
              X: <strong className="text-[var(--text)]">{offsetX > 0 ? `+${offsetX}` : offsetX}px</strong> | Y: <strong className="text-[var(--text)]">{offsetY > 0 ? `+${offsetY}` : offsetY}px</strong>
            </span>
          </div>

          {/* D-Pad Buttons */}
          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
            <button
              type="button"
              onClick={() => updateTransform(undefined, undefined, offsetY - 5)}
              className="p-2 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] transition-colors shadow-[2px_2px_0_0_var(--ink)] cursor-pointer"
              title="Dời lên trên"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateTransform(undefined, offsetX - 5, undefined)}
                className="p-2 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] transition-colors shadow-[2px_2px_0_0_var(--ink)] cursor-pointer"
                title="Dời sang trái"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-[2px] bg-[var(--panel-2)] hover:border-[var(--gold)] border-2 border-[var(--gold)] text-[var(--gold)] text-xs font-bold transition-colors cursor-pointer"
                title="Đặt lại chính giữa và kích thước gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => updateTransform(undefined, offsetX + 5, undefined)}
                className="p-2 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] transition-colors shadow-[2px_2px_0_0_var(--ink)] cursor-pointer"
                title="Dời sang phải"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => updateTransform(undefined, undefined, offsetY + 5)}
              className="p-2 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--text)] border-2 border-[#3B4474] transition-colors shadow-[2px_2px_0_0_var(--ink)] cursor-pointer"
              title="Dời xuống dưới"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-[var(--ink)]">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleReset}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
          >
            Mặc định
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Check className="w-4 h-4" />}
            onClick={onClose}
          >
            Xong
          </Button>
        </div>
      </div>
    </Modal>
  );
};
