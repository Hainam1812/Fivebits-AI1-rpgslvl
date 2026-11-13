import React, { useEffect, useState } from 'react';
import { useGame } from '../../store/GameContext.js';
import { useCharacterLibrary } from '../../store/CharacterLibraryContext.js';
import { CharacterSprite } from './CharacterSprite.js';
import { CharacterAdjustModal } from './CharacterAdjustModal.js';
import { getCosmeticById } from '../../data/cosmetics.js';
import charactersData from '../../data/characters.json' with { type: 'json' };
import { SlidersHorizontal, ImageOff } from 'lucide-react';

interface CharacterStageProps {
  characterId?: string;
  size?: 'mini' | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  previewCosmetics?: Partial<Record<string, string>>;
  showNameplate?: boolean;
  allowAdjustment?: boolean;
  characterScaleMultiplier?: number;
}

export const CharacterStage: React.FC<CharacterStageProps> = ({
  characterId,
  size = 'md',
  className = '',
  previewCosmetics,
  showNameplate = false,
  allowAdjustment,
  characterScaleMultiplier = 1,
}) => {
  const { state, isCelebrating } = useGame();
  const { selectedCharacter, selectedGifUrl } = useCharacterLibrary();
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [gifError, setGifError] = useState(false);

  useEffect(() => {
    setGifError(false);
  }, [selectedGifUrl]);

  const canAdjust = allowAdjustment !== undefined ? allowAdjustment : (size === 'md' || size === 'lg');

  const activeCharId = characterId || state.profile.characterId || 'hero';
  const charDef = charactersData.find((c: any) => c.id === activeCharId) || charactersData[0];
  const hasSelectedGif = Boolean(!characterId && selectedCharacter && selectedGifUrl);

  // Resolve equipped cosmetics, allowing preview override
  const equipped = {
    ...state.equippedCosmetics,
    ...(previewCosmetics || {}),
  };

  const backdropCos = getCosmeticById(equipped.backdrop || '');
  const frameCos = getCosmeticById(equipped.frame || '');
  const auraCos = getCosmeticById(equipped.aura || '');
  const companionCos = getCosmeticById(equipped.companion || '');
  const nameplateCos = getCosmeticById(equipped.nameplate || '');

  const sizeContainerStyles = {
    mini: 'w-10 h-10 rounded-full',
    xs: 'w-12 h-12 rounded-xl',
    sm: 'w-24 h-24 rounded-xl',
    md: 'w-48 h-48 sm:w-56 sm:h-56 rounded-2xl',
    lg: 'w-64 h-64 sm:w-80 sm:h-80 rounded-3xl',
  };

  const isMini = size === 'mini';

  // Mini avatar mode (under 64px)
  if (isMini) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border-2 border-violet-400/60 flex items-center justify-center bg-[#161B40] ${sizeContainerStyles.mini} ${className}`}
        aria-label={`Avatar nhân vật ${selectedCharacter?.name || charDef?.displayName || 'Adventurer'}`}
      >
        {hasSelectedGif && selectedGifUrl ? (
          gifError ? (
            <ImageOff className="w-4 h-4 text-slate-400" aria-hidden="true" />
          ) : (
            <img
              src={selectedGifUrl}
              alt={selectedCharacter!.name}
              onError={() => setGifError(true)}
              style={(selectedCharacter!.scale ?? 1) !== 1 ? { transform: `scale(${selectedCharacter!.scale})` } : undefined}
              className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-150"
              draggable={false}
            />
          )
        ) : (
          <CharacterSprite characterId={activeCharId} isCelebrating={isCelebrating} scale={0.9} />
        )}
      </div>
    );
  }

  // Backdrop gradient / pattern
  const backdropColor = backdropCos?.previewColor || '#161B40';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`relative shrink-0 flex items-center justify-center overflow-hidden border border-slate-700/60 shadow-2xl transition-all duration-300 ${sizeContainerStyles[size]}`}
        style={{ backgroundColor: backdropColor }}
        aria-label={`Sân khấu nhân vật ${selectedCharacter?.name || charDef?.displayName || 'Adventurer'}`}
      >
        {/* Layer 1: Backdrop scenery SVG patterns */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stageGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(196, 181, 253, 0.2)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stageGrid)" />
          </svg>
        </div>

        {/* Layer 2: Back Aura */}
        {auraCos && (
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-full blur-xl ${
              isCelebrating ? 'opacity-90 scale-110 animate-pulse-aura' : 'opacity-40 animate-pulse'
            }`}
            style={{
              background:
                auraCos.id === 'au-cyan-spark'
                  ? 'radial-gradient(circle, rgba(6,182,212,0.6) 0%, transparent 70%)'
                  : auraCos.id === 'au-gold-radiance'
                  ? 'radial-gradient(circle, rgba(245,158,11,0.7) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Layer 3: Character Sprite or Selected GIF */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-1 sm:p-2">
          {hasSelectedGif && selectedGifUrl && size === 'xs' ? (
            gifError ? (
              <ImageOff className="w-5 h-5 text-slate-400" aria-hidden="true" />
            ) : (
              <img
                src={selectedGifUrl}
                alt={selectedCharacter!.name}
                onError={() => setGifError(true)}
                style={(selectedCharacter!.scale ?? 1) !== 1 ? { transform: `scale(${selectedCharacter!.scale})` } : undefined}
                className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-150"
                draggable={false}
              />
            )
          ) : (
            <CharacterSprite
              key={hasSelectedGif ? selectedCharacter!.id : activeCharId}
              characterId={activeCharId}
              isCelebrating={isCelebrating}
              scale={(size === 'lg' ? 1.1 : size === 'sm' ? 0.75 : size === 'xs' ? 0.52 : 0.95) * characterScaleMultiplier}
            />
          )}
        </div>

        {/* Layer 4: Frame Border Overlay */}
        {frameCos && (
          <div
            className={`absolute inset-0 pointer-events-none z-20 rounded-inherit border-2 ${
              frameCos.id === 'fr-rune-violet'
                ? 'border-violet-500 shadow-[inset_0_0_12px_rgba(124,58,237,0.5)]'
                : frameCos.id === 'fr-cyber-neon'
                ? 'border-cyan-400 shadow-[inset_0_0_14px_rgba(6,182,212,0.6)]'
                : frameCos.id === 'fr-gold-slayer'
                ? 'border-amber-400 shadow-[inset_0_0_16px_rgba(245,158,11,0.6)]'
                : 'border-slate-600'
            }`}
          />
        )}

        {/* Layer 5: Companion Pet */}
        {companionCos && size !== 'xs' && (
          <div className="absolute bottom-2 right-2 z-30 pointer-events-none animate-bounce">
            <div className="w-8 h-8 rounded-full bg-indigo-950/90 border border-violet-400/60 flex items-center justify-center text-xs shadow-md">
              {companionCos.id === 'cp-cat-dorm'
                ? '🐱'
                : companionCos.id === 'cp-owl-scholar'
                ? '🦉'
                : companionCos.id === 'cp-mini-slime'
                ? '💧'
                : companionCos.id === 'cp-dragon-pup'
                ? '🐲'
                : '🤖'}
            </div>
          </div>
        )}

        {/* Layer 6: Front Aura particles when celebrating */}
        {isCelebrating && (
          <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
            <div className="w-full h-full animate-sparkle flex items-center justify-center">
              <span className="text-amber-300 text-lg absolute top-4 left-4">✦</span>
              <span className="text-cyan-300 text-base absolute top-6 right-6">✦</span>
              <span className="text-fuchsia-300 text-xl absolute bottom-8 left-8">✦</span>
              <span className="text-yellow-300 text-sm absolute bottom-5 right-10">✦</span>
            </div>
          </div>
        )}
        {/* Layer 7: Adjust Controls Button if enabled */}
        {canAdjust && !isMini && size !== 'xs' && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setIsAdjustOpen(true);
            }}
            className="absolute top-2.5 right-2.5 z-40 p-1.5 rounded-lg bg-black/60 hover:bg-violet-900/80 border border-violet-500/40 text-violet-300 hover:text-white transition-all shadow-md group cursor-pointer"
            title="Căn chỉnh & Phóng to / Thu nhỏ nhân vật"
            aria-label="Căn chỉnh và phóng to thu nhỏ nhân vật"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Nameplate & Title if requested */}
      {showNameplate && (
        <div className="mt-3 flex flex-col items-center">
          <div className="px-4 py-1 rounded-lg bg-[#0F132E] border border-violet-500/40 text-center shadow-lg">
            <div className="text-sm font-bold text-slate-100">
              {state.profile.nickname || charDef?.displayName || 'Adventurer'}
            </div>
            <div className="text-[10px] text-violet-300 tracking-wider uppercase font-semibold">
              {charDef?.tagline || 'Chiến Binh Solo'}
            </div>
          </div>
        </div>
      )}

      {/* Character Adjust Modal */}
      {canAdjust && (
        <CharacterAdjustModal
          isOpen={isAdjustOpen}
          onClose={() => setIsAdjustOpen(false)}
        />
      )}
    </div>
  );
};
