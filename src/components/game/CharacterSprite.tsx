import React, { useEffect, useState } from 'react';
import { useGame } from '../../store/GameContext.js';
import { useCharacterLibrary } from '../../store/CharacterLibraryContext.js';
import charactersData from '../../data/characters.json' with { type: 'json' };
import { ImageOff } from 'lucide-react';

interface CharacterSpriteProps {
  characterId: string;
  isCelebrating?: boolean;
  scale?: number;
  className?: string;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  characterId,
  isCelebrating = false,
  scale = 1,
  className = '',
}) => {
  const { state } = useGame();
  const { selectedCharacter, selectedGifUrl } = useCharacterLibrary();
  const [gifError, setGifError] = useState(false);

  useEffect(() => {
    setGifError(false);
  }, [selectedGifUrl]);

  const userScale = state.profile.characterScale ?? 1;
  const userOffsetX = state.profile.characterOffsetX ?? 0;
  const userOffsetY = state.profile.characterOffsetY ?? 0;

  // If user selected a GIF character in Tủ Đồ, render it across all character displays
  const shouldUseSelectedGif = Boolean(
    selectedCharacter &&
    selectedGifUrl &&
    (!characterId || characterId === state.profile.characterId || characterId === 'hero')
  );

  if (shouldUseSelectedGif && selectedCharacter && selectedGifUrl) {
    const importedScale = selectedCharacter.scale ?? 1;
    const gifScale = scale * importedScale * userScale;
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center select-none transition-transform duration-150 ${className}`}
        style={{
          transform: `translate(${userOffsetX}px, ${userOffsetY}px) scale(${gifScale})`,
        }}
      >
        {gifError ? (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <ImageOff className="w-6 h-6" aria-hidden="true" />
          </div>
        ) : (
          <img
            src={selectedGifUrl}
            alt={selectedCharacter.name}
            onError={() => setGifError(true)}
            className={`max-w-full max-h-full object-contain pointer-events-none z-[2] transition-transform duration-300 ${
              isCelebrating ? 'animate-celebrate-bounce' : ''
            }`}
            draggable={false}
          />
        )}
      </div>
    );
  }

  // Check if character is custom uploaded or built-in
  const customChar = state.customCharacters?.find(c => c.id === characterId);

  const character =
    customChar ||
    charactersData.find((c: any) => c.id === characterId) ||
    charactersData[0] || {
      id: 'hero',
      displayName: 'Nam Sinh Viên (Quân)',
      idle: { src: 'assets/char/hero/main.gif' },
      reward: { src: 'assets/char/hero/get_star.gif' },
      pixelArt: true,
      stage: { scale: 0.9, offsetY: 0 },
    };

  const isCustom = Boolean(customChar);
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

  let imageSrc = '';
  let displayName = character.displayName || 'Nhân vật';
  let isPixel = character.pixelArt !== false;

  if (isCustom && customChar) {
    const hasReward = Boolean(customChar.rewardSrc);
    imageSrc = isCelebrating && hasReward ? customChar.rewardSrc! : customChar.idleSrc;
  } else {
    const builtIn = character as any;
    const hasReward = Boolean(builtIn.reward?.src);
    const showReward = isCelebrating && hasReward;
    const imageRelPath = showReward ? builtIn.reward!.src : builtIn.idle.src;
    imageSrc = `${baseUrl}/${imageRelPath.replace(/^\//, '')}${
      showReward ? `?t=${Date.now()}` : ''
    }`;
  }

  // Equipped gear for this character
  const charGear = state.equippedGear[character.id] || {};

  // Custom user uploaded gear: only render if it is equipped
  const equippedCustomSet = new Set(
    state.equippedCustomGearIds !== undefined
      ? state.equippedCustomGearIds
      : state.customGearMeta.map(m => m.id)
  );

  const customItems = state.customGearMeta.filter(
    item =>
      equippedCustomSet.has(item.id) &&
      (!item.targetCharacterId || item.targetCharacterId === character.id)
  );

  const stageScale = (character as any).stage?.scale || 0.9;
  const stageOffsetY = (character as any).stage?.offsetY || 0;

  const totalScale = scale * stageScale * userScale;
  const totalTranslateX = userOffsetX;
  const totalTranslateY = stageOffsetY + userOffsetY;

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-150 ${className}`}
      style={{
        transform: `translate(${totalTranslateX}px, ${totalTranslateY}px) scale(${totalScale})`,
      }}
    >
      {/* Back Layer Gear (Pixel Backpack Straps) */}
      {charGear.back && (
        <div className="absolute inset-0 pointer-events-none z-[1] flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 28 40" shapeRendering="crispEdges">
            <rect x="4" y="24" width="2" height="9" fill="#4338CA" />
            <rect x="22" y="24" width="2" height="9" fill="#4338CA" />
            <rect x="9" y="22" width="10" height="2" fill="#3730A3" />
          </svg>
        </div>
      )}

      {/* Main Character 2D Pixel Image / Animated GIF / SVG */}
      <img
        src={imageSrc}
        alt={displayName}
        className={`max-w-full max-h-full object-contain pointer-events-none z-[2] transition-transform duration-300 pixelated ${
          isCelebrating ? 'animate-celebrate-bounce' : ''
        }`}
        draggable={false}
      />

      {/* Front Layer Gear overlays - 2D Pixel Art styled on 28x40 grid */}
      {/* Body Gear (Hoodie / Vest) */}
      {charGear.body && (
        <div className="absolute inset-0 pointer-events-none z-[3] flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 28 40" shapeRendering="crispEdges">
            <rect x="6" y="25" width="16" height="8" fill="#312E81" opacity="0.9" />
            <rect x="10" y="26" width="1" height="5" fill="#F1F5F9" />
            <rect x="17" y="26" width="1" height="5" fill="#F1F5F9" />
            <rect x="11" y="29" width="6" height="3" fill="#1E1B4B" />
          </svg>
        </div>
      )}

      {/* Head Gear (Red Headband with Gold Badge) */}
      {charGear.head && (
        <div className="absolute inset-0 pointer-events-none z-[4] flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 28 40" shapeRendering="crispEdges">
            <rect x="7" y="11" width="14" height="2" fill="#DC2626" />
            <rect x="13" y="11" width="2" height="2" fill="#FBBF24" />
          </svg>
        </div>
      )}

      {/* Face Gear (Pixel Smart Glasses) */}
      {charGear.face && (
        <div className="absolute inset-0 pointer-events-none z-[5] flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 28 40" shapeRendering="crispEdges">
            <rect x="7" y="15" width="5" height="3" fill="none" stroke="#38BDF8" strokeWidth="1" />
            <rect x="16" y="15" width="5" height="3" fill="none" stroke="#38BDF8" strokeWidth="1" />
            <rect x="12" y="16" width="4" height="1" fill="#38BDF8" />
          </svg>
        </div>
      )}

      {/* Handheld Gear (Pixel Tablet / Notebook) */}
      {charGear.handheld && (
        <div className="absolute inset-0 pointer-events-none z-[6] flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 28 40" shapeRendering="crispEdges">
            <rect x="2" y="27" width="4" height="6" fill="#0284C7" />
            <rect x="3" y="28" width="2" height="4" fill="#E0F2FE" />
            <rect x="3" y="29" width="2" height="1" fill="#0369A1" />
          </svg>
        </div>
      )}

      {/* Accessory (Pixel Pomodoro Smartwatch) */}
      {charGear.accessory && (
        <div className="absolute inset-0 pointer-events-none z-[6] flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 28 40" shapeRendering="crispEdges">
            <rect x="20" y="32" width="3" height="2" fill="#F59E0B" />
            <rect x="21" y="32" width="1" height="2" fill="#EF4444" />
          </svg>
        </div>
      )}

      {/* Custom Gear Layer (Supports GIF / PNG pixel items) */}
      {customItems.map(custom => {
        if (!custom.imageBlobUrl) return null;
        return (
          <img
            key={custom.id}
            src={custom.imageBlobUrl}
            alt={custom.name}
            className="absolute pointer-events-none z-[7] pixelated"
            style={{
              transform: `translate(${custom.offsetX}px, ${custom.offsetY}px) scale(${custom.scale}) ${
                custom.flipX ? 'scaleX(-1)' : ''
              }`,
            }}
          />
        );
      })}
    </div>
  );
};
