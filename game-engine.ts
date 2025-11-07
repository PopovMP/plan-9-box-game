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
  for (let i = 0; i < game.boxes.length; i++) {
    const box: IPoint = game.boxes[i];
    if (box.s === pos.s && box.e === pos.e) {
      return true;
    }
  }

  return false;
}

export function canMove(game: IGame, ds: number, de: number): boolean {
  const posNext    = {s: game.hero.s +   ds, e: game.hero.e +   de};
  const posNexter  = {s: game.hero.s + 2*ds, e: game.hero.e + 2*de};
  const nextChar   = getMapCharAt(game, posNext);
  const nexterChar = getMapCharAt(game, posNexter);

  if (nextChar === " " || nextChar === ".") {
    if (!isBoxAt(game, posNext)) return true;

    // Check if can box be moved
    if (nexterChar === " " || nexterChar === ".") {
      if (!isBoxAt(game, posNexter)) return true;
    }
  }

  return false;
}

export function doMove(game: IGame, ds: number, de: number): void {
  const posNext = {s: game.hero.s + ds, e: game.hero.e + de};

  for (let i = 0; i < game.boxes.length; i++) {
    const box: IPoint = game.boxes[i];
    if (box.s === posNext.s && box.e === posNext.e) {
      box.s += ds;
      box.e += de;
      break;
    }
  }

  game.hero.s += ds;
  game.hero.e += de;
}
