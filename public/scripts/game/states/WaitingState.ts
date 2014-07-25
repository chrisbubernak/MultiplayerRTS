/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WalkingState.ts" />
/// <reference path="AttackingState.ts" />
/// <reference path="PursuingState.ts" />
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
  } 

  public Execute(unit: Unit) {
    if (unit.target && (unit.unitTarget === null)) { //if we have a target location transition...
      unit.ChangeState(WalkingState.Instance()); //start walking there
    }
    else if (unit.target && unit.unitTarget) {
      unit.ChangeState(PursuingState.Instance());
    }
    else if (WaitingState.Instance().enemyInRange(unit)) { //if we are close enough to an enemy...
      unit.ChangeState(AttackingState.Instance()); //start fighting
    }
    else if (WaitingState.Instance().enemyInSight(unit) !== null) {
      var unitTarget = WaitingState.Instance().enemyInSight(unit)
      unit.unitTarget = unitTarget;
      unit.target = unitTarget.loc;
      unit.ChangeState(PursuingState.Instance());
    }
  }

  public Exit(unit: Unit) {
  }

  private enemyInRange(unit: Unit) {
    var locs = utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
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

  private enemyInSight(unit: Unit) {
    var topLeft = unit.loc - unit.targetAquireRange - Game.getNumOfCols() * unit.targetAquireRange;
    var width = unit.targetAquireRange * 2 + unit.gridWidth;
    var height = unit.targetAquireRange * 2 + unit.gridHeight;
    var locs = utilities.getOccupiedSquares(topLeft, width, height);
    for (var l in locs) {
      var neighbors = utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        var enemy = utilities.findUnit(id, Game.getUnits());
        if (enemy != null && enemy.player != unit.player) {
          return enemy;
        }
      }
    }
    return null;
  }
}

