import { type IGame, UP, LEFT, RIGHT, DOWN } from "./def.ts";

const TILE_SIZE = 32;

export function scaleCanvas(canvas: HTMLCanvasElement, game: IGame, scale: number): void{
  canvas.width  = Math.round(scale * TILE_SIZE * game.map[0].length);
  canvas.height = Math.round(scale * TILE_SIZE * game.map.length);
}

export function render(canvas: HTMLCanvasElement, game: IGame, scale: number): void {
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
  const tileSize: number = scale * TILE_SIZE;
  const dotR    : number = 2 * scale;

  ctx.fillStyle = "#DED6AE";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textBaseline = "middle";
  ctx.textAlign    = "center";
  ctx.font         = Math.round(tileSize - 4) + "px Sansserif";

  for (let s = 0; s < game.map.length; s++) {
  for (let e = 0; e < game.map[s].length; e++) {
    const tileX: number = e * tileSize;
    const tileY: number = s * tileSize;
    const midX : number = tileX + tileSize / 2;
    const midY : number = tileY + tileSize / 2;

    // Draw map
    switch (game.map[s][e]) {
      case "#": // Wall
        ctx.fillStyle = "#bbbbbb";
        ctx.fillRect(tileX, tileY, tileSize, tileSize);
        ctx.fillText("🧱", midX, midY);
        break;
      case " ": // Floor
        drawDot(midX, midY, dotR, "#C5BE9A");
        break;
      case ".": // Goal
        ctx.fillStyle = "#5bbf44";
        ctx.fillRect(tileX+3, tileY+3, tileSize-6, tileSize-6);
        drawDot(midX, midY, dotR, "#146e00");
        break;
    }
  }}

  // Draw hero
  const hs = Math.trunc(game.heroPos / 100);
  const he = game.heroPos % 100;
  ctx.fillText("🧑‍🏭", he * tileSize + tileSize / 2, hs * tileSize + tileSize / 2);

  // Draw boxes
  for (const pos of game.boxesPos) {
    const s = Math.trunc(pos / 100);
    const e = pos % 100;
    const tileX = e * tileSize;
    const tileY = s * tileSize;
    ctx.fillText("📦", tileX + tileSize / 2, tileY + tileSize / 2);
  }

  // Mark good tiles
  for (let s = 0; s < game.map.length; s++) {
  for (let e = 0; e < game.map[s].length; e++) {
    if (game.goodMap[s][e]) {
      const tileX: number = e * tileSize;
      const tileY: number = s * tileSize;
      const midX : number = tileX + tileSize / 2;
      const midY : number = tileY + tileSize / 2;
      drawDot(midX, midY, 2*dotR, "#f8a100ff");
    }
  }}

  // Mark step tiles
  for (let s = 0; s < game.map.length; s++) {
  for (let e = 0; e < game.map[s].length; e++) {
    if (game.stepMap[s][e]) {
      const tileX: number = e * tileSize;
      const tileY: number = s * tileSize;
      const midX : number = tileX + tileSize / 2;
      const midY : number = tileY + tileSize / 2;
      drawDot(midX, midY, 1.2*dotR, "#3600f8ff");
    }
  }}

  // Mark possible moves
  for (const move of game.possibleMoves) {
    if (move === 0) break;
    const tWidth = scale * TILE_SIZE;
    const ts  = Math.trunc(move / 10000);
    const te  = Math.trunc(move / 100) % 100;
    const s   = ts * tWidth;
    const e   = te * tWidth;
    const mid = scale * (TILE_SIZE / 2);
    const dir = move % 100;
    if (dir & UP) {
      drawDot(e + mid, s + 3, 3, "#000000");
    }
    if (dir & RIGHT) {
      drawDot(e + tWidth - 3, s + mid, 3, "#000000");
    }
    if (dir & LEFT) {
      drawDot(e +  3, s + mid, 3, "#000000");
    }
    if (dir & DOWN) {
      drawDot(e + mid, s + tWidth - 3, 3, "#000000");
    }
  }

  function drawDot(x: number, y: number, r: number, color: string): void {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }
}
