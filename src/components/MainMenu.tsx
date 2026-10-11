import React, { useState } from 'react';
import { FarmState } from '../types/game';
import { soundManager } from '../utils/audio';
import {
  Play,
  RotateCcw,
  Settings,
  BookOpen,
  Trophy,
  Cloud,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Tv,
  Palette,
  Check,
  Award,
} from 'lucide-react';

interface MainMenuProps {
  state: FarmState;
  renderMode?: '3d' | '2d';
  onToggleRenderMode?: () => void;
  onContinue: () => void;
  onNewGame: (newFarmName: string, climate: string) => void;
  onToggleSound: () => void;
  onToggleRetroPalette: () => void;
  onToggleCrtFilter: () => void;
  onOpenLeaderboard: () => void;
  onOpenCloud: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  state,
  renderMode = '3d',
  onToggleRenderMode,
  onContinue,
  onNewGame,
  onToggleSound,
  onToggleRetroPalette,
  onToggleCrtFilter,
  onOpenLeaderboard,
  onOpenCloud,
}) => {
  const [activeModal, setActiveModal] = useState<
    'none' | 'new_game' | 'settings' | 'manual'
  >('none');
  const [newFarmName, setNewFarmName] = useState('Granja Valle Verde');
  const [selectedClimate, setSelectedClimate] = useState('Templado (Clásico)');
  const [manualTab, setManualTab] = useState<'basics' | 'crops' | 'transport' | 'market'>('basics');

  const handleStartGame = () => {
    soundManager.playTitleJingle();
    onContinue();
  };

  const handleConfirmNewGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) return;
    soundManager.playTitleJingle();
    onNewGame(newFarmName.trim(), selectedClimate);
    setActiveModal('none');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#0f2e14] via-[#1a441e] to-[#0a1f0d] text-amber-100 overflow-hidden select-none">
      
      {/* 256-Color Retro Pixel Background Grid Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#388e3c_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Atmospheric Isometric Vintage Scenic Silhouette */}
      <div className="absolute bottom-0 inset-x-0 h-72 opacity-40 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1200 400" className="w-full h-full preserve-3d">
          {/* Distant Hills */}
          <polygon points="0,400 0,220 200,160 450,230 750,150 1000,240 1200,170 1200,400" fill="#14532d" />
          <polygon points="0,400 120,260 380,210 650,280 920,200 1200,280 1200,400" fill="#166534" />
          
          {/* Railway Tracks & Ballast */}
          <line x1="0" y1="360" x2="1200" y2="360" stroke="#475569" strokeWidth="12" />
          <line x1="0" y1="357" x2="1200" y2="357" stroke="#cbd5e1" strokeWidth="2.5" />
          <line x1="0" y1="363" x2="1200" y2="363" stroke="#cbd5e1" strokeWidth="2.5" />

          {/* Animated Retro Locomotive chugging across title background */}
          <g className="animate-train-chug">
            <g transform="translate(480, 318)">
              {/* Smoke puffs */}
              <circle cx="-10" cy="-35" r="8" fill="#f8fafc" opacity="0.6" />
              <circle cx="-25" cy="-50" r="13" fill="#f8fafc" opacity="0.4" />
              <circle cx="-45" cy="-65" r="18" fill="#f8fafc" opacity="0.2" />
              {/* Boiler */}
              <rect x="0" y="-20" width="70" height="26" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              {/* Cab */}
              <rect x="50" y="-36" width="30" height="42" fill="#991b1b" stroke="#7f1d1d" strokeWidth="2" />
              <rect x="56" y="-30" width="12" height="12" fill="#38bdf8" />
              {/* Chimney */}
              <rect x="14" y="-34" width="10" height="15" fill="#ca8a04" />
              {/* Wheels */}
              <circle cx="15" cy="8" r="8" fill="#ca8a04" stroke="#78350f" strokeWidth="2" />
              <circle cx="35" cy="8" r="8" fill="#ca8a04" stroke="#78350f" strokeWidth="2" />
              <circle cx="55" cy="8" r="8" fill="#ca8a04" stroke="#78350f" strokeWidth="2" />
              <circle cx="75" cy="8" r="8" fill="#ca8a04" stroke="#78350f" strokeWidth="2" />
            </g>
          </g>
        </svg>
      </div>

      {/* Top Header Controls: Sound & Version */}
      <div className="w-full max-w-5xl px-4 pt-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-stone-900/90 border border-amber-600/60 rounded-xl px-3 py-1 shadow-md text-xs font-mono font-bold text-amber-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>VALLE DORADO 3D • SIMULADOR AGRÍCOLA AVANZADO</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle 3D vs 2D */}
          {onToggleRenderMode && (
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleRenderMode();
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-black border transition flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-stone-950 border-emerald-300 shadow"
              title="Alternar motor gráfico 3D Suave o 2D Clásico"
            >
              <span>{renderMode === '3d' ? '🎮 3D Suave' : '🗺️ 2D'}</span>
            </button>
          )}

          {/* Toggle 256-Color Palette */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleRetroPalette();
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              state.retroPalette
                ? 'bg-amber-600 text-stone-950 border-yellow-300 shadow'
                : 'bg-stone-900/80 text-amber-200 border-amber-700/60 hover:bg-stone-800'
            }`}
            title="Paleta retro de 256 colores"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>256 Colores: {state.retroPalette ? 'ON' : 'OFF'}</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleSound();
            }}
            className="w-8 h-8 rounded-xl bg-stone-900/90 border border-amber-600/60 text-amber-300 flex items-center justify-center hover:bg-stone-800 transition"
            title="Activar / Desactivar Sonido"
          >
            {state.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-red-400" />
            )}
          </button>
        </div>
      </div>

      {/* Center Title Logo & Emblem */}
      <div className="flex flex-col items-center justify-center text-center my-auto z-10 px-4">
        <div className="relative mb-2">
          {/* Retro Title Box */}
          <div className="inline-block px-6 py-2 bg-stone-950/90 border-4 border-amber-500 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] text-center transform hover:scale-[1.02] transition">
            <div className="text-[11px] sm:text-xs font-black tracking-[0.25em] text-yellow-400 uppercase drop-shadow mb-1">
              SIMULADOR AGRÍCOLA 3D EN TIEMPO REAL
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight ttd-title-gradient uppercase">
              GRANJA VALLE DORADO
            </h1>
            <div className="text-sm sm:text-lg md:text-xl font-extrabold tracking-widest text-amber-200 mt-0.5 flex items-center justify-center gap-2">
              <span className="text-amber-500">🌾</span>
              <span>EDICIÓN 3D DELUXE</span>
              <span className="text-amber-500">🚂</span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-emerald-200/90 max-w-md mt-2 font-medium drop-shadow">
          Siembra campos en 3D, cría ganado animado, construye industrias de molienda y panadería, y transporta cosechas.
        </p>

        {/* Action Menu Buttons (Classic 3D Beveled Buttons) */}
        <div className="w-full max-w-sm flex flex-col gap-2.5 mt-6">
          {/* 1. CONTINUAR PARTIDA */}
          <button
            onClick={handleStartGame}
            className="group w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black text-base sm:text-lg border-2 border-yellow-200 shadow-[0_6px_20px_rgba(234,179,8,0.4)] active:scale-95 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-950/20 flex items-center justify-center text-xl">
                ▶
              </span>
              <div className="text-left">
                <div className="leading-tight uppercase tracking-wide">
                  Continuar Granja
                </div>
                <div className="text-[11px] font-bold text-amber-950/80">
                  {state.farmName} • Nivel {state.level} ({state.coins.toLocaleString()} 🪙)
                </div>
              </div>
            </div>
            <span className="text-xl group-hover:translate-x-1 transition-transform">
              ➔
            </span>
          </button>

          {/* 2. NUEVA PARTIDA */}
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveModal('new_game');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-200 font-extrabold text-sm border-2 border-amber-700/80 shadow-md active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Nueva Partida / Cambiar Granja</span>
          </button>

          {/* Secondary Row of Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {/* Manual del Granjero */}
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveModal('manual');
              }}
              className="py-2.5 px-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-200 font-bold text-xs border border-amber-700/60 shadow active:scale-95 transition flex flex-col items-center gap-1"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Manual 3D</span>
            </button>

            {/* Opciones */}
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveModal('settings');
              }}
              className="py-2.5 px-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-200 font-bold text-xs border border-amber-700/60 shadow active:scale-95 transition flex flex-col items-center gap-1"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Ajustes</span>
            </button>

            {/* Ranking Mundial */}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLeaderboard();
              }}
              className="py-2.5 px-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-amber-200 font-bold text-xs border border-amber-700/60 shadow active:scale-95 transition flex flex-col items-center gap-1"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Ranking</span>
            </button>
          </div>

          {/* Nube y Respaldos */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenCloud();
            }}
            className="w-full py-2 px-3 rounded-xl bg-stone-950/80 hover:bg-stone-900 text-amber-300 font-medium text-xs border border-stone-700/80 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span>Copia de Seguridad & Guardado en la Nube</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-5xl px-4 pb-3 flex items-center justify-between text-[11px] text-emerald-300/70 font-mono z-10">
        <div>MOTOR ISOMÉTRICO 2:1 • 100% OFFLINE & ONLINE</div>
        <div>GRANJA VALLE DORADO v1.94</div>
      </div>

      {/* --- MODAL: NUEVA PARTIDA --- */}
      {activeModal === 'new_game' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-stone-900 border-4 border-amber-600 rounded-3xl p-5 shadow-2xl text-amber-100">
            <div className="flex items-center justify-between border-b border-amber-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚜</span>
                <h3 className="font-extrabold text-lg text-amber-200">
                  Iniciar Nueva Compañía Agrícola
                </h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="w-8 h-8 rounded-full bg-stone-800 text-amber-300 flex items-center justify-center hover:bg-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmNewGame} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                  Nombre de tu Granja / Compañía:
                </label>
                <input
                  type="text"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  maxLength={25}
                  required
                  className="w-full bg-stone-950 border-2 border-amber-700 rounded-xl px-3 py-2 text-sm text-amber-100 font-bold focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase mb-1">
                  Clima & Región de Inicio:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Templado (Clásico)', 'Valle Soleado', 'Colinas Alpinas'].map(
                    (climate) => (
                      <button
                        key={climate}
                        type="button"
                        onClick={() => setSelectedClimate(climate)}
                        className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                          selectedClimate === climate
                            ? 'bg-amber-600 border-yellow-300 text-stone-950 shadow'
                            : 'bg-stone-800 border-stone-700 text-amber-200 hover:bg-stone-700'
                        }`}
                      >
                        <span className="text-base">
                          {climate.startsWith('Templado')
                            ? '🌲'
                            : climate.startsWith('Valle')
                            ? '🌻'
                            : '🏔️'}
                        </span>
                        <span className="text-center leading-tight">{climate}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-950/60 rounded-xl border border-amber-800 text-xs text-amber-300">
                ⚠️ Iniciarás con 450 monedas, 8 parcelas agrícolas y el camión de transporte listo para entregar pedidos.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 font-bold text-sm text-stone-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-black text-sm text-stone-950 border border-yellow-300 shadow"
                >
                  ¡Fundar Granja! 🌾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: AJUSTES & PANTALLA RETRO --- */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-stone-900 border-4 border-amber-600 rounded-3xl p-5 shadow-2xl text-amber-100">
            <div className="flex items-center justify-between border-b border-amber-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-amber-400" />
                <h3 className="font-extrabold text-lg text-amber-200">
                  Configuración Gráfica & Opciones
                </h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="w-8 h-8 rounded-full bg-stone-800 text-amber-300 flex items-center justify-center hover:bg-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* 3D WebGL Engine Toggle */}
              {onToggleRenderMode && (
                <div className="flex items-center justify-between p-3 bg-stone-950 rounded-2xl border border-stone-800">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-sm font-bold text-emerald-200">
                        Motor Gráfico 3D Suave (WebGL)
                      </div>
                      <div className="text-xs text-stone-400">
                        {renderMode === '3d'
                          ? 'Activo: Modelos 3D, sombras suaves e iluminación dinámica'
                          : 'Inactivo: Usando modo 2D isométrico clásico'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onToggleRenderMode}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${
                      renderMode === '3d' ? 'bg-emerald-500' : 'bg-stone-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-stone-950 transition-transform ${
                        renderMode === '3d' ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Retro 256 Colors Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-bold text-amber-200">
                      Paleta 256 Colores (Pixel Art Retro)
                    </div>
                    <div className="text-xs text-stone-400">
                      Gradaciones tonales con estética clásica de PC
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggleRetroPalette}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    state.retroPalette ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-stone-950 transition-transform ${
                      state.retroPalette ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* CRT Scanlines Filter */}
              <div className="flex items-center justify-between p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-3">
                  <Tv className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-bold text-amber-200">
                      Filtro Monitor CRT Vintage
                    </div>
                    <div className="text-xs text-stone-400">
                      Líneas de exploración retro de pantalla
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggleCrtFilter}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    state.crtFilter ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-stone-950 transition-transform ${
                      state.crtFilter ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm font-bold text-amber-200">
                      Efectos de Audio y Síntesis
                    </div>
                    <div className="text-xs text-stone-400">
                      Sonidos de trenes, animales y cosechas
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    state.soundEnabled ? 'bg-amber-500' : 'bg-stone-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-stone-950 transition-transform ${
                      state.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveModal('none')}
              className="w-full mt-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-stone-950 text-sm"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: MANUAL DEL GRANJERO TTD --- */}
      {activeModal === 'manual' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-lg bg-stone-900 border-4 border-amber-600 rounded-3xl p-5 shadow-2xl text-amber-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-amber-800 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-400" />
                <h3 className="font-extrabold text-lg text-amber-200">
                  Manual de Operaciones Tycoon
                </h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="w-8 h-8 rounded-full bg-stone-800 text-amber-300 flex items-center justify-center hover:bg-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-amber-800/80 pb-2 mb-3 shrink-0">
              {[
                { id: 'basics', label: 'Básicos 🚜' },
                { id: 'crops', label: 'Siembra 🌾' },
                { id: 'transport', label: 'Camión 🚚' },
                { id: 'market', label: 'Mercado 📰' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setManualTab(tab.id as any)}
                  className={`flex-1 py-1 px-2 rounded-xl text-xs font-bold transition ${
                    manualTab === tab.id
                      ? 'bg-amber-600 text-stone-950 shadow'
                      : 'bg-stone-800 text-amber-300 hover:bg-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content inside dialog */}
            <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-3">
              {manualTab === 'basics' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-yellow-300">
                    Bienvenido a Granja Valle Dorado 3D
                  </h4>
                  <p className="text-stone-300 leading-relaxed">
                    Granja Valle Dorado es un simulador agrícola en 3D interactivo donde cada parcela de tierra, cada animal y cada ruta de transporte impacta en tu economía.
                  </p>
                  <div className="p-2.5 bg-stone-950 rounded-xl border border-amber-800/60">
                    <strong className="text-amber-200">Controles en Pantalla:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-stone-300">
                      <li><strong>Arrastra</strong> con el dedo o ratón para explorar el mapa.</li>
                      <li><strong>Pellizca o usa la rueda</strong> para alejar/acercar el zoom.</li>
                      <li>Toca sobre parcelas vacías para sembrar trigo, maíz o zanahorias.</li>
                      <li>Toca los edificios para fabricar piensos, pan y lácteos.</li>
                    </ul>
                  </div>
                </div>
              )}

              {manualTab === 'crops' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-yellow-300">
                    Ciclo de Cultivos y Expansión
                  </h4>
                  <p className="text-stone-300 leading-relaxed">
                    Al cosechar cultivos (trigo, maíz, caña) recibes el doble (+2) de lo sembrado en tu Silo.
                  </p>
                  <p className="text-stone-300 leading-relaxed">
                    Usa la loseta <strong>`➕ DESARROLLAR PARCELA`</strong> en la esquina del campo para adquirir más tierra agrícola con monedas.
                  </p>
                </div>
              )}

              {manualTab === 'transport' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-yellow-300">
                    Depósito y Camión de Reparto 🚚
                  </h4>
                  <p className="text-stone-300 leading-relaxed">
                    El camión situado en el muelle de carga transporta los pedidos hacia las tiendas del pueblo. Despachar pedidos te otorga monedas, valiosa experiencia (XP) y herramientas raras para ampliar tus almacenes.
                  </p>
                </div>
              )}

              {manualTab === 'market' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-yellow-300">
                    Puesto de Venta & Periódico Mundial 🏪
                  </h4>
                  <p className="text-stone-300 leading-relaxed">
                    Publica artículos excedentes en tu puesto de carretera. Los demás granjeros y vecinos del mundo los comprarán a través del periódico en tiempo real.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 mt-2 border-t border-amber-800 shrink-0">
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-stone-950 text-xs"
              >
                Cerrar Manual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
