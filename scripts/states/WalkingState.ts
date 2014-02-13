/// <reference path="../Knight2.ts" />
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
  }

  public Execute(unit: Unit) {
    if (unit.path.length == 0) {
      unit.target = null;
      unit.prevLoc = unit.loc;
      unit.ChangeState(WaitingState.Instance());
    }
    else {
      WalkingState.move(unit);
    }
    //mark the locs occupied by this unit as true
    var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
    for (var l in locs) {
      Game.setGridLoc(locs[l], unit.id);
    }
    console.log('WALKING STATE');
  }

  public Exit(unit: Unit) {
    alert(this + " State Enter Function Not Implemented!");
  }

  private static move(unit) {
    //if the unit has a new target change our path
    if (unit.prevTar != unit.target) {
      unit.path = Pathing.aStar(unit.loc, unit.target, unit);
      unit.prevTar = unit.target;
    }

    unit.prevLoc = unit.loc;

    //mark the old locs occupied by this unit as false
    var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h)
    for (var l in locs) {
      Game.setGridLoc(locs[l], null);
    }

    //if something now stands in the units path re-path around it
    var locs = utilities.getOccupiedSquares(unit.path[0], unit.w, unit.h)
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
    //every time the unit moves a location reset its attack timer
    unit.attackTimer = unit.attackSpeed;
  }
}