import { SHIP_TYPE } from "Ship";

export class Profile {
  constructor(
    public studentNumber: string,
    public firstName: string,
    public familyName: string,
    public shipType: SHIP_TYPE,
    public flag: number
  ) {}
}
