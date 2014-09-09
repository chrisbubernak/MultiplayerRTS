/// <reference path="../Utilities.ts" />
/// <reference path="../game.ts" />

class BaseGameEntity {
  id: number;
  static nextValidId: number = 0;

  constructor() {
    this.id = BaseGameEntity.nextValidId;
    BaseGameEntity.nextValidId++;
  }

  public Update(): void {
    alert("update not implemented!!!");
  }
}
