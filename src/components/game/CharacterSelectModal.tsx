import React, { useEffect, useState } from 'react';
import { useGame } from '../../store/GameContext.js';
import { useCharacterLibrary } from '../../store/CharacterLibraryContext.js';
import charactersData from '../../data/characters.json' with { type: 'json' };
import { Button } from '../ui/Button.js';
import { Sparkles, Check, User, Upload, Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { saveCharBlob, deleteCharBlob } from '../../store/indexedDb.js';
import { saveStateToStorageImmediate } from '../../store/persistence.js';
import { validateCharacterName, sanitizeCharacterInput } from '../../domain/character.js';

interface CharacterSelectModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  isOpen,
  onClose,
  title = 'Chọn Nhân Vật & Biệt Danh',
  subtitle = 'Chào mừng bạn đến với SOLO LEVELLING! Chọn nhân vật sinh viên 2D Pixel hoặc tải lên file GIF riêng để bắt đầu hành trình!',
}) => {
  const { state, dispatch } = useGame();
  const { characters, selectedCharacter, selectCharacter } = useCharacterLibrary();
  const [selectedId, setSelectedId] = useState<string>(() => {
    const builtIn = Array.isArray(charactersData) ? charactersData : [];
    const curId = state.profile.characterId;
    const isValid =
      builtIn.some((c: any) => c.id === curId) ||
      (state.customCharacters || []).some(c => c.id === curId);
    return isValid ? curId : builtIn[0]?.id || 'boy1';
  });
  const [hasPickedCharacter, setHasPickedCharacter] = useState(false);
  const [nickname, setNickname] = useState<string>(state.profile.nickname || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [charName, setCharName] = useState('');
  const [charTagline, setCharTagline] = useState('');
  const [charDescription, setCharDescription] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [charToDelete, setCharToDelete] = useState<{ id: string; displayName: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setNickname(state.profile.nickname || '');
    setErrorMsg(null);
    setHasPickedCharacter(false);

    const builtIn = Array.isArray(charactersData) ? charactersData : [];
    if (state.profile.nickname?.trim() && selectedCharacter) {
      const normalized = selectedCharacter.name.trim().toLowerCase();
      if (selectedCharacter.id === 'preset-char-boy1' || normalized === 'boy1') {
        setSelectedId('boy1');
        return;
      }
      if (selectedCharacter.id === 'preset-char-girl1' || normalized === 'girl1') {
        setSelectedId('girl1');
        return;
      }
    }

    const curId = state.profile.characterId;
    const isValid =
      builtIn.some((c: any) => c.id === curId) ||
      (state.customCharacters || []).some(c => c.id === curId);
    setSelectedId(isValid ? curId : builtIn[0]?.id || 'boy1');
  }, [isOpen]);

  if (!isOpen) return null;

  const builtInCharacters = Array.isArray(charactersData) ? charactersData : [];
  const customCharacters = state.customCharacters || [];
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File quá lớn! Dung lượng tối đa là 2 MB.');
      return;
    }

    if (!['image/gif', 'image/png', 'image/webp', 'image/apng'].includes(file.type)) {
      setUploadError('Vui lòng chọn file GIF, PNG hoặc WebP 2D Pixel.');
      return;
    }

    setUploadError(null);
    setUploadFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreviewUrl(url);
  };

  const handleSaveCustomChar = async () => {
    const nameVal = validateCharacterName(charName);
    if (!nameVal.isValid) {
      setUploadError(nameVal.error || 'Tên nhân vật không được để trống.');
      return;
    }
    if (!uploadFile) {
      setUploadError('Vui lòng chọn file ảnh GIF/PNG cho nhân vật.');
      return;
    }

    const newId = `custom-char-${Date.now()}`;
    await saveCharBlob(newId, uploadFile);

    const newChar = {
      id: newId,
      displayName: nameVal.cleanName,
      tagline: charTagline.trim() || 'Sinh viên 2D Pixel',
      description: charDescription.trim() || charTagline.trim() || 'Nhân vật 2D Pixel tự tải lên',
      idleSrc: uploadPreviewUrl || '',
      pixelArt: true,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: 'ADD_CUSTOM_CHARACTER',
      payload: { character: newChar },
    });

    setSelectedId(newId);
    setHasPickedCharacter(true);
    setIsUploading(false);
    setUploadFile(null);
    setUploadPreviewUrl(null);
    setCharName('');
    setCharTagline('');
    setCharDescription('');
  };

  const handleConfirm = () => {
    const validation = validateCharacterName(nickname);
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Tên nhân vật không được để trống.');
      return;
    }

    dispatch({
      type: 'SET_PROFILE',
      payload: {
        characterId: selectedId,
        nickname: validation.cleanName,
      },
    });

    const isOnboarding = !state.profile.nickname || !state.profile.nickname.trim();
    if (isOnboarding || hasPickedCharacter) {
      if (selectedId === 'boy1' || selectedId === 'girl1') {
        const targetPresetId = selectedId === 'boy1' ? 'preset-char-boy1' : 'preset-char-girl1';
        const match = characters.find(
          c => c.id === targetPresetId || c.name.trim().toLowerCase() === selectedId
        );
        selectCharacter(match ? match.id : null);
      } else {
        selectCharacter(null);
      }
    }

    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-[#161B40] border border-violet-500/50 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-700/60 shrink-0 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>2D Pixel RPG Sinh Viên</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-100">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="py-5 overflow-y-auto space-y-5 flex-1 pr-1">
          {/* Nickname Input with strict constraints */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Tên nhân vật / Biệt danh (2 - 20 ký tự):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-pixel">
                {nickname.trim().length}/20
              </span>
            </div>
            <input
              type="text"
              value={nickname}
              onChange={e => {
                // Ràng buộc: bỏ các dấu cách dư đằng trước ngay khi nhập
                const sanitized = sanitizeCharacterInput(e.target.value);
                setNickname(sanitized);
                if (errorMsg) setErrorMsg(null);
              }}
              onBlur={() => {
                // Ràng buộc: bỏ các dấu cách dư đằng sau khi hoàn tất nhập
                setNickname(prev => prev.trim());
              }}
              placeholder="VD: Sung Jin-Woo, Nam, Minh, Hoàng, Lan..."
              maxLength={20}
              className={`w-full px-4 py-3 rounded-xl bg-[#0F132E] border text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors ${
                errorMsg
                  ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                  : 'border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
              }`}
            />
            {errorMsg ? (
              <p className="text-xs text-rose-400 font-medium flex items-center gap-1">
                <span>⚠️ {errorMsg}</span>
              </p>
            ) : nickname.trim().length >= 2 ? (
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span>✅ Tên nhân vật hợp lệ: <strong className="text-white font-bold">{nickname.trim()}</strong></span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                * Bắt buộc: Không được để trống, khoảng trắng ở đầu và cuối sẽ tự động bị loại bỏ.
              </p>
            )}
          </div>

          {/* Character selection header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Chọn nhân vật đại diện (2D Pixel GIF):
            </label>
            <div className="flex items-center gap-2">
              {customCharacters.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Bạn có chắc muốn xóa tất cả các nhân vật GIF đã tự tải lên khỏi thiết bị?')) {
                      for (const c of customCharacters) {
                        await deleteCharBlob(c.id);
                      }
                      dispatch({ type: 'CLEAR_ALL_CUSTOM_GIFS' });
                      setSelectedId('boy1');
                      saveStateToStorageImmediate({
                        ...state,
                        customCharacters: [],
                        profile: {
                          ...state.profile,
                          characterId: 'boy1',
                        },
                      });
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Xóa toàn bộ các ảnh GIF nhân vật tự tải"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết GIF đã tải ({customCharacters.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsUploading(!isUploading)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Đóng tải lên' : 'Tải lên GIF riêng'}</span>
              </button>
            </div>
          </div>

          {/* Custom Upload Section */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-[#0F132E] border border-cyan-500/40 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold font-heading">
                <Upload className="w-4 h-4" />
                <span>Tải Lên Nhân Vật 2D Pixel (GIF / PNG)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hỗ trợ ảnh động GIF 2D Pixel hoặc PNG sprite. Hệ thống tự động áp dụng hiệu ứng hiển thị pixelated sắc nét!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-20 h-20 shrink-0 rounded-xl bg-[#161B40] border border-slate-700 flex items-center justify-center overflow-hidden">
                  {uploadPreviewUrl ? (
                    <img
                      src={uploadPreviewUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain pixelated"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="file"
                    accept="image/gif,image/png,image/webp,image/apng"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={charName}
                    onChange={e => {
                      setCharName(sanitizeCharacterInput(e.target.value));
                      if (uploadError) setUploadError(null);
                    }}
                    onBlur={() => setCharName(prev => prev.trim())}
                    placeholder="Tên nhân vật (VD: Coder Tân Binh...)"
                    maxLength={20}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#161B40] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    value={charTagline}
                    onChange={e => setCharTagline(e.target.value)}
                    placeholder="Khẩu hiệu ngắn..."
                    maxLength={40}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#161B40] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <textarea
                    value={charDescription}
                    onChange={e => setCharDescription(e.target.value)}
                    placeholder="Mô tả / Tiểu sử nhân vật (VD: Chiến binh IT cày deadline, thích uống cà phê...)"
                    rows={2}
                    maxLength={140}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#161B40] border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>
              </div>

              {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => {
                  setIsUploading(false);
                  setCharDescription('');
                }}>
                  Hủy
                </Button>
                <Button size="sm" variant="cyan" onClick={handleSaveCustomChar}>
                  Lưu & Chọn Nhân Vật Này
                </Button>
              </div>
            </div>
          )}

          {/* Built-in and Custom Characters Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Built-in characters */}
            {builtInCharacters.map((char: any) => {
              const isSelected = selectedId === char.id;
              const imgSrc = `${baseUrl}/${char.idle.src.replace(/^\//, '')}`;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    setSelectedId(char.id);
                    setHasPickedCharacter(true);
                  }}
                  className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center select-none ${
                    isSelected
                      ? 'bg-violet-950/40 border-violet-400 shadow-lg shadow-violet-900/40 scale-[1.02]'
                      : 'bg-[#0F132E] border-slate-700/60 hover:border-slate-500 hover:bg-[#121738]'
                  }`}
                >
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-[10px] font-semibold">
                    Mặc định
                  </div>

                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative my-1 mt-4">
                    <img
                      src={imgSrc}
                      alt={char.displayName}
                      className="max-w-full max-h-full object-contain pointer-events-none pixelated"
                      draggable={false}
                    />
                  </div>

                  <div className="font-bold text-sm text-slate-100 mt-1 font-heading">
                    {char.displayName}
                  </div>
                  <div className="text-[11px] text-violet-300 font-medium line-clamp-1 mt-0.5">
                    {char.tagline || 'Chiến binh sinh viên'}
                  </div>
                  {char.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 px-1 leading-tight">
                      {char.description}
                    </p>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom user uploaded characters */}
            {customCharacters.map(char => {
              const isSelected = selectedId === char.id;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    setSelectedId(char.id);
                    setHasPickedCharacter(true);
                  }}
                  className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center select-none ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-900/40 scale-[1.02]'
                      : 'bg-[#0F132E] border-slate-700/60 hover:border-slate-500 hover:bg-[#121738]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setCharToDelete({ id: char.id, displayName: char.displayName });
                    }}
                    className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded-lg bg-rose-950/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/60 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
                    title="Xóa nhân vật GIF này vĩnh viễn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa GIF</span>
                  </button>

                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative my-1 mt-4">
                    {char.idleSrc ? (
                      <img
                        src={char.idleSrc}
                        alt={char.displayName}
                        className="max-w-full max-h-full object-contain pointer-events-none pixelated"
                        draggable={false}
                      />
                    ) : (
                      <span className="text-xs text-slate-500 font-pixel">Custom GIF</span>
                    )}
                  </div>

                  <div className="font-bold text-sm text-cyan-300 mt-1 font-heading">
                    {char.displayName}
                  </div>
                  <div className="text-[11px] text-cyan-400/80 font-medium line-clamp-1 mt-0.5">
                    {char.tagline || 'Nhân vật tải lên'}
                  </div>
                  {(char.description || char.tagline) && (
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 px-1 leading-tight">
                      {char.description || char.tagline}
                    </p>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-white shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-700/60 shrink-0 flex gap-3">
          {onClose && (
            <Button variant="secondary" size="lg" className="w-1/3" onClick={onClose}>
              Hủy bỏ
            </Button>
          )}
          <Button variant="primary" fullWidth size="lg" onClick={handleConfirm}>
            Xác Nhận & Bắt Đầu
          </Button>
        </div>
      </div>

      {/* In-app Character Deletion Modal */}
      {charToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#161B40] border border-rose-500/50 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold font-heading">
              <Trash2 className="w-5 h-5" />
              <span>Xóa Nhân Vật 2D Pixel</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc muốn xóa nhân vật <strong className="text-white font-bold">"{charToDelete.displayName}"</strong>? Ảnh GIF/PNG của nhân vật sẽ được xóa vĩnh viễn khỏi thiết bị này.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="secondary" onClick={() => setCharToDelete(null)}>
                Hủy
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  const targetId = charToDelete.id;
                  setCharToDelete(null);
                  await deleteCharBlob(targetId);
                  dispatch({ type: 'REMOVE_CUSTOM_CHARACTER', payload: { id: targetId } });
                  saveStateToStorageImmediate({
                    ...state,
                    customCharacters: (state.customCharacters || []).filter(c => c.id !== targetId),
                    profile: {
                      ...state.profile,
                      characterId: state.profile.characterId === targetId ? 'boy1' : state.profile.characterId,
                    },
                  });
                  if (selectedId === targetId) {
                    setSelectedId('boy1');
                  }
                }}
              >
                Xóa Vĩnh Viễn
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
