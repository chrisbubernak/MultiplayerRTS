/// <reference path="../units/unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="AttackingState.ts" />
/// <reference path="../Pathing.ts" />

class PursuingState extends State {
  static instance: PursuingState;

  public static Instance(): PursuingState {
    if (PursuingState.instance === null) {
      PursuingState.instance = new PursuingState();
    }
    return PursuingState.instance;
  }

  public ToString(): string {
    return "PursuingState";
  }

  public Enter(unit: Unit): void {
    unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
    unit.moveTimer = unit.moveSpeed;
  }

  public Execute(unit: Unit): void {
    if (unit.newCommand && !(unit.moveTimer >= unit.moveSpeed)) {
      PursuingState.move(unit);
      return;
    }

    if (unit.newCommand) {
      unit.ChangeState(WaitingState.Instance());
      return;
    }


    var enemy: Unit = (<AttackCommand>unit.command).GetTarget();

    var engageCommand: boolean = unit.command.ToString() === "engage";
    var currentTargetInPursueRange: boolean = PursuingState.Instance().specificEnemyInTargetAquireRange(unit, enemy);
    var potentialTarget: Unit = PursuingState.Instance().enemyInTargetAqureRange(unit);

    var enemyIsAlive: Unit = Utilities.findUnit(enemy.id, Game.getUnits());

    var closeEnoughToAttack: boolean = enemyIsAlive && PursuingState.Instance().specificEnemyInAttackRange(unit, enemy);

    // either we can't see it, or its dead
    var canWeStillSeeEnemy: boolean = enemyIsAlive &&
      Utilities.canAnyUnitSeeEnemy(unit, enemy);

    // the second half makes sure the unit has finished walking into the current grid location (otherwise graphics look werid) 
    if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) {
     unit.ChangeState(WaitingState.Instance());
    } else if (!canWeStillSeeEnemy && unit.moveTimer >= unit.moveSpeed) {
      unit.command = null;
      unit.ChangeState(WaitingState.Instance());
    } else if (closeEnoughToAttack && unit.moveTimer >= unit.moveSpeed) {
      unit.ChangeState(AttackingState.Instance());
    } else if (engageCommand && !currentTargetInPursueRange && potentialTarget) {
      // modify the engagecommandtohave the new target
      (<EngageCommand>unit.command).SetTarget(potentialTarget);
      PursuingState.move(unit);
    } else {
      PursuingState.move(unit);
    }
  }

  public Exit(unit: Unit): void{
    unit.prevLoc = unit.loc;
  }

  private static move(unit: Unit): void {
    // update our walking art
    unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

    if (unit.moveTimer >= unit.moveSpeed) {
      // mark this units occuppied locs as unoccupied
      Game.unmarkGridLocs(unit);

      // if the unit has a new target change our path
      var enemy: Unit = (<AttackCommand>unit.command).GetTarget();
      if (enemy.prevLoc !== enemy.loc) {
        unit.path = Pathing.aStarToLoc(unit.loc, enemy.loc, unit);
      }

      unit.prevLoc = unit.loc;

      // if something now stands in the units path re-path around it
      var locs: number[] = Utilities.getOccupiedSquares(unit.path[0],
        unit.gridWidth,
        unit.gridHeight);
      for (var l: number = 0 ; l < locs.length; l++) {
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
