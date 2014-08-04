/// <reference path="../State.ts" />
/// <reference path="WaitingState.ts" />
/// <reference path="../Pathing.ts" />


class WalkingState extends State {
  static instance: WalkingState;

  public static Instance() {
    if (WalkingState.instance == null) {
      WalkingState.instance = new WalkingState();
    }
    return WalkingState.instance;
  }

  public Enter(unit: Unit) {
    unit.path = Pathing.aStar(unit.loc, unit.target, unit);
    unit.prevTar = unit.target;
    unit.moveTimer = unit.moveSpeed;
  }

  public Execute(unit: Unit) {
    //if we have an enemey targeted and one of our units can see them start pursuing
    /*if (!(unit.target && unit.unitTarget && WalkingState.Instance().canAnyUnitSeeEnemy(unit, unit.unitTarget))) {
      if (unit.unitTarget) {
        console.log(unit.target + " " + unit.unitTarget + " " + WalkingState.Instance().canAnyUnitSeeEnemy(unit, unit.unitTarget));
      }
    }
    if (unit.target && unit.unitTarget && WalkingState.Instance().canAnyUnitSeeEnemy(unit, unit.unitTarget)) {
      console.log('PURSUING');
      unit.ChangeState(PursuingState.Instance());
    }*/
    //make sure is path is empty and make sure we've finished interpolating (i.e that the move timer = movespeed)
    if (unit.path.length == 0 && unit.moveTimer >= unit.moveSpeed) {
      unit.target = null;
      unit.prevLoc = unit.loc;
      unit.ChangeState(WaitingState.Instance());
    }
    else {
      WalkingState.move(unit);
    }
  }

  public Exit(unit: Unit) {
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