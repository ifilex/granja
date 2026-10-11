import React from 'react';
import { ProductionBuilding, FarmState } from '../../types/game';
import { GAME_ITEMS } from '../../data/gameData';
import { TILE_W, TILE_H, gridToScreen, getZIndex } from '../../utils/isometric';

interface IsometricBuildingTileProps {
  type: 'barn' | 'silo' | 'feed_mill' | 'bakery' | 'dairy' | 'sugar_mill';
  gx: number;
  gy: number;
  originX: number;
  originY: number;
  state: FarmState;
  building?: ProductionBuilding;
  onOpenBuilding?: (buildingId: string) => void;
  onOpenSilo?: () => void;
  onOpenBarn?: () => void;
}

export const IsometricBuildingTile: React.FC<IsometricBuildingTileProps> = ({
  type,
  gx,
  gy,
  originX,
  originY,
  state,
  building,
  onOpenBuilding,
  onOpenSilo,
  onOpenBarn,
}) => {
  const { x: sx, y: sy } = gridToScreen(gx, gy, originX, originY);
  const zIndex = getZIndex(gx, gy, 5);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'silo' && onOpenSilo) {
      onOpenSilo();
    } else if (type === 'barn' && onOpenBarn) {
      onOpenBarn();
    } else if (building && onOpenBuilding) {
      onOpenBuilding(building.id);
    }
  };

  const isLocked = building ? state.level < building.levelRequired : false;
  const hasFinished = building ? building.queue.some((q) => q.finished) : false;
  const isWorking = building ? building.queue.length > 0 : false;

  return (
    <g
      id={`iso-building-${type}`}
      style={{ zIndex, cursor: 'pointer' }}
      onClick={handleClick}
      className="group select-none"
    >
      {/* Ground Shadow Polygon */}
      <ellipse
        cx={sx}
        cy={sy + TILE_H * 0.8}
        rx={TILE_W * 0.65}
        ry={TILE_H * 0.45}
        fill="#0f172a"
        opacity="0.35"
      />

      {/* --- 1. GRANERO CENTRAL (BARN) --- */}
      {type === 'barn' && (
        <g transform={`translate(${sx}, ${sy})`}>
          {/* Base foundation */}
          <polygon
            points={`0,${TILE_H * 0.2} 48,${TILE_H * 0.6} 0,${TILE_H} -48,${TILE_H * 0.6}`}
            fill="#713f12"
          />

          {/* Barn Left Wall (Darker shade) */}
          <polygon
            points={`-48,${TILE_H * 0.6} 0,${TILE_H} 0,${-30} -48,${-54}`}
            fill="#991b1b"
            stroke="#7f1d1d"
            strokeWidth="1"
          />
          {/* Barn Right Wall (Light shade) */}
          <polygon
            points={`0,${TILE_H} 48,${TILE_H * 0.6} 48,${-54} 0,${-30}`}
            fill="#b91c1c"
            stroke="#991b1b"
            strokeWidth="1"
          />

          {/* White corner trims */}
          <line x1="0" y1={TILE_H} x2="0" y2="-30" stroke="#f8fafc" strokeWidth="3" />
          <line x1="-48" y1={TILE_H * 0.6} x2="-48" y2="-54" stroke="#f8fafc" strokeWidth="3" />
          <line x1="48" y1={TILE_H * 0.6} x2="48" y2="-54" stroke="#f8fafc" strokeWidth="3" />

          {/* Double wooden barn doors */}
          <polygon
            points={`-12,${TILE_H * 0.85} 12,${TILE_H * 0.85} 12,${TILE_H * 0.25} -12,${TILE_H * 0.25}`}
            fill="#451a03"
            stroke="#78350f"
            strokeWidth="1.5"
          />
          {/* Barn Door X braces */}
          <line x1="-12" y1={TILE_H * 0.85} x2="0" y2={TILE_H * 0.25} stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          <line x1="0" y1={TILE_H * 0.85} x2="-12" y2={TILE_H * 0.25} stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          <line x1="0" y1={TILE_H * 0.85} x2="12" y2={TILE_H * 0.25} stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          <line x1="12" y1={TILE_H * 0.85} x2="0" y2={TILE_H * 0.25} stroke="#ffffff" strokeWidth="1" opacity="0.6" />

          {/* Gambrel Roof (Left facet) */}
          <polygon
            points={`-52,${-54} 0,${-30} 0,${-80} -28,${-92}`}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          {/* Gambrel Roof (Right facet) */}
          <polygon
            points={`0,${-30} 52,${-54} 28,${-92} 0,${-80}`}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* Hayloft door with hanging hay */}
          <polygon
            points={`-8,${-40} 8,${-40} 8,${-60} -8,${-60}`}
            fill="#1e293b"
          />
          <text x="0" y="-45" textAnchor="middle" fontSize="12">
            🌾
          </text>

          {/* Roof Cupola & Weather Vane */}
          <rect x="-6" y="-102" width="12" height="12" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          <line x1="0" y1="-102" x2="0" y2="-112" stroke="#475569" strokeWidth="1.5" />
          <text x="0" y="-112" textAnchor="middle" fontSize="10">
            🐓
          </text>

          {/* Building Title & Capacity Badge */}
          <g transform="translate(0, -125)">
            <rect
              x="-48"
              y="-10"
              width="96"
              height="20"
              rx="10"
              fill="#7f1d1d"
              stroke="#fca5a5"
              strokeWidth="1.5"
              className="filter drop-shadow"
            />
            <text
              y="4"
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill="#ffffff"
            >
              📦 Granero {state.barnUsed}/{state.barnCapacity}
            </text>
          </g>
        </g>
      )}

      {/* --- 2. SILO DE GRANOS (GRAIN SILO) --- */}
      {type === 'silo' && (
        <g transform={`translate(${sx}, ${sy})`}>
          {/* Silo Cylinder Base */}
          <polygon
            points={`-28,${TILE_H * 0.4} 0,${TILE_H * 0.75} 28,${TILE_H * 0.4} 28,${-55} -28,${-55}`}
            fill="#94a3b8"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Cylinder Light Reflection */}
          <rect x="-10" y="-55" width="14" height={TILE_H * 0.6 + 55} fill="#f1f5f9" opacity="0.3" />

          {/* Corrugation Rings */}
          <path d={`M -28,${-35} Q 0,${-22} 28,${-35}`} fill="none" stroke="#475569" strokeWidth="1.2" />
          <path d={`M -28,${-15} Q 0,${-2} 28,${-15}`} fill="none" stroke="#475569" strokeWidth="1.2" />
          <path d={`M -28,${5} Q 0,${18} 28,${5}`} fill="none" stroke="#475569" strokeWidth="1.2" />
          <path d={`M -28,${25} Q 0,${38} 28,${25}`} fill="none" stroke="#475569" strokeWidth="1.2" />

          {/* Inspection Ladder */}
          <line x1="18" y1="32" x2="18" y2="-55" stroke="#334155" strokeWidth="2" />
          <line x1="24" y1="30" x2="24" y2="-55" stroke="#334155" strokeWidth="2" />
          {[-45, -30, -15, 0, 15].map((ly) => (
            <line key={ly} x1="18" y1={ly} x2="24" y2={ly} stroke="#334155" strokeWidth="1" />
          ))}

          {/* Conical Metallic Cap */}
          <polygon
            points={`-32,${-55} 32,${-55} 0,${-90}`}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          {/* Vent Spire */}
          <line x1="0" y1="-90" x2="0" y2="-98" stroke="#cbd5e1" strokeWidth="2" />

          {/* Silo Title & Capacity Badge */}
          <g transform="translate(0, -108)">
            <rect
              x="-46"
              y="-10"
              width="92"
              height="20"
              rx="10"
              fill="#ca8a04"
              stroke="#fef08a"
              strokeWidth="1.5"
              className="filter drop-shadow"
            />
            <text
              y="4"
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill="#422006"
            >
              🌾 Silo {state.siloUsed}/{state.siloCapacity}
            </text>
          </g>
        </g>
      )}

      {/* --- 3. MOLINO DE PIENSO / WINDMILL (FEED MILL) --- */}
      {type === 'feed_mill' && (
        <g transform={`translate(${sx}, ${sy})`}>
          {/* Stone Tower Base */}
          <polygon
            points={`-26,${TILE_H * 0.5} 0,${TILE_H * 0.75} 26,${TILE_H * 0.5} 18,${-45} -18,${-45}`}
            fill="#78716c"
            stroke="#57534e"
            strokeWidth="1.2"
          />
          {/* Wooden door & grain chute */}
          <polygon
            points={`-8,${TILE_H * 0.65} 8,${TILE_H * 0.65} 8,${TILE_H * 0.3} -8,${TILE_H * 0.3}`}
            fill="#44403c"
          />
          {/* Sacks on ground */}
          <circle cx="20" cy={TILE_H * 0.6} r="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          <circle cx="26" cy={TILE_H * 0.65} r="5" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />

          {/* Conical Roof */}
          <polygon
            points={`-22,${-45} 22,${-45} 0,${-75}`}
            fill="#b45309"
            stroke="#92400e"
            strokeWidth="1.2"
          />

          {/* 4-Blade Rotating Windmill Sails (CSS Animated rotation) */}
          <g
            transform="translate(0, -45)"
            className={isWorking ? 'animate-spin' : ''}
            style={{ animationDuration: '6s', transformOrigin: '0px 0px' }}
          >
            {/* Center axle hub */}
            <circle cx="0" cy="0" r="5" fill="#451a03" />

            {/* Top Blade */}
            <line x1="0" y1="0" x2="0" y2="-42" stroke="#78350f" strokeWidth="2.5" />
            <rect x="2" y="-38" width="12" height="34" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" opacity="0.85" />

            {/* Bottom Blade */}
            <line x1="0" y1="0" x2="0" y2="42" stroke="#78350f" strokeWidth="2.5" />
            <rect x="-14" y="4" width="12" height="34" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" opacity="0.85" />

            {/* Right Blade */}
            <line x1="0" y1="0" x2="42" y2="0" stroke="#78350f" strokeWidth="2.5" />
            <rect x="4" y="2" width="34" height="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" opacity="0.85" />

            {/* Left Blade */}
            <line x1="0" y1="0" x2="-42" y2="0" stroke="#78350f" strokeWidth="2.5" />
            <rect x="-38" y="-14" width="34" height="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" opacity="0.85" />
          </g>

          {/* Title / Status Badge */}
          <g transform="translate(0, -96)">
            <rect
              x="-48"
              y="-10"
              width="96"
              height="20"
              rx="10"
              fill="#854d0e"
              stroke="#fef08a"
              strokeWidth="1.5"
              className="filter drop-shadow"
            />
            <text y="4" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff">
              {hasFinished ? '⭐ ¡Pienso Listo!' : '🌾 Molino de Pienso'}
            </text>
          </g>
        </g>
      )}

      {/* --- 4. PANADERÍA (BAKERY) --- */}
      {type === 'bakery' && (
        <g transform={`translate(${sx}, ${sy})`}>
          {/* Main Stone Cottage Walls */}
          <polygon
            points={`-36,${TILE_H * 0.5} 0,${TILE_H * 0.8} 0,${-30} -36,${-48}`}
            fill="#d6d3d1"
            stroke="#a8a29e"
            strokeWidth="1"
          />
          <polygon
            points={`0,${TILE_H * 0.8} 36,${TILE_H * 0.5} 36,${-48} 0,${-30}`}
            fill="#e7e5e4"
            stroke="#d6d3d1"
            strokeWidth="1"
          />

          {/* Timber Frame Beams */}
          <line x1="-18" y1={TILE_H * 0.65} x2="-18" y2="-39" stroke="#78350f" strokeWidth="2" />
          <line x1="18" y1={TILE_H * 0.65} x2="18" y2="-39" stroke="#78350f" strokeWidth="2" />
          <line x1="0" y1={TILE_H * 0.8} x2="0" y2="-30" stroke="#78350f" strokeWidth="2.5" />

          {/* Shop Window with Warm Glow & Bread Loaf */}
          <polygon
            points={`-26,${TILE_H * 0.6} -6,${TILE_H * 0.72} -6,${-10} -26,${-22}`}
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          <text x="-16" y="-5" textAnchor="middle" fontSize="12">
            🍞
          </text>

          {/* Terracotta Shingle Roof */}
          <polygon
            points={`-42,${-48} 0,${-30} 0,${-72} -22,${-82}`}
            fill="#c2410c"
            stroke="#9a3412"
            strokeWidth="1"
          />
          <polygon
            points={`0,${-30} 42,${-48} 22,${-82} 0,${-72}`}
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="1"
          />

          {/* Stone Chimney with Smoke */}
          <polygon points="18,-65 28,-60 28,-90 18,-95" fill="#78716c" stroke="#44403c" strokeWidth="1" />
          {/* Animated smoke puffs */}
          <g className="animate-float-pulse">
            <circle cx="23" cy="-102" r="4" fill="#f8fafc" opacity="0.75" />
            <circle cx="26" cy="-112" r="6" fill="#f8fafc" opacity="0.5" />
            <circle cx="30" cy="-124" r="8" fill="#f8fafc" opacity="0.3" />
          </g>

          {/* Title / Queue Badge */}
          <g transform="translate(0, -96)">
            <rect
              x="-48"
              y="-10"
              width="96"
              height="20"
              rx="10"
              fill="#c2410c"
              stroke="#ffedd5"
              strokeWidth="1.5"
              className="filter drop-shadow"
            />
            <text y="4" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff">
              {hasFinished ? '⭐ ¡Panes Listos!' : isWorking ? '🔥 Horneando...' : '🥖 Panadería'}
            </text>
          </g>
        </g>
      )}

      {/* --- 5. LECHERÍA (DAIRY) --- */}
      {type === 'dairy' && (
        <g transform={`translate(${sx}, ${sy})`}>
          {/* Blue Alpine Dairy Walls */}
          <polygon
            points={`-34,${TILE_H * 0.5} 0,${TILE_H * 0.78} 0,${-28} -34,${-45}`}
            fill="#e0f2fe"
            stroke="#bae6fd"
            strokeWidth="1"
          />
          <polygon
            points={`0,${TILE_H * 0.78} 34,${TILE_H * 0.5} 34,${-45} 0,${-28}`}
            fill="#f0f9ff"
            stroke="#e0f2fe"
            strokeWidth="1"
          />

          {/* Blue Tiled Roof */}
          <polygon
            points={`-38,${-45} 0,${-28} 0,${-70} -20,${-80}`}
            fill="#0369a1"
            stroke="#075985"
            strokeWidth="1"
          />
          <polygon
            points={`0,${-28} 38,${-45} 20,${-80} 0,${-70}`}
            fill="#0284c7"
            stroke="#0369a1"
            strokeWidth="1"
          />

          {/* Giant Milk Bottle Sign */}
          <g transform="translate(0, -40)">
            <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontSize="16">
              🥛
            </text>
          </g>

          {/* Milk Cans on Porch */}
          <rect x="-24" y={TILE_H * 0.45} width="8" height="12" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
          <rect x="-14" y={TILE_H * 0.52} width="8" height="12" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

          {/* Title / Badge */}
          <g transform="translate(0, -96)">
            <rect
              x="-46"
              y="-10"
              width="92"
              height="20"
              rx="10"
              fill="#0369a1"
              stroke="#bae6fd"
              strokeWidth="1.5"
              className="filter drop-shadow"
            />
            <text y="4" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff">
              {hasFinished ? '⭐ ¡Lácteos Listos!' : isLocked ? '🔒 Nivel 2' : '🧈 Lechería'}
            </text>
          </g>
        </g>
      )}

      {/* --- 6. TRAPICHE DE AZÚCAR (SUGAR MILL) --- */}
      {type === 'sugar_mill' && (
        <g transform={`translate(${sx}, ${sy})`}>
          {/* Timber Frame Shed */}
          <polygon
            points={`-32,${TILE_H * 0.5} 0,${TILE_H * 0.75} 0,${-25} -32,${-42}`}
            fill="#854d0e"
            stroke="#713f12"
            strokeWidth="1"
          />
          <polygon
            points={`0,${TILE_H * 0.75} 32,${TILE_H * 0.5} 32,${-42} 0,${-25}`}
            fill="#a16207"
            stroke="#854d0e"
            strokeWidth="1"
          />

          {/* Reed Thatched Roof */}
          <polygon
            points={`-36,${-42} 0,${-25} 0,${-65} -18,${-75}`}
            fill="#ca8a04"
            stroke="#a16207"
            strokeWidth="1"
          />
          <polygon
            points={`0,${-25} 36,${-42} 18,${-75} 0,${-65}`}
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth="1"
          />

          {/* Sugarcane Stalks */}
          <text x="-16" y={TILE_H * 0.5} fontSize="14">
            🎋
          </text>
          <text x="12" y={TILE_H * 0.55} fontSize="14">
            🎋
          </text>

          {/* Title / Badge */}
          <g transform="translate(0, -90)">
            <rect
              x="-48"
              y="-10"
              width="96"
              height="20"
              rx="10"
              fill="#713f12"
              stroke="#fde047"
              strokeWidth="1.5"
              className="filter drop-shadow"
            />
            <text y="4" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff">
              {hasFinished ? '⭐ ¡Azúcar Lista!' : isLocked ? '🔒 Nivel 4' : '🍬 Trapiche'}
            </text>
          </g>
        </g>
      )}

      {/* Hover Selection Ring */}
      <ellipse
        cx={sx}
        cy={sy + TILE_H * 0.7}
        rx={TILE_W * 0.55}
        ry={TILE_H * 0.35}
        fill="transparent"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeOpacity="0"
        className="group-hover:stroke-opacity-75 transition"
      />
    </g>
  );
};
