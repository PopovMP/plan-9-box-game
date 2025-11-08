import { type IGame, canMove, doMove } from "./game-engine.ts";
import { easyLevels } from "./easy-levels.ts";

interface IView {
  board  : HTMLCanvasElement;
  ctx    : CanvasRenderingContext2D;
  levelId: HTMLElement;
}

export function main(): void {
  const TILE_WIDTH  = 32;
  const TILE_HEIGHT = 32;
  const levels: IGame[] = easyLevels;

  const view: IView = { } as IView;
  view.board   = document.getElementById("game-board") as HTMLCanvasElement;
  view.ctx     = view.board.getContext("2d") as CanvasRenderingContext2D;
  view.levelId = document.getElementById("level-id") as HTMLElement;

  let scale = 1.0;
  let level = 0;
  let game: IGame;

  setLevel(0);
  addEventListener("keydown", onKeyDown);

  function scaleCanvas(): void{
    const mapTileHeight = game.map.length;
    let mapTileWidth  = 0;
    for (let i = 0; i < game.map.length; i++) {
      if (game.map[i].length > mapTileWidth) {
        mapTileWidth = game.map[i].length;
      }
    }

    const canvasWidth  = Math.round(scale * TILE_WIDTH  * mapTileWidth);
    const canvasHeight = Math.round(scale * TILE_HEIGHT * mapTileHeight);

    view.board.width  = canvasWidth;
    view.board.height = canvasHeight;
  }

  function render(): void {
    view.ctx.fillStyle = "#DED6AE";
    view.ctx.fillRect(0, 0, view.ctx.canvas.width, view.ctx.canvas.height);

    const tileH = scale * TILE_HEIGHT;
    const tileW = scale * TILE_WIDTH;
    view.ctx.textBaseline = "middle";
    view.ctx.textAlign    = "center"
    view.ctx.font         = Math.round(tileH - 4) + "px Sansserif";

    for (let s = 0; s < game.map.length; s++) {
    for (let e = 0; e < game.map[s].length; e++) {
      const tileX   = Math.round(scale * e * TILE_WIDTH);
      const tileY   = Math.round(scale * s * TILE_HEIGHT);
      const tileMid = Math.round(tileW / 2);

      // Draw map
      switch (game.map[s][e]) {
        case "#": // Wall
          view.ctx.fillStyle = "#bbbbbb";
          view.ctx.fillRect(tileX, tileY, tileW, tileH);
          view.ctx.fillText("🧱", tileX + tileMid, tileY + tileMid + 2);
          break;
        case " ": // Floor
          view.ctx.fillStyle = "#C5BE9A";
          view.ctx.fillText("·", tileX + tileMid, tileY + tileMid + 3);
          break;
        case ".": // Goal
          view.ctx.fillStyle = "#67b4ef";
          view.ctx.fillRect(tileX+3, tileY+3, tileW-6, tileH-6);
          view.ctx.fillStyle = "#3d6787";
          view.ctx.fillText("·", tileX + tileMid, tileY + tileMid + 3);
          break;
      }
    }}

    // Draw hero
    view.ctx.fillText("🧑‍🏭", Math.round(scale * game.hero.e * TILE_WIDTH  + (tileW / 2)),
                            Math.round(scale * game.hero.s * TILE_HEIGHT + (tileH / 2)) + 2);

    // Draw boxes
    for (let i = 0; i < game.boxes.length; i++) {
      const tileX = Math.round(scale * game.boxes[i].e * TILE_WIDTH);
      const tileY = Math.round(scale * game.boxes[i].s * TILE_HEIGHT);
      view.ctx.fillText("📦", tileX + Math.round(tileW / 2), tileY + Math.round(tileH / 2) + 2);
    }
  }

  function setLevel(id: number): void {
    level = id;
    game = structuredClone(levels[level]);
    view.levelId.textContent = (id + 1).toString();
    scaleCanvas();
    render();
  }

  function onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case "+":
        if (scale < 3) scale += 0.2;
        event.preventDefault();
        scaleCanvas();
        render();
        break;
      case "-":
        if (scale > 0.4) scale -= 0.2;
        event.preventDefault();
        scaleCanvas();
        render();
        break;
      case "ArrowUp":
        if (event.ctrlKey) {
          level++;
          if (level >= levels.length) level = levels.length - 1;
          setLevel(level);
          return;
        }

        if (canMove(game, -1, 0)) {
          doMove(game, -1, 0);
          render();
        }
        break;
      case "ArrowRight":
        if (canMove(game, 0, 1)) {
          doMove(game, 0, 1);
          render();
        }
        break;
      case "ArrowLeft":
        if (canMove(game, 0, -1)) {
          doMove(game, 0, -1);
          render();
        }
        break;
      case "ArrowDown":
        if (event.ctrlKey) {
          level--;
          if (level < 0) level = 0;
          setLevel(level);
          return;
        }

        if (canMove(game, 1, 0)) {
          doMove(game, 1, 0);
          render();
        }
        break;
    }
  }
}
