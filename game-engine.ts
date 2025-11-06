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
