import React, { useState } from 'react';
import { FarmState, FarmBot } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { X, Zap, Cpu, Droplets, Scissors, BatteryCharging, Sparkles, Check, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RustyWorkshopModalProps {
  state: FarmState;
  onClose: () => void;
  onConvertBiofuel: (cropId: string, amount: number) => void;
  onUpgradeBot: (botId: string) => void;
  onUnlockBot: (botId: string) => void;
  onToggleAutoWatering: () => void;
  onToggleAutoHarvesting: () => void;
}

export const RustyWorkshopModal: React.FC<RustyWorkshopModalProps> = ({
  state,
  onClose,
  onConvertBiofuel,
  onUpgradeBot,
  onUnlockBot,
  onToggleAutoWatering,
  onToggleAutoHarvesting,
}) => {
  const [activeTab, setActiveTab] = useState<'bots' | 'biofuel'>('bots');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Crops available in inventory for biofuel
  const cropItems = Object.keys(state.inventory)
    .filter((itemId) => {
      const item = GAME_ITEMS[itemId];
      return item && item.category === 'crop' && (state.inventory[itemId] || 0) > 0;
    })
    .map((itemId) => ({
      item: GAME_ITEMS[itemId],
      qty: state.inventory[itemId],
    }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-stone-900 border-t-4 sm:border-2 border-amber-500/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-stone-100 animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Rusty Identity & Biofuel Gauge */}
        <div className="bg-gradient-to-r from-amber-900/90 via-stone-800 to-stone-900 p-4 border-b border-stone-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-amber-300 tracking-wide">
                  Taller de Tito (Rusty)
                </h2>
                <span className="text-[10px] bg-amber-500/30 text-amber-200 font-bold px-2 py-0.5 rounded-full border border-amber-400/40">
                  Autómatas
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Robots ayudantes y convertidor de biocombustible
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-stone-800 border border-stone-600 flex items-center justify-center text-stone-300 hover:text-white hover:bg-stone-700 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Energy & Spare Parts Bar */}
        <div className="bg-stone-950 px-4 py-3 border-b border-stone-800 grid grid-cols-2 gap-3 text-xs">
          {/* Biocombustible */}
          <div className="bg-stone-900/90 rounded-xl p-2 border border-emerald-500/30 flex flex-col gap-1">
            <div className="flex justify-between font-bold">
              <span className="text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Biocombustible
              </span>
              <span className="text-emerald-200 font-mono">
                {state.biofuel} / {state.maxBiofuel} L
              </span>
            </div>
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (state.biofuel / state.maxBiofuel) * 100)}%` }}
              />
            </div>
          </div>

          {/* Repuestos / Engranajes */}
          <div className="bg-stone-900/90 rounded-xl p-2 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              <div>
                <div className="text-[10px] text-stone-400 font-bold uppercase">Repuestos</div>
                <div className="text-sm font-black text-amber-300 font-mono">
                  {state.spareParts} <span className="text-stone-400 text-xs">piezas</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('biofuel')}
              className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-bold rounded-lg border border-amber-500/40 text-[11px] active:scale-95 transition"
            >
              + Generar
            </button>
          </div>
        </div>

        {/* Automation Fast Toggles */}
        <div className="bg-stone-950/60 px-4 py-2 border-b border-stone-800 flex items-center justify-between text-xs">
          <span className="font-bold text-stone-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" /> Modo Automatizado (Idle):
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleAutoWatering();
                showToast(
                  !state.autoWateringEnabled ? '💧 Auto-Riego Activado' : '💧 Auto-Riego Pausado'
                );
              }}
              className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 text-[11px] transition active:scale-95 ${
                state.autoWateringEnabled
                  ? 'bg-sky-600/30 border-sky-400 text-sky-300'
                  : 'bg-stone-800 border-stone-700 text-stone-500'
              }`}
            >
              💧 Riego {state.autoWateringEnabled ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onToggleAutoHarvesting();
                showToast(
                  !state.autoHarvestingEnabled ? '🌾 Auto-Cosecha Activada' : '🌾 Auto-Cosecha Pausada'
                );
              }}
              className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 text-[11px] transition active:scale-95 ${
                state.autoHarvestingEnabled
                  ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300'
                  : 'bg-stone-800 border-stone-700 text-stone-500'
              }`}
            >
              🌾 Cosecha {state.autoHarvestingEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Tabs: Robots vs Biofuel */}
        <div className="flex border-b border-stone-800 bg-stone-900/60">
          <button
            onClick={() => setActiveTab('bots')}
            className={`flex-1 py-2.5 text-center font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === 'bots'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-stone-800/60'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            🤖 Robots Asistentes ({state.bots.filter((b) => b.unlocked).length}/{state.bots.length})
          </button>
          <button
            onClick={() => setActiveTab('biofuel')}
            className={`flex-1 py-2.5 text-center font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              activeTab === 'biofuel'
                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-stone-800/60'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            ⚡ Convertidor de Biocombustible
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white font-bold text-center py-1.5 text-xs animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'bots' ? (
            /* TAB 1: ROBOTS LIST & UPGRADES */
            <div className="space-y-3">
              {state.bots.map((bot) => {
                const upgradeCostParts = bot.level * 10;
                const upgradeCostCoins = bot.level * 40;
                const canUpgrade =
                  state.spareParts >= upgradeCostParts && state.coins >= upgradeCostCoins;
                const unlockCostParts = 20;
                const unlockCostCoins = 100;
                const canUnlock =
                  state.spareParts >= unlockCostParts && state.coins >= unlockCostCoins;

                return (
                  <div
                    key={bot.id}
                    className={`rounded-2xl p-3 border transition-all ${
                      bot.unlocked
                        ? 'bg-stone-950/80 border-stone-700/80'
                        : 'bg-stone-950/40 border-stone-800 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 shadow-inner"
                          style={{
                            backgroundColor: `${bot.color}20`,
                            borderColor: bot.color,
                          }}
                        >
                          {bot.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-stone-100">{bot.name}</h3>
                            {bot.unlocked && (
                              <span className="text-[10px] font-mono bg-stone-800 text-amber-300 px-2 py-0.5 rounded-md border border-stone-700">
                                Nvl. {bot.level}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                            {bot.description}
                          </p>
                          {bot.unlocked && (
                            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                              <span className="text-sky-300 flex items-center gap-1 font-mono font-bold">
                                ⚡ Vel: {bot.speed.toFixed(1)}x
                              </span>
                              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                                🔋 {bot.battery}%
                              </span>
                              <span className="text-stone-400 italic text-[10px]">
                                {bot.currentTask}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {bot.unlocked ? (
                          <button
                            onClick={() => {
                              if (canUpgrade) {
                                soundManager.playRobotBoop();
                                onUpgradeBot(bot.id);
                                confetti({ particleCount: 20, spread: 45, origin: { y: 0.7 } });
                                showToast(`¡${bot.name} mejorado a Nivel ${bot.level + 1}!`);
                              } else {
                                soundManager.playClick();
                                showToast('Necesitas más repuestos o monedas');
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center transition active:scale-95 ${
                              canUpgrade
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 shadow-md'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Mejorar
                            </span>
                            <span className="text-[9px] font-mono opacity-90 mt-0.5">
                              ⚙️{upgradeCostParts} 🪙{upgradeCostCoins}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (canUnlock) {
                                soundManager.playRobotBoop();
                                onUnlockBot(bot.id);
                                confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
                                showToast(`¡${bot.name} construido y activado!`);
                              } else {
                                soundManager.playClick();
                                showToast('Necesitas más repuestos para construir');
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center transition active:scale-95 ${
                              canUnlock
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:brightness-110'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                            }`}
                          >
                            <span>Construir</span>
                            <span className="text-[9px] font-mono opacity-90 mt-0.5">
                              ⚙️{unlockCostParts} 🪙{unlockCostCoins}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAB 2: BIOFUEL GENERATOR */
            <div className="space-y-4">
              <div className="bg-stone-950/90 rounded-2xl p-3 border border-emerald-500/40 text-xs text-stone-300">
                <div className="font-extrabold text-emerald-400 text-sm flex items-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4" /> ¿Cómo funciona el Biocombustible?
                </div>
                <p>
                  Tal como en <em>Rusty's Retirement</em>, convierte los excedentes de tus cultivos en
                  biocombustible verde para mantener la energía de tus robots granjeros y obtener{' '}
                  <strong className="text-amber-300">Repuestos Mecánicos (⚙️)</strong> para mejorar sus
                  habilidades.
                </p>
              </div>

              <h4 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">
                Cultivos Disponibles en Silo:
              </h4>

              {cropItems.length === 0 ? (
                <div className="bg-stone-950 p-6 rounded-2xl text-center text-stone-500 text-xs border border-dashed border-stone-800">
                  <span className="text-2xl block mb-2">������</span>
                  No tienes cultivos cosechados en el Silo. ¡Siembra y cosecha trigo o maíz primero!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {cropItems.map(({ item, qty }) => {
                    const fuelGain = item.id === 'wheat' ? 10 : item.id === 'corn' ? 18 : 25;
                    const partsGain = item.id === 'wheat' ? 3 : item.id === 'corn' ? 5 : 8;

                    return (
                      <div
                        key={item.id}
                        className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <div className="font-extrabold text-xs text-stone-200">{item.name}</div>
                            <div className="text-[10px] text-stone-400">
                              Disponibles: <strong className="text-stone-200">{qty}</strong>
                            </div>
                            <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                              +{fuelGain}L ⚡ | +{partsGain} ⚙️
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (qty >= 2) {
                              soundManager.playBiofuel();
                              onConvertBiofuel(item.id, 2);
                              confetti({ particleCount: 15, spread: 45, origin: { y: 0.7 } });
                              showToast(`¡Convertido 2x ${item.name} en Biocombustible!`);
                            } else {
                              soundManager.playClick();
                              showToast(`Necesitas al menos 2x ${item.name}`);
                            }
                          }}
                          disabled={qty < 2}
                          className={`px-3 py-2 rounded-xl font-extrabold text-xs transition active:scale-95 ${
                            qty >= 2
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                          }`}
                        >
                          Convertir 2x
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 text-center text-[11px] text-stone-500 flex items-center justify-center gap-2">
          <span>🌾 Simulación relajante de cultivos</span>
          <span>•</span>
          <span>Tito cuida de tu granja de forma automática</span>
        </div>
      </div>
    </div>
  );
};
