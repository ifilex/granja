// Isometric projection utilities and map grid constants for Transport Tycoon style view

export const TILE_W = 104; // Diamond tile width
export const TILE_H = 52;  // Diamond tile height (2:1 classic dimetric ratio)
export const MAP_SIZE = 18; // 18x18 tile world

export interface GridCoord {
  gx: number;
  gy: number;
}

export interface ScreenCoord {
  x: number;
  y: number;
}

/**
 * Converts grid coordinates (gx, gy) to 2D screen space coordinates
 */
export function gridToScreen(gx: number, gy: number, originX: number = 0, originY: number = 0): ScreenCoord {
  return {
    x: originX + (gx - gy) * (TILE_W / 2),
    y: originY + (gx + gy) * (TILE_H / 2),
  };
}

/**
 * Converts screen coordinate back to grid coordinates (gx, gy)
 */
export function screenToGrid(sx: number, sy: number, originX: number = 0, originY: number = 0): GridCoord {
  const relX = sx - originX;
  const relY = sy - originY;
  
  const gx = (relX / (TILE_W / 2) + relY / (TILE_H / 2)) / 2;
  const gy = (relY / (TILE_H / 2) - relX / (TILE_W / 2)) / 2;
  
  return {
    gx: Math.floor(gx),
    gy: Math.floor(gy),
  };
}

/**
 * Calculates depth z-index based on isometric distance from top corner
 */
export function getZIndex(gx: number, gy: number, layerBonus: number = 0): number {
  return (gx + gy) * 10 + layerBonus;
}

/**
 * Path points string for SVG polygon diamond tile centered or anchored at top
 */
export function getTilePolygonPoints(sx: number, sy: number): string {
  const halfW = TILE_W / 2;
  const halfH = TILE_H / 2;
  // Top, Right, Bottom, Left vertices
  return `${sx},${sy} ${sx + halfW},${sy + halfH} ${sx},${sy + TILE_H} ${sx - halfW},${sy + halfH}`;
}
