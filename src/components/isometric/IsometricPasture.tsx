import React from 'react';
import { AnimalPen, FarmState } from '../../types/game';
import { GAME_ITEMS } from '../../data/gameData';
import { TILE_W, TILE_H, gridToScreen, getZIndex } from '../../utils/isometric';
import { Clock } from 'lucide-react';

interface IsometricPastureProps {
  pen: AnimalPen;
  gx: number;
  gy: number;
  originX: number;
  originY: number;
  state: FarmState;
  now: number;
  onFeedAnimal: (penId: string) => void;
  onCollectAnimal: (penId: string) => void;
  onSpeedUpAnimal: (penId: string) => void;
}

export const IsometricPasture: React.FC<IsometricPastureProps> = ({
  pen,
  gx,
  gy,
  originX,
  originY,
  state,
  now,
  onFeedAnimal,
  onCollectAnimal,
  onSpeedUpAnimal,
}) => {
  const { x: sx, y: sy } = gridToScreen(gx, gy, originX, originY);
  const zIndex = getZIndex(gx, gy, 4);

  const product = GAME_ITEMS[pen.productItemId];
  const feed = GAME_ITEMS[pen.feedItemId];
  const feedAvailable = state.inventory[pen.feedItemId] || 0;
  const isFed = pen.fedCount > 0;
  const isReady = isFed && pen.readyAt ? now >= pen.readyAt : false;
  const remainingSecs = pen.readyAt ? Math.max(0, Math.ceil((pen.readyAt - now) / 1000)) : 0;
  const isLocked = state.level < pen.levelRequired;

  const halfW = TILE_W;
  const halfH = TILE_H;

  return (
    <g
      id={`iso-pasture-${pen.id}`}
      style={{ zIndex }}
      className="group select-none"
    >
      {/* Pasture 2x2 Grass Base */}
      <polygon
        points={`${sx},${sy - halfH * 0.2} ${sx + halfW},${sy + halfH * 0.8} ${sx},${sy + halfH * 1.8} ${sx - halfW},${sy + halfH * 0.8}`}
        fill="#15803d"
        stroke="#14532d"
        strokeWidth="1.5"
      />

      {/* Inside Pasture Mud or Straw details */}
      {pen.type === 'pig' ? (
        <ellipse cx={sx} cy={sy + halfH * 0.8} rx="30" ry="15" fill="#78350f" opacity="0.65" />
      ) : pen.type === 'chicken' ? (
        <ellipse cx={sx} cy={sy + halfH * 0.8} rx="26" ry="14" fill="#ca8a04" opacity="0.45" />
      ) : (
        <ellipse cx={sx} cy={sy + halfH * 0.8} rx="28" ry="14" fill="#166534" opacity="0.5" />
      )}

      {/* Wooden Post-and-Rail Fence Posts and Rails in Isometric */}
      {/* Front-left fence */}
      <line
        x1={sx - halfW}
        y1={sy + halfH * 0.8}
        x2={sx}
        y2={sy + halfH * 1.8}
        stroke="#78350f"
        strokeWidth="2.5"
      />
      <line
        x1={sx - halfW}
        y1={sy + halfH * 0.8 - 6}
        x2={sx}
        y2={sy + halfH * 1.8 - 6}
        stroke="#92400e"
        strokeWidth="1.8"
      />
      {/* Front-right fence */}
      <line
        x1={sx}
        y1={sy + halfH * 1.8}
        x2={sx + halfW}
        y2={sy + halfH * 0.8}
        stroke="#78350f"
        strokeWidth="2.5"
      />
      <line
        x1={sx}
        y1={sy + halfH * 1.8 - 6}
        x2={sx + halfW}
        y2={sy + halfH * 0.8 - 6}
        stroke="#92400e"
        strokeWidth="1.8"
      />
      {/* Back fence rails */}
      <line
        x1={sx - halfW}
        y1={sy + halfH * 0.8}
        x2={sx}
        y2={sy - halfH * 0.2}
        stroke="#572a08"
        strokeWidth="1.5"
      />
      <line
        x1={sx}
        y1={sy - halfH * 0.2}
        x2={sx + halfW}
        y2={sy + halfH * 0.8}
        stroke="#572a08"
        strokeWidth="1.5"
      />

      {/* Wooden Fence Posts */}
      {[
        { px: sx - halfW, py: sy + halfH * 0.8 },
        { px: sx, py: sy + halfH * 1.8 },
        { px: sx + halfW, py: sy + halfH * 0.8 },
        { px: sx, py: sy - halfH * 0.2 },
        { px: sx - halfW * 0.5, py: sy + halfH * 1.3 },
        { px: sx + halfW * 0.5, py: sy + halfH * 1.3 },
      ].map((pt, idx) => (
        <line
          key={idx}
          x1={pt.px}
          y1={pt.py + 4}
          x2={pt.px}
          y2={pt.py - 12}
          stroke="#451a03"
          strokeWidth="3.5"
        />
      ))}

      {/* Water Trough */}
      <g transform={`translate(${sx + 24}, ${sy + halfH * 0.5})`}>
        <rect x="-10" y="-4" width="20" height="8" rx="2" fill="#78716c" stroke="#44403c" strokeWidth="1" />
        <rect x="-8" y="-2" width="16" height="4" rx="1" fill="#38bdf8" />
      </g>

      {/* Henhouse Shelter (if chicken coop) */}
      {pen.type === 'chicken' && (
        <g transform={`translate(${sx - 26}, ${sy + halfH * 0.3})`}>
          <polygon points="-14,4 0,10 14,4 14,-10 -14,-10" fill="#92400e" />
          <polygon points="-16,-10 0,-18 16,-10 0,-4" fill="#b91c1c" />
          <rect x="-4" y="-2" width="8" height="8" fill="#1c1917" />
        </g>
      )}

      {/* Animal Sprites Inside Pasture */}
      <g transform={`translate(${sx}, ${sy + halfH * 0.8})`}>
        {pen.type === 'chicken' && (
          <g>
            <text x="-12" y="-4" fontSize="18" className={isFed ? 'animate-bounce' : ''}>
              🐔
            </text>
            <text x="8" y="2" fontSize="14" className="animate-pulse">
              🐥
            </text>
            <text x="2" y="-12" fontSize="16">
              🐓
            </text>
          </g>
        )}

        {pen.type === 'cow' && (
          <g>
            <text x="-18" y="-2" fontSize="24" className={isFed ? 'animate-gentle-bob' : ''}>
              🐄
            </text>
            <text x="8" y="4" fontSize="22">
              🐮
            </text>
          </g>
        )}

        {pen.type === 'pig' && (
          <g>
            <text x="-14" y="0" fontSize="22" className={isFed ? 'animate-float-pulse' : ''}>
              🐖
            </text>
            <text x="10" y="-4" fontSize="20">
              🐷
            </text>
          </g>
        )}
      </g>

      {/* Pasture Floating Interactive Controls (Touch-Optimized) */}
      <g transform={`translate(${sx}, ${sy + halfH * 1.8 + 8})`}>
        {isLocked ? (
          <g transform="translate(0, -6)">
            <rect x="-44" y="-9" width="88" height="18" rx="9" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
            <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#cbd5e1">
              🔒 Nivel {pen.levelRequired}
            </text>
          </g>
        ) : isReady ? (
          /* Ready to Harvest Product Button */
          <g
            transform="translate(0, -8)"
            className="cursor-pointer hover:scale-105 transition"
            onClick={(e) => {
              e.stopPropagation();
              onCollectAnimal(pen.id);
            }}
          >
            <rect
              x="-60"
              y="-12"
              width="120"
              height="24"
              rx="12"
              fill="#eab308"
              stroke="#fef08a"
              strokeWidth="2"
              className="filter drop-shadow animate-bounce"
            />
            <text
              y="5"
              textAnchor="middle"
              fontSize="10"
              fontWeight="900"
              fill="#422006"
            >
              {product?.icon} ¡RECOLECTAR {pen.productYield}!
            </text>
          </g>
        ) : isFed ? (
          /* Feeding Countdown Timer & Speed Up Button */
          <g transform="translate(0, -8)">
            <rect
              x="-54"
              y="-10"
              width="108"
              height="20"
              rx="10"
              fill="#1c1917"
              stroke="#78350f"
              strokeWidth="1.2"
              className="filter drop-shadow"
            />
            <text
              x="-8"
              y="4"
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#fef08a"
            >
              ⏳ {remainingSecs}s ({product?.name})
            </text>
            {/* Speedup button */}
            <g
              transform="translate(40, 0)"
              className="cursor-pointer hover:scale-125 transition"
              onClick={(e) => {
                e.stopPropagation();
                onSpeedUpAnimal(pen.id);
              }}
            >
              <circle r="7" fill="#059669" stroke="#34d399" strokeWidth="1" />
              <text textAnchor="middle" y="3" fontSize="8" fill="#ffffff" fontWeight="bold">
                ⚡
              </text>
            </g>
          </g>
        ) : (
          /* Feed Animal Button */
          <g
            transform="translate(0, -8)"
            className="cursor-pointer hover:scale-105 transition"
            onClick={(e) => {
              e.stopPropagation();
              onFeedAnimal(pen.id);
            }}
          >
            <rect
              x="-56"
              y="-11"
              width="112"
              height="22"
              rx="11"
              fill={feedAvailable >= pen.count ? '#d97706' : '#44403c'}
              stroke={feedAvailable >= pen.count ? '#fef3c7' : '#78716c'}
              strokeWidth="1.5"
              className="filter drop-shadow"
            />
            <text
              y="4"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="900"
              fill="#ffffff"
            >
              {feed?.icon} Alimentar ({feedAvailable})
            </text>
          </g>
        )}
      </g>
    </g>
  );
};
