import { type IGame, type IGameModel, EDir, canMove, doMove, isSolved, loadGame, storeGame } from "./game-engine.ts";
import { easyLevels } from "./easy-levels.ts";

interface IView {
  board  : HTMLCanvasElement;
  ctx    : CanvasRenderingContext2D;
  levelId: HTMLElement;
  solved : HTMLElement;
  replay : HTMLElement;
  reset  : HTMLElement;
  next   : HTMLElement;
}

export function main(): void {
  const TILE_WIDTH  = 32;
  const TILE_HEIGHT = 32;
  const levels: IGame[]    = easyLevels;
  const model : IGameModel = loadGame();
  const replay: number[]   = [];

  const view: IView = {
    board  : document.getElementById("game-board"  ) as HTMLCanvasElement,
    levelId: document.getElementById("level-id"    ) as HTMLElement,
    solved : document.getElementById("level-solved") as HTMLElement,
    replay : document.getElementById("level-replay") as HTMLElement,
    reset  : document.getElementById("level-reset") as HTMLElement,
    next   : document.getElementById("level-next") as HTMLElement,
  } as IView;
  view.ctx = view.board.getContext("2d") as CanvasRenderingContext2D;

  let game: IGame;
  let isReplaying = false;

  setLevel(model.levelId);
  document.addEventListener("keydown", onKeyDown);
  view.replay.addEventListener("click", onReplay);
  view.reset .addEventListener("click", onReset);
  view.next  .addEventListener("click", onNext);

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
    replay.length = 0;
    model.levelId = id;
    game = structuredClone(levels[model.levelId]);
    view.levelId.textContent = (model.levelId + 1).toString();
    storeGame(model);
    setSolvedStyle();
    setReplayStyle();
    setNextStyle();
    scaleCanvas();
    render();
  }

  function markGameSolved(): void {
    if (!model.solvedIds.includes(model.levelId)) {
      model.solvedIds.push(model.levelId);
    }
    model.replays[model.levelId] = replay.slice();
    storeGame(model);
    setSolvedStyle();
    setReplayStyle();
    setNextStyle();
    showNext();
  }

  function setSolvedStyle(): void {
    if (model.solvedIds.includes(model.levelId)) {
      view.solved.classList.remove("d-none");
      view.solved.classList.add("d-inline-block");
    } else {
      view.solved.classList.add("d-none");
      view.solved.classList.remove("d-inline-block");
    }
  }

  function setReplayStyle(): void {
    if (
      model.solvedIds.includes(model.levelId) &&
      Array.isArray(model.replays[model.levelId]) &&
      model.replays[model.levelId].length > 0
    ) {
      view.replay.classList.remove("d-none");
      view.replay.classList.add("d-inline-block");
    } else {
      hideReplay();
    }
  }

  function setNextStyle(): void {
    if (model.solvedIds.includes(model.levelId)) {
      showNext();
    } else {
      view.next.classList.remove("d-inline-block");
      view.next.classList.add("d-none");
    }
  }

  function hideReplay(): void {
    view.replay.classList.remove("d-inline-block");
    view.replay.classList.add("d-none");
  }

  function showNext(): void {
    view.next.classList.remove("d-none");
    view.next.classList.add("d-inline-block");
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (isReplaying) return;

    switch (event.key) {
      case "+":
      case "=":
        event.preventDefault();
        if (model.scale < 3) model.scale += 0.2;
        scaleCanvas();
        render();
        storeGame(model);
        break;
      case "-":
        event.preventDefault();
        if (model.scale > 0.4) model.scale -= 0.2;
        scaleCanvas();
        render();
        storeGame(model);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (event.ctrlKey) {
          setLevel(Math.min(model.levelId + 1, levels.length - 1));
          return;
        }

        if (canMove(game, -1, 0)) {
          doMove(game, -1, 0);
          render();
          replay.push(EDir.up);
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if (canMove(game, 0, 1)) {
          doMove(game, 0, 1);
          render();
          replay.push(EDir.right);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (canMove(game, 0, -1)) {
          doMove(game, 0, -1);
          render();
          replay.push(EDir.left);
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (event.ctrlKey) {
          setLevel(Math.max(model.levelId - 1, 0));
          return;
        }

        if (canMove(game, 1, 0)) {
          doMove(game, 1, 0);
          render();
          replay.push(EDir.down);
        }
        break;
    }

    if (isSolved(game)) {
      markGameSolved();
    }
  }

  function onReplay(event: Event): void {
    event.preventDefault();
    if (isReplaying) return;
    if (!Array.isArray(model.replays[model.levelId]) ||
        model.replays[model.levelId].length === 0) return;
    isReplaying = true;
    game = structuredClone(levels[model.levelId]);
    render();

    const time_step = 200;
    setTimeout(loop, time_step, 0);

    function loop(i: number): void {
      if (i >= model.replays[model.levelId].length) {
        isReplaying = false;
        return;
      }

      switch (model.replays[model.levelId][i]) {
        case EDir.up:
          if (canMove(game, -1, 0)) {
            doMove(game, -1, 0);
            render();
          }
          break;
        case EDir.left:
          if (canMove(game, 0, -1)) {
            doMove(game, 0, -1);
            render();
          }
          break;
        case EDir.right:
          if (canMove(game, 0, 1)) {
            doMove(game, 0, 1);
            render();
          }
          break;
        case EDir.down:
          if (canMove(game, 1, 0)) {
            doMove(game, 1, 0);
            render();
          }
          break;
      }

      setTimeout(loop, time_step, i + 1);
    }
  }

  function onReset(event: Event): void {
    event.preventDefault();
    if (isReplaying) return;
    setLevel(model.levelId);
  }

  function onNext(event: Event): void {
    event.preventDefault();
    if (isReplaying) return;
    setLevel(Math.min(model.levelId + 1, levels.length - 1));
  }
}
