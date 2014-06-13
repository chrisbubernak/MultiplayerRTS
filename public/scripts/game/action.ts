/// <reference path="unit.ts" />

class Action {
  private target: number; //the grid loc number
  private unit: number; //the unit id number that action is assigned to
  private shift: any; //variable that holds whether or not shift was held down for this action (if it was we want to add to action queue instead of replace 

  constructor (target: number, unit: number, shift ) {
    this.target = target;
    this.unit = unit;
    this.shift = shift;
  }

  public getTarget() {
    return this.target;
  }

  public getUnit() {
    return this.unit;
  }

  public getShifted() {
    return this.shift;
  }
}