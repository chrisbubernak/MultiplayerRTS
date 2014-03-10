/// <reference path="utilities.ts" />
/// <reference path="game.ts" />

class BaseGameEntity {
  id: number;
  static NextValidId: number = 0; 

  constructor() {
    this.id = BaseGameEntity.NextValidId;
    BaseGameEntity.NextValidId++;
  }

  public Update() {
    alert('update not implemented!!!');
  }
}