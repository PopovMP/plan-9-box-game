import { type IGame } from "./game-engine.ts";


export const UP    = 0b0000_0001;
export const RIGHT = 0b0000_0010;
export const LEFT  = 0b0000_0100;
export const DOWN  = 0b0000_1000;

export function makeBoxMap(game: IGame): boolean[][] {
  const mapWidth = game.map[0].length;
  const boxMap: boolean[][] = new Array(game.map.length);
  for (let i = 0; i < mapWidth; i++) {
    boxMap[i] = new Array(mapWidth).fill(false);
  }
  for (const box of game.boxes) {
    boxMap[box.s][box.e] = true;
  }

  return boxMap;
}

export function makeGoodMap(gameMap: string[]): boolean[][] {
  const mapWidth: number = gameMap[0].length;
  const flagMap: boolean[][] = new Array(gameMap.length);
  for (let i = 0; i < gameMap.length; i++) {
    flagMap[i] = new Array(mapWidth).fill(false);
  }

  let isChanged;
  do {
    isChanged = false;
    for (let i = 1; i < gameMap.length - 1; i++) {
    for (let j = 1; j < mapWidth - 1;       j++) {
      let ch: string;
      if (flagMap[i][j]) continue;
      if ((ch = gameMap[i][j]) === "#" || ch === "_") continue;

      // It is goal tile
      if (gameMap[i][j] === ".") {
        flagMap[i][j] = true;
        isChanged = true;
        continue;
      }

      if (
        (flagMap[i-1][j  ] && ((ch = gameMap[i+1][j  ]) === " " || ch === ".")) ||
        (flagMap[i  ][j+1] && ((ch = gameMap[i  ][j-1]) === " " || ch === ".")) ||
        (flagMap[i+1][j  ] && ((ch = gameMap[i-1][j  ]) === " " || ch === ".")) ||
        (flagMap[i  ][j-1] && ((ch = gameMap[i  ][j+1]) === " " || ch === "."))
      ) {
        flagMap[i][j] = true;
        isChanged = true;
        continue;
      }
    }}
  } while (isChanged);

  return flagMap;
}

export function findPossibleMoves(game: IGame): number[] {
  const out: number[] = [];

  if (!game.goodMap ) return out;
  if (!game.boxMap  ) return out;
  if (!game.stepMap ) return out;

  const goodMap = game.goodMap;
  const stepMap = game.stepMap;
  const boxMap  = game.boxMap;

  for (const box of game.boxes) {
    let dir = 0;
    const s = box.s;
    const e = box.e;

    if (goodMap[s-1][e] && stepMap[s+1][e] && !boxMap[s-1][e] && !boxMap[s+1][e]) {
      dir |= UP;
    }
    if (goodMap[s][e+1] && stepMap[s][e-1] && !boxMap[s][e+1] && !boxMap[s][e-1]) {
      dir |= RIGHT;
    }
    if (goodMap[s][e-1] && stepMap[s][e+1] && !boxMap[s][e+1] && !boxMap[s][e-1]) {
      dir |= LEFT;
    }
    if (goodMap[s+1][e] && stepMap[s-1][e] && !boxMap[s+1][e] && !boxMap[s-1][e]) {
      dir |= DOWN;
    }

    out.push(s * 10000 + e * 100 + dir);
  }

  return out;
}

export function makeStepMap(game: IGame): boolean[][] {
  const gameMap = game.map;
  const mapWidth: number = gameMap[0].length;
  const boxMap : boolean[][] | undefined = game.boxMap;
  const stepMap: boolean[][] = new Array(gameMap.length);
  for (let i = 0; i < gameMap.length; i++) {
    stepMap[i] = new Array(mapWidth).fill(false);
  }
  if (!boxMap) return stepMap;

  let isChanged;
  do {
    isChanged = false;
    for (let i = 1; i < gameMap.length - 1; i++) {
    for (let j = 1; j < mapWidth - 1;       j++) {
      let ch: string;
      if (stepMap[i][j]) continue;
      if ((ch = gameMap[i][j]) === "#" || ch === "_" || boxMap[i][j]) continue;

      // It is the hero tile
      if (i === game.hero.s && j === game.hero.e) {
        stepMap[i][j] = true;
        isChanged = true;
        continue;
      }

      if (
        (stepMap[i-1][j  ]) ||
        (stepMap[i  ][j+1]) ||
        (stepMap[i+1][j  ]) ||
        (stepMap[i  ][j-1])
      ) {
        stepMap[i][j] = true;
        isChanged = true;
        continue;
      }
    }}
  } while (isChanged);

  return stepMap;
}
