/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WalkingState.ts" />
/// <reference path="AttackingState.ts" />
/// <reference path="../Pathing.ts" />

class PursuingState extends State {
  static instance: PursuingState;

  public static Instance() {
    if (PursuingState.instance == null) {
      PursuingState.instance = new PursuingState();
    }
    return PursuingState.instance;
  }

  public Enter(unit: Unit) {
    unit.path = Pathing.aStar(unit.loc, unit.target, unit);
    unit.prevTar = unit.target;
    unit.moveTimer = unit.moveSpeed;
  }

  public Execute(unit: Unit) {
    //if we don't have a unit to target, or we are no longer able to see that unit with any of our units
    //TODO: What if the unit we are pursuing dies???
    if ((!unit.unitTarget) || (!utilities.canAnyUnitSeeEnemy(unit, unit.unitTarget))) { //if we have a target location transition...
      unit.ChangeState(WaitingState.Instance()); //stop pursing
    }
    else if (PursuingState.Instance().enemyInRange(unit)) { //if we are close enough to an enemy to attack...
      unit.ChangeState(AttackingState.Instance()); //start fighting
    }
    else {
      unit.target = unit.unitTarget.loc;
      PursuingState.move(unit);
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

  private static move(unit) {
    //update our walking art
    unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

    if (unit.moveTimer >= unit.moveSpeed) {
      //mark this units occuppied locs as unoccupied
      Game.unmarkGridLocs(unit);

      //if the unit has a new target change our path
      if (unit.prevTar != unit.target) {
        unit.path = Pathing.aStar(unit.loc, unit.target, unit);
        unit.prevTar = unit.target;
      }

      unit.prevLoc = unit.loc;

      //if something now stands in the units path re-path around it
      var locs = utilities.getOccupiedSquares(unit.path[0], unit.gridWidth, unit.gridHeight)
      for (var l in locs) {
        var gridLoc = Game.getGridLoc(locs[l]);
        if (gridLoc != unit.id && gridLoc != null) {
          unit.path = Pathing.aStar(unit.loc, unit.path[unit.path.length - 1], unit);
          break;
        }
      }
      //try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
      var direction = utilities.getDirection(unit.loc, unit.path[0])
    if (direction) {
        unit.setDirection(direction);
      }
      unit.loc = unit.path[0] || unit.loc;
      unit.path.shift();
      unit.moveTimer = 0;
      //mark the new locs occupied by this unit as true
      Game.markOccupiedGridLocs(unit);
    }
    else {
      unit.moveTimer++;
    }

  }
}
