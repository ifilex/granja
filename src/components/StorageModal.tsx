import React, { useState } from 'react';
import { FarmState } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { ArrowUpCircle, Coins, Sparkles, Check, AlertCircle } from 'lucide-react';

interface StorageModalProps {
  type: 'silo' | 'barn';
  state: FarmState;
  onClose: () => void;
  onSellItem: (itemId: string, count: number) => void;
  onUpgradeStorage: (type: 'silo' | 'barn') => void;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  type,
  state,
  onClose,
  onSellItem,
  onUpgradeStorage,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sellAmount, setSellAmount] = useState<number>(1);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const isSilo = type === 'silo';
  const title = isSilo ? 'Silo de Granos' : 'Granero Central';
  const icon = isSilo ? '🌾' : '📦';
  const capacity = isSilo ? state.siloCapacity : state.barnCapacity;
  const used = isSilo ? state.siloUsed : state.barnUsed;
  const usagePercent = Math.min(100, Math.round((used / capacity) * 100));

  // Filter items corresponding to this storage
  const validItems = (Object.entries(state.inventory) as [string, number][])
    .filter(([itemId, count]) => {
      if (count <= 0) return false;
      const meta = GAME_ITEMS[itemId];
      if (!meta) return false;
      if (isSilo) {
        return meta.category === 'crop';
      } else {
        return meta.category !== 'crop';
      }
    })
    .map(([itemId, count]) => ({
      ...GAME_ITEMS[itemId],
      count,
    }));

  const selectedItem = selectedItemId ? GAME_ITEMS[selectedItemId] : null;
  const selectedItemCount = selectedItemId ? state.inventory[selectedItemId] || 0 : 0;

  // Upgrade materials required:
  // Silo: nails + planks
  // Barn: bolts + duct_tape
  const requiredTools = isSilo
    ? [
        { id: 'nail', name: 'Clavos', count: Math.ceil(capacity / 25) },
        { id: 'plank', name: 'Tablas', count: Math.ceil(capacity / 25) },
      ]
    : [
        { id: 'bolt', name: 'Pernos', count: Math.ceil(capacity / 25) },
        { id: 'duct_tape', name: 'Cinta Aislante', count: Math.ceil(capacity / 25) },
      ];

  const canUpgradeWithTools = requiredTools.every(
    (t) => (state.inventory[t.id] || 0) >= t.count
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-amber-800/80 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-amber-300">
                Capacidad: {used} / {capacity} unidades ({usagePercent}%)
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

        {/* Capacity Bar & Upgrade trigger */}
        <div className="bg-amber-950/90 px-5 py-3 border-b border-amber-800 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="w-full bg-amber-900/80 rounded-full h-3 p-0.5 border border-amber-700/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usagePercent > 90 ? 'bg-red-500' : 'bg-yellow-400'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsUpgrading(!isUpgrading)}
            className="bg-amber-700 hover:bg-amber-600 text-amber-100 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-amber-500 flex items-center gap-1 shadow active:scale-95 transition"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isUpgrading ? 'Ver Artículos' : 'Aumentar +25'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {isUpgrading ? (
            /* Upgrade Screen */
            <div className="bg-amber-950/80 border border-amber-700/80 rounded-2xl p-4 text-center space-y-4">
              <div className="text-4xl">🏗️</div>
              <h4 className="font-extrabold text-base text-amber-100">
                Ampliar Capacidad de {title} a {capacity + 25}
              </h4>
              <p className="text-xs text-amber-300">
                Necesitas los siguientes materiales de construcción para expandir la estructura:
              </p>

              <div className="flex justify-center gap-4 py-2">
                {requiredTools.map((tool) => {
                  const available = state.inventory[tool.id] || 0;
                  const item = GAME_ITEMS[tool.id];
                  const hasEnough = available >= tool.count;
                  return (
                    <div
                      key={tool.id}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center w-28 ${
                        hasEnough
                          ? 'bg-amber-900/80 border-emerald-500'
                          : 'bg-stone-900/80 border-stone-700'
                      }`}
                    >
                      <span className="text-3xl">{item?.icon}</span>
                      <span className="text-xs font-bold text-amber-100 mt-1">
                        {tool.name}
                      </span>
                      <span
                        className={`text-xs font-black mt-0.5 ${
                          hasEnough ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {available} / {tool.count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onUpgradeStorage(type)}
                  disabled={!canUpgradeWithTools}
                  className={`w-full py-2.5 rounded-xl font-black text-sm shadow transition ${
                    canUpgradeWithTools
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {canUpgradeWithTools
                    ? '¡Mejorar Almacén (+25)!'
                    : 'Faltan Materiales de Obra'}
                </button>
                <span className="text-[11px] text-amber-400/80">
                  Tip: Obtén materiales completando pedidos de camioneta o en el periódico.
                </span>
              </div>
            </div>
          ) : (
            /* Items Grid */
            <>
              {validItems.length === 0 ? (
                <div className="text-center py-12 text-amber-400/60 font-bold text-sm">
                  No tienes artículos en este almacén aún.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {validItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedItemId(item.id);
                        setSellAmount(1);
                      }}
                      className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-between cursor-pointer transition transform active:scale-95 ${
                        selectedItemId === item.id
                          ? 'bg-amber-800 border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg'
                          : 'bg-amber-900/60 hover:bg-amber-900/80 border-amber-700/60'
                      }`}
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-xs font-black text-amber-100 text-center truncate w-full mt-1">
                        {item.name}
                      </span>
                      <span className="text-xs font-extrabold text-yellow-300 bg-amber-950/70 px-2 py-0.5 rounded-full mt-1">
                        x{item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Item Drawer to Sell for quick coins */}
              {selectedItem && (
                <div className="mt-4 bg-amber-950/95 border-2 border-amber-700 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedItem.icon}</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-amber-100">
                          {selectedItem.name}
                        </h4>
                        <span className="text-[11px] text-amber-300">
                          {selectedItem.description}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItemId(null)}
                      className="text-xs text-amber-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Sell Quantity Slider / Selector */}
                  <div className="flex items-center justify-between bg-amber-900/60 p-2 rounded-xl border border-amber-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSellAmount(Math.max(1, sellAmount - 1))}
                        className="w-7 h-7 bg-amber-800 text-white rounded-lg font-black flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-amber-100 text-sm px-2">
                        {sellAmount} / {selectedItemCount}
                      </span>
                      <button
                        onClick={() =>
                          setSellAmount(Math.min(selectedItemCount, sellAmount + 1))
                        }
                        className="w-7 h-7 bg-amber-800 text-white rounded-lg font-black flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setSellAmount(selectedItemCount)}
                        className="text-[10px] bg-amber-700 text-amber-200 px-2 py-1 rounded font-bold ml-1"
                      >
                        Máx
                      </button>
                    </div>

                    <div className="flex items-center gap-1 font-black text-yellow-300 text-sm">
                      <Coins className="w-4 h-4" />
                      <span>+{sellAmount * selectedItem.basePrice}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSellItem(selectedItem.id, sellAmount);
                      setSelectedItemId(null);
                    }}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-amber-950 font-black py-2 rounded-xl shadow active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Vender al instante por</span>
                    <span>{sellAmount * selectedItem.basePrice} 🪙</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
