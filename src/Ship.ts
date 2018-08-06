import { Coordinates } from "./Coordinates";

export enum SHIP_TYPE {
  BATTLESHIP = "0",
  FRIGATE = "1",
  SUBMARINE = "2"
}

export class Ship {
  static MAX_HEALTH = 10;
  static FIRING_RANGE = 100;
  static VISIBILITY_RANGE = 200;

  public coordinates: Coordinates;
  public type: SHIP_TYPE;
  public flag: number;
  public health: number;
  public id: number = 0;

  constructor(
    id: number,
    coordinates: Coordinates,
    type: SHIP_TYPE,
    health: number,
    flag: number
  ) {
    this.id = id;
    this.coordinates = coordinates;
    this.type = type;
    this.flag = flag;
    this.health = health;
  }

  distanceTo(target: Ship | Coordinates) {
    return this.coordinates.distanceTo(target);
  }

  directionsTo(target: Ship | Coordinates) {
    return this.coordinates.directionsTo(target);
  }

  toString() {
    return `<Ship id=${this.id} coords=${this.coordinates} type=${
      this.type
    } health=${this.health} flag=${this.flag}>`;
  }
}
