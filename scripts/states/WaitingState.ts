﻿/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WalkingState.ts" />
/// <reference path="../Pathing.ts" />

class WaitingState extends State{
  static instance: WaitingState;

  public static Instance() {
    if (WaitingState.instance == null) {
      WaitingState.instance = new WaitingState();
    }
    return WaitingState.instance;
  }

  public Enter(unit: Unit) {
    alert(this + " State Enter Function Not Implemented!");
  } 

  public Execute(unit: Unit) {
    if (unit.target) { //if we have a target location transition...
      unit.ChangeState(WalkingState.Instance()); //start walking there
    }
    else if (WaitingState.Instance().enemyInRange(unit)) { //if we are close enough to an enemy...
      unit.ChangeState(AttackingState.Instance()); //start fighting
    }
    //mark the locs occupied by this unit as true
    var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
    for (var l in locs) {
      Game.setGridLoc(locs[l], unit.id);
    }
    console.log('WAITING STATE');
  }

  public Exit(unit: Unit) {
    alert(this + " State Exit Function Not Implemented!");
  }

  private enemyInRange(unit: Unit) {
    var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
    for (var l in locs) {
      var neighbors = utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        var enemy = utilities.findUnit(id, Game.getUnits());
        if (enemy != null && enemy.player != unit.player) {
          return true;
        }
      }
    }
    return false;
  }
}

