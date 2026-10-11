import React, { useState } from 'react';
import { FarmState, Achievement } from '../types/game';
import { soundManager } from '../utils/audio';
import { Trophy, Share2, Sparkles, CheckCircle2, Copy, Check, Star, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AchievementsAndShareModalProps {
  state: FarmState;
  onClose: () => void;
  onClaimAchievement: (achievementId: string) => void;
}

export const AchievementsAndShareModal: React.FC<AchievementsAndShareModalProps> = ({
  state,
  onClose,
  onClaimAchievement,
}) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'share'>('achievements');
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    soundManager.playCoin();
    const text = `🌾 ¡Mi granja "${state.farmName}" alcanzó el Nivel ${state.level} en Granja Valle Dorado! He cosechado ${state.stats.cropsHarvested} cultivos y completado ${state.stats.ordersCompleted} pedidos. ¡Únete a mi clan de granjeros! 🚜✨`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Granja Valle Dorado',
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-800/90 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                Logros y Compartir Progreso
              </h3>
              <p className="text-xs text-amber-300">
                Gana diamantes gratis y comparte tu estatus en redes sociales
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
              setActiveTab('achievements');
            }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs transition ${
              activeTab === 'achievements'
                ? 'bg-yellow-400 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            🏆 Logros de la Granja
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('share');
            }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs transition ${
              activeTab === 'share'
                ? 'bg-yellow-400 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            📢 Pasaporte Rural & Redes
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {activeTab === 'achievements' ? (
            <div className="space-y-3">
              {state.achievements.map((ach) => {
                const percent = Math.min(
                  100,
                  Math.round((ach.currentValue / ach.targetValue) * 100)
                );
                const isReadyToClaim = ach.currentValue >= ach.targetValue && !ach.claimed;

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 shadow ${
                      ach.claimed
                        ? 'bg-amber-950/40 border-amber-800/40 opacity-70'
                        : isReadyToClaim
                        ? 'bg-gradient-to-r from-amber-800 to-amber-900 border-yellow-400 ring-2 ring-yellow-400/40'
                        : 'bg-amber-950/70 border-amber-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-900/80 border border-amber-700 flex items-center justify-center text-2xl shadow-inner">
                        {ach.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-amber-100">
                          {ach.title}
                        </h4>
                        <p className="text-xs text-amber-300">{ach.description}</p>
                        {/* Progress Bar */}
                        <div className="w-36 sm:w-48 bg-amber-950 rounded-full h-2 mt-1.5 border border-amber-800 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-amber-400/80 font-bold">
                          {ach.currentValue} / {ach.targetValue} ({percent}%)
                        </span>
                      </div>
                    </div>

                    {/* Reward and Action */}
                    <div>
                      {ach.claimed ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reclamado</span>
                        </div>
                      ) : isReadyToClaim ? (
                        <button
                          onClick={() => {
                            onClaimAchievement(ach.id);
                            confetti({ particleCount: 30, spread: 50 });
                          }}
                          className="bg-yellow-400 hover:bg-yellow-300 text-amber-950 font-black text-xs px-3 py-2 rounded-xl shadow animate-bounce flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+{ach.rewardDiamonds} 💎</span>
                        </button>
                      ) : (
                        <div className="text-xs font-black text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 rounded-xl">
                          +{ach.rewardDiamonds} 💎
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Social Share Card */
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-md bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 border-4 border-amber-700 rounded-3xl p-5 shadow-2xl text-amber-950 relative overflow-hidden">
                {/* Ribbon */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-amber-300">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{state.playerAvatar}</span>
                    <div>
                      <h4 className="font-black text-lg leading-tight">
                        {state.farmName}
                      </h4>
                      <span className="text-xs font-bold text-amber-800">
                        Granjero: {state.playerName}
                      </span>
                    </div>
                  </div>
                  <div className="bg-amber-600 text-white font-black text-sm px-3 py-1 rounded-full shadow">
                    Nivel {state.level}
                  </div>
                </div>

                {/* Grid of stats */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="bg-amber-200/60 rounded-2xl p-2.5 text-center border border-amber-300">
                    <span className="text-xs font-bold text-amber-800 block">
                      Cultivos Cosechados
                    </span>
                    <span className="text-xl font-black text-amber-950">
                      🌾 {state.stats.cropsHarvested}
                    </span>
                  </div>

                  <div className="bg-amber-200/60 rounded-2xl p-2.5 text-center border border-amber-300">
                    <span className="text-xs font-bold text-amber-800 block">
                      Pedidos Enviados
                    </span>
                    <span className="text-xl font-black text-amber-950">
                      🚚 {state.stats.ordersCompleted}
                    </span>
                  </div>

                  <div className="bg-amber-200/60 rounded-2xl p-2.5 text-center border border-amber-300">
                    <span className="text-xs font-bold text-amber-800 block">
                      Ventas en Mercado
                    </span>
                    <span className="text-xl font-black text-amber-950">
                      📰 {state.stats.marketSales}
                    </span>
                  </div>

                  <div className="bg-amber-200/60 rounded-2xl p-2.5 text-center border border-amber-300">
                    <span className="text-xs font-bold text-amber-800 block">
                      Vecinos Ayudados
                    </span>
                    <span className="text-xl font-black text-amber-950">
                      🌳 {state.stats.treesRevived}
                    </span>
                  </div>
                </div>

                <div className="text-center text-[11px] font-bold text-amber-800">
                  Valle Dorado • Simulador Clásico de Granja 2D
                </div>
              </div>

              <button
                onClick={handleShare}
                className="w-full max-w-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition flex items-center justify-center gap-2"
              >
                {copiedShare ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
                <span>
                  {copiedShare
                    ? '¡Enlace de Granja Copiado al Portapapeles!'
                    : 'Compartir en Redes Sociales / WhatsApp'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
