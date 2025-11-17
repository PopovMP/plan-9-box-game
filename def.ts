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

export interface IMouseModel {
  hoverPos : number;   // Posiiton of the hovered tile. 0 otherwise
  heroTrack: number[]; // Hero track to plot. Empty for none
  boxDir   : number;   // Direction of the possible push. 0 otherwise
}

export interface IGame {
  map          : string[],
  boxMap       : boolean[][],
  goodMap      : boolean[][],
  stepMap      : boolean[][],
  possibleMoves: number[],
  heroPos      : number;
  boxesPos     : number[];
  boxesId      : number;
  gameId       : number;
  initialGameId: number;
  solvedBoxesId: number;
  mouseModel   : IMouseModel;
}

export interface IGameModel {
  scale    : number;
  levelId  : number;
  solvedIds: number[];
  replays  : number[][];
}

export const UP    = 0b0000_0001;
export const RIGHT = 0b0000_0010;
export const LEFT  = 0b0000_0100;
export const DOWN  = 0b0000_1000;
export const PUSH  = 0b0001_0000;
