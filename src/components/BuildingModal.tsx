import React from 'react';
import { ProductionBuilding, FarmState, Recipe } from '../types/game';
import { GAME_ITEMS, RECIPES } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { Clock, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

interface BuildingModalProps {
  building: ProductionBuilding | null;
  state: FarmState;
  onClose: () => void;
  onQueueRecipe: (buildingId: string, recipeId: string) => void;
  onCollectItem: (buildingId: string, slotIndex: number) => void;
  onUnlockSlot: (buildingId: string) => void;
  onSpeedUpSlot: (buildingId: string, slotIndex: number) => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({
  building,
  state,
  onClose,
  onQueueRecipe,
  onCollectItem,
  onUnlockSlot,
  onSpeedUpSlot,
}) => {
  if (!building) return null;

  const recipes = RECIPES.filter((r) => r.buildingType === building.type);
  const slotUnlockCost = 6; // Fair diamond cost

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-amber-800/80 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {building.type === 'feed_mill' && '🌾'}
              {building.type === 'bakery' && '🍞'}
              {building.type === 'dairy' && '🧈'}
              {building.type === 'sugar_mill' && '🎋'}
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                {building.name}
              </h3>
              <p className="text-[11px] text-amber-300">
                Cola de producción: {building.queue.length}/{building.slotsCount} ranuras
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-amber-950/80 hover:bg-amber-900 text-amber-300 flex items-center justify-center font-bold text-lg border border-amber-700"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Active Queue Visualizer */}
          <div className="bg-amber-950/70 border border-amber-800/80 rounded-2xl p-3">
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
              Ranuras de Elaboración
            </h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {Array.from({ length: building.slotsCount }).map((_, idx) => {
                const itemInSlot = building.queue[idx];
                const gameItem = itemInSlot ? GAME_ITEMS[itemInSlot.itemId] : null;

                if (!itemInSlot) {
                  return (
                    <div
                      key={idx}
                      className="w-16 h-20 rounded-xl bg-amber-900/40 border-2 border-dashed border-amber-700/60 flex flex-col items-center justify-center text-amber-400/60 shrink-0"
                    >
                      <span className="text-xs font-bold">Libre</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={`w-20 h-24 rounded-xl border-2 p-1 flex flex-col items-center justify-between shrink-0 shadow-md ${
                      itemInSlot.finished
                        ? 'bg-amber-800 border-yellow-400 ring-2 ring-yellow-400/40 animate-pulse'
                        : 'bg-amber-900 border-amber-600'
                    }`}
                  >
                    <span className="text-2xl mt-1">{gameItem?.icon}</span>
                    <span className="text-[10px] font-extrabold text-amber-100 truncate w-full text-center">
                      {gameItem?.name}
                    </span>

                    {itemInSlot.finished ? (
                      <button
                        onClick={() => onCollectItem(building.id, idx)}
                        className="w-full bg-yellow-400 hover:bg-yellow-300 text-amber-950 font-black text-[10px] py-1 rounded shadow"
                      >
                        Recoger
                      </button>
                    ) : (
                      <button
                        onClick={() => onSpeedUpSlot(building.id, idx)}
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-[9px] py-0.5 rounded flex items-center justify-center gap-0.5 shadow"
                        title="Terminar ahora con 1 diamante"
                      >
                        <span>⚡ 1💎</span>
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Unlock Extra Slot Button */}
              {building.slotsCount < building.maxSlots && (
                <button
                  onClick={() => onUnlockSlot(building.id)}
                  className="w-16 h-20 rounded-xl bg-amber-900/60 hover:bg-amber-800/80 border-2 border-amber-600 flex flex-col items-center justify-center text-amber-200 shrink-0 shadow transition active:scale-95"
                >
                  <Plus className="w-4 h-4 text-emerald-300" />
                  <span className="text-[10px] font-bold mt-1">Desbloquear</span>
                  <span className="text-[10px] font-black text-emerald-300">
                    {slotUnlockCost} 💎
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Recipes Catalog */}
          <div>
            <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider mb-2">
              Recetas Disponibles
            </h4>
            <div className="space-y-2.5">
              {recipes.map((recipe) => {
                const outputItem = GAME_ITEMS[recipe.outputItemId];
                const isLevelMet = state.level >= recipe.levelRequired;
                const canAfford = recipe.ingredients.every(
                  (ing) => (state.inventory[ing.itemId] || 0) >= ing.count
                );
                const hasSlotAvailable = building.queue.length < building.slotsCount;

                return (
                  <div
                    key={recipe.id}
                    className={`rounded-2xl border-2 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-md ${
                      !isLevelMet
                        ? 'bg-stone-900/60 border-stone-800 opacity-60'
                        : canAfford && hasSlotAvailable
                        ? 'bg-amber-900/70 border-amber-600/80'
                        : 'bg-amber-950/60 border-amber-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-700/80 flex items-center justify-center text-2xl shadow-inner">
                        {outputItem?.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-extrabold text-sm text-amber-100">
                            {recipe.name}
                          </h5>
                          <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800">
                            +{recipe.xpReward} XP
                          </span>
                        </div>
                        {/* Ingredients chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {recipe.ingredients.map((ing) => {
                            const ingItem = GAME_ITEMS[ing.itemId];
                            const available = state.inventory[ing.itemId] || 0;
                            const hasEnough = available >= ing.count;

                            return (
                              <span
                                key={ing.itemId}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border flex items-center gap-0.5 ${
                                  hasEnough
                                    ? 'bg-amber-950/80 text-amber-200 border-amber-700'
                                    : 'bg-red-950/80 text-red-300 border-red-800'
                                }`}
                              >
                                <span>{ingItem?.icon}</span>
                                <span>
                                  {available}/{ing.count}
                                </span>
                              </span>
                            );
                          })}
                          <span className="text-[10px] text-amber-400/80 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {recipe.durationSeconds}s
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isLevelMet ? (
                      <span className="text-xs font-bold text-stone-400 self-end sm:self-center">
                        🔒 Nivel {recipe.levelRequired}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford && hasSlotAvailable) {
                            onQueueRecipe(building.id, recipe.id);
                          }
                        }}
                        disabled={!canAfford || !hasSlotAvailable}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition active:scale-95 shadow ${
                          canAfford && hasSlotAvailable
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-stone-800 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {!hasSlotAvailable
                          ? 'Cola llena'
                          : !canAfford
                          ? 'Faltan ingredientes'
                          : 'Cocinar'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
