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
    if (isPointEq(box, pos)) {
      return true;
    }
  }

  return false;
}

export function canMove(game: IGame, ds: number, de: number): boolean {
  const posNext   : IPoint = makePointNext(game.hero, ds, de);
  const posNexter : IPoint = makePointNext(posNext, ds, de);
  const nextChar  : string = getMapCharAt(game, posNext);
  const nexterChar: string = getMapCharAt(game, posNexter);

  if (nextChar === " " || nextChar === ".") {
    // True if empty space
    if (!isBoxAt(game, posNext)) return true;

    // True if box movable
    if (nexterChar === " " || nexterChar === ".") {
      if (!isBoxAt(game, posNexter)) return true;
    }
  }

  return false;
}

export function doMove(game: IGame, ds: number, de: number): void {
  const posNext = makePointNext(game.hero, ds, de);
  moveBox(game, posNext, ds, de);
  movePoint(game.hero, ds, de);
}

export function isSolved(game: IGame): boolean {
  for (const box of game.boxes) {
    if (getMapCharAt(game, box) !== ".") {
      return false;
    }
  }

  return true;
}
