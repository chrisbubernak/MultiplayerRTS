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

  public Enter(unit: Unit) {
    unit.attackTimer = 0;
  }

  public Execute(unit: Unit) {
    //update our art given where we are in carrying out an attack
    unit.attackArtTimer = ((unit.attackTimer / unit.attackSpeed) * unit.numberOfAttackAnimations) % unit.numberOfAttackAnimations;

    var enemy = AttackingState.Instance().getEnemy(unit, unit.inCombatWith);
    if (unit.target) { //if we have a target location transition...
      unit.ChangeState(WalkingState.Instance()); //start walking there
    }
    else if (enemy != null) { //if we have an enemy...
      AttackingState.Instance().attack(unit, enemy); //attack them
    }
    else if (enemy == null) { //if we no longer have a target enemy...
      unit.ChangeState(WaitingState.Instance()); //transition back to waiting
    }
  }

  public Exit(unit: Unit) {
    unit.unitTarget = null;
    unit.inCombatWith = null;
    unit.attackTimer = 0;
  }

  private attack(attacker: Unit, defender: Unit) {
    //try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
    var direction = Utilities.getDirection(attacker.loc, defender.loc)
    if (direction) {
      attacker.setDirection(direction);
    }

    if (attacker.attackTimer >= attacker.attackSpeed) {
      var attackRange = attacker.attackMax - attacker.attackMin;
      var damage = Utilities.random() * attackRange + attacker.attackMin;
      defender.health -= damage;
      if (defender.health <= 0) {
        Game.removeUnit(defender);
        attacker.inCombatWith = null;
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
            unit.inCombatWith = enemy;
            return enemy;
          }
          enemies.push(enemy);
        }
      }
    }
    if (enemies.length == 0) {
      return null;
    }
    unit.inCombatWith = enemies[0]; //update your preferred target
    return enemies[0];
  }
}