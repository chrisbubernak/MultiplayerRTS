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
    alert(this + " State Enter Function Not Implemented!");
  }

  public Execute(unit: Unit) {
    var enemy = AttackingState.Instance().getEnemy(unit, unit.inCombatWith);
    if (unit.target) { //if we have a target location transition...
      unit.ChangeState(WalkingState.Instance()); //start walking there
    }
    else if (enemy != null) { //if we have an enemy...
      AttackingState.Instance().attack(unit, enemy); //attack them
    }
    else if (enemy == null){ //if we no longer have a target enemy...
      unit.ChangeState(WaitingState.Instance()); //transition back to waiting
    }
    //mark the locs occupied by this unit as true
    var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
    for (var l in locs) {
      Game.setGridLoc(locs[l], unit.id);
    }
    console.log('ATTACKING STATE');
  }

  public Exit(unit: Unit) {
    unit.inCombatWith = null;
  }
  /*
  private combat(unit: Unit) {
    //need to check attacktimer & make sure the unit is not in the process of moving
    if (unit.attackTimer > 0 || unit.path.length > 0) {
      unit.attackTimer--;
      return;
    }
    var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
    for (var l in locs) {
      var neighbors = utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        var enemy = utilities.findUnit(id, Game.getUnits());
        if (enemy != null && enemy.player != unit.player) {
          unit.setDirection(utilities.getDirection(unit.loc, enemy.loc));
          this.attack(unit, enemy);
          unit.attackTimer = unit.attackSpeed;
          unit.inCombat = true;
          return;
        }
      }
    }
    unit.inCombat = false;
  }
*/
  private attack(attacker: Unit, defender: Unit) {
    var attackRange = attacker.attackMax - attacker.attackMin;
    var damage = utilities.random() * attackRange + attacker.attackMin;
    defender.health -= damage;
    if (defender.health <= 0) {
      Game.removeUnit(defender);
      attacker.inCombatWith = null;
    }
  }

  //returns an enemy to attack, will try and keep attacking same unit if a prefTarget is supplied
  private getEnemy(unit: Unit, prefTarget: Unit) {
    var enemies = new Array();

    var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
    for (var l in locs) {
      var neighbors = utilities.neighbors(locs[l]);
      for (var n in neighbors) {
        var id = Game.getGridLoc(neighbors[n]);
        var enemy = utilities.findUnit(id, Game.getUnits());
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