import React, { useState } from 'react';
import { useGame } from '../store/GameContext.js';
import { CharacterStage } from '../components/game/CharacterStage.js';
import { CharacterSprite } from '../components/game/CharacterSprite.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { RarityBadge } from '../components/ui/Badge.js';
import { COSMETICS, CosmeticDef } from '../data/cosmetics.js';
import { CosmeticSlot, GearSlot, CustomGearItem } from '../store/types.js';
import gearData from '../data/gear.json' with { type: 'json' };
import { selectUnlockedCosmetics } from '../store/selectors.js';
import { isCosmeticUnlocked } from '../domain/cosmetics.js';
import { saveGearBlob, deleteGearBlob, deleteCharBlob, clearAllCustomBlobs } from '../store/indexedDb.js';
import { saveStateToStorageImmediate } from '../store/persistence.js';
import { CharacterSelectModal } from '../components/game/CharacterSelectModal.js';
import { CharacterAdjustModal } from '../components/game/CharacterAdjustModal.js';
import charactersData from '../data/characters.json' with { type: 'json' };
import {
  Shirt,
  Sparkles,
  Layers,
  Upload,
  Check,
  Lock,
  Eye,
  Trash2,
  RotateCcw,
  Plus,
  ArrowRight,
  ChevronRight,
  User,
  Wand2,
  SlidersHorizontal,
  X,
  AlertTriangle,
} from 'lucide-react';

export const WardrobePage: React.FC = () => {
  const { state, dispatch, now } = useGame();

  const [activeTab, setActiveTab] = useState<'gear' | 'stage' | 'custom'>('gear');
  const [selectedGearSlot, setSelectedGearSlot] = useState<string>('all');
  const [selectedStageSlot, setSelectedStageSlot] = useState<CosmeticSlot | 'all'>('all');
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isAdjustCharModalOpen, setIsAdjustCharModalOpen] = useState(false);

  // Preview override state
  const [previewCosmetic, setPreviewCosmetic] = useState<{ slot: string; id: string } | null>(null);

  // Custom Upload Wizard State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadSlot, setUploadSlot] = useState<any>('head');
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeCharId = state.profile.characterId || 'hero';
  const unlockedCosmetics = selectUnlockedCosmetics(state, now);
  const unlockedCosmeticIds = new Set(unlockedCosmetics.map(c => c.id));

  const equippedGear = state.equippedGear[activeCharId] || {};
  const equippedCosmetics = state.equippedCosmetics;

  // Custom items list
  const customItems = state.customGearMeta;

  // Filter gear items
  const gearItems = Array.isArray(gearData) ? gearData : [];
  const filteredGear = gearItems.filter(item => {
    if (selectedGearSlot === 'all') return true;
    return item.slot === selectedGearSlot;
  });

  // Filter stage cosmetics
  const filteredStage = COSMETICS.filter(item => {
    if (selectedStageSlot === 'all') return true;
    return item.slot === selectedStageSlot;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File quá lớn! Dung lượng tối đa là 2 MB.');
      return;
    }

    if (!['image/gif', 'image/webp', 'image/png', 'image/apng'].includes(file.type)) {
      setUploadError('Chỉ chấp nhận file ảnh động/tĩnh GIF, WebP, PNG/APNG (từ chối SVG).');
      return;
    }

    setUploadError(null);
    setUploadFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreviewUrl(url);
  };

  const handleSaveCustomGear = async () => {
    // If editing existing item's position/alignment
    if (editingItemId) {
      dispatch({
        type: 'UPDATE_CUSTOM_GEAR_ADJUST',
        payload: {
          id: editingItemId,
          scale,
          offsetX,
          offsetY,
          flipX,
        },
      });
      saveStateToStorageImmediate({
        ...state,
        customGearMeta: state.customGearMeta.map(item =>
          item.id === editingItemId ? { ...item, scale, offsetX, offsetY, flipX } : item
        ),
      });
      setIsUploadModalOpen(false);
      setEditingItemId(null);
      setUploadFile(null);
      setUploadPreviewUrl(null);
      setToastMsg('Đã cập nhật vị trí phụ kiện thành công!');
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    if (!uploadFile || !uploadName.trim()) {
      setUploadError('Vui lòng chọn ảnh và đặt tên cho món đồ.');
      return;
    }

    const itemId = `custom-${Date.now()}`;
    // Save blob to IndexedDB
    await saveGearBlob(itemId, uploadFile);

    const newItem = {
      id: itemId,
      name: uploadName.trim(),
      slot: uploadSlot,
      imageBlobUrl: uploadPreviewUrl || undefined,
      scale,
      offsetX,
      offsetY,
      flipX,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: 'ADD_CUSTOM_GEAR_META',
      payload: { item: newItem },
    });

    saveStateToStorageImmediate({
      ...state,
      customGearMeta: [newItem, ...state.customGearMeta].slice(0, 30),
      equippedCustomGearIds: [...(state.equippedCustomGearIds || state.customGearMeta.map(m => m.id)), itemId],
    });

    setIsUploadModalOpen(false);
    setUploadFile(null);
    setUploadName('');
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setFlipX(false);
    setToastMsg('Đã thêm phụ kiện mới vào tủ đồ!');
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleOpenEditItem = (item: CustomGearItem) => {
    setEditingItemId(item.id);
    setUploadName(item.name);
    setUploadSlot(item.slot);
    setScale(item.scale ?? 1);
    setOffsetX(item.offsetX ?? 0);
    setOffsetY(item.offsetY ?? 0);
    setFlipX(item.flipX ?? false);
    setUploadPreviewUrl(item.imageBlobUrl || null);
    setUploadFile(null);
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  const handlePurgeAllCustomGifs = async () => {
    await clearAllCustomBlobs();
    dispatch({ type: 'CLEAR_ALL_CUSTOM_GIFS' });
    saveStateToStorageImmediate({
      ...state,
      customCharacters: [],
      customGearMeta: [],
      equippedCustomGearIds: [],
      profile: {
        ...state.profile,
        characterId: 'hero',
      },
    });
    setIsPurgeModalOpen(false);
    setToastMsg('Đã dọn dẹp sạch toàn bộ các file GIF tự tải trên thiết bị!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const equippedGearCount = Object.keys(equippedGear).length;
  const equippedCustomCount = (state.equippedCustomGearIds || []).length;
  const equippedCosmeticsCount = Object.keys(equippedCosmetics).length;
  const totalEquippedCount = equippedGearCount + equippedCustomCount + equippedCosmeticsCount;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2">
            <Shirt className="w-6 h-6 text-cyan-400" />
            <span>Tủ Đồ & Ngoại Trang</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ngoại trang và trang phục thuần thẩm mỹ – Không bán bằng tiền hay XP!
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#161B40] border border-slate-700/60 w-full sm:w-auto">
          {[
            { id: 'gear', label: 'Trang Phục (8 Slot)' },
            { id: 'stage', label: 'Sân Khấu (6 Slot)' },
            { id: 'custom', label: 'Đồ Của Bạn' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setPreviewCosmetic(null);
              }}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer ${
                activeTab === t.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Dedicated Character Preview Section (Natural flow, compact, never overlays or traps scroll) */}
      <div className="block lg:hidden w-full">
        <Card variant="surface" className="p-3.5 border-cyan-500/30 space-y-2.5">
          {previewCosmetic && (
            <div className="w-full py-1.5 px-3 bg-amber-500/20 border border-amber-400/50 text-amber-300 rounded-xl text-xs font-bold font-pixel flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>ĐANG XEM THỬ</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewCosmetic(null)}
                className="text-xs text-amber-200 underline font-semibold hover:text-white cursor-pointer"
              >
                Hủy xem thử
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Stationary Character Stage preview - compact for mobile */}
            <div className="shrink-0 rounded-2xl overflow-hidden border border-cyan-500/40 bg-[#0F132E]">
              <CharacterStage
                size="sm"
                showNameplate={false}
                characterScaleMultiplier={1.25}
                previewCosmetics={previewCosmetic ? { [previewCosmetic.slot]: previewCosmetic.id } : undefined}
              />
            </div>

            {/* Character Info & Quick Controls */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div>
                <div className="text-[10px] text-slate-400 font-pixel uppercase">Nhân vật</div>
                <div className="text-xs sm:text-sm font-bold text-cyan-300 truncate">
                  {state.customCharacters?.find(c => c.id === activeCharId)?.displayName ||
                    charactersData.find((c: any) => c.id === activeCharId)?.displayName ||
                    'Nam Sinh Viên (Quân)'}
                </div>
                {(() => {
                  const charObj = state.customCharacters?.find(c => c.id === activeCharId) ||
                    charactersData.find((c: any) => c.id === activeCharId);
                  const desc = charObj?.description || charObj?.tagline;
                  return desc ? (
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {desc}
                    </div>
                  ) : null;
                })()}
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Đang mang: <strong className={totalEquippedCount > 0 ? 'text-cyan-400' : 'text-slate-500'}>
                    {totalEquippedCount > 0 ? `${totalEquippedCount} món` : '0 món (Trống)'}
                  </strong>
                </div>
              </div>

              {/* Action buttons that don't overlap anything */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<SlidersHorizontal className="w-3 h-3 text-violet-400" />}
                  onClick={() => setIsAdjustCharModalOpen(true)}
                  className="text-[11px] py-1 px-2 h-7"
                >
                  Căn chỉnh
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<User className="w-3 h-3" />}
                  onClick={() => setIsCharModalOpen(true)}
                  className="text-[11px] py-1 px-2 h-7"
                >
                  Đổi GIF
                </Button>

                {totalEquippedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'UNEQUIP_EVERYTHING', payload: { characterId: activeCharId } });
                      setPreviewCosmetic(null);
                      saveStateToStorageImmediate({
                        ...state,
                        equippedGear: {},
                        equippedCustomGearIds: [],
                        equippedCosmetics: {},
                      });
                      setToastMsg('Đã gỡ sạch toàn bộ trang phục, phụ kiện và sân khấu!');
                      setTimeout(() => setToastMsg(null), 2500);
                    }}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/50 cursor-pointer ml-auto"
                    title="Gỡ sạch toàn bộ trang phục đang mang"
                  >
                    Gỡ hết
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Wardrobe Grid (Desktop: side-by-side sticky column; Mobile: stacked normal scroll) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Desktop Preview Panel Stage (Hidden on mobile, sticky on desktop) */}
        <div className="hidden lg:block lg:w-80 shrink-0 sticky top-24 z-10">
          <Card variant="surface" className="p-5 flex flex-col items-center text-center space-y-3 border-cyan-500/30">
            {previewCosmetic && (
              <div className="w-full py-1 px-3 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-lg text-xs font-bold font-pixel">
                ĐANG XEM THỬ (PREVIEW)
              </div>
            )}

            <CharacterStage
              size="lg"
              showNameplate={true}
              characterScaleMultiplier={2}
              previewCosmetics={previewCosmetic ? { [previewCosmetic.slot]: previewCosmetic.id } : undefined}
            />

            <div className="w-full flex items-center justify-between pt-2 border-t border-slate-700/60 flex-wrap gap-2">
              <div className="text-left flex-1 min-w-0 pr-2">
                <div className="text-[10px] text-slate-400 font-pixel uppercase">Nhân vật hiện tại</div>
                <div className="text-xs font-bold text-cyan-300 truncate">
                  {state.customCharacters?.find(c => c.id === activeCharId)?.displayName ||
                    charactersData.find((c: any) => c.id === activeCharId)?.displayName ||
                    'Nam Sinh Viên (Quân)'}
                </div>
                {(() => {
                  const charObj = state.customCharacters?.find(c => c.id === activeCharId) ||
                    charactersData.find((c: any) => c.id === activeCharId);
                  const desc = charObj?.description || charObj?.tagline;
                  return desc ? (
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {desc}
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />}
                  onClick={() => setIsAdjustCharModalOpen(true)}
                  title="Căn chỉnh vị trí và thu phóng nhân vật"
                >
                  Căn chỉnh
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<User className="w-3.5 h-3.5" />}
                  onClick={() => setIsCharModalOpen(true)}
                >
                  Đổi GIF
                </Button>
              </div>
            </div>

            {/* Status of equipped items */}
            <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-pixel py-1.5 border-t border-slate-700/40">
              <span>Đang mang trên người:</span>
              <span className={`font-bold ${totalEquippedCount > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                {totalEquippedCount > 0 ? `${totalEquippedCount} món` : '0 món (Trống)'}
              </span>
            </div>

            <div className="w-full flex flex-col gap-2 pt-1">
              {previewCosmetic ? (
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setPreviewCosmetic(null)}
                >
                  Hủy xem thử
                </Button>
              ) : (
                <div className="flex flex-col gap-1.5 w-full">
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    icon={<RotateCcw className="w-4 h-4" />}
                    disabled={totalEquippedCount === 0}
                    onClick={() => {
                      dispatch({ type: 'UNEQUIP_EVERYTHING', payload: { characterId: activeCharId } });
                      setPreviewCosmetic(null);
                      saveStateToStorageImmediate({
                        ...state,
                        equippedGear: {},
                        equippedCustomGearIds: [],
                        equippedCosmetics: {},
                      });
                      setToastMsg('Đã gỡ sạch toàn bộ trang phục, phụ kiện và sân khấu!');
                      setTimeout(() => setToastMsg(null), 2500);
                    }}
                    className="text-xs font-bold py-2 shadow-lg cursor-pointer"
                    title="Gỡ sạch toàn bộ trang phục, phụ kiện và sân khấu của nhân vật"
                  >
                    Gỡ Hết Toàn Bộ {totalEquippedCount > 0 ? `(${totalEquippedCount})` : ''}
                  </Button>

                  <div className="flex items-center justify-center pt-1 text-[11px]">
                    <button
                      type="button"
                      disabled={activeTab === 'stage' ? equippedCosmeticsCount === 0 : activeTab === 'gear' ? equippedGearCount === 0 : equippedCustomCount === 0}
                      onClick={() => {
                        if (activeTab === 'stage') {
                          dispatch({ type: 'UNEQUIP_ALL_COSMETICS' });
                          saveStateToStorageImmediate({ ...state, equippedCosmetics: {} });
                          setToastMsg('Đã gỡ toàn bộ hiệu ứng sân khấu!');
                        } else if (activeTab === 'gear') {
                          dispatch({ type: 'UNEQUIP_ALL_GEAR', payload: { characterId: activeCharId } });
                          saveStateToStorageImmediate({ ...state, equippedGear: { ...state.equippedGear, [activeCharId]: {} }, equippedCustomGearIds: [] });
                          setToastMsg('Đã gỡ toàn bộ trang phục!');
                        } else {
                          dispatch({ type: 'UNEQUIP_ALL_CUSTOM_GEAR' });
                          saveStateToStorageImmediate({ ...state, equippedCustomGearIds: [] });
                          setToastMsg('Đã gỡ toàn bộ phụ kiện tự chọn!');
                        }
                        setTimeout(() => setToastMsg(null), 2500);
                      }}
                      className="text-slate-400 hover:text-amber-300 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                    >
                      ↺ Gỡ riêng {activeTab === 'stage' ? 'sân khấu' : activeTab === 'gear' ? 'trang phục' : 'phụ kiện'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right / Main Content Column */}
        <div className="flex-1 w-full space-y-4">
          {/* TAB 1: Trang phục (Gear) */}
          {activeTab === 'gear' && (
            <div className="space-y-4">
              {/* Slot Filter Pills & Unequip Gear Button */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'head', label: 'Đầu' },
                    { id: 'face', label: 'Mặt' },
                    { id: 'body', label: 'Áo' },
                    { id: 'legs', label: 'Quần' },
                    { id: 'feet', label: 'Giày' },
                    { id: 'back', label: 'Lưng' },
                    { id: 'handheld', label: 'Cầm tay' },
                    { id: 'accessory', label: 'Phụ kiện' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedGearSlot(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        selectedGearSlot === s.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-[#161B40] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                  disabled={equippedGearCount === 0}
                  onClick={() => {
                    dispatch({ type: 'UNEQUIP_ALL_GEAR', payload: { characterId: activeCharId } });
                    saveStateToStorageImmediate({
                      ...state,
                      equippedGear: { ...state.equippedGear, [activeCharId]: {} },
                      equippedCustomGearIds: [],
                    });
                    setToastMsg('Đã gỡ sạch toàn bộ trang phục!');
                    setTimeout(() => setToastMsg(null), 2500);
                  }}
                  className="text-xs text-slate-200 hover:text-white shrink-0"
                  title="Tháo toàn bộ trang phục đang mặc trên nhân vật"
                >
                  Gỡ hết trang phục {equippedGearCount > 0 ? `(${equippedGearCount})` : ''}
                </Button>
              </div>

              {/* Gear Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredGear.map((item: any) => {
                  const isEquipped = equippedGear[item.slot as GearSlot] === item.id;
                  const isOwned = true; // Starter items are all starter unlocked

                  return (
                    <Card
                      key={item.id}
                      variant={isEquipped ? 'glow' : 'surface'}
                      className="p-4 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-violet-400 uppercase font-pixel">
                            {item.slot}
                          </span>
                          <RarityBadge rarity={item.rarity || 'Common'} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-100 font-heading mt-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                        {isEquipped ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            onClick={() =>
                              dispatch({
                                type: 'UNEQUIP_GEAR',
                                payload: { characterId: activeCharId, slot: item.slot },
                              })
                            }
                          >
                            Tháo ra
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            onClick={() =>
                              dispatch({
                                type: 'EQUIP_GEAR',
                                payload: { characterId: activeCharId, slot: item.slot, gearId: item.id },
                              })
                            }
                          >
                            Mặc vào
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Sân khấu (Stage Cosmetics) */}
          {activeTab === 'stage' && (
            <div className="space-y-4">
              {/* Slot Filter Pills & Unequip Stage Button */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1">
                <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'backdrop', label: 'Cảnh nền' },
                    { id: 'frame', label: 'Khung viền' },
                    { id: 'aura', label: 'Hào quang' },
                    { id: 'companion', label: 'Linh vật' },
                    { id: 'title', label: 'Danh hiệu' },
                    { id: 'nameplate', label: 'Bảng tên' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStageSlot(s.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        selectedStageSlot === s.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-[#161B40] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                  disabled={equippedCosmeticsCount === 0}
                  onClick={() => {
                    dispatch({ type: 'UNEQUIP_ALL_COSMETICS' });
                    setPreviewCosmetic(null);
                    saveStateToStorageImmediate({
                      ...state,
                      equippedCosmetics: {},
                    });
                    setToastMsg('Đã gỡ sạch toàn bộ hiệu ứng sân khấu!');
                    setTimeout(() => setToastMsg(null), 2500);
                  }}
                  className="text-xs text-slate-200 hover:text-white shrink-0"
                  title="Tháo toàn bộ hiệu ứng sân khấu đang áp dụng"
                >
                  Gỡ hết sân khấu {equippedCosmeticsCount > 0 ? `(${equippedCosmeticsCount})` : ''}
                </Button>
              </div>

              {/* Stage Cosmetics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredStage.map(cos => {
                  const isOwned = unlockedCosmeticIds.has(cos.id);
                  const isEquipped = equippedCosmetics[cos.slot] === cos.id;

                  return (
                    <Card
                      key={cos.id}
                      variant={isEquipped ? 'glow' : 'surface'}
                      className={`p-4 flex flex-col justify-between space-y-3 ${
                        !isOwned ? 'opacity-70 bg-slate-900/40' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase font-pixel">
                            {cos.slot}
                          </span>
                          <RarityBadge rarity={cos.rarity} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-100 font-heading mt-1">
                          {cos.name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {cos.description}
                        </p>
                      </div>

                      {/* Unlock condition notice if locked */}
                      {!isOwned && (
                        <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 flex items-start gap-1.5">
                          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            Khóa: {cos.unlock.type === 'level' ? `Đạt Level ${cos.unlock.level}` : cos.unlock.type === 'streak' ? `Đạt Streak ${cos.unlock.days} ngày` : 'Thử thách trong game'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                        {isOwned ? (
                          isEquipped ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              fullWidth
                              onClick={() =>
                                dispatch({ type: 'UNEQUIP_COSMETIC', payload: { slot: cos.slot } })
                              }
                            >
                              Tháo ra
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() => {
                                dispatch({
                                  type: 'EQUIP_COSMETIC',
                                  payload: { slot: cos.slot, cosmeticId: cos.id },
                                });
                                setPreviewCosmetic(null);
                              }}
                            >
                              Trang bị
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setPreviewCosmetic({ slot: cos.slot, id: cos.id })}
                          >
                            Xem thử
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Đồ của bạn (Custom User Gear & 2D Pixel Presets) */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* Presets Gallery */}
              <div className="p-4 rounded-2xl bg-[#161B40] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Phụ Kiện 2D Pixel Sẵn Có (Animated GIF)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Bấm vào phụ kiện để trang bị nhanh lên nhân vật sinh viên của bạn!
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw className="w-3.5 h-3.5 text-amber-400" />}
                    disabled={equippedCustomCount === 0}
                    onClick={() => {
                      dispatch({ type: 'UNEQUIP_ALL_CUSTOM_GEAR' });
                      saveStateToStorageImmediate({ ...state, equippedCustomGearIds: [] });
                      setToastMsg('Đã tháo toàn bộ phụ kiện đang đeo!');
                      setTimeout(() => setToastMsg(null), 2500);
                    }}
                    className="text-xs text-slate-200 hover:text-white shrink-0"
                    title="Tháo toàn bộ phụ kiện tùy chỉnh và phụ kiện sẵn có đang đeo"
                  >
                    Gỡ hết phụ kiện {equippedCustomCount > 0 ? `(${equippedCustomCount})` : ''}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                  {[
                    { id: 'preset-coffee', name: 'Ly Cà Phê Cày Deadline', slot: 'handheld', src: 'assets/gear/coffee_cup.gif', scale: 1.2, offsetX: -16, offsetY: 12 },
                    { id: 'preset-grad', name: 'Mũ Cử Nhân Pixel', slot: 'head', src: 'assets/gear/grad_cap.gif', scale: 1.2, offsetX: 0, offsetY: -34 },
                    { id: 'preset-shades', name: 'Kính Râm Pixel Ngầu', slot: 'face', src: 'assets/gear/pixel_shades.gif', scale: 1.0, offsetX: 0, offsetY: -12 },
                    { id: 'preset-cat', name: 'Mèo Đậu Trên Đầu', slot: 'head', src: 'assets/gear/cat_on_head.gif', scale: 1.1, offsetX: 0, offsetY: -34 },
                    { id: 'preset-headset', name: 'Tai Nghe Gaming Sinh Viên', slot: 'head', src: 'assets/gear/gaming_headset.gif', scale: 1.2, offsetX: 0, offsetY: -20 },
                  ].map(preset => {
                    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
                    const fullSrc = `${baseUrl}/${preset.src}`;
                    const currentEquippedIds = state.equippedCustomGearIds !== undefined
                      ? state.equippedCustomGearIds
                      : state.customGearMeta.map(m => m.id);
                    const isAlreadyEquipped = currentEquippedIds.includes(preset.id);

                    return (
                      <div
                        key={preset.id}
                        className={`p-2.5 rounded-xl border transition-all flex flex-col items-center text-center space-y-2 select-none ${
                          isAlreadyEquipped
                            ? 'bg-cyan-950/40 border-cyan-400/80 shadow-md shadow-cyan-950/50'
                            : 'bg-[#0F132E] border-slate-700 hover:border-cyan-400/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex items-center justify-center bg-[#161B40] rounded-lg p-1 border border-slate-800">
                          <img
                            src={fullSrc}
                            alt={preset.name}
                            className="max-h-full max-w-full object-contain pixelated"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 line-clamp-1 leading-tight">
                          {preset.name}
                        </span>
                        <Button
                          variant={isAlreadyEquipped ? 'secondary' : 'cyan'}
                          size="sm"
                          fullWidth
                          className="text-[10px] py-1"
                          onClick={() => {
                            const isPresentInMeta = state.customGearMeta.some(c => c.id === preset.id);
                            if (isPresentInMeta) {
                              dispatch({ type: 'TOGGLE_CUSTOM_GEAR_EQUIP', payload: { id: preset.id } });
                            } else {
                              dispatch({
                                type: 'ADD_CUSTOM_GEAR_META',
                                payload: {
                                  item: {
                                    id: preset.id,
                                    name: preset.name,
                                    slot: preset.slot as any,
                                    imageBlobUrl: fullSrc,
                                    scale: preset.scale,
                                    offsetX: preset.offsetX,
                                    offsetY: preset.offsetY,
                                    flipX: false,
                                    createdAt: new Date().toISOString(),
                                  },
                                },
                              });
                            }
                          }}
                        >
                          {isAlreadyEquipped ? 'Đang đeo (Bấm gỡ)' : '+ Đeo vào'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Uploaded Gear Section */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-heading">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Phụ Kiện Tự Tải Lên (GIF / PNG)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tải lên file ảnh động/tĩnh 2D Pixel của riêng bạn, căn chỉnh vị trí & kích cỡ trực quan.
                  </p>
                </div>
                <Button
                  variant="cyan"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingItemId(null);
                    setUploadFile(null);
                    setUploadPreviewUrl(null);
                    setUploadName('');
                    setScale(1);
                    setOffsetX(0);
                    setOffsetY(0);
                    setFlipX(false);
                    setUploadError(null);
                    setIsUploadModalOpen(true);
                  }}
                >
                  Tải lên phụ kiện
                </Button>
              </div>

              {customItems.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#161B40]/60 border border-dashed border-slate-700 space-y-3">
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-200">
                    Chưa có món đồ cá nhân nào
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Chọn nhanh các phụ kiện pixel sẵn có ở trên hoặc bấm "Tải lên phụ kiện" để thêm GIF/PNG riêng của bạn!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {customItems.map(item => {
                    const isEquipped = (
                      state.equippedCustomGearIds !== undefined
                        ? state.equippedCustomGearIds
                        : state.customGearMeta.map(m => m.id)
                    ).includes(item.id);

                    return (
                      <Card
                        key={item.id}
                        variant="surface"
                        className={`p-4 space-y-3 border-2 transition-all ${
                          isEquipped
                            ? 'border-cyan-500/70 bg-cyan-950/20 shadow-md shadow-cyan-950/40'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase font-pixel">
                            {item.slot}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditItem(item)}
                              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Căn chỉnh lại vị trí và kích thước món đồ này"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Chỉnh vị trí</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setItemToDelete({ id: item.id, name: item.name })}
                              className="px-2 py-0.5 rounded-md bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/50 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow"
                              title="Xóa phụ kiện này khỏi tủ đồ"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>

                        <div className="h-20 bg-[#0F132E] rounded-xl flex items-center justify-center p-2 border border-slate-800">
                          {item.imageBlobUrl ? (
                            <img src={item.imageBlobUrl} alt={item.name} className="max-h-full object-contain pixelated" />
                          ) : (
                            <span className="text-xs text-slate-500 font-pixel">Custom Item</span>
                          )}
                        </div>

                        <div className="font-bold text-sm text-slate-100">{item.name}</div>

                        <Button
                          variant={isEquipped ? 'secondary' : 'cyan'}
                          size="sm"
                          fullWidth
                          onClick={() => dispatch({ type: 'TOGGLE_CUSTOM_GEAR_EQUIP', payload: { id: item.id } })}
                        >
                          {isEquipped ? 'Đang đeo (Bấm để gỡ)' : 'Đeo vào nhân vật'}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Dedicated GIF Purge & Management Section */}
              <div className="p-4 rounded-2xl bg-[#0F132E] border border-slate-700/80 space-y-3 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Quản Lý & Xóa Toàn Bộ File GIF Cũ Đã Tải Lên</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Đang có <strong>{customItems.length}</strong> món phụ kiện tải lên và <strong>{state.customCharacters?.length || 0}</strong> nhân vật GIF tùy chỉnh trên thiết bị này.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={customItems.length === 0 && (!state.customCharacters || state.customCharacters.length === 0)}
                    onClick={() => setIsPurgeModalOpen(true)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    className="shrink-0"
                  >
                    Xóa Sạch Tất Cả GIF Đã Tải
                  </Button>
                </div>
                <div className="text-[11px] text-slate-400/90 leading-relaxed bg-[#161B40] p-2.5 rounded-xl border border-slate-800">
                  💡 <em>Lưu ý:</em> Nhân vật mặc định (Quân & Mai) và các trang phục chuẩn của game là tài nguyên gốc vĩnh viễn trong hệ thống, không thể xóa. Nút xóa trên sẽ dọn sạch các tệp GIF/PNG bạn đã tự tải lên để giải phóng bộ nhớ và làm sạch tủ đồ.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Gear Upload & Alignment Modal */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-[#161B40] border border-cyan-500/50 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setIsUploadModalOpen(false);
                setEditingItemId(null);
                setUploadFile(null);
                setUploadPreviewUrl(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2 pr-6">
              <Wand2 className="w-5 h-5 text-cyan-400" />
              <span>{editingItemId ? 'Căn Chỉnh Lại Vị Trí Phụ Kiện' : 'Tải Lên Phụ Kiện Mới (GIF / PNG)'}</span>
            </h3>

            {/* Step 1: File selection (Only if creating new item) */}
            {!editingItemId && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">1. Chọn file ảnh (GIF, WebP, PNG &le; 2MB):</label>
                <input
                  type="file"
                  accept="image/png,image/gif,image/webp,image/apng"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                />
              </div>
            )}

            {/* Step 2: Name & Slot */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">{editingItemId ? 'Tên món đồ:' : '2. Tên món đồ (1-30 ký tự):'}</label>
              <input
                type="text"
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="VD: Mũ Phù Thủy Tím..."
                maxLength={30}
                disabled={Boolean(editingItemId)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F132E] border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-75"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">{editingItemId ? 'Vị trí Slot:' : '3. Vị trí Slot:'}</label>
              <select
                value={uploadSlot}
                onChange={e => setUploadSlot(e.target.value)}
                disabled={Boolean(editingItemId)}
                className="w-full px-3 py-2 rounded-xl bg-[#0F132E] border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 disabled:opacity-75"
              >
                <option value="head">head (Mũ, nón, băng đô)</option>
                <option value="face">face (Kính, mặt nạ)</option>
                <option value="body">body (Áo, hoodie, giáp)</option>
                <option value="legs">legs (Quần, váy)</option>
                <option value="feet">feet (Giày, ủng)</option>
                <option value="back">back (Balo, cánh)</option>
                <option value="handheld">handheld (Vũ khí, sách, laptop)</option>
                <option value="accessory">accessory (Đồng hồ, huy hiệu)</option>
              </select>
            </div>

            {/* Step 3: Alignment Controls Panel */}
            {uploadPreviewUrl && (
              <div className="space-y-3 pt-2 border-t border-slate-700">
                <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5 font-heading">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Bảng Căn Chỉnh Vị Trí Phụ Kiện</span>
                    </span>
                    <span className="text-[10px] text-cyan-400 font-pixel font-bold">2D Pixel Grid</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Dùng các nút điều khiển hoặc kéo thanh trượt bên dưới để chỉnh kích cỡ và tọa độ X/Y cho phụ kiện vừa khít với nhân vật.
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-200">
                  Xem thử trực tiếp trên nhân vật:
                </div>

                <div className="h-44 bg-[#0F132E] rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-800">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <CharacterSprite characterId={activeCharId} scale={0.75} />
                    <img
                      src={uploadPreviewUrl}
                      alt="Xem thử căn chỉnh"
                      className="absolute pointer-events-none pixelated"
                      style={{
                        transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale}) ${
                          flipX ? 'scaleX(-1)' : ''
                        }`,
                      }}
                    />
                  </div>
                </div>

                {/* Quick 1-touch slot presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Gợi ý vị trí chuẩn 1 chạm:</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => { setOffsetX(0); setOffsetY(-34); setScale(1.1); }}
                      className="px-2 py-1.5 rounded-lg bg-[#0F132E] hover:bg-cyan-900/40 border border-slate-700 text-slate-200 cursor-pointer text-center"
                    >
                      🎓 Lên đầu
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOffsetX(0); setOffsetY(-12); setScale(1.0); }}
                      className="px-2 py-1.5 rounded-lg bg-[#0F132E] hover:bg-cyan-900/40 border border-slate-700 text-slate-200 cursor-pointer text-center"
                    >
                      👓 Ngang mắt
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOffsetX(0); setOffsetY(4); setScale(1.0); }}
                      className="px-2 py-1.5 rounded-lg bg-[#0F132E] hover:bg-cyan-900/40 border border-slate-700 text-slate-200 cursor-pointer text-center"
                    >
                      👕 Thân áo
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOffsetX(-16); setOffsetY(12); setScale(1.0); }}
                      className="px-2 py-1.5 rounded-lg bg-[#0F132E] hover:bg-cyan-900/40 border border-slate-700 text-slate-200 cursor-pointer text-center"
                    >
                      ☕ Cầm tay
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOffsetX(16); setOffsetY(8); setScale(1.0); }}
                      className="px-2 py-1.5 rounded-lg bg-[#0F132E] hover:bg-cyan-900/40 border border-slate-700 text-slate-200 cursor-pointer text-center"
                    >
                      🎒 Sau lưng
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOffsetX(0); setOffsetY(0); setScale(1.0); }}
                      className="px-2 py-1.5 rounded-lg bg-[#0F132E] hover:bg-cyan-900/40 border border-slate-700 text-slate-200 cursor-pointer text-center"
                    >
                      🔄 Căn giữa
                    </button>
                  </div>
                </div>

                {/* Adjust Sliders with interactive Step Buttons */}
                <div className="space-y-3 pt-1 text-xs">
                  {/* Scale Control */}
                  <div className="p-2.5 rounded-xl bg-[#0F132E] border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-semibold">Kích thước (Scale):</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setScale(s => Math.max(0.3, +(s - 0.1).toFixed(2)))}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-cyan-300 font-bold min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => setScale(s => Math.min(2.5, +(s + 0.1).toFixed(2)))}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.5"
                      step="0.05"
                      value={scale}
                      onChange={e => setScale(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Horizontal X Control */}
                  <div className="p-2.5 rounded-xl bg-[#0F132E] border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-semibold">Tọa độ Ngang (Trục X):</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOffsetX(x => Math.max(-60, x - 2))}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] cursor-pointer"
                        >
                          ◀ Trái
                        </button>
                        <span className="text-cyan-300 font-bold min-w-[50px] text-center">
                          {offsetX > 0 ? `+${offsetX}px` : `${offsetX}px`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOffsetX(x => Math.min(60, x + 2))}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] cursor-pointer"
                        >
                          Phải ▶
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={offsetX}
                      onChange={e => setOffsetX(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Vertical Y Control */}
                  <div className="p-2.5 rounded-xl bg-[#0F132E] border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-semibold">Tọa độ Dọc (Trục Y):</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOffsetY(y => Math.max(-60, y - 2))}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] cursor-pointer"
                        >
                          ▲ Lên
                        </button>
                        <span className="text-cyan-300 font-bold min-w-[50px] text-center">
                          {offsetY < 0 ? `${offsetY}px` : `+${offsetY}px`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOffsetY(y => Math.min(60, y + 2))}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] cursor-pointer"
                        >
                          Xuống ▼
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={offsetY}
                      onChange={e => setOffsetY(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={flipX}
                        onChange={e => setFlipX(e.target.checked)}
                        className="w-4 h-4 rounded accent-cyan-400"
                      />
                      <span>Lật ngang hình ảnh (Flip Horizontal)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {uploadError && <p className="text-xs text-rose-400 font-medium">{uploadError}</p>}

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setEditingItemId(null);
                  setUploadFile(null);
                  setUploadPreviewUrl(null);
                }}
              >
                Hủy
              </Button>
              <Button variant="cyan" fullWidth onClick={handleSaveCustomGear}>
                {editingItemId ? 'Cập Nhật Vị Trí' : 'Lưu Vào Tủ Đồ'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Deletion Confirmation Modal for Individual Custom Gear */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#161B40] border border-rose-500/50 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold font-heading">
              <Trash2 className="w-5 h-5" />
              <span>Xóa Món Đồ Phụ Kiện</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc muốn xóa vĩnh viễn món đồ <strong className="text-white font-bold">"{itemToDelete.name}"</strong>? Ảnh GIF/PNG của món đồ sẽ được gỡ hoàn toàn khỏi tủ đồ và thiết bị này.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="secondary" onClick={() => setItemToDelete(null)}>
                Hủy
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  const targetId = itemToDelete.id;
                  setItemToDelete(null);
                  await deleteGearBlob(targetId);
                  dispatch({ type: 'REMOVE_CUSTOM_GEAR_META', payload: { id: targetId } });
                  saveStateToStorageImmediate({
                    ...state,
                    customGearMeta: state.customGearMeta.filter(i => i.id !== targetId),
                    equippedCustomGearIds: (state.equippedCustomGearIds || []).filter(id => id !== targetId),
                  });
                  setToastMsg('Đã xóa món đồ phụ kiện thành công!');
                  setTimeout(() => setToastMsg(null), 2500);
                }}
              >
                Xóa Vĩnh Viễn
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Purge Modal for All Uploaded GIFs */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#161B40] border border-rose-500/50 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold font-heading text-base">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Xác Nhận Xóa Tất Cả GIF Tự Tải Lên</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ các tệp GIF nhân vật và tệp GIF phụ kiện bạn đã từng tải lên khỏi bộ nhớ máy. Nhân vật sẽ được đưa về mặc định (Nam Sinh Viên Quân).
            </p>
            <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30">
              ⚠️ Các trang phục và nhân vật gốc trong hệ thống Solo Levelling sẽ không bị ảnh hưởng.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setIsPurgeModalOpen(false)}>
                Hủy Bỏ
              </Button>
              <Button size="sm" variant="danger" onClick={handlePurgeAllCustomGifs}>
                Xác Nhận Xóa Sạch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Character Select & Upload Modal */}
      <CharacterSelectModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        title="Đổi Nhân Vật hoặc Tải Lên GIF Riêng"
        subtitle="Chọn nhân vật sinh viên 2D Pixel hoặc tải file ảnh GIF 2D Pixel của bạn để làm ảnh đại diện phiêu lưu!"
      />

      {/* Character Alignment & Zoom Adjust Modal */}
      <CharacterAdjustModal
        isOpen={isAdjustCharModalOpen}
        onClose={() => setIsAdjustCharModalOpen(false)}
      />
    </div>
  );
};
