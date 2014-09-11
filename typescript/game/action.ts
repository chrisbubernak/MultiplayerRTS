/// <reference path="units/unit.ts" />

class Action {
  private target: number; // the grid loc number
  private unit: number; // the unit id number that action is assigned to
  // variable that holds whether or not shift was held
  // down for this action (if it was we want to add
  // to action queue instead of replace 
  private shift: any;

  constructor (target: number, unit: number, shift: boolean ) {
    this.target = target;
    this.unit = unit;
    this.shift = shift;
  }

  public getTarget(): number {
    return this.target;
  }

  public getUnit(): number {
    return this.unit;
  }

  public getShifted(): boolean {
    return this.shift;
  }
}
