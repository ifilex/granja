import React from 'react';
import { OtherFarm, FarmState } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { Heart, Coins, Store, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VisitingFarmModalProps {
  farm: OtherFarm | null;
  state: FarmState;
  onClose: () => void;
  onReviveTree: (farmId: string, treeId: number) => void;
  onBuyVisitingItem: (farmId: string, itemId: string, price: number, qty: number) => void;
}

export const VisitingFarmModal: React.FC<VisitingFarmModalProps> = ({
  farm,
  state,
  onClose,
  onReviveTree,
  onBuyVisitingItem,
}) => {
  if (!farm) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3">
      <div className="bg-gradient-to-b from-emerald-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-950/90 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl border border-emerald-600 flex items-center gap-1 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Mi Granja</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{farm.ownerAvatar}</span>
                <h3 className="font-extrabold text-base sm:text-lg text-amber-100">
                  {farm.farmName}
                </h3>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-bold">
                  Nv.{farm.level}
                </span>
              </div>
              <p className="text-xs text-emerald-300">
                Granja de {farm.ownerName} • ¡Ayuda a regar árboles para ganar cartas de agradecimiento!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-amber-300 flex items-center justify-center font-bold text-lg border border-emerald-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {/* Section 1: Help with Wilted Trees */}
          <div className="bg-amber-950/70 border-2 border-amber-700/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400" />
                <h4 className="font-extrabold text-sm sm:text-base text-amber-100">
                  Huerto Frutal (Peticiones de Ayuda)
                </h4>
              </div>
              <span className="text-xs text-amber-300 font-bold">
                +15 XP & Carta de Regalo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {farm.wiltedTrees.map((tree) => (
                <div
                  key={tree.id}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between text-center ${
                    tree.isRevived
                      ? 'bg-emerald-950/60 border-emerald-600/60'
                      : 'bg-amber-900/80 border-rose-500/80'
                  }`}
                >
                  <span className="text-3xl mb-1">{tree.fruitType.split(' ')[1]}</span>
                  <span className="text-xs font-black text-amber-100 mb-2">
                    {tree.fruitType}
                  </span>

                  {tree.isRevived ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-900/60 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>¡Revivido!</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onReviveTree(farm.id, tree.id);
                        confetti({ particleCount: 30, spread: 60 });
                      }}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-110 text-white font-black text-xs py-1.5 rounded-xl shadow active:scale-95 transition flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>¡Regar y Revivir!</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Visitor's Roadside Shop */}
          <div className="bg-amber-950/70 border-2 border-amber-700/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-5 h-5 text-yellow-400" />
              <h4 className="font-extrabold text-sm sm:text-base text-amber-100">
                Puesto de Venta Exclusivo de {farm.ownerName}
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {farm.marketItems.map((item) => {
                const itemMeta = GAME_ITEMS[item.itemId];
                const canAfford = state.coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className="bg-amber-50 rounded-2xl border-2 border-amber-300 p-2.5 shadow flex flex-col items-center justify-between"
                  >
                    <span className="text-3xl my-1">{itemMeta?.icon}</span>
                    <span className="text-xs font-black text-amber-950 text-center truncate w-full">
                      {itemMeta?.name} x{item.quantity}
                    </span>

                    <button
                      onClick={() => {
                        if (canAfford) {
                          onBuyVisitingItem(farm.id, item.itemId, item.price, item.quantity);
                          confetti({ particleCount: 20, spread: 45 });
                        }
                      }}
                      disabled={!canAfford}
                      className={`w-full mt-2 py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow transition ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{item.price} 🪙</span>
                    </button>
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
