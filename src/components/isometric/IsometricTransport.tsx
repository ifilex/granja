import React from 'react';
import { FarmState } from '../../types/game';
import { TILE_W, TILE_H, gridToScreen, getZIndex } from '../../utils/isometric';
import { ChevronRight } from 'lucide-react';

interface IsometricTransportProps {
  state: FarmState;
  originX: number;
  originY: number;
  onOpenOrders: () => void;
  onOpenMarket: () => void;
}

export const IsometricTransport: React.FC<IsometricTransportProps> = ({
  state,
  originX,
  originY,
  onOpenOrders,
  onOpenMarket,
}) => {
  // Truck Depot at gx: 4, gy: 3
  const truckPos = gridToScreen(4, 3, originX, originY);
  const truckZ = getZIndex(4, 3, 6);

  // Roadside Stand at gx: 9, gy: 3
  const marketPos = gridToScreen(9, 3, originX, originY);
  const marketZ = getZIndex(9, 3, 6);

  const pendingOrders = state.truckOrders.filter((o) => !o.completed).length;

  return (
    <>
      {/* --- TRUCK DEPOT & TRANSPORT TYCOON TRUCK --- */}
      <g
        id="iso-truck-depot"
        style={{ zIndex: truckZ, cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenOrders();
        }}
        className="group select-none"
      >
        {/* Loading Dock Platform */}
        <polygon
          points={`${truckPos.x - 36},${truckPos.y + 12} ${truckPos.x},${truckPos.y + 28} ${truckPos.x + 36},${truckPos.y + 12} ${truckPos.x},${truckPos.y - 4}`}
          fill="#57534e"
          stroke="#44403c"
          strokeWidth="1.2"
        />

        {/* Shadow under truck */}
        <ellipse
          cx={truckPos.x}
          cy={truckPos.y + 14}
          rx="32"
          ry="14"
          fill="#0f172a"
          opacity="0.4"
        />

        {/* Transport Tycoon Delivery Truck (Isometric Red Box Truck) */}
        <g transform={`translate(${truckPos.x}, ${truckPos.y - 6})`} className="group-hover:-translate-y-1 transition-transform">
          {/* Cargo Box (White/Cream box body) */}
          {/* Cargo Left Side */}
          <polygon
            points="-28,4 0,16 0,-18 -28,-30"
            fill="#e2e8f0"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          {/* Cargo Right Side */}
          <polygon
            points="0,16 28,4 28,-30 0,-18"
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          {/* Cargo Roof */}
          <polygon
            points="0,-18 -28,-30 0,-42 28,-30"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Red Truck Cab (Front of truck facing down-right) */}
          <polygon
            points="0,16 18,24 38,15 28,4"
            fill="#b91c1c"
            stroke="#991b1b"
            strokeWidth="1"
          />
          <polygon
            points="18,24 18,10 38,1 38,15"
            fill="#dc2626"
            stroke="#b91c1c"
            strokeWidth="1"
          />
          {/* Windshield */}
          <polygon
            points="14,12 26,6 36,10 24,16"
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth="0.8"
          />

          {/* Chrome Bumpers & Wheels */}
          <circle cx="-16" cy="12" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="16" cy="24" r="5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />

          {/* Engine Exhaust Smoke Puffs */}
          <g className="animate-float-pulse">
            <circle cx="-32" cy="-14" r="3.5" fill="#f8fafc" opacity="0.8" />
            <circle cx="-38" cy="-22" r="5" fill="#f8fafc" opacity="0.5" />
            <circle cx="-44" cy="-32" r="6.5" fill="#f8fafc" opacity="0.3" />
          </g>

          {/* Loading Cargo Crates */}
          <text x="-12" y="-5" fontSize="14">
            📦
          </text>
        </g>

        {/* Order Notification Floating Badge */}
        <g transform={`translate(${truckPos.x}, ${truckPos.y - 58})`}>
          <rect
            x="-56"
            y="-12"
            width="112"
            height="24"
            rx="12"
            fill="#dc2626"
            stroke="#fecaca"
            strokeWidth="1.8"
            className="filter drop-shadow-md animate-gentle-bob"
          />
          <text
            y="5"
            textAnchor="middle"
            fontSize="10"
            fontWeight="900"
            fill="#ffffff"
          >
            🚚 {pendingOrders} PEDIDOS LISTOS
          </text>
        </g>
      </g>

      {/* --- ROADSIDE STAND & GLOBAL MARKET (PUESTO DE VENTA) --- */}
      <g
        id="iso-roadside-market"
        style={{ zIndex: marketZ, cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenMarket();
        }}
        className="group select-none"
      >
        {/* Wooden Veranda Base */}
        <polygon
          points={`${marketPos.x - 38},${marketPos.y + 12} ${marketPos.x},${marketPos.y + 28} ${marketPos.x + 38},${marketPos.y + 12} ${marketPos.x},${marketPos.y - 4}`}
          fill="#854d0e"
          stroke="#713f12"
          strokeWidth="1.2"
        />

        {/* Shadow */}
        <ellipse
          cx={marketPos.x}
          cy={marketPos.y + 14}
          rx="34"
          ry="14"
          fill="#0f172a"
          opacity="0.4"
        />

        {/* Wooden Stall Structure */}
        <g transform={`translate(${marketPos.x}, ${marketPos.y - 8})`} className="group-hover:-translate-y-1 transition-transform">
          {/* Back Wall & Counter */}
          <polygon
            points="-28,8 0,20 28,8 28,-14 -28,-14"
            fill="#92400e"
            stroke="#78350f"
            strokeWidth="1"
          />

          {/* Display Crates with Harvest produce */}
          <polygon points="-24,10 -4,18 -4,6 -24,-2" fill="#78350f" />
          <polygon points="4,18 24,10 24,-2 4,6" fill="#78350f" />
          <text x="-14" y="8" fontSize="12">
            🥕
          </text>
          <text x="14" y="8" fontSize="12">
            🍞
          </text>

          {/* Red and White Striped Fabric Awning */}
          <polygon
            points="-34,-14 0,0 34,-14 26,-36 -26,-36"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="1"
          />
          {/* White Stripes on Awning */}
          <polygon points="-22,-19 -8,-9 -8,-36 -22,-36" fill="#ffffff" />
          <polygon points="8,-9 22,-19 22,-36 8,-36" fill="#ffffff" />

          {/* Wooden Awning Posts */}
          <line x1="-30" y1="6" x2="-30" y2="-16" stroke="#451a03" strokeWidth="2.5" />
          <line x1="30" y1="6" x2="30" y2="-16" stroke="#451a03" strokeWidth="2.5" />
          <line x1="0" y1="18" x2="0" y2="-2" stroke="#451a03" strokeWidth="2.5" />

          {/* Newspaper / Live Market Globe Sign */}
          <circle cx="0" cy="-44" r="13" fill="#047857" stroke="#34d399" strokeWidth="2" className="animate-pulse" />
          <text x="0" y="-39" textAnchor="middle" fontSize="15">
            📰
          </text>
        </g>

        {/* Global Market Floating Badge */}
        <g transform={`translate(${marketPos.x}, ${marketPos.y - 68})`}>
          <rect
            x="-62"
            y="-12"
            width="124"
            height="24"
            rx="12"
            fill="#065f46"
            stroke="#34d399"
            strokeWidth="1.8"
            className="filter drop-shadow-md"
          />
          <text
            y="5"
            textAnchor="middle"
            fontSize="10"
            fontWeight="900"
            fill="#ffffff"
          >
            🏪 MERCADO MUNDIAL
          </text>
        </g>
      </g>
    </>
  );
};
