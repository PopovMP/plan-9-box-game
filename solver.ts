import { type IGame, UP, LEFT, RIGHT, DOWN } from "./def.ts";
import { moveBox, setGameState } from "./game-engine.ts";

export function initBoxMap(game: IGame): void {
  const mapWidth = game.map[0].length;
  game.boxMap = new Array(game.map.length);
  for (let s = 0, len = game.map.length; s < len; s++) {
    game.boxMap[s] = new Array(mapWidth).fill(false);
  }
}

export function setBoxMap(game: IGame): void {
  const boxMap = game.boxMap;
  // Reset the map
  for (let s = 0, len = game.map.length; s < len; s++) {
    boxMap[s].fill(false);
  }

  // Set the boxes
  for (const boxPos of game.boxesPos) {
    const s = Math.trunc(boxPos / 100);
    const e = boxPos % 100;
    boxMap[s][e] = true;
  }
}

export function initGoodMap(game: IGame): void {
  const mapWidth = game.map[0].length;
  game.goodMap = new Array(game.map.length);
  for (let s = 0, len = game.map.length; s < len; s++) {
    game.goodMap[s] = new Array(mapWidth).fill(false);
  }
}

export function setGoodMap(game: IGame): void {
  const mapWidth: number = game.map[0].length;
  const gameMap = game.map;
  const goodMap = game.goodMap;

  // Reset goodMap
  for (let s = 1, len = gameMap.length; s < len - 1; s++) {
    goodMap[s] = new Array(mapWidth).fill(false);
  }

  let isChanged;
  do {
    isChanged = false;
    for (let s = 1, len = gameMap.length; s < len - 1; s++) {
    for (let e = 1; e < mapWidth - 1; e++) {
      let ch: string;
      if (goodMap[s][e]) continue;
      if ((ch = gameMap[s][e]) === "#" || ch === "_") continue;

      // It is goal tile
      if (gameMap[s][e] === ".") {
        goodMap[s][e] = true;
        isChanged = true;
        continue;
      }

      if (
        (goodMap[s-1][e  ] && ((ch = gameMap[s+1][e  ]) === " " || ch === ".")) ||
        (goodMap[s  ][e+1] && ((ch = gameMap[s  ][e-1]) === " " || ch === ".")) ||
        (goodMap[s+1][e  ] && ((ch = gameMap[s-1][e  ]) === " " || ch === ".")) ||
        (goodMap[s  ][e-1] && ((ch = gameMap[s  ][e+1]) === " " || ch === "."))
      ) {
        goodMap[s][e] = true;
        isChanged = true;
        continue;
      }
    }}
  } while (isChanged);
}

export function initStepMap(game: IGame): void {
  const mapWidth = game.map[0].length;
  game.stepMap = new Array(game.map.length);
  for (let s = 0, len = game.map.length; s < len; s++) {
    game.stepMap[s] = new Array(mapWidth).fill(false);
  }
}

export function setStepMap(game: IGame): boolean[][] {
  const gameMap = game.map;
  const mapWidth: number = gameMap[0].length;
  const boxMap : boolean[][] = game.boxMap;
  const stepMap: boolean[][] = game.stepMap;

  // Reset stepMap
  for (let i = 0, len = gameMap.length; i < len; i++) {
    stepMap[i] = new Array(mapWidth).fill(false);
  }

  // It is the hero tile
  const hs = Math.trunc(game.heroPos / 100);
  const he = game.heroPos % 100;
  stepMap[hs][he] = true;

  // Set stepMap
  let isChanged;
  do {
    isChanged = false;
    for (let s = 1, len = gameMap.length; s < len - 1; s++) {
    for (let e = 1; e < mapWidth - 1; e++) {
      let ch: string;
      if (stepMap[s][e]) continue;
      if ((ch = gameMap[s][e]) === "#" || ch === "_" || boxMap[s][e]) continue;

      if (
        stepMap[s-1][e  ] ||
        stepMap[s  ][e+1] ||
        stepMap[s+1][e  ] ||
        stepMap[s  ][e-1]
      ) {
        stepMap[s][e] = true;
        isChanged = true;
        continue;
      }
    }}
  } while (isChanged);

  return stepMap;
}

export function setPossibleMoves(game: IGame): void {
  const goodMap = game.goodMap;
  const stepMap = game.stepMap;
  const boxMap  = game.boxMap;
  game.possibleMoves.length = 0;

  for (const boxPos of game.boxesPos) {
    const s = Math.trunc(boxPos / 100);
    const e = boxPos % 100;

    if (goodMap[s-1][e] && stepMap[s+1][e] && !boxMap[s+1][e] && !boxMap[s-1][e]) {
      game.possibleMoves.push(boxPos * 100 + UP);
    }
    if (goodMap[s+1][e] && stepMap[s-1][e] && !boxMap[s+1][e] && !boxMap[s-1][e]) {
      game.possibleMoves.push(boxPos * 100 + DOWN);
    }
    if (goodMap[s][e+1] && stepMap[s][e-1] && !boxMap[s][e+1] && !boxMap[s][e-1]) {
      game.possibleMoves.push(boxPos * 100 + RIGHT);
    }
    if (goodMap[s][e-1] && stepMap[s][e+1] && !boxMap[s][e+1] && !boxMap[s][e-1]) {
      game.possibleMoves.push(boxPos * 100 + LEFT);
    }
  }
}

export function runSolver(game: IGame): number[] {
  const pastGames = new Set<number>();
  const track: number[] = [];
  setState(game);
  pastGames.add(game.gameId);

  const initialHeroPos  = game.heroPos;
  const initialBoxesPos = game.boxesPos.slice();

  let calcs    = 0;
  let isSolved = false;
  try {
    isSolved = doBranchMoves();
  } catch (e){
    console.error((e as Error).message);
  }

  game.heroPos  = initialHeroPos;
  game.boxesPos = initialBoxesPos;
  setState(game);

  if (isSolved) {
    optimizeTrack(game, track);
    console.log(`Solved! Calcs: ${calcs}, Steps: ${track.length}`);
    return track;
  } else {
    console.log(`Not Solved! Calcs: ${calcs}`);
    return [];
  }

  function doBranchMoves(): boolean {
    for (const move of game.possibleMoves) {
      const heroBack  = game.heroPos;
      const boxesBack = game.boxesPos.slice();

      jumpMove(game, move);
      calcs++;

      if (pastGames.has(game.gameId)) {
        game.heroPos  = heroBack;
        game.boxesPos = boxesBack;
        setState(game);
        continue;
      }

      pastGames.add(game.gameId);
      track.push(move);

      if (game.boxesId === game.solvedBoxesId)
        return true; // Solved

      if (doBranchMoves())
        return true; // solved

      track.pop();
      game.heroPos  = heroBack;
      game.boxesPos = boxesBack;
      setState(game);
    }

    return false;
  }
}

function optimizeTrack(game: IGame, track: number[]): void {
  const initialHeroBack  = game.heroPos;
  const initialBoxesBack = game.boxesPos.slice();

  let i = 0;
  while (i < track.length) {
    let isOptimised = false;

    const heroBack  = game.heroPos;
    const boxesBack = game.boxesPos.slice();
    const boxesId   = game.boxesId;

    const hs = Math.trunc(game.heroPos / 100);
    const he = game.heroPos % 100;
    for (let j = i; j < track.length; j++) {
      jumpMove(game, track[j]);
      if (game.boxesId === boxesId && game.stepMap[hs][he]) {
        track.splice(i, (j - i) + 1);
        isOptimised = true;
        break;
      }
    }

    game.heroPos  = heroBack;
    game.boxesPos = boxesBack.slice();
    setState(game);

    if (!isOptimised) {
      jumpMove(game, track[i]);
      i++;
    }
  }

  game.heroPos  = initialHeroBack;
  game.boxesPos = initialBoxesBack;
  setState(game);
}

function jumpMove(game: IGame, move: number): void {
  const pos = Math.trunc(move / 100);
  const dir = move % 100;
  moveBox(game.boxesPos, pos, dir);
  game.heroPos = pos;
  setState(game);
}

function setState(game: IGame): void {
  setBoxMap(game);
  setStepMap(game);
  setPossibleMoves(game);
  setGameState(game);
}
