import React, { useState } from 'react';
import { MAP_SIZE, TILE_W, TILE_H, gridToScreen, getZIndex } from '../../utils/isometric';
import { soundManager } from '../../utils/audio';

interface IsometricLandscapeProps {
  originX: number;
  originY: number;
  onBuyPlot?: () => void;
  nextPlotCost: number;
  canAffordPlot: boolean;
  nextPlotGx: number;
  nextPlotGy: number;
}

export const IsometricLandscape: React.FC<IsometricLandscapeProps> = ({
  originX,
  originY,
  onBuyPlot,
  nextPlotCost,
  canAffordPlot,
  nextPlotGx,
  nextPlotGy,
}) => {
  const halfW = TILE_W / 2;
  const halfH = TILE_H / 2;
  const [trainMessage, setTrainMessage] = useState<string | null>(null);

  // Generate base terrain grid
  const tiles: {
    gx: number;
    gy: number;
    type: 'grass1' | 'grass2' | 'grass3' | 'rail' | 'road' | 'water' | 'path';
  }[] = [];

  for (let gy = 0; gy < MAP_SIZE; gy++) {
    for (let gx = 0; gx < MAP_SIZE; gx++) {
      let type: 'grass1' | 'grass2' | 'grass3' | 'rail' | 'road' | 'water' | 'path' =
        (gx + gy) % 2 === 0 ? 'grass1' : 'grass2';

      // 1. TTD Railway line running diagonally along gy === 1
      if (gy === 1) {
        type = 'rail';
      }
      // 2. Roadway along gy === 3
      else if (gy === 3) {
        type = 'road';
      }
      // 3. Water Pond at southeast gx: 14..16, gy: 13..15
      else if (gx >= 14 && gx <= 16 && gy >= 13 && gy <= 15) {
        type = 'water';
      }
      // 4. Stone Pathways connecting Road to Barn & Plots
      else if ((gx === 5 && gy >= 4 && gy <= 9) || (gy === 8 && gx >= 2 && gx <= 11)) {
        type = 'path';
      } else if ((gx * 3 + gy * 7) % 5 === 0) {
        type = 'grass3';
      }

      tiles.push({ gx, gy, type });
    }
  }

  // Predefined decorative TTD style trees
  const trees = [
    { gx: 0, gy: 4, type: 'pine' },
    { gx: 0, gy: 7, type: 'apple' },
    { gx: 1, gy: 12, type: 'pine' },
    { gx: 17, gy: 4, type: 'apple' },
    { gx: 17, gy: 8, type: 'pine' },
    { gx: 16, gy: 11, type: 'apple' },
    { gx: 8, gy: 9, type: 'oak' },
    { gx: 13, gy: 16, type: 'pine' },
    { gx: 2, gy: 16, type: 'pine' },
  ];

  // Screen coordinates for the "Desarrollar Parcela +" tile
  const devPlotPos = gridToScreen(nextPlotGx, nextPlotGy, originX, originY);
  const devPlotZ = getZIndex(nextPlotGx, nextPlotGy, 3);

  // Railway Station coordinates at gx: 7, gy: 1
  const stationPos = gridToScreen(7, 1, originX, originY);
  const stationZ = getZIndex(7, 1, 5);

  // Animated Steam Freight Train coordinates at gx: 12, gy: 1
  const trainPos = gridToScreen(12, 1, originX, originY);
  const trainZ = getZIndex(12, 1, 8);

  const handleTrainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playTrainWhistle();
    setTrainMessage('🚂 Expreso Agrícola: ¡Transportando 20 T. de Trigo hacia el Puerto!');
    setTimeout(() => setTrainMessage(null), 4000);
  };

  return (
    <>
      {/* 1. Base Terrain Diamond Polygons (Transport Tycoon 256-Color Palette) */}
      <g id="iso-base-terrain">
        {tiles.map(({ gx, gy, type }) => {
          const { x: sx, y: sy } = gridToScreen(gx, gy, originX, originY);
          const topX = sx;
          const topY = sy;
          const rightX = sx + halfW;
          const rightY = sy + halfH;
          const bottomX = sx;
          const bottomY = sy + TILE_H;
          const leftX = sx - halfW;
          const leftY = sy + halfH;

          // 256-color DOS palette exact values
          let fill = '#2d7a31'; // Mid grass
          let stroke = '#1f5922';

          if (type === 'grass2') {
            fill = '#38822e'; // Darker step grass
            stroke = '#246328';
          } else if (type === 'grass3') {
            fill = '#479638'; // Sunlit step grass
            stroke = '#2d7a31';
          } else if (type === 'rail') {
            fill = '#475569'; // Railway ballast gravel
            stroke = '#334155';
          } else if (type === 'road') {
            fill = '#2c3038'; // Dark asphalt
            stroke = '#1e2126';
          } else if (type === 'water') {
            fill = '#184e77'; // TTD deep water
            stroke = '#103957';
          } else if (type === 'path') {
            fill = '#6b7280'; // Cobblestone path
            stroke = '#4b5563';
          }

          return (
            <g key={`${gx}-${gy}`}>
              {/* Diamond tile surface */}
              <polygon
                points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
                fill={fill}
                stroke={stroke}
                strokeWidth="0.8"
              />

              {/* TTD Checker Grass Dither Pattern */}
              {(type === 'grass1' || type === 'grass2' || type === 'grass3') && (
                <g opacity="0.18">
                  <line x1={topX} y1={topY + 6} x2={topX + 8} y2={topY + 10} stroke="#ffffff" strokeWidth="1" />
                  <line x1={bottomX - 6} y1={bottomY - 4} x2={bottomX + 4} y2={bottomY - 8} stroke="#0f3312" strokeWidth="1" />
                </g>
              )}

              {/* TTD Railway Track Ties & Steel Rails */}
              {type === 'rail' && (
                <g>
                  {/* Wooden Sleepers (Cross ties spaced perpendicular to track) */}
                  {[-18, -9, 0, 9, 18].map((offset, i) => {
                    const cx = sx + (offset * halfW) / 22;
                    const cy = sy + halfH + (offset * halfH) / 22;
                    return (
                      <line
                        key={i}
                        x1={cx - 10}
                        y1={cy - 5}
                        x2={cx + 10}
                        y2={cy + 5}
                        stroke="#381e0c"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                    );
                  })}
                  {/* Left Steel Rail */}
                  <line
                    x1={leftX + 10}
                    y1={leftY - 5}
                    x2={rightX - 10}
                    y2={rightY - 5}
                    stroke="#cbd5e1"
                    strokeWidth="1.8"
                  />
                  <line
                    x1={leftX + 10}
                    y1={leftY - 4}
                    x2={rightX - 10}
                    y2={rightY - 4}
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  {/* Right Steel Rail */}
                  <line
                    x1={leftX + 14}
                    y1={leftY + 5}
                    x2={rightX - 6}
                    y2={rightY + 5}
                    stroke="#cbd5e1"
                    strokeWidth="1.8"
                  />
                  <line
                    x1={leftX + 14}
                    y1={leftY + 6}
                    x2={rightX - 6}
                    y2={rightY + 6}
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                </g>
              )}

              {/* Road markings along asphalt highway */}
              {type === 'road' && (
                <line
                  x1={leftX + 6}
                  y1={leftY}
                  x2={rightX - 6}
                  y2={rightY}
                  stroke="#facc15"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                />
              )}

              {/* Water reflections, wavelets and reeds */}
              {type === 'water' && (
                <g>
                  <ellipse cx={sx} cy={sy + halfH} rx="16" ry="7" fill="#1e6091" />
                  <ellipse cx={sx - 4} cy={sy + halfH - 2} rx="6" ry="2" fill="#52b69a" opacity="0.6" />
                  <text x={sx - 6} y={sy + halfH + 4} fontSize="9">
                    🦆
                  </text>
                </g>
              )}

              {/* Cobblestone path specks */}
              {type === 'path' && (
                <g opacity="0.4">
                  <circle cx={sx - 5} cy={sy + halfH} r="1.5" fill="#374151" />
                  <circle cx={sx + 6} cy={sy + halfH + 2} r="1.5" fill="#e5e7eb" />
                </g>
              )}
            </g>
          );
        })}

        {/* 2. TTD 3D Bedrock Cliff Strata (Floating Island Tabletop Edges) */}
        {/* Southwest Edge (gx = 0..MAP_SIZE-1, gy = MAP_SIZE-1) */}
        {Array.from({ length: MAP_SIZE }).map((_, gx) => {
          const { x: sx, y: sy } = gridToScreen(gx, MAP_SIZE - 1, originX, originY);
          const bottomX = sx;
          const bottomY = sy + TILE_H;
          const leftX = sx - halfW;
          const leftY = sy + halfH;
          const depth = 28;

          return (
            <g key={`cliff-sw-${gx}`}>
              {/* Left Cliff Face */}
              <polygon
                points={`${leftX},${leftY} ${bottomX},${bottomY} ${bottomX},${bottomY + depth} ${leftX},${leftY + depth}`}
                fill="#381e0c"
                stroke="#261205"
                strokeWidth="1"
              />
              {/* Rock strata lines */}
              <line
                x1={leftX}
                y1={leftY + depth * 0.4}
                x2={bottomX}
                y2={bottomY + depth * 0.4}
                stroke="#543016"
                strokeWidth="1.5"
              />
              <line
                x1={leftX}
                y1={leftY + depth * 0.75}
                x2={bottomX}
                y2={bottomY + depth * 0.75}
                stroke="#1c0e04"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Southeast Edge (gx = MAP_SIZE-1, gy = 0..MAP_SIZE-1) */}
        {Array.from({ length: MAP_SIZE }).map((_, gy) => {
          const { x: sx, y: sy } = gridToScreen(MAP_SIZE - 1, gy, originX, originY);
          const bottomX = sx;
          const bottomY = sy + TILE_H;
          const rightX = sx + halfW;
          const rightY = sy + halfH;
          const depth = 28;

          return (
            <g key={`cliff-se-${gy}`}>
              {/* Right Cliff Face (Lighter shade from isometric sun) */}
              <polygon
                points={`${bottomX},${bottomY} ${rightX},${rightY} ${rightX},${rightY + depth} ${bottomX},${bottomY + depth}`}
                fill="#4a2810"
                stroke="#331908"
                strokeWidth="1"
              />
              <line
                x1={bottomX}
                y1={bottomY + depth * 0.4}
                x2={rightX}
                y2={rightY + depth * 0.4}
                stroke="#693917"
                strokeWidth="1.5"
              />
              <line
                x1={bottomX}
                y1={bottomY + depth * 0.75}
                x2={rightX}
                y2={rightY + depth * 0.75}
                stroke="#2b1506"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </g>

      {/* 3. TTD RAILWAY STATION PLATFORM (gx: 7, gy: 1) */}
      <g
        id="iso-railway-station"
        style={{ zIndex: stationZ, cursor: 'pointer' }}
        onClick={handleTrainClick}
        className="group select-none"
      >
        {/* Wooden Platform */}
        <polygon
          points={`${stationPos.x - 38},${stationPos.y + 4} ${stationPos.x},${stationPos.y + 22} ${stationPos.x + 38},${stationPos.y + 4} ${stationPos.x},${stationPos.y - 14}`}
          fill="#543016"
          stroke="#381e0c"
          strokeWidth="1.2"
        />
        {/* Platform Timber Edge */}
        <polygon
          points={`${stationPos.x - 38},${stationPos.y + 4} ${stationPos.x},${stationPos.y + 22} ${stationPos.x},${stationPos.y + 28} ${stationPos.x - 38},${stationPos.y + 10}`}
          fill="#381e0c"
        />
        <polygon
          points={`${stationPos.x},${stationPos.y + 22} ${stationPos.x + 38},${stationPos.y + 4} ${stationPos.x + 38},${stationPos.y + 10} ${stationPos.x},${stationPos.y + 28}`}
          fill="#261205"
        />

        {/* Station Shelter with corrugated roof */}
        <g transform={`translate(${stationPos.x - 14}, ${stationPos.y - 20})`}>
          {/* Support posts */}
          <line x1="-12" y1="12" x2="-12" y2="-6" stroke="#ca8a04" strokeWidth="2.5" />
          <line x1="12" y1="12" x2="12" y2="-6" stroke="#ca8a04" strokeWidth="2.5" />
          {/* Roof */}
          <polygon
            points="-22,-6 0,-18 22,-6 0,6"
            fill="#b91c1c"
            stroke="#7f1d1d"
            strokeWidth="1.2"
          />
          {/* Station Clock */}
          <circle cx="0" cy="-6" r="4" fill="#ffffff" stroke="#1e293b" strokeWidth="1" />
          {/* Station Nameboard */}
          <rect x="-24" y="2" width="48" height="9" rx="2" fill="#1e293b" stroke="#ca8a04" strokeWidth="1" />
          <text
            x="0"
            y="8.5"
            textAnchor="middle"
            fill="#fef08a"
            fontSize="5.5"
            fontWeight="bold"
            letterSpacing="0.5"
          >
            ESTACIÓN VALLE
          </text>
        </g>
      </g>

      {/* 4. CLASSIC TTD STEAM FREIGHT TRAIN (gx: 12, gy: 1) */}
      <g
        id="iso-steam-train"
        style={{ zIndex: trainZ, cursor: 'pointer' }}
        onClick={handleTrainClick}
        className="group select-none"
      >
        <g transform={`translate(${trainPos.x}, ${trainPos.y})`} className="animate-train-chug">
          {/* Steam Locomotive Boiler (Black & Brass with red trim) */}
          {/* Main Boiler Body */}
          <polygon
            points="-26,2 2,16 2,-6 -26,-20"
            fill="#1e293b"
            stroke="#0f172a"
            strokeWidth="1"
          />
          <polygon
            points="2,16 28,3 28,-19 2,-6"
            fill="#334155"
            stroke="#1e293b"
            strokeWidth="1"
          />
          <polygon
            points="2,-6 -26,-20 0,-32 28,-19"
            fill="#475569"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Locomotive Red Cab */}
          <polygon
            points="-38,-4 -20,5 -20,-24 -38,-33"
            fill="#b91c1c"
            stroke="#7f1d1d"
            strokeWidth="1"
          />
          <polygon
            points="-20,5 -10,0 -10,-29 -20,-24"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="1"
          />
          {/* Cab Window */}
          <polygon
            points="-32,-14 -22,-9 -22,-19 -32,-24"
            fill="#38bdf8"
            stroke="#0284c7"
            strokeWidth="0.8"
          />

          {/* Brass Smokestack & Chimney */}
          <polygon
            points="14,-9 22,-5 22,-20 14,-24"
            fill="#ca8a04"
            stroke="#a16207"
            strokeWidth="0.8"
          />
          <ellipse cx="18" cy="-22" rx="4" ry="2" fill="#eab308" />

          {/* Animated Steam Clouds puffing from chimney */}
          <g className="animate-float-pulse">
            <circle cx="16" cy="-30" r="5" fill="#f8fafc" opacity="0.8" />
            <circle cx="10" cy="-38" r="7" fill="#f8fafc" opacity="0.6" />
            <circle cx="2" cy="-48" r="10" fill="#f8fafc" opacity="0.4" />
          </g>

          {/* Red Wheels with brass spokes */}
          {[-20, -6, 8, 22].map((wx, i) => (
            <circle
              key={i}
              cx={wx}
              cy={12 + (i % 2 === 0 ? 0 : 2)}
              r="4.5"
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth="1.2"
            />
          ))}

          {/* Grain Hopper Wagon behind locomotive */}
          <g transform="translate(-48, -24)">
            <polygon
              points="-22,10 2,22 2,4 -22,-8"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="1"
            />
            <polygon
              points="2,22 24,11 24,-7 2,4"
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="1"
            />
            {/* Grain Cargo (Golden Wheat Pile) */}
            <polygon
              points="-20,2 2,13 22,2 0,-9"
              fill="#facc15"
              stroke="#eab308"
              strokeWidth="0.8"
            />
          </g>
        </g>
      </g>

      {/* Train Cargo Floating Banner Message */}
      {trainMessage && (
        <g
          style={{ zIndex: 9999 }}
          transform={`translate(${trainPos.x}, ${trainPos.y - 75})`}
          className="animate-bounce select-none pointer-events-none"
        >
          <rect
            x="-160"
            y="-14"
            width="320"
            height="28"
            rx="14"
            fill="#1c1917"
            stroke="#facc15"
            strokeWidth="2"
            className="filter drop-shadow-xl"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="#fef08a"
            fontSize="11"
            fontWeight="bold"
          >
            {trainMessage}
          </text>
        </g>
      )}

      {/* 5. "DESARROLLAR PARCELA" (Buy & Expand Farm Plot Tile) */}
      {onBuyPlot && (
        <g
          id="iso-develop-plot-tile"
          style={{ zIndex: devPlotZ, cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onBuyPlot();
          }}
          className="group select-none"
        >
          {/* Tile base */}
          <polygon
            points={`${devPlotPos.x},${devPlotPos.y} ${devPlotPos.x + halfW},${devPlotPos.y + halfH} ${devPlotPos.x},${devPlotPos.y + TILE_H} ${devPlotPos.x - halfW},${devPlotPos.y + halfH}`}
            fill={canAffordPlot ? '#1f5922' : '#334155'}
            stroke="#facc15"
            strokeWidth="2"
            strokeDasharray="5 3"
            className="group-hover:filter group-hover:brightness-125 transition"
          />

          {/* Plus sign & expansion indicator */}
          <g transform={`translate(${devPlotPos.x}, ${devPlotPos.y + halfH - 4})`}>
            <circle
              r="15"
              fill="#ca8a04"
              stroke="#fef08a"
              strokeWidth="1.5"
              className="animate-pulse"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="16"
              fontWeight="900"
              fill="#ffffff"
            >
              ➕
            </text>
            <g transform="translate(0, 20)">
              <rect
                x="-36"
                y="-8"
                width="72"
                height="16"
                rx="8"
                fill="#1c1917"
                stroke="#ca8a04"
                strokeWidth="1"
                className="filter drop-shadow"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fde047"
                fontSize="9"
                fontWeight="bold"
              >
                {nextPlotCost} 🪙
              </text>
            </g>
          </g>
        </g>
      )}

      {/* 6. TTD Conifer Pines & Apple Trees */}
      <g id="iso-decorative-trees">
        {trees.map(({ gx, gy, type }, index) => {
          const { x: sx, y: sy } = gridToScreen(gx, gy, originX, originY);
          const zIndex = getZIndex(gx, gy, 4);

          return (
            <g
              key={`tree-${index}`}
              id={`tree-${index}`}
              style={{ zIndex }}
              className="pointer-events-none"
            >
              {/* Tree Shadow */}
              <ellipse
                cx={sx}
                cy={sy + halfH}
                rx="14"
                ry="7"
                fill="#0f172a"
                opacity="0.35"
              />

              {/* TTD Temperate Conifer Pine Tree */}
              {type === 'pine' ? (
                <g transform={`translate(${sx}, ${sy + halfH - 2})`}>
                  {/* Trunk */}
                  <rect x="-3" y="-12" width="6" height="14" fill="#381e0c" stroke="#261205" strokeWidth="0.8" />
                  {/* Bottom Tier Needle Cluster */}
                  <polygon
                    points="0,-42 -22,-14 22,-14"
                    fill="#1b4332"
                    stroke="#081c15"
                    strokeWidth="0.8"
                  />
                  {/* Middle Tier Needle Cluster */}
                  <polygon
                    points="0,-52 -18,-26 18,-26"
                    fill="#2d6a4f"
                    stroke="#1b4332"
                    strokeWidth="0.8"
                  />
                  {/* Top Tier Needle Cluster */}
                  <polygon
                    points="0,-62 -12,-38 12,-38"
                    fill="#40916c"
                    stroke="#2d6a4f"
                    strokeWidth="0.8"
                  />
                  {/* Highlight snow/sun tip */}
                  <polygon
                    points="0,-62 -4,-52 4,-52"
                    fill="#74c69d"
                  />
                </g>
              ) : (
                /* TTD Deciduous Apple Tree */
                <g transform={`translate(${sx}, ${sy + halfH - 4})`}>
                  {/* Trunk */}
                  <rect x="-4" y="-14" width="8" height="16" rx="2" fill="#543016" stroke="#381e0c" strokeWidth="0.8" />
                  {/* Green Foliage Spheres */}
                  <circle cx="0" cy="-32" r="18" fill="#2d7a31" stroke="#1f5922" strokeWidth="1" />
                  <circle cx="-8" cy="-34" r="12" fill="#38822e" />
                  <circle cx="8" cy="-30" r="13" fill="#479638" />
                  {/* Apples */}
                  <circle cx="-6" cy="-32" r="2.5" fill="#ef4444" />
                  <circle cx="5" cy="-26" r="2.5" fill="#ef4444" />
                  <circle cx="1" cy="-38" r="2.5" fill="#ef4444" />
                </g>
              )}
            </g>
          );
        })}
      </g>
    </>
  );
};
