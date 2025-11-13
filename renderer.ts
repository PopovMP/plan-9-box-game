import { type IGame } from "./game-engine.ts";

const TILE_SIZE = 32;

export function scaleCanvas(canvas: HTMLCanvasElement, game: IGame, scale: number): void{
  canvas.width  = Math.round(scale * TILE_SIZE * game.map[0].length);
  canvas.height = Math.round(scale * TILE_SIZE * game.map.length);
}

export  function render(canvas: HTMLCanvasElement, game: IGame, scale: number): void {
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
  const tileSize: number = scale * TILE_SIZE;
  const dotR    : number = 2 * scale;
  const dotStart: number = 0;
  const dotEnd  : number = 2 * Math.PI;

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
        ctx.beginPath();
        ctx.fillStyle = "#C5BE9A";
        ctx.arc(midX, midY, dotR, dotStart, dotEnd);
        ctx.fill();
        break;
      case ".": // Goal
        ctx.fillStyle = "#5bbf44";
        ctx.fillRect(tileX+3, tileY+3, tileSize-6, tileSize-6);

        ctx.beginPath();
        ctx.fillStyle = "#146e00";
        ctx.arc(midX, midY, dotR, dotStart, dotEnd);
        ctx.fill();
        break;
    }
  }}

  // Draw hero
  ctx.fillText("🧑‍🏭", game.hero.e * tileSize + tileSize / 2,
                     game.hero.s * tileSize + tileSize / 2);

  // Draw boxes
  for (const box of game.boxes) {
    const tileX = box.e * tileSize;
    const tileY = box.s * tileSize;
    ctx.fillText("📦", tileX + tileSize / 2, tileY + tileSize / 2);
  }
}
