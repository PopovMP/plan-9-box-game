import { type IGame, UP, LEFT, RIGHT, DOWN } from "./def.ts";
import { moveBox, setGameState } from "./game-engine.ts";

export function initBoxMap(game: IGame): void {
  const mapWidth = game.map[0].length;
  game.boxMap = new Array(game.map.length);
  for (let i = 0, len = game.map.length; i < len; i++) {
    game.boxMap[i] = new Array(mapWidth).fill(false);
  }
}

export function setBoxMap(game: IGame): void {
  const boxMap = game.boxMap;
  // Reset the map
  for (let i = 0, len = game.map.length; i < len; i++) {
    boxMap[i].fill(false);
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
  for (let i = 0, len = game.map.length; i < len; i++) {
    game.goodMap[i] = new Array(mapWidth).fill(false);
  }
}

export function setGoodMap(game: IGame): void {
  const mapWidth: number = game.map[0].length;
  const gameMap = game.map;
  const goodMap = game.goodMap;

  // Reset goodMap
  for (let i = 1, len = gameMap.length; i < len - 1; i++) {
    goodMap[i] = new Array(mapWidth).fill(false);
  }

  let isChanged;
  do {
    isChanged = false;
    for (let i = 1, len = gameMap.length; i < len - 1; i++) {
    for (let j = 1; j < mapWidth - 1; j++) {
      let ch: string;
      if (goodMap[i][j]) continue;
      if ((ch = gameMap[i][j]) === "#" || ch === "_") continue;

      // It is goal tile
      if (gameMap[i][j] === ".") {
        goodMap[i][j] = true;
        isChanged = true;
        continue;
      }

      if (
        (goodMap[i-1][j  ] && ((ch = gameMap[i+1][j  ]) === " " || ch === ".")) ||
        (goodMap[i  ][j+1] && ((ch = gameMap[i  ][j-1]) === " " || ch === ".")) ||
        (goodMap[i+1][j  ] && ((ch = gameMap[i-1][j  ]) === " " || ch === ".")) ||
        (goodMap[i  ][j-1] && ((ch = gameMap[i  ][j+1]) === " " || ch === "."))
      ) {
        goodMap[i][j] = true;
        isChanged = true;
        continue;
      }
    }}
  } while (isChanged);
}

export function initStepMap(game: IGame): void {
  const mapWidth = game.map[0].length;
  game.stepMap = new Array(game.map.length);
  for (let i = 0, len = game.map.length; i < len; i++) {
    game.stepMap[i] = new Array(mapWidth).fill(false);
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
    for (let i = 1, len = gameMap.length; i < len - 1; i++) {
    for (let j = 1; j < mapWidth - 1; j++) {
      let ch: string;
      if (stepMap[i][j]) continue;
      if ((ch = gameMap[i][j]) === "#" || ch === "_" || boxMap[i][j]) continue;

      if (
        stepMap[i-1][j  ] ||
        stepMap[i  ][j+1] ||
        stepMap[i+1][j  ] ||
        stepMap[i  ][j-1]
      ) {
        stepMap[i][j] = true;
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
  let   calcs = 0;
  setState(game);
  pastGames.add(game.gameId);

  let isSolved = false;
  try {
    isSolved = doBranchMoves();
    setState(game);
  } catch (e){
    console.error((e as Error).message);
    setState(game);
  }

  if (isSolved) {
    console.log("Solved!");
    console.log("Calcs:", calcs);
    console.log("Track:", track.join(", "));
    console.log("Moves:", track.length);
    return track;
  } else {
    console.log("Not solved!");
    console.log("Calcs:", calcs);
    return [];
  }

  function doBranchMoves(): boolean {
    for (const move of game.possibleMoves) {
      const heroBack  = game.heroPos;
      const boxesBack = game.boxesPos.slice();

      const pos = Math.trunc(move / 100);
      const dir = move % 100;
      moveBox(game.boxesPos, pos, dir);
      game.heroPos = pos;
      setState(game);
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

function setState(game: IGame): void {
  setBoxMap(game);
  setStepMap(game);
  setPossibleMoves(game);
  setGameState(game);
}
