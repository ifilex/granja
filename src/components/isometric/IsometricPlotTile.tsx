import React from 'react';
import { CropPlot, GameItem } from '../../types/game';
import { GAME_ITEMS } from '../../data/gameData';
import { TILE_W, TILE_H, gridToScreen, getZIndex } from '../../utils/isometric';
import { Clock, Zap } from 'lucide-react';

interface IsometricPlotTileProps {
  plot: CropPlot;
  gx: number;
  gy: number;
  originX: number;
  originY: number;
  now: number;
  activeTool: string | null;
  performanceMode?: 'potato' | 'standard' | '3d';
  onHarvest: (plotId: number, e: React.MouseEvent | React.TouchEvent) => void;
  onPlant: (plotId: number, cropId: string, e: React.MouseEvent | React.TouchEvent) => void;
  onWaterPlot?: (plotId: number, e: React.MouseEvent | React.TouchEvent) => void;
  onSpeedUp: (plotId: number) => void;
  onSelectPlot: (plotId: number) => void;
}

export const IsometricPlotTile: React.FC<IsometricPlotTileProps> = ({
  plot,
  gx,
  gy,
  originX,
  originY,
  now,
  activeTool,
  performanceMode = 'potato',
  onHarvest,
  onPlant,
  onWaterPlot,
  onSpeedUp,
  onSelectPlot,
}) => {
  const { x: sx, y: sy } = gridToScreen(gx, gy, originX, originY);
  const zIndex = getZIndex(gx, gy, 2);

  const crop = plot.cropId ? GAME_ITEMS[plot.cropId] : null;
  const isReady = plot.readyAt ? now >= plot.readyAt : false;
  const totalDuration = crop?.growthTimeSeconds ? crop.growthTimeSeconds * 1000 : 15000;
  const elapsed = plot.plantedAt ? now - plot.plantedAt : 0;
  const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  const remainingSecs = plot.readyAt ? Math.max(0, Math.ceil((plot.readyAt - now) / 1000)) : 0;

  const halfW = TILE_W / 2;
  const halfH = TILE_H / 2;

  // Diamond points relative to sx, sy
  const topX = sx;
  const topY = sy;
  const rightX = sx + halfW;
  const rightY = sy + halfH;
  const bottomX = sx;
  const bottomY = sy + TILE_H;
  const leftX = sx - halfW;
  const leftY = sy + halfH;

  const slabHeight = 8;
  const isPotato = performanceMode === 'potato';

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // 1. If holding Watering Can, water the plot!
    if (activeTool === 'water_can') {
      if (onWaterPlot) {
        onWaterPlot(plot.id, e);
      }
      return;
    }

    // 2. If plot is empty
    if (!plot.cropId) {
      if (activeTool && ['wheat', 'corn', 'carrot', 'sugarcane', 'strawberry', 'pumpkin'].includes(activeTool)) {
        onPlant(plot.id, activeTool, e);
      } else {
        onSelectPlot(plot.id);
      }
    } else if (isReady) {
      // 3. Harvest if ready
      onHarvest(plot.id, e);
    } else if (activeTool === 'sickle') {
      // Trying to harvest early
      onSelectPlot(plot.id);
    } else {
      // Plot is growing, clicking can water if dry or show details
      if (!plot.isWatered && onWaterPlot) {
        onWaterPlot(plot.id, e);
      } else {
        onSelectPlot(plot.id);
      }
    }
  };

  return (
    <g
      id={`iso-plot-${plot.id}`}
      style={{ zIndex, cursor: 'pointer' }}
      onClick={handleClick}
      className="transition-transform group select-none"
    >
      {/* 3D Depth Slab (Soil cut depth) */}
      <polygon
        points={`${leftX},${leftY} ${bottomX},${bottomY} ${bottomX},${bottomY + slabHeight} ${leftX},${leftY + slabHeight}`}
        fill="#3d2110"
      />
      <polygon
        points={`${bottomX},${bottomY} ${rightX},${rightY} ${rightX},${rightY + slabHeight} ${bottomX},${bottomY + slabHeight}`}
        fill="#291407"
      />

      {/* Main Top Diamond (Soil Surface: moist dark loam when watered, warm earthy when dry) */}
      <polygon
        points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
        fill={
          !plot.cropId
            ? plot.isWatered
              ? '#3b2210'
              : '#5a341a'
            : isReady
            ? '#6e3c1a'
            : plot.isWatered
            ? '#2d180b'
            : '#472713'
        }
        stroke={isReady ? '#facc15' : plot.isWatered ? '#38bdf8' : '#854d0e'}
        strokeWidth={isReady ? 2.5 : plot.isWatered ? 1.8 : 1.2}
      />

      {/* Tilled Earth Furrow Lines (Stardew style furrows) */}
      <line
        x1={sx - halfW * 0.5}
        y1={sy + halfH * 0.75}
        x2={sx + halfW * 0.5}
        y2={sy + halfH * 1.25}
        stroke={plot.isWatered ? '#1c0f07' : '#331a0a'}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.75"
      />
      <line
        x1={sx - halfW * 0.25}
        y1={sy + halfH * 0.35}
        x2={sx + halfW * 0.75}
        y2={sy + halfH * 0.85}
        stroke={plot.isWatered ? '#1c0f07' : '#331a0a'}
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.75"
      />

      {/* Watered Moisture Sheen & Dew Droplets */}
      {plot.isWatered && (
        <g>
          <polygon
            points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
            fill="#38bdf8"
            opacity="0.14"
          />
          {/* Subtle water droplets on ground */}
          <circle cx={sx - 14} cy={sy + halfH - 2} r="2" fill="#7dd3fc" opacity="0.8" />
          <circle cx={sx + 16} cy={sy + halfH + 4} r="1.8" fill="#bae6fd" opacity="0.8" />
          <circle cx={sx + 2} cy={sy + halfH + 12} r="1.5" fill="#38bdf8" opacity="0.7" />
        </g>
      )}

      {/* Plot Contents & Detailed Growth Stages (Rusty's Retirement & Stardew Valley aesthetic) */}
      {!plot.cropId ? (
        /* Empty Plot with Sembrar indicator */
        <g transform={`translate(${sx}, ${sy + halfH - 2})`}>
          <circle r="12" fill="#78350f" opacity="0.85" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="13"
            className="pointer-events-none"
          >
            🌱
          </text>
          <text
            y="18"
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#fef3c7"
            className="pointer-events-none"
          >
            #{plot.id + 1}
          </text>
        </g>
      ) : isReady ? (
        /* Ready Crop Stage with Rich Rusty & Stardew Harvest Presentation */
        <g transform={`translate(${sx}, ${sy + halfH - 10})`}>
          {/* Golden harvest aura */}
          <circle r="24" fill="#fde047" opacity="0.4" className={isPotato ? '' : 'animate-pulse'} />

          {/* Cluster of crops in isometric view */}
          <g className={isPotato ? '' : 'animate-bounce'} style={{ transformOrigin: 'center' }}>
            <text x="-12" y="-2" fontSize="22" className="pointer-events-none">
              {crop?.icon}
            </text>
            <text x="0" y="-8" fontSize="26" className="pointer-events-none">
              {crop?.icon}
            </text>
            <text x="10" y="-3" fontSize="22" className="pointer-events-none">
              {crop?.icon}
            </text>
          </g>

          {/* Sparkles / Little butterfly hovering if not potato */}
          {!isPotato && (
            <text x="16" y="-18" fontSize="12" className="animate-spin pointer-events-none">
              ✨
            </text>
          )}

          {/* Floating Harvest Badge */}
          <g transform="translate(0, 18)">
            <rect
              x="-36"
              y="-9"
              width="72"
              height="18"
              rx="9"
              fill="#fef08a"
              stroke="#ca8a04"
              strokeWidth="1.5"
            />
            <text
              y="3.5"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="900"
              fill="#713f12"
              className="pointer-events-none"
            >
              ¡COSECHAR!
            </text>
          </g>
        </g>
      ) : (
        /* Growing Crop Stage - Detailed 4-stage visual growth */
        <g transform={`translate(${sx}, ${sy + halfH - 6})`}>
          {/* Stage 1: Sprout (0-25%) */}
          {progress < 25 ? (
            <g>
              {/* Seedling twin leaves in soil */}
              <circle cx="0" cy="2" r="3" fill="#15803d" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="14" className="pointer-events-none">
                🌱
              </text>
            </g>
          ) : progress < 55 ? (
            /* Stage 2: Growing Bush (25-55%) */
            <g>
              <text textAnchor="middle" dominantBaseline="central" fontSize="18" className="pointer-events-none">
                🌿
              </text>
            </g>
          ) : progress < 85 ? (
            /* Stage 3: Blooming Plant with Buds (55-85%) */
            <g>
              <text textAnchor="middle" dominantBaseline="central" fontSize="20" className="pointer-events-none">
                {crop?.id === 'wheat' ? '🌾' : crop?.id === 'carrot' ? '🥕' : '🪴'}
              </text>
              <circle cx="-6" cy="-8" r="2" fill="#facc15" />
            </g>
          ) : (
            /* Stage 4: Almost Mature Crop (85-99%) */
            <g>
              <text textAnchor="middle" dominantBaseline="central" fontSize="22" className="pointer-events-none">
                {crop?.icon}
              </text>
            </g>
          )}

          {/* Thirsty icon prompt if not watered */}
          {!plot.isWatered && (
            <g
              transform="translate(18, -14)"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onWaterPlot) onWaterPlot(plot.id, e);
              }}
            >
              <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
              <text textAnchor="middle" y="3" fontSize="9" fill="#ffffff">
                💧
              </text>
            </g>
          )}

          {/* Progress bar container */}
          <g transform="translate(-24, 12)">
            <rect
              x="0"
              y="0"
              width="48"
              height="5"
              rx="2.5"
              fill="#1c1917"
              stroke="#78350f"
              strokeWidth="0.8"
            />
            <rect
              x="0.5"
              y="0.5"
              width={Math.max(2, (47 * progress) / 100)}
              height="4"
              rx="2"
              fill={plot.isWatered ? '#38bdf8' : '#22c55e'}
            />
          </g>

          {/* Countdown & Speedup Badge */}
          <g transform="translate(0, 25)">
            <rect
              x="-24"
              y="-7"
              width="48"
              height="14"
              rx="7"
              fill="#292524"
              stroke="#57534e"
              strokeWidth="1"
            />
            <text
              x="-4"
              y="3"
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill={plot.isWatered ? '#7dd3fc' : '#fde047'}
            >
              {remainingSecs}s {plot.isWatered ? '💧' : ''}
            </text>
            {/* Speedup button */}
            <g
              transform="translate(14, 0)"
              className="cursor-pointer hover:scale-125 transition"
              onClick={(ev) => {
                ev.stopPropagation();
                onSpeedUp(plot.id);
              }}
            >
              <circle r="5" fill="#059669" />
              <text textAnchor="middle" y="2" fontSize="6.5" fill="#ffffff" fontWeight="bold">
                ⚡
              </text>
            </g>
          </g>
        </g>
      )}

      {/* Parcela border highlight on hover */}
      <polygon
        points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
        fill="transparent"
        stroke="#ffffff"
        strokeWidth="2"
        strokeOpacity="0"
        className="group-hover:stroke-opacity-60 transition"
      />
    </g>
  );
};
