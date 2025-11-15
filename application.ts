import { type IGame, type ILevel, type IGameModel, UP, LEFT, RIGHT, DOWN, PUSH } from "./def.ts";
import { canMove, doMove, isSolved, loadGame, storeGame, moveBox, makePointNext, setGameState, initGameState, findOppositePosition, findHeroTrack } from "./game-engine.ts";
import { initGoodMap, setGoodMap, setPossibleMoves, initBoxMap, setBoxMap, initStepMap, setStepMap, runSolver } from "./solver.ts";
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
  const levels: ILevel[]   = easyLevels;
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
  let isReplaying  = false;
  let isStopReplay = false;

  setLevel(model.levelId);
  document.addEventListener("keydown", onKeyDown);
  view.replay.addEventListener("click", onReplay);
  view.reset .addEventListener("click", onReset);
  view.next  .addEventListener("click", onNext);
  view.undo  .addEventListener("click", onUndo);

  function setLevel(id: number): void {
    replay.length = 0;
    model.levelId = id;
    const level: ILevel = structuredClone(levels[model.levelId]);
    game = initGameState(level);
    initGoodMap(game);
    initBoxMap(game);
    initStepMap(game);
    setGoodMap(game);
    setBoxMap(game);
    setStepMap(game);
    setPossibleMoves(game);
    setGameState(game);

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
    if (game.gameId === game.initialGameId) {
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
    if (game.gameId === game.initialGameId) {
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
    if (event.key === "x") {
        event.preventDefault();
        isStopReplay = true;
        return;
    }
    if (isReplaying) return;
    let dir = 0;
    let isMove = false;

    switch (event.key) {
      case "s": {
        event.preventDefault();
        const track: number[] = runSolver(game);
        playSolution(track);
        return;
      }
      case "+":
      case "=":
        event.preventDefault();
        if (model.scale < 3) model.scale += 0.2;
        scaleCanvas(view.board, game, model.scale);
        render(view.board, game, model.scale);
        storeGame(model);
        return;
      case "-":
        event.preventDefault();
        if (model.scale > 0.4) model.scale -= 0.2;
        scaleCanvas(view.board, game, model.scale);
        render(view.board, game, model.scale);
        storeGame(model);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (event.ctrlKey) {
          setLevel(Math.min(model.levelId + 1, levels.length - 1));
          return;
        }

        if ((dir = canMove(game, UP)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
          isMove = true;
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if ((dir = canMove(game, RIGHT)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
          isMove = true;
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if ((dir = canMove(game, LEFT)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
          isMove = true;
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        if (event.ctrlKey) {
          setLevel(Math.max(model.levelId - 1, 0));
          return;
        }

        if ((dir = canMove(game, DOWN)) && !isSolved(game)) {
          doMove(game, dir);
          replay.push(dir);
          isMove = true;
        }
        break;
      case "u":
      case "U":
        if (!isSolved(game)) {
          event.preventDefault();
          undoMove();
          isMove = true;
        }
        break;
    }

    if (isMove) {
      setBoxMap(game);
      setStepMap(game);
      setPossibleMoves(game);
      setGameState(game);
      render(view.board, game, model.scale);
      if (isSolved(game)) {
        markGameSolved();
      }
      setUndoStyle();
      setResetStyle();
    }
  }

  function playSolution(track: number[]): void {
    isReplaying  = true;
    isStopReplay = false;
    const time_step = 500;
    setTimeout(loop, time_step, 0);

    function loop(i: number): void {
      if (i >= track.length || isStopReplay) {
        isReplaying = false;
        setUndoStyle();
        setResetStyle();
        return;
      }

      const move = track[i];
      makeSolutionMove(move, () => {
        setBoxMap(game);
        setStepMap(game);
        setPossibleMoves(game);
        setGameState(game);
        render(view.board, game, model.scale);
        setTimeout(loop, time_step, i + 1);
      });
    }
  }

  function makeSolutionMove(move: number, callback: () => void): void {
    const pos  = Math.trunc(move / 100);
    const dir  = move % 100;
    const oppositePos: number = findOppositePosition(pos, dir);

    if (oppositePos === game.heroPos) {
      moveBox(game.boxesPos, pos, dir);
      game.heroPos = pos;
      callback();
      return;
    }

    const heroTrack: number[] = findHeroTrack(game, oppositePos);
    loop(0);

    function loop(i: number): void {
      if (i >= heroTrack.length) {
        moveBox(game.boxesPos, pos, dir);
        game.heroPos = pos;
        callback();
        return;
      }

      game.heroPos = heroTrack[i];
      render(view.board, game, model.scale);

      setTimeout(loop, 200, i + 1);
    }
  }

  function onReplay(event: Event): void {
    event.preventDefault();
    if (isReplaying) return;
    if (!Array.isArray(model.replays[model.levelId]) ||
        model.replays[model.levelId].length === 0) return;
    isReplaying  = true;
    isStopReplay = false;

    setLevel(model.levelId);

    const time_step = 200;
    setTimeout(loop, time_step, 0);

    function loop(i: number): void {
      if (i >= model.replays[model.levelId].length || isStopReplay) {
        isReplaying = false;
        setUndoStyle();
        setResetStyle();
        return;
      }

      const move = model.replays[model.levelId][i];
           if (move & UP   ) doMove(game, UP   );
      else if (move & LEFT ) doMove(game, LEFT );
      else if (move & RIGHT) doMove(game, RIGHT);
      else if (move & DOWN ) doMove(game, DOWN );

      setBoxMap(game);
      setStepMap(game);
      setPossibleMoves(game);
      setGameState(game);
      render(view.board, game, model.scale);
      setTimeout(loop, time_step, i + 1);
    }
  }

  function undoMove(): void {
    if (isReplaying) return;
    if (replay.length === 0) return;
    const lastMove = replay.pop();

    switch (lastMove) {
      case UP:
        doMove(game, DOWN);
        break;
      case PUSH | UP: {
          const pos = makePointNext(game.heroPos, UP);
          doMove(game, DOWN);
          moveBox(game.boxesPos, pos, DOWN);
        } break;
      case LEFT:
        doMove(game, RIGHT);
        break;
      case PUSH | LEFT: {
          const pos = makePointNext(game.heroPos, LEFT);
          doMove(game, RIGHT);
          moveBox(game.boxesPos, pos, RIGHT);
        } break;
      case RIGHT:
        doMove(game, LEFT);
        break;
      case PUSH | RIGHT: {
          const pos = makePointNext(game.heroPos, RIGHT);
          doMove(game, LEFT);
          moveBox(game.boxesPos, pos, LEFT);
        } break;
      case DOWN:
        doMove(game, UP);
        break;
      case PUSH | DOWN: {
          const pos = makePointNext(game.heroPos, DOWN);
          doMove(game, UP);
          moveBox(game.boxesPos, pos, UP);
      } break;
    }

    setBoxMap(game);
    setStepMap(game);
    setPossibleMoves(game);
    setGameState(game);
    setUndoStyle();
    setResetStyle();
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
