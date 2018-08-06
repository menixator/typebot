import { Coordinates } from "./Coordinates";
import { Directions } from "./Directions";
import { Ship } from "./Ship";
import dgram from "dgram";
import { Profile } from "./Profile";
import { Client } from "Client";
import { AddressInfo } from "net";
import chalk from "chalk";

export class MyShip extends Ship {
  static getRandomCoords(): Coordinates {
    return new Coordinates(
      Math.floor(Math.random() * 995),
      Math.floor(Math.random() * 995)
    );
  }

  private target: Coordinates = MyShip.getRandomCoords();

  private client: Client = null!;

  constructor(public profile: Profile) {
    super(
      0,
      Coordinates.NULL_COORDS,
      profile.shipType,
      Ship.MAX_HEALTH,
      profile.flag
    );
  }

  public setClient(client: Client) {
    this.client = client;
  }

  register() {
    this.send(
      `Register  ${this.profile.studentNumber},${this.profile.firstName},${
        this.profile.familyName
      },${this.profile.shipType}`
    );
    this.setFlag(this.flag);
  }

  public fire(target: Coordinates | Ship): void {
    if (target instanceof Ship) return this.fire(target.coordinates);
    this.send(`Fire ${this.profile.studentNumber},${target.x},${target.y}`);
  }

  public move(target: Directions | Coordinates | Ship): void {
    if (target instanceof Coordinates) {
      return this.move(this.directionsTo(target));
    }

    if (target instanceof Ship) {
      return this.move(this.directionsTo(target));
    }

    this.send(`Move ${this.profile.studentNumber},${target.x},${target.y}`);
  }

  public setFlag(flag: number) {
    this.send(`Flag ${this.profile.studentNumber},${flag}`);
  }

  public message(dest: string, source: string, msg: string) {
    this.send(
      `"Message ${this.profile.studentNumber},${dest},${source},${msg}`
    );
  }

  public merge(ship: Ship) {
    this.coordinates = ship.coordinates;
    this.flag = ship.flag;
    this.health = ship.health;
  }

  private send(str: string) {
    this.client.send(Buffer.from(str + "\0"));
  }

  public onMessage(msg: Buffer, rinfo: AddressInfo) {}
  public tick(enemies: Ship[], friends: Ship[]) {
    enemies.splice(enemies.length, 0, ...friends);
    friends.splice(0);

    let coordsToMoveAwayFrom: Coordinates[] = [];
    console.log(chalk.yellow("tick started"));
    console.log(chalk.magenta("Me: " + this.toString()));

    if (enemies.length > 0) {
      console.log(chalk.red("ENEMIES: "));
      enemies.forEach(enemy => console.log("  ", chalk.red(enemy.toString())));
      console.log(chalk.red("--ENEMIES-- "));
    }

    if (friends.length > 0) {
      console.log(chalk.green("ALLIES: "));
      friends.forEach(enemy =>
        console.log("  ", chalk.green(enemy.toString()))
      );
      console.log(chalk.green("--ALLIES-- "));
    }

    // There are no other ships!
    if (enemies.length == 0) {
      console.log(chalk.green("no enemy ships in sight"));
      if (
        this.distanceTo(this.target) < 20 ||
        this.coordinates.x <= 10 ||
        this.coordinates.y < 10
      ) {
        this.target = MyShip.getRandomCoords();
      }
      this.move(this.target);
    }

    let coordsOfShipsWithFriends = new Coordinates(0, 0);
    let numberOfShipsWithFriends = 0;

    // There are other ships.
    let closest = -1;
    for (let i = 0; i < enemies.length; i++) {
      if (
        closest == -1 ||
        (enemies[i].distanceTo(this) < enemies[closest].distanceTo(this) &&
          enemies[i].health < enemies[closest].health)
      ) {
        console.log(chalk.green(enemies[i].toString()));
        let hasFriends = enemies.some(
          enemy =>
            enemy == enemies[i] ? false : enemy.distanceTo(enemies[i]) < 50
        );

        if (!hasFriends) {
          closest = i;
          console.log(chalk.green("found a ship with no friends"));
        } else {
          coordsOfShipsWithFriends = coordsOfShipsWithFriends.add(
            enemies[i].coordinates
          );
          numberOfShipsWithFriends++;

          console.log(chalk.red(`${enemies[i].toString()} has friends`));
        }
      }
    }

    if (closest > -1) {
      console.log("moving towards the closest");
      this.target = enemies[closest].coordinates;
      if (this.distanceTo(enemies[closest]) <= Ship.FIRING_RANGE) {
        this.fire(enemies[closest]);
      }
      this.move(this.target);
    } else if (numberOfShipsWithFriends > 0) {
      // closest == -1
      let moveAway = new Coordinates(
        Math.floor(coordsOfShipsWithFriends.x / numberOfShipsWithFriends),
        coordsOfShipsWithFriends.y / numberOfShipsWithFriends
      );

      this.target = new Coordinates(
        this.coordinates.x - moveAway.x,
        this.coordinates.y - moveAway.y
      );
      console.log(this.target.toString());
      this.move(this.target);
    }

    let hasPackShipsInSight = closest == -1 && enemies.length > 0;

    console.log("--- tick end --");
  }
}
