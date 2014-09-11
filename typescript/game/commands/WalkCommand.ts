/// <reference path="ICommand.ts" />
/// <reference path="../units/unit.ts" />

class WalkCommand implements ICommand {
  private location: number;
  private name: string = "walk";

  constructor(location: number) {
    this.location = location;
  }

  public GetLocation(): number {
    return this.location;
  }

  public ToString(): string {
    return this.name;
  }
}
