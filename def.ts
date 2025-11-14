export interface IPoint {
  s: number; // South coordinate
  e: number; // East coordinate
}

export interface ILevel {
  id     : number,
  hero   : IPoint,
  boxes  : IPoint[],
  map    : string[],
}

export interface IGame extends ILevel {
  boxMap : boolean[][],
  goodMap: boolean[][],
  stepMap: boolean[][],
  possibleMoves: number[],
  heroPos : number;
  boxesPos: number[];
  boxesId : number;
  gameId  : number;
  initialGameId: number;
  solvedBoxesId: number;
}

export interface IGameModel {
  scale    : number;
  levelId  : number;
  solvedIds: number[];
  replays  : number[][];
}

export const EDir = {
  up       :  1,
  right    :  2,
  left     :  3,
  down     :  4,
  pushUp   : 11,
  pushRight: 12,
  pushLeft : 13,
  pushDown : 14,
};


export const UP    = 0b0000_0001;
export const RIGHT = 0b0000_0010;
export const LEFT  = 0b0000_0100;
export const DOWN  = 0b0000_1000;
