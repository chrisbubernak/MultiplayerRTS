/// <reference path="../State.ts" />
/// <reference path="WaitingState.ts" />
/// <reference path="../Pathing.ts" />


class WalkingState extends State {
  static instance: WalkingState;

  public static Instance(): WalkingState {
    if (typeof WalkingState.instance === "undefined") {
      WalkingState.instance = new WalkingState();
    }
    return WalkingState.instance;
  }
  public ToString(): string {
    return "WalkingState";
  }
  public Enter(unit: Unit): void {
    if (unit.command && unit.command.ToString() === "walk") {
      unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
      unit.moveTimer = unit.moveSpeed;
    }
  }

  public Execute(unit: Unit): void {
    // if we have reached our location/our path length is 0
    var doneWalking: boolean = (unit.path.length === 0 && unit.moveTimer >= unit.moveSpeed);
    // the second half makes sure the unit has finished walking into the current grid location (otherwise graphics look werid)
    if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) {
      // if we recieve have a walk command, transition to walking
      if (unit.command && unit.command.ToString() === "walk") {
        unit.ChangeState(WalkingState.Instance());
      } else if (unit.command && (unit.command.ToString() === "attack" || unit.command.ToString() === "engage")) {
        // if we have an attack command, transition to pursuing
        unit.ChangeState(PursuingState.Instance());
      }
    } else if (doneWalking) {
      unit.command = null;
      unit.ChangeState(WaitingState.Instance());
    } else {
      WalkingState.move(unit);
    }
  }

  public Exit(unit: Unit): void {
    unit.prevLoc = unit.loc;
    unit.newCommand = false;
  }

  private static move(unit: Unit): void {
    // update our walking art
    unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

    if (unit.moveTimer >= unit.moveSpeed) {
      // mark this units occuppied locs as unoccupied
      Game.unmarkGridLocs(unit);

      unit.prevLoc = unit.loc;

      // if something now stands in the units path re-path around it
      var locs: number[] = Utilities.getOccupiedSquares(unit.path[0],
        unit.gridWidth,
        unit.gridHeight);
      for (var l: number = 0; l < locs.length; l++) {
        var gridLoc: number = Game.getGridLoc(locs[l]);
        if (gridLoc !== unit.id && gridLoc !== null) {
          unit.path = Pathing.aStarToLoc(unit.loc, unit.path[unit.path.length - 1], unit);
          break;
        }
      }
      // try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
      var direction: string = Utilities.getDirection(unit.loc, unit.path[0]);
      if (direction) {
        unit.setDirection(direction);
      }
      unit.loc = unit.path[0] || unit.loc;
      unit.path.shift();
      unit.moveTimer = 0;
      // mark the new locs occupied by this unit as true
      Game.markOccupiedGridLocs(unit);
    } else {
      unit.moveTimer++;
    }

  }
}
