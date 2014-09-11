/// <reference path="../units/unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WaitingState.ts" />
/// <reference path="../Pathing.ts" />

class AttackingState extends State {
  static instance: AttackingState;

  public static Instance(): AttackingState {
    if (typeof AttackingState.instance === "undefined") {
      AttackingState.instance = new AttackingState();
    }
    return AttackingState.instance;
  }

  public ToString(): string {
    return "AttackingState";
  }

  public Enter(unit: Unit): void {
    unit.attackTimer = 0;
  }

  public Execute(unit: Unit): void {

    if (unit.newCommand) {
      unit.ChangeState(WaitingState.Instance());
      return;
    }

    unit.attackArtTimer = ((unit.attackTimer / unit.attackSpeed) * unit.numberOfAttackAnimations) % unit.numberOfAttackAnimations;
    var enemy: Unit = (<AttackCommand>unit.command).GetTarget();

    var enemyIsAlive: Unit = Utilities.findUnit(enemy.id, Game.getUnits());

    var closeEnoughToAttack: boolean = enemyIsAlive && AttackingState.Instance().specificEnemyInAttackRange(unit, enemy);

    // either we can't see it, or its dead
    var canWeStillSeeEnemy: boolean = enemyIsAlive && Utilities.canAnyUnitSeeEnemy(unit, enemy);

    if (!canWeStillSeeEnemy && unit.attackTimer === 0) { // only allow state change after finishing an attack
      unit.command = null;
      unit.ChangeState(WaitingState.Instance());
    } else if (!closeEnoughToAttack && unit.attackTimer === 0) { // only allow state change after finishing an attack
      unit.ChangeState(PursuingState.Instance());
    } else {
      AttackingState.Instance().attack(unit, enemy); // attack them
    }
  }

  public Exit(unit: Unit): void {
    unit.attackTimer = 0;
  }

  private attack(attacker: Unit, defender: Unit): void {
    // try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
    var direction: string = Utilities.getDirection(attacker.loc, defender.loc);
    if (direction) {
      attacker.setDirection(direction);
    }

    if (attacker.attackTimer >= attacker.attackSpeed) {
      if (AttackingState.Instance().specificEnemyInAttackRange(attacker, defender)) {
        var attackRange: number = attacker.attackMax - attacker.attackMin;
        var damage: number = Utilities.random() * attackRange + attacker.attackMin;
        defender.health -= damage;
        if (defender.health <= 0) {
          Game.removeUnit(defender);
        }
      }
      attacker.attackTimer = 0;
    } else {
      attacker.attackTimer++;
    }
  }
}
