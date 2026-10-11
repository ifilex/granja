import React, { useState } from 'react';
import { LeaderboardPlayer, FarmState } from '../types/game';
import { soundManager } from '../utils/audio';
import { Trophy, Medal, Crown, Star, Eye } from 'lucide-react';

interface LeaderboardModalProps {
  players: LeaderboardPlayer[];
  state: FarmState;
  onClose: () => void;
  onVisitPlayer: (playerId: string) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  players,
  state,
  onClose,
  onVisitPlayer,
}) => {
  const [filter, setFilter] = useState<'monthly' | 'farm_value'>('monthly');

  const sortedPlayers = [...players].sort((a, b) =>
    filter === 'monthly' ? b.monthlyScore - a.monthlyScore : b.farmValue - a.farmValue
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3">
      <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-amber-950 border-2 border-amber-600 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-800/90 border-b border-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-400" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-amber-100 leading-tight">
                Clasificación Mensual de Granjeros
              </h3>
              <p className="text-xs text-amber-300">
                Temporada de Cosecha Dorada • Finaliza en 14 días
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

        {/* Filter Tabs */}
        <div className="px-5 py-2.5 bg-amber-950/90 border-b border-amber-800 flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setFilter('monthly');
            }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs transition ${
              filter === 'monthly'
                ? 'bg-yellow-400 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            🏆 Puntuación del Mes
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setFilter('farm_value');
            }}
            className={`flex-1 py-1.5 rounded-xl font-black text-xs transition ${
              filter === 'farm_value'
                ? 'bg-yellow-400 text-amber-950 shadow'
                : 'bg-amber-900/60 text-amber-200'
            }`}
          >
            💰 Valor de la Granja
          </button>
        </div>

        {/* Players List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {sortedPlayers.map((player, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={player.id}
                className={`rounded-2xl border-2 p-3 flex items-center justify-between shadow transition hover:brightness-105 ${
                  rank === 1
                    ? 'bg-gradient-to-r from-yellow-700/80 via-amber-800 to-amber-900 border-yellow-400'
                    : rank === 2
                    ? 'bg-gradient-to-r from-slate-600/80 to-amber-900 border-slate-300'
                    : rank === 3
                    ? 'bg-gradient-to-r from-amber-800/80 to-stone-900 border-amber-600'
                    : 'bg-amber-950/60 border-amber-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className="w-8 h-8 flex items-center justify-center font-black text-sm">
                    {rank === 1 ? (
                      <span className="text-2xl">🥇</span>
                    ) : rank === 2 ? (
                      <span className="text-2xl">🥈</span>
                    ) : rank === 3 ? (
                      <span className="text-2xl">🥉</span>
                    ) : (
                      <span className="text-amber-300">#{rank}</span>
                    )}
                  </div>

                  <span className="text-2xl">{player.avatar}</span>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-amber-100">
                        {player.name}
                      </h4>
                      <span className="text-[10px] bg-amber-900 text-amber-200 px-1.5 py-0.2 rounded font-bold">
                        Nv.{player.level}
                      </span>
                    </div>
                    {player.clanName && (
                      <span className="text-[11px] text-amber-300">
                        🌾 {player.clanName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score & Visit Button */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-sm font-black text-yellow-300 block">
                      {filter === 'monthly'
                        ? `${player.monthlyScore.toLocaleString()} pts`
                        : `${player.farmValue.toLocaleString()} 🪙`}
                    </span>
                    <span className="text-[9px] text-amber-400/80">
                      {filter === 'monthly' ? 'Puntos de temporada' : 'Valor neto'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onVisitPlayer(player.id);
                    }}
                    className="p-2 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded-xl border border-amber-600 shadow transition active:scale-95"
                    title="Visitar granja de este jugador"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
