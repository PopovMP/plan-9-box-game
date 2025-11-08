import { type IGame, type IGameModel, canMove, doMove, isSolved, loadGame, storeGame } from "./game-engine.ts";
import { easyLevels } from "./easy-levels.ts";

interface IView {
  board  : HTMLCanvasElement;
  ctx    : CanvasRenderingContext2D;
  levelId: HTMLElement;
  solved : HTMLElement;
}

export function main(): void {
  const TILE_WIDTH  = 32;
  const TILE_HEIGHT = 32;
  const levels: IGame[]    = easyLevels;
  const model : IGameModel = loadGame();

  const view: IView = { } as IView;
  view.board   = document.getElementById("game-board") as HTMLCanvasElement;
  view.ctx     = view.board.getContext("2d") as CanvasRenderingContext2D;
  view.levelId = document.getElementById("level-id") as HTMLElement;
  view.solved  = document.getElementById("level-solved") as HTMLElement;

  let game: IGame;

  setLevel(model.currentLevelId);
  addEventListener("keydown", onKeyDown);

  function scaleCanvas(): void{
    const mapTileHeight = game.map.length;
    let mapTileWidth  = 0;
    for (const line of game.map) {
      if (line.length > mapTileWidth) {
        mapTileWidth = line.length;
      }
    }

    const canvasWidth  = Math.round(model.scale * TILE_WIDTH  * mapTileWidth);
    const canvasHeight = Math.round(model.scale * TILE_HEIGHT * mapTileHeight);

    view.board.width  = canvasWidth;
    view.board.height = canvasHeight;
  }

  function render(): void {
    view.ctx.fillStyle = "#DED6AE";
    view.ctx.fillRect(0, 0, view.ctx.canvas.width, view.ctx.canvas.height);

    const tileH = model.scale * TILE_HEIGHT;
    const tileW = model.scale * TILE_WIDTH;
    view.ctx.textBaseline = "middle";
    view.ctx.textAlign    = "center";
    view.ctx.font         = Math.round(tileH - 4) + "px Sansserif";

    for (let s = 0; s < game.map.length; s++) {
    for (let e = 0; e < game.map[s].length; e++) {
      const tileX   = Math.round(model.scale * e * TILE_WIDTH);
      const tileY   = Math.round(model.scale * s * TILE_HEIGHT);
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
    view.ctx.fillText("🧑‍🏭", Math.round(model.scale * game.hero.e * TILE_WIDTH  + (tileW / 2)),
                            Math.round(model.scale * game.hero.s * TILE_HEIGHT + (tileH / 2)) + 2);

    // Draw boxes
    for (const box of game.boxes) {
      const tileX = Math.round(model.scale * box.e * TILE_WIDTH);
      const tileY = Math.round(model.scale * box.s * TILE_HEIGHT);
      view.ctx.fillText("📦", tileX + Math.round(tileW / 2), tileY + Math.round(tileH / 2) + 2);
    }
  }

  function setLevel(id: number): void {
    model.currentLevelId = id;
    game = structuredClone(levels[model.currentLevelId]);
    view.solved.textContent = "";
    view.levelId.textContent = (model.currentLevelId + 1).toString();
    if (model.solvedLevelIds.includes(model.currentLevelId)) {
      view.solved.textContent = "Solved";
    }
    scaleCanvas();
    render();
    storeGame(model);
  }

  function markGameSolved(): void {
    view.solved.textContent = "Solved";
    if (!model.solvedLevelIds.includes(model.currentLevelId)) {
      model.solvedLevelIds.push(model.currentLevelId);
      storeGame(model);
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case "+":
      case "=":
        if (model.scale < 3) model.scale += 0.2;
        event.preventDefault();
        scaleCanvas();
        render();
        storeGame(model);
        break;
      case "-":
        if (model.scale > 0.4) model.scale -= 0.2;
        event.preventDefault();
        scaleCanvas();
        render();
        storeGame(model);
        break;
      case "ArrowUp":
        if (event.ctrlKey) {
          if (model.currentLevelId < levels.length - 1) {
            setLevel(model.currentLevelId + 1);
          }
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
          if (model.currentLevelId > 0) {
            setLevel(model.currentLevelId - 1);
          }
          return;
        }

        if (canMove(game, 1, 0)) {
          doMove(game, 1, 0);
          render();
        }
        break;
    }

    if (isSolved(game)) {
      markGameSolved();
    }
  }
}
