import {
  type IGame, type IGameModel, EDir, canMove, doMove, isSolved, loadGame, storeGame,
  moveBox, makePointNext,
} from "./game-engine.ts";
import { easyLevels } from "./easy-levels.ts";

interface IView {
  board  : HTMLCanvasElement;
  ctx    : CanvasRenderingContext2D;
  levelId: HTMLElement;
  solved : HTMLElement;
  replay : HTMLElement;
  reset  : HTMLElement;
  next   : HTMLElement;
  info   : HTMLElement;
  undo   : HTMLElement;
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
    reset  : document.getElementById("level-reset" ) as HTMLElement,
    next   : document.getElementById("level-next"  ) as HTMLElement,
    info   : document.getElementById("game-info"   ) as HTMLElement,
    undo   : document.getElementById("move-undo"   ) as HTMLElement,
  } as IView;
  view.ctx = view.board.getContext("2d") as CanvasRenderingContext2D;

  let game: IGame;
  let isReplaying = false;

  setLevel(model.levelId);
  document.addEventListener("keydown", onKeyDown);
  view.replay.addEventListener("click", onReplay);
  view.reset .addEventListener("click", onReset);
  view.next  .addEventListener("click", onNext);
  view.undo  .addEventListener("click", onUndo);

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
          view.ctx.fillStyle = "#5bbf44";
          view.ctx.fillRect(tileX+3, tileY+3, tileW-6, tileH-6);
          view.ctx.fillStyle = "#146e00";
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
    view.info.innerHTML = `Solved <strong>${model.solvedIds.length}</strong>
                           out of <strong>${levels.length}</strong> levels.`;
    storeGame(model);
    setSolvedStyle();
    setReplayStyle();
    setNextStyle();
    setUndoStyle();
    scaleCanvas();
    render();
  }

  function markGameSolved(): void {
    if (!model.solvedIds.includes(model.levelId)) {
      model.solvedIds.push(model.levelId);
    }
    model.replays[model.levelId] = replay.slice();
    view.info.innerHTML = `Solved <strong>${model.solvedIds.length}</strong>
                           out of <strong>${levels.length}</strong> levels.`;
    storeGame(model);
    setSolvedStyle();
    setReplayStyle();
    setNextStyle();
    setUndoStyle();
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

  function setUndoStyle(): void {
    if (replay.length === 0) {
      view.undo.classList.remove("d-inline-block");
      view.undo.classList.add("d-none");
    } else {
      view.undo.classList.remove("d-none");
      view.undo.classList.add("d-inline-block");
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
          const dir = doMove(game, -1, 0);
          replay.push(dir);
          render();
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if (canMove(game, 0, 1)) {
          const dir = doMove(game, 0, 1);
          replay.push(dir);
          render();
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (canMove(game, 0, -1)) {
          const dir = doMove(game, 0, -1);
          replay.push(dir);
          render();
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (event.ctrlKey) {
          setLevel(Math.max(model.levelId - 1, 0));
          return;
        }

        if (canMove(game, 1, 0)) {
          const dir = doMove(game, 1, 0);
          replay.push(dir);
          render();
        }
        break;
      case "u":
      case "U":
        event.preventDefault();
        undoMove();
        render();
        break;
    }

    setUndoStyle();

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
        case EDir.pushUp:
          if (canMove(game, -1, 0)) {
            doMove(game, -1, 0);
            render();
          }
          break;
        case EDir.left:
        case EDir.pushLeft:
          if (canMove(game, 0, -1)) {
            doMove(game, 0, -1);
            render();
          }
          break;
        case EDir.right:
        case EDir.pushRight:
          if (canMove(game, 0, 1)) {
            doMove(game, 0, 1);
            render();
          }
          break;
        case EDir.down:
        case EDir.pushDown:
          if (canMove(game, 1, 0)) {
            doMove(game, 1, 0);
            render();
          }
          break;
      }

      setTimeout(loop, time_step, i + 1);
    }
  }

  function undoMove(): void {
    if (isReplaying) return;
    if (replay.length === 0) return;
    const lastMove = replay.pop();

    switch (lastMove) {
      case EDir.up:
        doMove(game, 1, 0);
        break;
      case EDir.pushUp: {
          const pos = makePointNext(game.hero, -1, 0);
          doMove(game, 1, 0);
          moveBox(game, pos, 1, 0);
        } break;
      case EDir.left:
        doMove(game, 0, 1);
        break;
      case EDir.pushLeft: {
          const pos = makePointNext(game.hero, 0, -1);
          doMove(game, 0, 1);
          moveBox(game, pos, 0, 1);
        } break;
      case EDir.right:
        doMove(game, 0, -1);
        break;
      case EDir.pushRight: {
          const pos = makePointNext(game.hero, 0, 1);
          doMove(game, 0, -1);
          moveBox(game, pos, 0, -1);
        } break;
      case EDir.down:
        doMove(game, -1, 0);
        break;
      case EDir.pushDown: {
          const pos = makePointNext(game.hero, 1, 0);
          doMove(game, -1, 0);
          moveBox(game, pos, -1, 0);
      } break;
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

  function onUndo(event: Event): void {
    event.preventDefault();
    if (isReplaying) return;
    undoMove();
    render();
    setUndoStyle();
  }
}
