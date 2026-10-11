import React, { useState } from 'react';
import { TruckOrder, FarmState } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { Check, X, Truck, Coins, Sparkles, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderBoardModalProps {
  state: FarmState;
  onClose: () => void;
  onFulfillOrder: (orderId: string) => void;
  onDiscardOrder: (orderId: string) => void;
}

export const OrderBoardModal: React.FC<OrderBoardModalProps> = ({
  state,
  onClose,
  onFulfillOrder,
  onDiscardOrder,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    state.truckOrders[0]?.id || ''
  );

  const selectedOrder = state.truckOrders.find((o) => o.id === selectedOrderId);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-amber-800/80 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                Tablón de Pedidos de la Camioneta
              </h3>
              <p className="text-xs text-amber-300">
                Entrega pedidos a los habitantes del pueblo para ganar monedas y planos.
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

        {/* Content: Left orders grid + Right selected order detail */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col md:flex-row gap-4">
          {/* Order Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {state.truckOrders.map((order, idx) => {
              const canFulfill = order.requirements.every(
                (req) => (state.inventory[req.itemId] || 0) >= req.count
              );
              const isSelected = order.id === selectedOrderId;

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    soundManager.playClick();
                    setSelectedOrderId(order.id);
                  }}
                  className={`relative p-3 rounded-2xl border-2 cursor-pointer transition transform active:scale-95 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-800/90 border-yellow-400 ring-2 ring-yellow-400/40 shadow-lg'
                      : canFulfill
                      ? 'bg-amber-900/80 border-emerald-500/80 shadow'
                      : 'bg-amber-950/70 border-amber-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{order.clientAvatar}</span>
                    <div className="flex items-center gap-1 text-[11px] font-black text-yellow-300">
                      <span>{order.rewardCoins}</span>
                      <span>🪙</span>
                    </div>
                  </div>

                  <h5 className="font-extrabold text-xs text-amber-100 mt-2 truncate">
                    {order.clientName}
                  </h5>

                  {/* Tiny item icons requested */}
                  <div className="flex items-center gap-1 mt-2">
                    {order.requirements.map((req) => {
                      const item = GAME_ITEMS[req.itemId];
                      const hasEnough = (state.inventory[req.itemId] || 0) >= req.count;
                      return (
                        <span
                          key={req.itemId}
                          className={`text-xs p-1 rounded border ${
                            hasEnough
                              ? 'bg-emerald-950/80 border-emerald-600'
                              : 'bg-red-950/80 border-red-800 opacity-60'
                          }`}
                          title={`${item?.name}: ${state.inventory[req.itemId] || 0}/${req.count}`}
                        >
                          {item?.icon}
                        </span>
                      );
                    })}
                  </div>

                  {canFulfill && (
                    <span className="mt-2 bg-emerald-500 text-white font-black text-[9px] text-center py-0.5 rounded-full uppercase tracking-wider">
                      ¡Completar!
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Order Card */}
          {selectedOrder && (
            <div className="w-full md:w-72 bg-amber-950/90 border-2 border-amber-700 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-800">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{selectedOrder.clientAvatar}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-100">
                        {selectedOrder.clientName}
                      </h4>
                      <span className="text-[11px] text-amber-300">
                        Pedido de mercancía rural
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDiscardOrder(selectedOrder.id)}
                    className="p-1.5 text-stone-400 hover:text-red-400 transition"
                    title="Descartar pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Items Checklist */}
                <div className="py-3 space-y-2">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Suministros Requeridos:
                  </span>
                  {selectedOrder.requirements.map((req) => {
                    const item = GAME_ITEMS[req.itemId];
                    const inStock = state.inventory[req.itemId] || 0;
                    const hasEnough = inStock >= req.count;

                    return (
                      <div
                        key={req.itemId}
                        className={`flex items-center justify-between p-2 rounded-xl border ${
                          hasEnough
                            ? 'bg-emerald-950/60 border-emerald-700/60'
                            : 'bg-red-950/60 border-red-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item?.icon}</span>
                          <span className="text-xs font-bold text-amber-100">
                            {item?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-black">
                          <span className={hasEnough ? 'text-emerald-400' : 'text-red-400'}>
                            {inStock}
                          </span>
                          <span className="text-amber-400/80">/{req.count}</span>
                          {hasEnough ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-red-400 ml-1" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rewards Preview */}
                <div className="bg-amber-900/60 p-2.5 rounded-xl border border-amber-800 mb-4">
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block mb-1">
                    Recompensas al Entregar:
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs font-black text-yellow-300">
                      <Coins className="w-4 h-4" />
                      <span>+{selectedOrder.rewardCoins}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-black text-sky-300">
                      <Sparkles className="w-4 h-4" />
                      <span>+{selectedOrder.rewardXp} XP</span>
                    </div>
                    {selectedOrder.specialRewardToolId && (
                      <div className="flex items-center gap-1 text-xs font-black text-amber-200">
                        <span>
                          {GAME_ITEMS[selectedOrder.specialRewardToolId]?.icon} +1
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fulfill Button */}
              {(() => {
                const canFulfill = selectedOrder.requirements.every(
                  (req) => (state.inventory[req.itemId] || 0) >= req.count
                );

                return (
                  <button
                    onClick={() => {
                      if (canFulfill) {
                        onFulfillOrder(selectedOrder.id);
                        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
                      }
                    }}
                    disabled={!canFulfill}
                    className={`w-full py-3 rounded-xl font-black text-sm shadow transition flex items-center justify-center gap-2 ${
                      canFulfill
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white active:scale-95'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>{canFulfill ? '¡Cargar Camioneta y Enviar!' : 'Faltan Productos'}</span>
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
