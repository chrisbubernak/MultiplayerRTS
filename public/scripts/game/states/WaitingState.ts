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

  public ToString(): string {
    return "WaitingState";
  }

  public Enter(unit: Unit) {

  } 

  public Execute(unit: Unit) {
    //see if there is an enemy in sight
    var enemy = WaitingState.Instance().enemyInSight(unit);
    
      //if we recieve have a walk command, transition to walking
    if (unit.command && unit.command.ToString() === "walk") {
      unit.ChangeState(WalkingState.Instance());
    }

    //if we have an attack command, transition to pursuing
    else if (unit.command && unit.command.ToString() === "attack") {
      unit.ChangeState(PursuingState.Instance());
    }

    else if (enemy !== null) {
      //artificially issue an attack command to the unit
      unit.command = new AttackCommand(enemy);
    }
  }

  public Exit(unit: Unit) {
    unit.newCommand = false;
  }

  private enemyInRange(unit: Unit) {
    var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l in locs) {
      var neighbors = Utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        var enemy = Utilities.findUnit(id, Game.getUnits());
        if (enemy != null && enemy.player != unit.player) {
          return true;
        }
      }
    }
    return false;
  }

  private enemyInSight(unit: Unit) {
    var locs = Utilities.getGridLocsInTargetAquireRange(unit);
    for (var l in locs) {
      var neighbors = Utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        var enemy = Utilities.findUnit(id, Game.getUnits());
        if (enemy != null && enemy.player != unit.player) {
          return enemy;
        }
      }
    }
    return null;
  }
}

