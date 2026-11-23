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

  const activeCharId = characterId || state.profile.characterId || 'boy1';
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
    mini: 'w-10 h-10 rounded-[2px]',
    xs: 'w-12 h-12 rounded-[2px]',
    sm: 'w-24 h-24 rounded-[2px]',
    md: 'w-48 h-48 sm:w-56 sm:h-56 rounded-[2px]',
    lg: 'w-64 h-64 sm:w-80 sm:h-80 rounded-[2px]',
  };

  const isMini = size === 'mini';

  // Mini avatar mode (under 64px)
  if (isMini) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border-2 border-[var(--gold)] flex items-center justify-center bg-[var(--panel)] shadow-[inset_0_0_0_1px_var(--ink)] ${sizeContainerStyles.mini} ${className}`}
        aria-label={`Avatar nhân vật ${selectedCharacter?.name || charDef?.displayName || 'Adventurer'}`}
      >
        {hasSelectedGif && selectedGifUrl ? (
          gifError ? (
            <ImageOff className="w-4 h-4 text-[var(--muted)]" aria-hidden="true" />
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
  const backdropColor = backdropCos?.previewColor || '#161B33';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`relative shrink-0 flex items-center justify-center overflow-hidden border-[3px] border-[#3B4474] shadow-[inset_0_0_0_2px_var(--ink),6px_8px_0_0_rgba(0,0,0,0.3)] transition-all duration-200 ${sizeContainerStyles[size]}`}
        style={{ backgroundColor: backdropColor }}
        aria-label={`Sân khấu nhân vật ${selectedCharacter?.name || charDef?.displayName || 'Adventurer'}`}
      >
        {/* Layer 1: Backdrop scenery SVG patterns */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stageGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(154, 160, 189, 0.25)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stageGrid)" />
          </svg>
        </div>

        {/* Layer 2: Back Aura (crisp pixel checker/halo, zero blur) */}
        {auraCos && (
          <div
            className={`absolute inset-3 pointer-events-none border-2 border-dashed ${
              isCelebrating ? 'opacity-90 animate-pulse-aura' : 'opacity-45'
            }`}
            style={{
              borderColor:
                auraCos.id === 'au-cyan-spark'
                  ? 'var(--sky)'
                  : auraCos.id === 'au-gold-radiance'
                  ? 'var(--gold)'
                  : 'var(--violet)',
              backgroundColor:
                auraCos.id === 'au-cyan-spark'
                  ? 'rgba(98, 182, 247, 0.08)'
                  : auraCos.id === 'au-gold-radiance'
                  ? 'rgba(232, 194, 122, 0.08)'
                  : 'rgba(169, 155, 255, 0.08)',
            }}
          />
        )}

        {/* Layer 3: Character Sprite or Selected GIF */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-1 sm:p-2">
          {hasSelectedGif && selectedGifUrl && size === 'xs' ? (
            gifError ? (
              <ImageOff className="w-5 h-5 text-[var(--muted)]" aria-hidden="true" />
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
            className={`absolute inset-0 pointer-events-none z-20 rounded-[2px] border-[3px] shadow-[inset_0_0_0_2px_var(--ink)] ${
              frameCos.id === 'fr-rune-violet'
                ? 'border-[var(--violet)]'
                : frameCos.id === 'fr-cyber-neon'
                ? 'border-[var(--sky)]'
                : frameCos.id === 'fr-gold-slayer'
                ? 'border-[var(--gold)]'
                : 'border-[#3B4474]'
            }`}
          />
        )}

        {/* Layer 5: Companion Pet */}
        {companionCos && size !== 'xs' && (
          <div className="absolute bottom-2 right-2 z-30 pointer-events-none animate-bounce">
            <div className="w-8 h-8 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)] flex items-center justify-center text-xs shadow-[2px_3px_0_0_var(--ink)]">
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
              <span className="text-[var(--gold)] text-lg absolute top-4 left-4">✦</span>
              <span className="text-[var(--sky)] text-base absolute top-6 right-6">✦</span>
              <span className="text-[var(--violet)] text-xl absolute bottom-8 left-8">✦</span>
              <span className="text-[var(--green)] text-sm absolute bottom-5 right-10">✦</span>
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
            className="absolute top-2.5 right-2.5 z-40 p-1.5 rounded-[2px] bg-[var(--bg)] hover:bg-[var(--panel-2)] border-2 border-[var(--gold)] text-[var(--gold)] hover:text-[var(--text)] transition-colors shadow-[2px_3px_0_0_var(--ink)] group cursor-pointer"
            title="Căn chỉnh & Phóng to / Thu nhỏ nhân vật"
            aria-label="Căn chỉnh và phóng to thu nhỏ nhân vật"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nameplate & Title if requested */}
      {showNameplate && (
        <div className="mt-3 flex flex-col items-center">
          <div className="px-4 py-1.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)] text-center shadow-[4px_4px_0_0_var(--ink)]">
            <div className="text-sm font-bold text-[var(--text)] font-heading">
              {state.profile.nickname || charDef?.displayName || 'Adventurer'}
            </div>
            <div className="text-xs text-[var(--gold)] tracking-wider uppercase font-semibold">
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
