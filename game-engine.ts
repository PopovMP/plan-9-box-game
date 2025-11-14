import { type IGame, type IGameModel, type ILevel, UP, LEFT, RIGHT, DOWN, PUSH } from "./def.ts";

export function moveBox(boxesPos: number[], pos: number, dir: number): void {
  for (let i = 0; i < boxesPos.length; i++) {
    const boxPos = boxesPos[i];
    if (boxPos === pos) {
      const s = Math.trunc(boxPos / 100);
      const e = boxPos % 100;
           if (dir & UP   ) boxesPos[i] = (s-1) * 100 + e;
      else if (dir & DOWN ) boxesPos[i] = (s+1) * 100 + e;
      else if (dir & LEFT ) boxesPos[i] = s * 100 + (e-1);
      else if (dir & RIGHT) boxesPos[i] = s * 100 + (e+1);
      break;
    }
  }
  boxesPos.sort();
}

function getMapCharAt(game: IGame, pos: number): string {
  const s = Math.trunc(pos / 100);
  const e = pos % 100;
  return game.map[s][e];
}

function isBoxAt(boxesPos: number[], pos: number): boolean {
  return boxesPos.includes(pos);
}

// Gets if there is a steppable floor tile at pos
function isFloorAt(game: IGame, pos: number): boolean {
  const char: string = getMapCharAt(game, pos);
  return char === " " || char === ".";
}

function isFreeAt(game: IGame, pos: number): boolean {
    return isFloorAt(game, pos) && !isBoxAt(game.boxesPos, pos);
}

export function makePointNext(pos: number, dir: number): number {
  const s = Math.trunc(pos / 100);
  const e = pos % 100;

  if (dir & UP   ) return (s-1) * 100 + e;
  if (dir & DOWN ) return (s+1) * 100 + e;
  if (dir & LEFT ) return s * 100 + (e-1);
  if (dir & RIGHT) return s * 100 + (e+1);

  throw new Error(`Unreachble. Wrong dir: ${dir}`);
}

export function canMove(game: IGame, dir: number): number {
  const posNext: number = makePointNext(game.heroPos, dir);

  if (!isFloorAt(game, posNext)) return 0;

  if (isBoxAt(game.boxesPos, posNext)) {
      const posNexter: number = makePointNext(posNext, dir);
      if (isFreeAt(game, posNexter)) {
        return PUSH | dir;
      } else {
        return 0;
      }
  }

  return dir;
}

export function doMove(game: IGame, dir: number): void {
  const posNext: number = makePointNext(game.heroPos, dir);

  if (isBoxAt(game.boxesPos, posNext)) {
    const posNexter: number = makePointNext(posNext, dir);
    if (isFreeAt(game, posNexter)) {
      moveBox(game.boxesPos, posNext, dir);
    } else {
      throw new Error(`Cannot move a box at: ${posNexter}`);
    }
  }

  if (isFreeAt(game, posNext)) {
    game.heroPos = posNext;
  } else {
    throw new Error(`Cannot move the hero at: ${posNext}`);
  }
}

export function isSolved(game: IGame): boolean {
  return game.boxesId === game.solvedBoxesId;
}

export function storeGame(model: IGameModel): void {
  const modelTxt: string = JSON.stringify(model);
  localStorage.setItem("plan-9-box-game", modelTxt);
}

export function loadGame(): IGameModel {
  const model: IGameModel = {
    scale    : 1.4,
    levelId  : 0,
    solvedIds: [],
    replays  : [],
  };

  const modelTxt: string|null = localStorage.getItem("plan-9-box-game");

  if (typeof modelTxt === "string") {
    try {
      const modelDto: IGameModel = JSON.parse(modelTxt);
      if (typeof modelDto.scale === "number") {
        model.scale = modelDto.scale;
      }
      if (typeof modelDto.levelId === "number") {
        model.levelId = modelDto.levelId;
      }
      if (Array.isArray(modelDto.solvedIds)) {
        model.solvedIds = modelDto.solvedIds.slice();
      }
      if (Array.isArray(modelDto.replays)) {
        model.replays = new Array(modelDto.replays.length);
        for (let i = 0; i < modelDto.replays.length; i++) {
          if (Array.isArray(modelDto.replays[i])) {
              model.replays[i] = modelDto.replays[i].slice();
          } else {
            model.replays[i] = [];
          }
        }
      }
    } catch {
      // skip
    }
  }

  return model;
}

export function initGameState(level: ILevel): IGame {
  const game: IGame = {
    map          : structuredClone(level.map),
    boxMap       : [],
    goodMap      : [],
    stepMap      : [],
    possibleMoves: [],
    heroPos      : level.hero.s * 100 + level.hero.e,
    boxesPos     : level.boxes.map(b => b.s * 100 + b.e).sort(),
    boxesId      : 0,
    gameId       : level.id,
    initialGameId: 0,
    solvedBoxesId: 0,
  };

  game.boxesId       = getNumArrId(game.boxesPos);
  game.gameId        = (31 * game.boxesId + game.heroPos) >>> 0;
  game.initialGameId = game.gameId;

  const mapWidth = game.map[0].length;
  const goalsPos: number[] = [];
  for (let s = 0; s < game.map.length; s++) {
  for (let e = 0; e < mapWidth; e++) {
    if (game.map[s][e] === ".") {
      goalsPos.push(s*100 + e);
    }
  }}
  goalsPos.sort();

  game.solvedBoxesId = getNumArrId(goalsPos);

  return game;
}

export function setGameState(game: IGame): void {
  game.boxesId = getNumArrId(game.boxesPos);
  game.gameId  = (31 * game.boxesId + game.heroPos) >>> 0;
}

function getNumArrId(nums: number[]): number {
  let res = 0;
  for (const num of nums) {
    res = (31 * res + num) | 0; // Convert to signed 32 bit int
  }
  return res >>> 0; // Convert to unsigned 32 bit int
}
