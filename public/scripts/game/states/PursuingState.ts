/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
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

  public ToString(): string {
    return "PursuingState";
  }

  public Enter(unit: Unit) {
    if (unit.command && unit.command.ToString() === "attack") {
      unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
      unit.moveTimer = unit.moveSpeed;
      unit.prevTar = unit.target;
    }
  }

  public Execute(unit: Unit) {
    //TODO: If we start pursuing a unit and get an artificial attack command but then they run away and another unit is closer we should target that
    //just make sure we don't disregard an actual attack command

    if (unit.newCommand && !(unit.moveTimer >= unit.moveSpeed)) {
      PursuingState.move(unit);
      return;
    }

    if (unit.newCommand) {
      unit.ChangeState(WaitingState.Instance());
      return;
    }

    var enemy = (<AttackCommand>unit.command).GetTarget();

    var enemyIsAlive = Utilities.findUnit(enemy.id, Game.getUnits());

    var closeEnoughToAttack = enemyIsAlive && PursuingState.Instance().specificEnemyInRange(unit, enemy);

    var canWeStillSeeEnemy = enemyIsAlive && Utilities.canAnyUnitSeeEnemy(unit, enemy); //either we can't see it, or its dead

    if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) { //the second half makes sure the unit has finished walking into the current grid location (otherwise graphics look werid)
      unit.ChangeState(WaitingState.Instance());
    }
    else if (!canWeStillSeeEnemy && unit.moveTimer >= unit.moveSpeed) {
      unit.command = null;
      unit.ChangeState(WaitingState.Instance());
    }
    else if (closeEnoughToAttack && unit.moveTimer >= unit.moveSpeed) {
      unit.ChangeState(AttackingState.Instance());
    }
    else {
      PursuingState.move(unit);
    }
  }

  public Exit(unit: Unit) {
    unit.prevLoc = unit.loc;
  }

  //TODO: refactor, this is duplicated in attackingstate
  private specificEnemyInRange(unit: Unit, enemy: Unit) {
    var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l in locs) {
      var neighbors = Utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        if (id === enemy.id) {
          return true;
        }
      }
    }
    return false;
  }

  private static move(unit: Unit) {
    //update our walking art
    unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

    if (unit.moveTimer >= unit.moveSpeed) {
      //mark this units occuppied locs as unoccupied
      Game.unmarkGridLocs(unit);

      //if the unit has a new target change our path
      var enemy = (<AttackCommand>unit.command).GetTarget();
      if (enemy.prevTar != enemy.loc) {
        unit.path = Pathing.aStarToLoc(unit.loc, enemy.loc, unit);
        unit.prevTar = unit.target;
      }

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
