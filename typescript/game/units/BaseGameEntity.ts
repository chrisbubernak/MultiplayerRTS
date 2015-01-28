/// <reference path="../Utilities.ts" />
/// <reference path="../game.ts" />
/// <reference path="../logger.ts" />

class BaseGameEntity {
  id: number;
  static nextValidId: number = 0;

  constructor() {
    this.id = BaseGameEntity.nextValidId;
    BaseGameEntity.nextValidId++;
  }

  public Update(): void {
    Logger.LogError("update not implemented for BaseGameEntity");
  }
}
