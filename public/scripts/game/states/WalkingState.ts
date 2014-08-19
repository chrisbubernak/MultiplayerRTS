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
  public ToString(): string {
    return "WalkingState";
  }
  public Enter(unit: Unit) {
    if (unit.command && unit.command.ToString() === "walk") {
      unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
      unit.moveTimer = unit.moveSpeed;
    }
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
    /*if (unit.path.length == 0 && unit.moveTimer >= unit.moveSpeed) {
      unit.target = null;
      unit.prevLoc = unit.loc;
      unit.ChangeState(WaitingState.Instance());
    }
    else {
      WalkingState.move(unit);
    }*/

    //if we have reached our location/our path length is 0
    var doneWalking = (unit.path.length == 0 && unit.moveTimer >= unit.moveSpeed);
    if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) { //the second half makes sure the unit has finished walking into the current grid location (otherwise graphics look werid)
      unit.ChangeState(WaitingState.Instance());      
    }
    else if (doneWalking) {
      unit.command = null;
      unit.ChangeState(WaitingState.Instance());
    }

    else {
      WalkingState.move(unit);
    }
  }

  public Exit(unit: Unit) {
    unit.prevLoc = unit.loc;
  }

  private static move(unit) {
    //update our walking art
    unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

    if (unit.moveTimer >= unit.moveSpeed) {
      //mark this units occuppied locs as unoccupied
      Game.unmarkGridLocs(unit);

      unit.prevLoc = unit.loc;

      //if something now stands in the units path re-path around it
      var locs = Utilities.getOccupiedSquares(unit.path[0], unit.gridWidth, unit.gridHeight)
      for (var l in locs) {
        var gridLoc = Game.getGridLoc(locs[l]);
        if (gridLoc != unit.id && gridLoc != null) {
          unit.path = Pathing.aStarToLoc(unit.loc, unit.path[unit.path.length - 1], unit);
          break;
        }
      }
      //try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
      var direction = Utilities.getDirection(unit.loc, unit.path[0])
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