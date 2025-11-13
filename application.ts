import {
  type IGame, type IGameModel, EDir, canMove, doMove, isSolved, loadGame, storeGame,
  moveBox, makePointNext, areGameEqual,
} from "./game-engine.ts";
import { easyLevels } from "./easy-levels.ts";
import { render, scaleCanvas } from "./renderer.ts";

interface IView {
  board  : HTMLCanvasElement;
  levelId: HTMLElement;
  solved : HTMLElement;
  replay : HTMLElement;
  reset  : HTMLElement;
  next   : HTMLElement;
  info   : HTMLElement;
  undo   : HTMLElement;
}

export function main(): void {
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

  let game: IGame;
  let isReplaying = false;

  setLevel(model.levelId);
  document.addEventListener("keydown", onKeyDown);
  view.replay.addEventListener("click", onReplay);
  view.reset .addEventListener("click", onReset);
  view.next  .addEventListener("click", onNext);
  view.undo  .addEventListener("click", onUndo);

  function setLevel(id: number): void {
    replay.length = 0;
    model.levelId = id;
    game = structuredClone(levels[model.levelId]);
    view.levelId.textContent = (model.levelId + 1).toString();
    view.info.innerHTML = `Solved <strong>${model.solvedIds.length}</strong>
                           out of <strong>${levels.length}</strong> levels.`;
    storeGame(model);
    setSolvedStyle();
    setResetStyle();
    setReplayStyle();
    setNextStyle();
    setUndoStyle();
    scaleCanvas(view.board, game, model.scale);
    render(view.board, game, model.scale);
  }

  function markGameSolved(): void {
    if (!model.solvedIds.includes(model.levelId)) {
      model.solvedIds.push(model.levelId);
    }
    model.replays[model.levelId] = replay.slice();
    replay.length = 0;
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

  function setResetStyle(): void {
    if (areGameEqual(game, levels[model.levelId])) {
      view.reset.classList.add("d-none");
      view.reset.classList.remove("d-inline-block");
    } else {
      view.reset.classList.remove("d-none");
      view.reset.classList.add("d-inline-block");
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
    if (areGameEqual(game, levels[model.levelId])) {
      replay.length = 0;
    }

    if (replay.length === 0 || isSolved(game)) {
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
    let dir = 0;

    switch (event.key) {
      case "+":
      case "=":
        event.preventDefault();
        if (model.scale < 3) model.scale += 0.2;
        scaleCanvas(view.board, game, model.scale);
        break;
      case "-":
        event.preventDefault();
        if (model.scale > 0.4) model.scale -= 0.2;
        scaleCanvas(view.board, game, model.scale);
        storeGame(model);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (event.ctrlKey) {
          setLevel(Math.min(model.levelId + 1, levels.length - 1));
          return;
        }

        if ((dir = canMove(game, -1, 0)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if ((dir = canMove(game, 0, 1)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if ((dir = canMove(game, 0, -1)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (event.ctrlKey) {
          setLevel(Math.max(model.levelId - 1, 0));
          return;
        }

        if ((dir = canMove(game, 1, 0)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
        }
        break;
      case "u":
      case "U":
        event.preventDefault();
        undoMove();
        break;
    }

    render(view.board, game, model.scale);
    setUndoStyle();
    setResetStyle();
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
    replay.length = 0;
    render(view.board, game, model.scale);

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
          doMove(game, EDir.up);
          break;
        case EDir.left:
        case EDir.pushLeft:
          doMove(game, EDir.left);
          break;
        case EDir.right:
        case EDir.pushRight:
          doMove(game, EDir.right);
          break;
        case EDir.down:
        case EDir.pushDown:
          doMove(game, EDir.down);
          break;
        }

      render(view.board, game, model.scale);
      setTimeout(loop, time_step, i + 1);
    }
  }

  function undoMove(): void {
    if (isReplaying) return;
    if (replay.length === 0) return;
    const lastMove = replay.pop();

    switch (lastMove) {
      case EDir.up:
        doMove(game, EDir.down);
        break;
      case EDir.pushUp: {
          const pos = makePointNext(game.hero, -1, 0);
          doMove(game, EDir.pushDown);
          moveBox(game, pos, 1, 0);
        } break;
      case EDir.left:
        doMove(game, EDir.right);
        break;
      case EDir.pushLeft: {
          const pos = makePointNext(game.hero, 0, -1);
          doMove(game, EDir.pushRight);
          moveBox(game, pos, 0, 1);
        } break;
      case EDir.right:
        doMove(game, EDir.left);
        break;
      case EDir.pushRight: {
          const pos = makePointNext(game.hero, 0, 1);
          doMove(game, EDir.pushLeft);
          moveBox(game, pos, 0, -1);
        } break;
      case EDir.down:
        doMove(game,EDir.up);
        break;
      case EDir.pushDown: {
          const pos = makePointNext(game.hero, 1, 0);
          doMove(game, EDir.pushUp);
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
    render(view.board, game, model.scale);
    setUndoStyle();
  }
}
