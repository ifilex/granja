import React from 'react';
import { FarmBot, FarmState } from '../../types/game';
import { gridToScreen, getZIndex } from '../../utils/isometric';

interface IsometricRustyBotsProps {
  bots: FarmBot[];
  state: FarmState;
  originX: number;
  originY: number;
  performanceMode?: 'potato' | 'standard' | '3d';
  onOpenWorkshop: () => void;
}

export const IsometricRustyBots: React.FC<IsometricRustyBotsProps> = ({
  bots,
  state,
  originX,
  originY,
  performanceMode = 'potato',
  onOpenWorkshop,
}) => {
  const isPotato = performanceMode === 'potato';

  return (
    <g id="rusty-bots-layer">
      {bots.map((bot, index) => {
        if (!bot.unlocked) return null;

        // Base coordinate with slight offset for each bot so they don't overlap exactly
        const baseGx = bot.gx + (index % 2 === 0 ? 0.3 : -0.3);
        const baseGy = bot.gy + (index > 1 ? 0.4 : -0.2);
        const { x: sx, y: sy } = gridToScreen(baseGx, baseGy, originX, originY);
        const zIndex = getZIndex(Math.floor(baseGx), Math.floor(baseGy), 8);

        return (
          <g
            key={bot.id}
            id={`bot-${bot.id}`}
            transform={`translate(${sx}, ${sy})`}
            style={{ zIndex, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenWorkshop();
            }}
            className="group select-none"
          >
            {/* Shadow under robot */}
            <ellipse cx="0" cy="10" rx="14" ry="7" fill="#1c1917" opacity="0.45" />

            {/* Robot Tracks / Wheels */}
            <g transform="translate(0, 5)">
              <rect x="-12" y="0" width="6" height="7" rx="3" fill="#292524" stroke="#44403c" strokeWidth="0.8" />
              <rect x="6" y="0" width="6" height="7" rx="3" fill="#292524" stroke="#44403c" strokeWidth="0.8" />
              {/* Treads connecting */}
              <line x1="-10" y1="5" x2="-8" y2="5" stroke="#78716c" strokeWidth="1" />
              <line x1="8" y1="5" x2="10" y2="5" stroke="#78716c" strokeWidth="1" />
            </g>

            {/* Robot Body Chassis */}
            <rect
              x="-11"
              y="-10"
              width="22"
              height="16"
              rx="4"
              fill={bot.color}
              stroke="#1c1917"
              strokeWidth="1.2"
              className={isPotato ? '' : 'transition-transform group-hover:scale-105'}
            />

            {/* Screen Face / Visor */}
            <rect x="-8" y="-7" width="16" height="8" rx="2" fill="#0f172a" />
            {/* LED Glowing Eyes */}
            <circle cx="-3.5" cy="-3" r="1.5" fill="#38bdf8" className={isPotato ? '' : 'animate-pulse'} />
            <circle cx="3.5" cy="-3" r="1.5" fill="#38bdf8" className={isPotato ? '' : 'animate-pulse'} />

            {/* Antenna with status light */}
            <line x1="0" y1="-10" x2="0" y2="-17" stroke="#57534e" strokeWidth="1.5" />
            <circle
              cx="0"
              cy="-18"
              r="2.5"
              fill={bot.status === 'working' ? '#22c55e' : '#facc15'}
              stroke="#0f172a"
              strokeWidth="0.5"
            />

            {/* Specialized Robot Attachment */}
            {bot.type === 'rusty' && (
              // Rusty's little straw hat or copper badge
              <g transform="translate(0, -11)">
                <ellipse cx="0" cy="0" rx="9" ry="2.5" fill="#d97706" />
                <rect x="-4" y="-3.5" width="8" height="3" rx="1.5" fill="#b45309" />
              </g>
            )}

            {bot.type === 'water_bot' && (
              // Water canister on side
              <g transform="translate(10, -8)">
                <rect x="0" y="0" width="5" height="9" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
                <line x1="2" y1="9" x2="5" y2="13" stroke="#0284c7" strokeWidth="1.5" />
              </g>
            )}

            {bot.type === 'harvest_bot' && (
              // Clipper arm
              <g transform="translate(-13, -4)">
                <line x1="0" y1="0" x2="-4" y2="5" stroke="#15803d" strokeWidth="2" />
                <circle cx="-5" cy="6" r="2" fill="#eab308" />
              </g>
            )}

            {bot.type === 'biofuel_bot' && (
              // Battery meter
              <g transform="translate(-9, 0)">
                <rect x="-3" y="-5" width="4" height="8" rx="1" fill="#7e22ce" />
              </g>
            )}

            {/* Cute Speech Bubble / Task Tooltip */}
            <g transform="translate(0, -28)">
              <rect
                x="-32"
                y="-8"
                width="64"
                height="15"
                rx="7.5"
                fill="#18181b"
                stroke={bot.color}
                strokeWidth="1"
                opacity="0.92"
              />
              <text
                y="3"
                textAnchor="middle"
                fontSize="8"
                fontWeight="800"
                fill="#f4f4f5"
                className="pointer-events-none"
              >
                {bot.currentTask}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
