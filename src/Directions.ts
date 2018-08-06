export enum MOVEMENT {
  LEFT = -1,
  RIGHT = 1,
  UP = 1,
  DOWN = -1,
  FAST = 2,
  SLOW = 1
}

export class Directions {
  public x: number;
  public y: number;

  static ALL: Directions[] = [-2, 0, 2]
    .map((n: number) => {
      return [new Directions(n, -2), new Directions(n, 2)];
    })
    .reduce(
      (p: Directions[], c) => {
        p.push(...c);
        return p;
      },
      [new Directions(-2, 0), new Directions(2, 0)]
    );

  constructor(x: number, y: number) {
    this.x = Math.min(Math.max(x, -2), 2);
    this.y = Math.min(Math.max(y, -2), 2);
  }

  toString() {
    return `<${this.getStringifiedX()}, ${this.getStringifiedY()}>`;
  }

  public slow() {
    this.x = Math.min(Math.max(this.x, -1), 1);
    this.y = Math.min(Math.max(this.y, -1), 1);
    return this;
  }

  private getStringifiedX() {
    switch (this.x) {
      case -2:
        return "FAST_LEFT";
      case -1:
        return "SLOW_LEFT";
      case 0:
        return "NO-OP";
      case 1:
        return "SLOW_RIGHT";
      case 2:
        return "FAST_RIGHT";
    }
  }

  private getStringifiedY() {
    switch (this.y) {
      case -2:
        return "FAST_DOWN";
      case -1:
        return "SLOW_DOWN";
      case 0:
        return "NO-OP";
      case 1:
        return "SLOW_UP";
      case 2:
        return "FAST_UP";
    }
  }
}
