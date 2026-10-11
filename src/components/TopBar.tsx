import React from 'react';
import { FarmState } from '../types/game';
import { soundManager } from '../utils/audio';
import { Volume2, VolumeX, Bell, Cloud, Trophy, Gift, Users, ShieldAlert, Sparkles } from 'lucide-react';

interface TopBarProps {
  state: FarmState;
  renderMode?: '3d' | '2d';
  onToggleRenderMode?: () => void;
  onOpenMainMenu: () => void;
  onOpenSilo: () => void;
  onOpenBarn: () => void;
  onOpenDaily: () => void;
  onOpenAchievements: () => void;
  onOpenClans: () => void;
  onOpenCloud: () => void;
  onOpenLeaderboard: () => void;
  onOpenWorkshop?: () => void;
  onTogglePerformanceMode?: () => void;
  onToggleSound: () => void;
  onToggleRetroPalette?: () => void;
  onRequestNotifications: () => void;
  isOnline: boolean;
  hasDailyReady: boolean;
  unclaimedAchievements: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  renderMode = '3d',
  onToggleRenderMode,
  onOpenMainMenu,
  onOpenSilo,
  onOpenBarn,
  onOpenDaily,
  onOpenAchievements,
  onOpenClans,
  onOpenCloud,
  onOpenLeaderboard,
  onOpenWorkshop,
  onTogglePerformanceMode,
  onToggleSound,
  onToggleRetroPalette,
  onRequestNotifications,
  isOnline,
  hasDailyReady,
  unclaimedAchievements,
}) => {
  const xpPercent = Math.min(100, Math.round((state.xp / state.xpToNextLevel) * 100));

  return (
    <header className="w-full bg-gradient-to-b from-[#1c1917]/95 via-[#292524]/90 to-[#1c1917]/85 backdrop-blur-md text-amber-100 border-b border-amber-800/60 shadow-lg px-2 sm:px-4 py-1.5 z-30 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: TTD Menu Button & Player Profile */}
        <div className="flex items-center gap-2">
          {/* Classic TTD Game Menu Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenMainMenu();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black text-xs border border-yellow-200 shadow-md flex items-center gap-1.5 active:scale-95 transition"
            title="Abrir Menú Principal y Opciones"
          >
            <span className="text-sm">💾</span>
            <span className="tracking-wide uppercase font-black">MENÚ</span>
          </button>

          <div className="relative group cursor-pointer" onClick={onOpenAchievements} title="Perfil de Granjero">
            <div className="w-10 h-10 rounded-2xl bg-amber-800/80 border-2 border-amber-400/80 flex items-center justify-center text-xl shadow-inner transform transition active:scale-95">
              {state.playerAvatar}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black text-[10px] px-1.5 py-0.2 rounded-full border border-amber-900 shadow">
              {state.level}
            </div>
          </div>

          <div className="flex flex-col min-w-[85px] sm:min-w-[120px]">
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs sm:text-sm text-amber-100 tracking-wide truncate max-w-[90px] sm:max-w-[130px]">
                {state.farmName}
              </span>
              <span className="hidden md:inline-flex text-[10px] font-mono text-yellow-400/80 bg-stone-900 px-1 rounded border border-stone-800">
                1994
              </span>
            </div>
            {/* XP Bar */}
            <div className="w-full bg-amber-950/80 rounded-full h-2 p-0.5 border border-amber-700/60 mt-0.5 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Currencies & Storages */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Monedas */}
          <div className="flex items-center gap-1 bg-amber-900/70 border border-amber-700/80 rounded-full px-2.5 py-1 shadow-inner">
            <span className="text-base sm:text-lg animate-bounce drop-shadow">🪙</span>
            <span className="font-black text-xs sm:text-sm text-yellow-300 tracking-wider">
              {state.coins.toLocaleString()}
            </span>
          </div>

          {/* Diamantes */}
          <div className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-700/80 rounded-full px-2.5 py-1 shadow-inner">
            <span className="text-base sm:text-lg drop-shadow">💎</span>
            <span className="font-black text-xs sm:text-sm text-emerald-300 tracking-wider">
              {state.diamonds}
            </span>
          </div>

          {/* Silo */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSilo();
            }}
            className="flex items-center gap-1 bg-yellow-950/70 hover:bg-yellow-900/80 border border-yellow-700/70 rounded-xl px-2 py-1 transition transform active:scale-95"
            title="Silo (Cosechas)"
          >
            <span className="text-sm">🌾</span>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-amber-200">{state.siloUsed}</span>
              <span className="text-amber-400/80">/{state.siloCapacity}</span>
            </div>
          </button>

          {/* Granero */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenBarn();
            }}
            className="flex items-center gap-1 bg-red-950/70 hover:bg-red-900/80 border border-red-700/70 rounded-xl px-2 py-1 transition transform active:scale-95"
            title="Granero (Productos y Materiales)"
          >
            <span className="text-sm">📦</span>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-amber-200">{state.barnUsed}</span>
              <span className="text-amber-400/80">/{state.barnCapacity}</span>
            </div>
          </button>
        </div>

        {/* Right: Actions and Utilities */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tito (Rusty's Workshop) Button */}
          {onOpenWorkshop && (
            <button
              onClick={() => {
                soundManager.playRobotBoop();
                onOpenWorkshop();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 hover:brightness-110 text-stone-950 font-black text-xs border border-yellow-300 shadow-md flex items-center gap-1.5 active:scale-95 transition"
              title="Taller de Tito (Rusty's Retirement): Robots y Biocombustible"
            >
              <span className="text-sm">🤖</span>
              <span className="hidden md:inline">Tito</span>
              <span className="bg-stone-950/70 text-emerald-400 font-mono text-[10px] px-1.5 py-0.5 rounded-md border border-stone-800">
                ⚡{state.biofuel}L
              </span>
            </button>
          )}

          {/* Celulares Antiguos / Potato Mode Quick Indicator & Toggle */}
          {onTogglePerformanceMode && (
            <button
              onClick={() => {
                soundManager.playClick();
                onTogglePerformanceMode();
              }}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-xl border text-xs font-black shadow transition active:scale-95 flex items-center gap-1 ${
                state.performanceMode === 'potato'
                  ? 'bg-amber-500 text-stone-950 border-yellow-200 shadow-amber-500/20'
                  : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:bg-stone-800'
              }`}
              title="Modo Celulares Antiguos (Ultra Optimizado a 60 FPS)"
            >
              <span className="text-xs">🥔</span>
              <span className="hidden xl:inline text-[10px]">
                {state.performanceMode === 'potato' ? '60 FPS Móvil' : 'Modo Ligero'}
              </span>
            </button>
          )}

          {/* Ruleta y Regalos diarios */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenDaily();
            }}
            className="relative p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 hover:brightness-110 text-amber-950 font-bold border border-yellow-300 shadow transition active:scale-95"
            title="Recompensas Diarias y Ruleta"
          >
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950" />
            {hasDailyReady && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping border border-white" />
            )}
            {hasDailyReady && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {/* Clasificación Mensual */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenLeaderboard();
            }}
            className="p-2 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-yellow-300 border border-amber-600 shadow transition active:scale-95"
            title="Tabla de Clasificación Mensual"
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Clan y Chat */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenClans();
            }}
            className="p-2 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-sky-300 border border-amber-600 shadow transition active:scale-95"
            title="Clan de Granjeros y Chat Global"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Notificaciones */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRequestNotifications();
            }}
            className={`p-2 rounded-xl border shadow transition active:scale-95 ${
              state.notificationsEnabled
                ? 'bg-amber-800/80 text-amber-200 border-amber-600 hover:bg-amber-700'
                : 'bg-stone-900/80 text-stone-400 border-stone-700 hover:bg-stone-800'
            }`}
            title="Notificaciones Push de Cosechas"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Nube & Respaldo Cifrado */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenCloud();
            }}
            className="p-2 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-emerald-300 border border-amber-600 shadow transition active:scale-95"
            title="Copia de Seguridad en la Nube y Sincronización"
          >
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* 3D vs 2D Toggle Button */}
          {onToggleRenderMode && (
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleRenderMode();
              }}
              className={`px-2.5 py-1 rounded-xl border text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5 ${
                renderMode === '3d'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-stone-950 border-emerald-300'
                  : 'bg-stone-900/90 text-amber-200 border-amber-600/70 hover:bg-stone-800'
              }`}
              title="Alternar entre Gráficos 3D Suaves WebGL y 2D Clásico"
            >
              <span>{renderMode === '3d' ? '🎮 3D Suave' : '🗺️ 2D Clásico'}</span>
            </button>
          )}

          {/* 256 Colors Retro Mode Quick Toggle */}
          {onToggleRetroPalette && (
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleRetroPalette();
              }}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-xl border text-xs font-bold shadow transition active:scale-95 flex items-center gap-1 ${
                state.retroPalette
                  ? 'bg-amber-600 text-stone-950 border-yellow-300'
                  : 'bg-stone-900/80 text-amber-200 border-stone-700 hover:bg-stone-800'
              }`}
              title="Alternar paleta retro clásica de 256 colores"
            >
              <span className="text-xs">🎨</span>
              <span className="hidden lg:inline text-[11px]">256 Colores</span>
            </button>
          )}

          {/* Sonido */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-700 shadow transition active:scale-95"
            title={state.soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
          >
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
