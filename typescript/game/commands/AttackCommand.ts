/// <reference path="ICommand.ts" />

class AttackCommand implements ICommand {
  private enemy: Unit;
  private name: string = "attack";

  constructor(enemy: Unit) {
    this.enemy = enemy;
  }

  public GetLocation(): number {
    return this.enemy.loc;
  }

  public ToString(): string {
    return this.name;
  }

  public GetTarget(): Unit {
    return this.enemy;
  }
}