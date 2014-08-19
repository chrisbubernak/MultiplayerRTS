/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WaitingState.ts" />
/// <reference path="../Pathing.ts" />

class AttackingState extends State {
  static instance: AttackingState;

  public static Instance() {
    if (AttackingState.instance == null) {
      AttackingState.instance = new AttackingState();
    }
    return AttackingState.instance;
  }

  public ToString(): string {
    return "AttackingState";
  }

  public Enter(unit: Unit) {
    unit.attackTimer = 0;
  }

  public Execute(unit: Unit) {

    if (unit.newCommand) {
      unit.ChangeState(WaitingState.Instance());
      return;
    }

    unit.attackArtTimer = ((unit.attackTimer / unit.attackSpeed) * unit.numberOfAttackAnimations) % unit.numberOfAttackAnimations;
    var enemy = (<AttackCommand>unit.command).GetTarget();

    var enemyIsAlive = Utilities.findUnit(enemy.id, Game.getUnits());

    var closeEnoughToAttack = enemyIsAlive && AttackingState.Instance().specificEnemyInAttackRange(unit, enemy);

    var canWeStillSeeEnemy = enemyIsAlive && Utilities.canAnyUnitSeeEnemy(unit, enemy); //either we can't see it, or its dead

    if (!canWeStillSeeEnemy && unit.attackTimer === 0) { //only allow state change after finishing an attack
      unit.command = null;
      unit.ChangeState(WaitingState.Instance()); 
    }
    else if (!closeEnoughToAttack && unit.attackTimer === 0) { //only allow state change after finishing an attack
      unit.ChangeState(PursuingState.Instance()); 
    }
    else {
      AttackingState.Instance().attack(unit, enemy); //attack them
    }
  }

  public Exit(unit: Unit) {
    unit.attackTimer = 0;
  }

  private attack(attacker: Unit, defender: Unit) {
    //try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
    var direction = Utilities.getDirection(attacker.loc, defender.loc)
    if (direction) {
      attacker.setDirection(direction);
    }

    if (attacker.attackTimer >= attacker.attackSpeed) {
      if (AttackingState.Instance().specificEnemyInAttackRange(attacker, defender)) {
        var attackRange = attacker.attackMax - attacker.attackMin;
        var damage = Utilities.random() * attackRange + attacker.attackMin;
        defender.health -= damage;
        if (defender.health <= 0) {
          Game.removeUnit(defender);
        }
      }
      attacker.attackTimer = 0;
    }
    else {
      attacker.attackTimer++;
    }
  }

  //returns an enemy to attack, will try and keep attacking same unit if a prefTarget is supplied
  private getEnemy(unit: Unit, prefTarget: Unit) {
    var enemies = new Array();

    var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l in locs) {
      var neighbors = Utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        var enemy = Utilities.findUnit(id, Game.getUnits());
        if (enemy != null && enemy.player != unit.player) {
          if (prefTarget == null || id == prefTarget.id) { //if we didn't have a preference or this was our preference return it
            return enemy;
          }
          enemies.push(enemy);
        }
      }
    }
    if (enemies.length == 0) {
      return null;
    }
    return enemies[0];
  }
}