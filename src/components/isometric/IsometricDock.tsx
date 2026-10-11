import React from 'react';
import { FarmState } from '../../types/game';
import { soundManager } from '../../utils/audio';
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  Hand,
  Sparkles,
  ChevronUp,
  MapPin,
  HelpCircle,
} from 'lucide-react';

interface IsometricDockProps {
  state: FarmState;
  activeTool: string | null;
  onSelectTool: (tool: string | null) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenterFarm: () => void;
  onJumpToSector: (sector: 'crops' | 'animals' | 'factories' | 'road') => void;
  onBuyPlot?: () => void;
  nextPlotCost: number;
  canAffordPlot: boolean;
  onOpenWorkshop?: () => void;
  onWaterAll?: () => void;
  onHarvestAll?: () => void;
  onTogglePerformanceMode?: () => void;
}

export const IsometricDock: React.FC<IsometricDockProps> = ({
  state,
  activeTool,
  onSelectTool,
  zoom,
  onZoomIn,
  onZoomOut,
  onCenterFarm,
  onJumpToSector,
  onBuyPlot,
  nextPlotCost,
  canAffordPlot,
  onOpenWorkshop,
  onWaterAll,
  onHarvestAll,
  onTogglePerformanceMode,
}) => {
  const wheatAvailable = state.inventory['wheat'] || 0;
  const cornAvailable = state.inventory['corn'] || 0;
  const carrotAvailable = state.inventory['carrot'] || 0;

  const readyPlotsCount = state.plots.filter(
    (p) => p.cropId && p.readyAt && Date.now() >= p.readyAt
  ).length;
  const unwateredPlotsCount = state.plots.filter(
    (p) => p.cropId && !p.isWatered && (!p.readyAt || Date.now() < p.readyAt)
  ).length;

  return (
    <div className="fixed bottom-0 inset-x-0 pointer-events-none z-30 flex flex-col items-center">
      {/* Top Floating Action Bar: Quick Water/Harvest All + Sector Navigation + Performance Toggle */}
      <div className="w-full max-w-2xl px-2 pb-1.5 flex items-center justify-between pointer-events-auto gap-1">
        {/* Left: Quick Actions (Water All / Harvest All) */}
        <div className="flex items-center gap-1 bg-stone-950/90 border-2 border-stone-700/80 rounded-2xl p-1 shadow-2xl backdrop-blur-md">
          {readyPlotsCount > 0 && onHarvestAll && (
            <button
              onClick={() => {
                soundManager.playHarvest();
                onHarvestAll();
              }}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-[11px] shadow animate-pulse flex items-center gap-1 active:scale-95 transition"
            >
              <span>🌾</span>
              <span>¡Cosechar ({readyPlotsCount})!</span>
            </button>
          )}

          {unwateredPlotsCount > 0 && onWaterAll && (
            <button
              onClick={() => {
                soundManager.playWater();
                onWaterAll();
              }}
              className="px-2 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow flex items-center gap-1 active:scale-95 transition"
            >
              <span>💧</span>
              <span>Regar ({unwateredPlotsCount})</span>
            </button>
          )}

          {/* Tito (Rusty's Workshop Shortcut) */}
          {onOpenWorkshop && (
            <button
              onClick={() => {
                soundManager.playRobotBoop();
                onOpenWorkshop();
              }}
              className="px-2 py-1 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/50 text-amber-200 font-bold text-[11px] flex items-center gap-1 active:scale-95 transition"
              title="Abrir Taller de Tito (Robots & Biocombustible)"
            >
              <span>🤖</span>
              <span className="hidden sm:inline">Taller Tito</span>
              <span className="text-[10px] text-emerald-400 font-mono">⚡{state.biofuel}L</span>
            </button>
          )}
        </div>

        {/* Right: Camera Centering & Performance Mode */}
        <div className="flex items-center gap-1 bg-stone-950/90 border-2 border-stone-700/80 rounded-2xl p-1 shadow-2xl backdrop-blur-md text-[11px]">
          {onTogglePerformanceMode && (
            <button
              onClick={() => {
                soundManager.playClick();
                onTogglePerformanceMode();
              }}
              className="px-2 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-bold flex items-center gap-1 active:scale-95 transition"
              title="Modo de rendimiento para celulares antiguos"
            >
              <span>{state.performanceMode === 'potato' ? '🥔' : state.performanceMode === '3d' ? '🎮' : '⚖️'}</span>
              <span className="hidden sm:inline">
                {state.performanceMode === 'potato'
                  ? '60 FPS Móvil'
                  : state.performanceMode === '3d'
                  ? 'Modo 3D'
                  : 'Equilibrado'}
              </span>
            </button>
          )}

          <button
            onClick={onCenterFarm}
            className="h-7 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-black text-[10px] flex items-center gap-1 transition shadow"
            title="Centrar granja en pantalla"
          >
            <Crosshair className="w-3 h-3" />
            <span className="hidden sm:inline">Centrar</span>
          </button>
        </div>
      </div>

      {/* Main Touch Bottom Dock: Ergonomic Mobile-First Tool Selection (Stardew Valley / Rusty toolbar) */}
      <div className="w-full max-w-2xl bg-stone-950/95 border-t-4 border-amber-600 px-2 sm:px-3 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] backdrop-blur-md pointer-events-auto rounded-t-3xl">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* 1. Mano / Inspeccionar */}
          <button
            onClick={() => {
              soundManager.playClick();
              onSelectTool(null);
            }}
            className={`flex-1 py-1.5 px-0.5 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              activeTool === null
                ? 'bg-amber-500 border-yellow-300 text-stone-950 shadow-md ring-2 ring-yellow-400/50 scale-105'
                : 'bg-stone-900 border-stone-800 text-amber-200 hover:bg-stone-800'
            }`}
          >
            <Hand className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-black leading-tight">Mano</span>
          </button>

          {/* 2. Regadera (Watering Can: clave en Rusty's y Stardew para duplicar crecimiento) */}
          <button
            onClick={() => {
              soundManager.playWater();
              onSelectTool(activeTool === 'water_can' ? null : 'water_can');
            }}
            className={`flex-1 py-1.5 px-0.5 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              activeTool === 'water_can'
                ? 'bg-sky-500 border-sky-200 text-stone-950 shadow-md ring-2 ring-sky-300/50 scale-105'
                : 'bg-sky-950/70 border-sky-900 text-sky-200 hover:bg-sky-900/80'
            }`}
            title="Regadera: Acelera 2x el crecimiento de los cultivos"
          >
            <span className="text-xl leading-none">💧</span>
            <span className="text-[10px] font-black leading-tight">Regadera</span>
            <span className="text-[8.5px] font-bold text-sky-400">2x vel.</span>
          </button>

          {/* 3. Trigo */}
          <button
            onClick={() => {
              soundManager.playClick();
              onSelectTool(activeTool === 'wheat' ? null : 'wheat');
            }}
            className={`flex-1 py-1.5 px-0.5 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              activeTool === 'wheat'
                ? 'bg-amber-500 border-yellow-300 text-stone-950 shadow-md ring-2 ring-yellow-400/50 scale-105'
                : 'bg-amber-950/70 border-amber-900 text-amber-100 hover:bg-amber-900'
            }`}
          >
            <span className="text-xl leading-none">🌾</span>
            <span className="text-[10px] font-black leading-tight">Trigo</span>
            <span className="text-[8.5px] font-bold text-amber-400">({wheatAvailable})</span>
          </button>

          {/* 4. Maíz */}
          <button
            onClick={() => {
              soundManager.playClick();
              onSelectTool(activeTool === 'corn' ? null : 'corn');
            }}
            className={`flex-1 py-1.5 px-0.5 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              activeTool === 'corn'
                ? 'bg-amber-500 border-yellow-300 text-stone-950 shadow-md ring-2 ring-yellow-400/50 scale-105'
                : 'bg-amber-950/70 border-amber-900 text-amber-100 hover:bg-amber-900'
            }`}
          >
            <span className="text-xl leading-none">🌽</span>
            <span className="text-[10px] font-black leading-tight">Maíz</span>
            <span className="text-[8.5px] font-bold text-amber-400">({cornAvailable})</span>
          </button>

          {/* 5. Zanahoria */}
          <button
            onClick={() => {
              soundManager.playClick();
              onSelectTool(activeTool === 'carrot' ? null : 'carrot');
            }}
            className={`flex-1 py-1.5 px-0.5 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              activeTool === 'carrot'
                ? 'bg-amber-500 border-yellow-300 text-stone-950 shadow-md ring-2 ring-yellow-400/50 scale-105'
                : 'bg-amber-950/70 border-amber-900 text-amber-100 hover:bg-amber-900'
            }`}
          >
            <span className="text-xl leading-none">🥕</span>
            <span className="text-[10px] font-black leading-tight">Zanahoria</span>
            <span className="text-[8.5px] font-bold text-amber-400">({carrotAvailable})</span>
          </button>

          {/* 6. Hoz de Cosecha */}
          <button
            onClick={() => {
              soundManager.playClick();
              onSelectTool(activeTool === 'sickle' ? null : 'sickle');
            }}
            className={`flex-1 py-1.5 px-0.5 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
              activeTool === 'sickle'
                ? 'bg-yellow-400 border-yellow-100 text-stone-950 shadow-md ring-2 ring-yellow-300/50 scale-105'
                : 'bg-stone-900 border-stone-800 text-amber-200 hover:bg-stone-800'
            }`}
          >
            <span className="text-xl leading-none">🪓</span>
            <span className="text-[10px] font-black leading-tight">Hoz</span>
            <span className="text-[8.5px] font-bold text-yellow-400">Cosechar</span>
          </button>

          {/* 7. Nueva Parcela */}
          {onBuyPlot && (
            <button
              onClick={() => {
                soundManager.playClick();
                onBuyPlot();
              }}
              className={`flex-1 py-1.5 px-0.5 rounded-2xl border-2 transition flex flex-col items-center justify-center ${
                canAffordPlot
                  ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white active:scale-95 shadow'
                  : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
              }`}
              title={`Comprar nueva parcela (${nextPlotCost} monedas)`}
            >
              <span className="text-xl leading-none">➕</span>
              <span className="text-[10px] font-black leading-tight">Parcela</span>
              <span className="text-[8.5px] font-bold text-emerald-300">{nextPlotCost}🪙</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
