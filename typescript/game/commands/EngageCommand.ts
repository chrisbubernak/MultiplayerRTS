/// <reference path="ICommand.ts" />

// this command is artificially issued to units when an enemy walks to close and they want to pursue that unit
// we have to differentiate between this and when a user explicitly gives out an attack command and wants
// a unit to keep attacking a specific enemy no matter what
class EngageCommand implements ICommand {
  private enemy: Unit;
  private name: string = "engage";

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

  public SetTarget(enemy: Unit):  void {
    this.enemy = enemy;
  }
}
