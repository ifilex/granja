import React from 'react';
import { FarmState, GameItem } from '../../types/game';
import { GAME_ITEMS } from '../../data/gameData';
import { Clock, X } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface IsometricSeedSelectorProps {
  plotId: number;
  state: FarmState;
  onClose: () => void;
  onPlant: (plotId: number, cropId: string, e: React.MouseEvent) => void;
}

export const IsometricSeedSelector: React.FC<IsometricSeedSelectorProps> = ({
  plotId,
  state,
  onClose,
  onPlant,
}) => {
  const unlockedSeeds = Object.values(GAME_ITEMS).filter(
    (item) => item.category === 'crop' && item.unlockLevel <= state.level
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-stone-900 border-4 border-amber-600 rounded-3xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-amber-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-800/80 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-200 leading-tight">
                Sembrar en Parcela #{plotId + 1}
              </h3>
              <p className="text-xs text-amber-400">
                Selecciona una semilla para comenzar a cosechar:
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-amber-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of Unlocked Crop Seeds */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {unlockedSeeds.map((crop) => {
            const countInSilo = state.inventory[crop.id] || 0;
            const hasSeeds = countInSilo > 0;

            return (
              <button
                key={crop.id}
                disabled={!hasSeeds}
                onClick={(e) => {
                  if (hasSeeds) {
                    onPlant(plotId, crop.id, e);
                    onClose();
                  }
                }}
                className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-between transition transform active:scale-95 ${
                  hasSeeds
                    ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-600 hover:border-yellow-400 cursor-pointer shadow-md'
                    : 'bg-stone-800/60 border-stone-700 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl filter drop-shadow my-1">{crop.icon}</span>
                <span className="font-black text-xs text-amber-100 truncate w-full text-center">
                  {crop.name}
                </span>

                <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold mt-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{crop.growthTimeSeconds}s</span>
                </div>

                <div
                  className={`mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-black w-full text-center ${
                    hasSeeds ? 'bg-amber-600 text-white' : 'bg-stone-700 text-stone-300'
                  }`}
                >
                  Tienes: {countInSilo}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tip for Touch Controls */}
        <div className="mt-4 p-2.5 bg-stone-950/70 rounded-xl border border-amber-800/50 flex items-center gap-2 text-xs text-amber-300 font-medium">
          <span className="text-lg">💡</span>
          <span>
            <strong>Consejo táctil:</strong> Selecciona una semilla en la barra inferior para sembrar múltiples parcelas rápidamente tocando sobre ellas.
          </span>
        </div>
      </div>
    </div>
  );
};
