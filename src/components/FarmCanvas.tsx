import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FarmState } from '../types/game';
import { GAME_ITEMS } from '../data/gameData';
import { soundManager } from '../utils/audio';
import { TILE_W, TILE_H, gridToScreen, MAP_SIZE } from '../utils/isometric';
import { IsometricPlotTile } from './isometric/IsometricPlotTile';
import { IsometricBuildingTile } from './isometric/IsometricBuildingTile';
import { IsometricTransport } from './isometric/IsometricTransport';
import { IsometricPasture } from './isometric/IsometricPasture';
import { IsometricLandscape } from './isometric/IsometricLandscape';
import { IsometricDock } from './isometric/IsometricDock';
import { IsometricSeedSelector } from './isometric/IsometricSeedSelector';
import { IsometricRustyBots } from './isometric/IsometricRustyBots';
import confetti from 'canvas-confetti';

interface FloatingParticle {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface FarmCanvasProps {
  state: FarmState;
  onHarvestPlot: (plotId: number) => void;
  onPlantPlot: (plotId: number, cropId: string) => void;
  onWaterPlot?: (plotId: number) => void;
  onWaterAll?: () => void;
  onHarvestAll?: () => void;
  onFeedAnimal: (penId: string) => void;
  onCollectAnimal: (penId: string) => void;
  onOpenBuilding: (buildingId: string) => void;
  onCollectBuildingItem: (buildingId: string, slotIndex: number) => void;
  onOpenOrders: () => void;
  onOpenMarket: () => void;
  onOpenOtherFarm: (farmId: string) => void;
  onSpeedUpPlot: (plotId: number) => void;
  onSpeedUpAnimal: (penId: string) => void;
  onBuyPlot?: () => void;
  onOpenSilo?: () => void;
  onOpenBarn?: () => void;
  onOpenWorkshop?: () => void;
  onTogglePerformanceMode?: () => void;
}

export const FarmCanvas: React.FC<FarmCanvasProps> = ({
  state,
  onHarvestPlot,
  onPlantPlot,
  onWaterPlot,
  onWaterAll,
  onHarvestAll,
  onFeedAnimal,
  onCollectAnimal,
  onOpenBuilding,
  onCollectBuildingItem,
  onOpenOrders,
  onOpenMarket,
  onOpenOtherFarm,
  onSpeedUpPlot,
  onSpeedUpAnimal,
  onBuyPlot,
  onOpenSilo,
  onOpenBarn,
  onOpenWorkshop,
  onTogglePerformanceMode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Camera Pan and Zoom State
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [seedSelectorPlotId, setSeedSelectorPlotId] = useState<number | null>(null);
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [now, setNow] = useState(Date.now());

  // Dragging and Pinch Tracking
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef(1.0);

  // Center coordinate of world in virtual coordinates
  const worldCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Real-time tick for countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Center camera on initial mount or window resize
  const centerCamera = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    
    // Center on farmstead (around gx: 7, gy: 7)
    const centerPoint = gridToScreen(7, 7, 0, 0);
    worldCenterRef.current = centerPoint;

    setPan({
      x: clientWidth / 2 - centerPoint.x * zoom,
      y: clientHeight / 2 - centerPoint.y * zoom,
    });
  }, [zoom]);

  useEffect(() => {
    centerCamera();
    window.addEventListener('resize', centerCamera);
    return () => window.removeEventListener('resize', centerCamera);
  }, []);

  // Particle spawner
  const spawnParticle = (text: string, e: React.MouseEvent | React.TouchEvent) => {
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;

    if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const newP: FloatingParticle = {
      id: Math.random().toString(),
      x: clientX,
      y: clientY - 30,
      text,
    };
    setFloatingParticles((prev) => [...prev, newP]);
    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => p.id !== newP.id));
    }, 1200);
  };

  // Quick jump to sectors in isometric world
  const handleJumpToSector = (sector: 'crops' | 'animals' | 'factories' | 'road') => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    soundManager.playClick();

    let targetGx = 7;
    let targetGy = 7;

    if (sector === 'crops') {
      targetGx = 4;
      targetGy = 11;
    } else if (sector === 'animals') {
      targetGx = 10;
      targetGy = 12;
    } else if (sector === 'factories') {
      targetGx = 12;
      targetGy = 6;
    } else if (sector === 'road') {
      targetGx = 7;
      targetGy = 3;
    }

    const pt = gridToScreen(targetGx, targetGy, 0, 0);
    setPan({
      x: clientWidth / 2 - pt.x * zoom,
      y: clientHeight / 2 - pt.y * zoom,
    });
  };

  // Touch Handlers for 1-Finger Pan and 2-Finger Pinch-To-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragDistanceRef.current = 0;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPanRef.current = { ...pan };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistRef.current = Math.hypot(dx, dy);
      initialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;
      dragDistanceRef.current += Math.hypot(deltaX, deltaY);

      setPan({
        x: initialPanRef.current.x + deltaX,
        y: initialPanRef.current.y + deltaY,
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / initialPinchDistRef.current;
      const newZoom = Math.min(1.6, Math.max(0.65, initialZoomRef.current * ratio));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
  };

  // Desktop Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    dragDistanceRef.current += Math.hypot(deltaX, deltaY);

    setPan({
      x: initialPanRef.current.x + deltaX,
      y: initialPanRef.current.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(1.6, Math.max(0.65, prev + zoomDelta)));
  };

  // Zoom Button Handlers
  const handleZoomIn = () => {
    soundManager.playClick();
    setZoom((prev) => Math.min(1.6, prev + 0.15));
  };

  const handleZoomOut = () => {
    soundManager.playClick();
    setZoom((prev) => Math.max(0.65, prev - 0.15));
  };

  // Plot Positioning Mapping
  // Plots are arranged in an agricultural grid starting from gx: 2, gy: 9
  const getPlotGridCoords = (index: number) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    return {
      gx: 2 + col,
      gy: 9 + row * 2,
    };
  };

  const nextPlotCost = 40 + state.plots.length * 20;
  const canAffordPlot = state.coins >= nextPlotCost;
  const nextPlotCoords = getPlotGridCoords(state.plots.length);

  // Buildings in State
  const feedMill = state.buildings.find((b) => b.type === 'feed_mill');
  const bakery = state.buildings.find((b) => b.type === 'bakery');
  const dairy = state.buildings.find((b) => b.type === 'dairy');
  const sugarMill = state.buildings.find((b) => b.type === 'sugar_mill');

  return (
    <div
      ref={containerRef}
      id="transport-tycoon-isometric-viewport"
      className="relative w-full flex-1 overflow-hidden bg-gradient-to-b from-[#14532d] via-[#166534] to-[#0f3b1e] select-none touch-none cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Top Banner Bar for Transport Tycoon Mode */}
      <div className="absolute top-2 left-3 z-20 pointer-events-auto flex items-center gap-2">
        <div className="bg-stone-950/85 border-2 border-amber-600/80 rounded-2xl px-3 py-1 shadow-lg backdrop-blur-md flex items-center gap-2">
          <span className="text-xl animate-pulse">🚂</span>
          <div>
            <div className="text-[11px] font-black text-amber-200 uppercase tracking-wider">
              Transport Tycoon Isometric
            </div>
            <div className="text-[9px] text-amber-400 font-bold">
              Arrastra para explorar • Pellizca para zoom
            </div>
          </div>
        </div>

        {/* Neighbor Visit Shortcut */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenOtherFarm('greg');
          }}
          className="bg-gradient-to-r from-sky-600 to-blue-700 hover:brightness-110 text-white font-extrabold text-xs px-3 py-1.5 rounded-2xl border border-sky-400 shadow-md flex items-center gap-1.5 transition active:scale-95"
        >
          <span>🤠</span>
          <span className="hidden sm:inline">Visitar a Greg</span>
        </button>
      </div>

      {/* Floating Gain Particles */}
      {floatingParticles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50 font-black text-xl text-yellow-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] animate-bounce"
          style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}
        >
          {p.text}
        </div>
      ))}

      {/* Master Isometric SVG Stage */}
      <svg
        className="w-full h-full pointer-events-auto"
        style={{
          overflow: 'visible',
          willChange: 'transform',
        }}
      >
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: '0 0' }}
        >
          {/* LAYER 1: BASE TERRAIN (Emerald Checkered Grass, Roads, Paths, Water Pond, Trees, Land Expansion Tile) */}
          <IsometricLandscape
            originX={0}
            originY={0}
            onBuyPlot={onBuyPlot}
            nextPlotCost={nextPlotCost}
            canAffordPlot={canAffordPlot}
            nextPlotGx={nextPlotCoords.gx}
            nextPlotGy={nextPlotCoords.gy}
          />

          {/* LAYER 2: TRANSPORT TYCOON ROAD INFRASTRUCTURE & VEHICLES */}
          <IsometricTransport
            state={state}
            originX={0}
            originY={0}
            onOpenOrders={onOpenOrders}
            onOpenMarket={onOpenMarket}
          />

          {/* LAYER 3: CORE FARM BUILDINGS (SILO, BARN, FEED MILL/WINDMILL) */}
          {/* Silo de Granos */}
          <IsometricBuildingTile
            type="silo"
            gx={2}
            gy={5}
            originX={0}
            originY={0}
            state={state}
            onOpenSilo={onOpenSilo}
          />

          {/* Granero Central (Barn) */}
          <IsometricBuildingTile
            type="barn"
            gx={5}
            gy={5}
            originX={0}
            originY={0}
            state={state}
            onOpenBarn={onOpenBarn}
          />

          {/* Molino de Viento / Pienso */}
          {feedMill && (
            <IsometricBuildingTile
              type="feed_mill"
              gx={8}
              gy={5}
              originX={0}
              originY={0}
              state={state}
              building={feedMill}
              onOpenBuilding={onOpenBuilding}
            />
          )}

          {/* LAYER 4: ARTISAN FACTORIES */}
          {/* Panadería Artesanal */}
          {bakery && (
            <IsometricBuildingTile
              type="bakery"
              gx={11}
              gy={5}
              originX={0}
              originY={0}
              state={state}
              building={bakery}
              onOpenBuilding={onOpenBuilding}
            />
          )}

          {/* Lechería */}
          {dairy && (
            <IsometricBuildingTile
              type="dairy"
              gx={14}
              gy={5}
              originX={0}
              originY={0}
              state={state}
              building={dairy}
              onOpenBuilding={onOpenBuilding}
            />
          )}

          {/* Trapiche de Azúcar */}
          {sugarMill && (
            <IsometricBuildingTile
              type="sugar_mill"
              gx={12}
              gy={8}
              originX={0}
              originY={0}
              state={state}
              building={sugarMill}
              onOpenBuilding={onOpenBuilding}
            />
          )}

          {/* LAYER 5: CROPS FIELDS (PARCELAS DE CULTIVO ISOMÉTRICAS) */}
          {state.plots.map((plot, index) => {
            const coords = getPlotGridCoords(index);
            return (
              <IsometricPlotTile
                key={plot.id}
                plot={plot}
                gx={coords.gx}
                gy={coords.gy}
                originX={0}
                originY={0}
                now={now}
                activeTool={activeTool}
                performanceMode={state.performanceMode}
                onHarvest={(plotId, e) => {
                  const c = plot.cropId ? GAME_ITEMS[plot.cropId] : null;
                  onHarvestPlot(plotId);
                  spawnParticle(`+2 ${c?.icon || '🌾'}`, e);
                  confetti({ particleCount: 15, spread: 45, origin: { y: 0.6 } });
                }}
                onPlant={(plotId, cropId, e) => {
                  const c = GAME_ITEMS[cropId];
                  onPlantPlot(plotId, cropId);
                  spawnParticle(`-1 ${c?.icon || '🌱'}`, e);
                }}
                onWaterPlot={(plotId, e) => {
                  if (onWaterPlot) {
                    onWaterPlot(plotId);
                    spawnParticle('💧 +Agua', e);
                  }
                }}
                onSpeedUp={onSpeedUpPlot}
                onSelectPlot={(plotId) => {
                  if (activeTool === 'water_can') {
                    if (onWaterPlot) onWaterPlot(plotId);
                  } else if (activeTool === 'sickle') {
                    // Harvest if ready
                    if (plot.readyAt && now >= plot.readyAt) {
                      onHarvestPlot(plotId);
                    }
                  } else {
                    setSeedSelectorPlotId(plotId);
                  }
                }}
              />
            );
          })}

          {/* LAYER 5.5: RUSTY'S WORKER BOTS (AUTÓMATAS AGRÍCOLAS) */}
          <IsometricRustyBots
            bots={state.bots}
            state={state}
            originX={0}
            originY={0}
            performanceMode={state.performanceMode}
            onOpenWorkshop={onOpenWorkshop || (() => {})}
          />

          {/* LAYER 6: ANIMAL PASTURES (CORRALES DE ANIMALES) */}
          {state.animalPens.map((pen) => {
            let gx = 8;
            let gy = 10;
            if (pen.type === 'cow') {
              gx = 11;
              gy = 10;
            } else if (pen.type === 'pig') {
              gx = 8;
              gy = 13;
            }

            return (
              <IsometricPasture
                key={pen.id}
                pen={pen}
                gx={gx}
                gy={gy}
                originX={0}
                originY={0}
                state={state}
                now={now}
                onFeedAnimal={(penId) => {
                  const feed = GAME_ITEMS[pen.feedItemId];
                  onFeedAnimal(penId);
                  soundManager.playAnimal(pen.type);
                }}
                onCollectAnimal={(penId) => {
                  const prod = GAME_ITEMS[pen.productItemId];
                  onCollectAnimal(penId);
                  confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 } });
                }}
                onSpeedUpAnimal={onSpeedUpAnimal}
              />
            );
          })}
        </g>
      </svg>

      {/* Floating Contextual Seed Selector Drawer */}
      {seedSelectorPlotId !== null && (
        <IsometricSeedSelector
          plotId={seedSelectorPlotId}
          state={state}
          onClose={() => setSeedSelectorPlotId(null)}
          onPlant={(plotId, cropId, e) => {
            const crop = GAME_ITEMS[cropId];
            onPlantPlot(plotId, cropId);
            spawnParticle(`-1 ${crop?.icon || '🌱'}`, e);
          }}
        />
      )}

      {/* Bottom Touch Dock & Tool Controls */}
      <IsometricDock
        state={state}
        activeTool={activeTool}
        onSelectTool={(tool) => setActiveTool(tool)}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onCenterFarm={centerCamera}
        onJumpToSector={handleJumpToSector}
        onBuyPlot={onBuyPlot}
        nextPlotCost={nextPlotCost}
        canAffordPlot={canAffordPlot}
        onOpenWorkshop={onOpenWorkshop}
        onWaterAll={onWaterAll}
        onHarvestAll={onHarvestAll}
        onTogglePerformanceMode={onTogglePerformanceMode}
      />
    </div>
  );
};
