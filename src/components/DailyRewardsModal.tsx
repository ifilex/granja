import React, { useState } from 'react';
import { FarmState } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { Gift, Sparkles, Check, Flame, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyRewardsModalProps {
  state: FarmState;
  onClose: () => void;
  onClaimDailyStreak: () => void;
  onSpinWheel: (prizeIndex: number) => void;
}

const WHEEL_PRIZES = [
  { label: '50 🪙', type: 'coins', amount: 50, icon: '🪙' },
  { label: '3 💎', type: 'diamonds', amount: 3, icon: '💎' },
  { label: '5x Trigo', type: 'item', itemId: 'wheat', amount: 5, icon: '🌾' },
  { label: '1x Tabla', type: 'item', itemId: 'plank', amount: 1, icon: '🪵' },
  { label: '150 🪙', type: 'coins', amount: 150, icon: '💰' },
  { label: '1x Perno', type: 'item', itemId: 'bolt', amount: 1, icon: '🔩' },
  { label: '5 💎', type: 'diamonds', amount: 5, icon: '✨' },
  { label: '1x Clavos', type: 'item', itemId: 'nail', amount: 1, icon: '📌' },
];

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  state,
  onClose,
  onClaimDailyStreak,
  onSpinWheel,
}) => {
  const [activeTab, setActiveTab] = useState<'streak' | 'wheel'>('streak');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  const canClaimStreak = Date.now() - state.lastDailyRewardClaim > 24 * 3600 * 1000 || state.lastDailyRewardClaim === 0;
  const canSpinWheel = Date.now() - state.lastSpinTimestamp > 24 * 3600 * 1000 || state.lastSpinTimestamp === 0;

  const handleSpin = () => {
    if (isSpinning || !canSpinWheel) return;
    setIsSpinning(true);
    setWonPrize(null);
    soundManager.playClick();

    // Pick random prize
    const prizeIdx = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const prize = WHEEL_PRIZES[prizeIdx];

    // Calculate rotation: 5 full turns (1800 deg) + offset
    const sliceDeg = 360 / WHEEL_PRIZES.length;
    const targetDeg = 1800 + (360 - prizeIdx * sliceDeg - sliceDeg / 2);

    setWheelRotation(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize.label);
      onSpinWheel(prizeIdx);
      confetti({ particleCount: 50, spread: 70 });
      soundManager.playLevelUp();
    }, 3500);
  };

  const streakDays = [
    { day: 1, reward: '100 🪙', icon: '🪙' },
    { day: 2, reward: '2 💎', icon: '💎' },
    { day: 3, reward: '1x Tabla', icon: '🪵' },
    { day: 4, reward: '250 🪙', icon: '🪙' },
    { day: 5, reward: '1x Clavos', icon: '📌' },
    { day: 6, reward: '5 💎', icon: '💎' },
    { day: 7, reward: 'Gran Cofre (10💎 + 500🪙)', icon: '🎁' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-800/90 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-yellow-300 animate-bounce" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                Recompensas Diarias y Ruleta de la Suerte
              </h3>
              <p className="text-xs text-amber-300">
                Juega todos los días para multiplicar tus ganancias gratis
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

        {/* Tabs */}
        <div className="px-5 py-2.5 bg-amber-950/90 border-b border-amber-800 flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('streak');
            }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 ${
              activeTab === 'streak'
                ? 'bg-yellow-400 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Racha Diaria ({state.dailyRewardStreak} días)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('wheel');
            }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 ${
              activeTab === 'wheel'
                ? 'bg-yellow-400 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span>Ruleta de la Suerte</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {activeTab === 'streak' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-950/70 p-3 rounded-2xl border border-amber-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-100">
                      Racha Activa: {state.dailyRewardStreak} Días
                    </h4>
                    <span className="text-xs text-amber-300">
                      Entra cada 24 horas para desbloquear los premios mayores
                    </span>
                  </div>
                </div>
              </div>

              {/* 7 Days Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {streakDays.map((item) => {
                  const isCurrent = item.day === state.dailyRewardStreak;
                  const isClaimed = item.day < state.dailyRewardStreak || (!canClaimStreak && isCurrent);

                  return (
                    <div
                      key={item.day}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between min-h-[105px] text-center ${
                        isCurrent && canClaimStreak
                          ? 'bg-gradient-to-b from-yellow-500 to-amber-600 border-yellow-300 ring-2 ring-yellow-400 shadow-lg animate-bounce'
                          : isClaimed
                          ? 'bg-emerald-950/60 border-emerald-700/60 opacity-80'
                          : 'bg-amber-950/60 border-amber-800/60'
                      }`}
                    >
                      <span className="text-[10px] font-black text-amber-200">
                        Día {item.day}
                      </span>
                      <span className="text-2xl my-1">{item.icon}</span>
                      <span className="text-[11px] font-extrabold text-amber-100">
                        {item.reward}
                      </span>
                      {isClaimed && (
                        <span className="text-[9px] text-emerald-400 font-black">
                          ✓ Reclamado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (canClaimStreak) {
                    onClaimDailyStreak();
                    confetti({ particleCount: 35, spread: 60 });
                  }
                }}
                disabled={!canClaimStreak}
                className={`w-full py-3 rounded-2xl font-black text-sm shadow transition ${
                  canClaimStreak
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white active:scale-95'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                {canClaimStreak
                  ? '¡Reclamar Recompensa de Hoy!'
                  : 'Vuelve mañana para tu siguiente premio'}
              </button>
            </div>
          ) : (
            /* Lucky Wheel */
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Wheel Pointer */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 text-red-500 text-3xl filter drop-shadow">
                  ▼
                </div>

                {/* Animated Rotating Wheel SVG/Canvas Container */}
                <div
                  className="w-full h-full rounded-full border-4 border-yellow-400 shadow-2xl overflow-hidden relative transition-transform duration-[3500ms] cubic-bezier(0.2, 0.8, 0.3, 1)"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    background: 'conic-gradient(#b45309 0deg 45deg, #78350f 45deg 90deg, #d97706 90deg 135deg, #92400e 135deg 180deg, #b45309 180deg 225deg, #78350f 225deg 270deg, #d97706 270deg 315deg, #92400e 315deg 360deg)',
                  }}
                >
                  {WHEEL_PRIZES.map((prize, idx) => {
                    const angle = idx * 45 + 22.5;
                    return (
                      <div
                        key={idx}
                        className="absolute w-full h-full flex items-center justify-center pointer-events-none"
                        style={{
                          transform: `rotate(${angle}deg)`,
                        }}
                      >
                        <div className="transform -translate-y-20 flex flex-col items-center">
                          <span className="text-xl">{prize.icon}</span>
                          <span className="text-[10px] font-black text-amber-100 drop-shadow">
                            {prize.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Center Hub */}
                <div className="absolute w-12 h-12 rounded-full bg-yellow-400 border-2 border-amber-950 flex items-center justify-center text-amber-950 font-black text-xs shadow-lg z-10">
                  Valle
                </div>
              </div>

              {wonPrize && (
                <div className="bg-emerald-900/80 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-2xl font-black text-sm text-center animate-bounce">
                  🎉 ¡Felicidades! Ganaste: {wonPrize}
                </div>
              )}

              <button
                onClick={handleSpin}
                disabled={isSpinning || !canSpinWheel}
                className={`w-full max-w-xs py-3 rounded-2xl font-black text-sm shadow transition ${
                  !canSpinWheel
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : isSpinning
                    ? 'bg-amber-700 text-amber-200 cursor-wait'
                    : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-amber-950 active:scale-95'
                }`}
              >
                {isSpinning
                  ? 'Girando la ruleta...'
                  : canSpinWheel
                  ? '¡Girar Ruleta Gratis!'
                  : 'Giro gratis disponible en 24h'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
