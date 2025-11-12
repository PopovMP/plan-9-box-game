export interface IPoint {
  s: number; // South coordinate
  e: number; // East coordinate
}

export interface IGame {
  id   : number,
  hero : IPoint,
  boxes: IPoint[],
  map  : string[],
}

export interface IGameModel {
  scale    : number;
  levelId  : number;
  solvedIds: number[];
  replays  : number[][];
}

export const EDir = {
  up   : 1,
  right: 2,
  left : 3,
  down : 4,
};

function isPointEq(p1: IPoint, p2: IPoint): boolean {
  return p1.s === p2.s && p1.e === p2.e;
}

function makePointNext(point: IPoint, ds: number, de: number): IPoint {
  return {s: point.s + ds, e: point.e + de};
}

function movePoint(point: IPoint, ds: number, de: number): void {
  point.s += ds;
  point.e += de;
}

function moveBox(game: IGame, fromPos: IPoint, ds: number, de: number): void {
  for (const box of game.boxes) {
    if (isPointEq(box, fromPos)) {
      movePoint(box, ds, de);
      break;
    }
  }
}

function getMapCharAt(game: IGame, pos: IPoint): string {
  if (
    pos.s >= 0 && pos.s < game.map.length &&
    pos.e >= 0 && pos.e < game.map[pos.s].length
  ) {
    return game.map[pos.s][pos.e];
  }

  return "";
}

function isBoxAt(game: IGame, pos: IPoint): boolean {
  for (const box of game.boxes) {
    if (isPointEq(box, pos)) return true;
  }

  return false;
}

// Gets if there is a steppable floor tile at pos
function isFloorAt(game: IGame, pos: IPoint): boolean {
  const char: string = getMapCharAt(game, pos);
  return char === " " || char === ".";
}

function isFreeAt(game: IGame, pos: IPoint): boolean {
    return isFloorAt(game, pos) && !isBoxAt(game, pos);
}

export function canMove(game: IGame, ds: number, de: number): boolean {
  const posNext: IPoint = makePointNext(game.hero, ds, de);
  if (isFreeAt(game, posNext)) return true;

  if (isBoxAt(game, posNext)) {
      const posNexter: IPoint = makePointNext(posNext, ds, de);
      if (isFreeAt(game, posNexter)) return true;
  }

  return false;
}

export function doMove(game: IGame, ds: number, de: number): void {
  const posNext: IPoint = makePointNext(game.hero, ds, de);
  if (isBoxAt(game, posNext)) {
      const posNexter: IPoint = makePointNext(posNext, ds, de);
      if (isFreeAt(game, posNexter)) {
          moveBox(game, posNext, ds, de);
      } else {
          throw new Error(`Cannot move a box at: ${posNexter}`);
      }
  }

  if (isFreeAt(game, posNext)) {
      movePoint(game.hero, ds, de);
  } else {
      throw new Error(`Cannot move the hero at: ${posNext}`);
  }
}

export function isSolved(game: IGame): boolean {
  for (const box of game.boxes) {
    if (getMapCharAt(game, box) !== ".") {
      return false;
    }
  }

  return true;
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
        model.replays = structuredClone(modelDto.replays);
      }
    } catch {
      // skip
    }
  }

  return model;
}
