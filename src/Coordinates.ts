import { Ship } from "./Ship";
import { Directions } from "./Directions";

export class Coordinates {
  static MAX = 995;
  static MIN = 0;

  public x: number;
  public y: number;

  static NULL_COORDS = new Coordinates(-1, -1);

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  directionsTo(target: Coordinates | Ship): Directions {
    if (target instanceof Ship) return this.directionsTo(target.coordinates);
    return new Directions(target.x - this.x, target.y - this.y);
  }

  distanceTo(target: Coordinates | Ship): number {
    if (target instanceof Ship) return this.distanceTo(target.coordinates);
    return Math.sqrt(
      Math.pow(target.x - this.x, 2) + Math.pow(target.y - this.y, 2)
    );
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }

  clone() {
    return new Coordinates(this.x, this.y);
  }

  add(vector: Directions | Coordinates) {
    let clone = this.clone();
    clone.x += vector.x;
    clone.y += vector.y;
    return clone;
  }
}
