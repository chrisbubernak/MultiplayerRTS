/// <reference path="units/BaseGameEntity.ts" />

class State {
  constructor() {

  }
  public ToString(): string {
    return "State";
  }
  public Enter(entity: BaseGameEntity) {
    alert(this + " State Enter Function Not Implemented!");
  }
  public Execute(entity: BaseGameEntity) {
    alert(this + " State Enter Function Not Implemented!");
  }
  public Exit(entity: BaseGameEntity) {
    alert(this + " State Enter Function Not Implemented!");
  }

  public specificEnemyInAttackRange(unit: Unit, enemy: Unit) {
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

  public enemyInTargetAqureRange(unit: Unit) {
    var locs = Utilities.getGridLocsInTargetAquireRange(unit);
    
    locs.sort(function (a, b) { //sort by min distance to the unit so we find the closest enemy...not 100% this is working
      //what this really should do instead of a -> loc is find the min distance from a to a spot occupied by the unit
      return Utilities.distance(a, unit.loc) - Utilities.distance(b, unit.loc);
    });

    for (var l in locs) {
      var id = Game.getGridLoc(locs[l]);
      var enemy = Utilities.findUnit(id, Game.getUnits());
      if (enemy != null && enemy.player != unit.player) {
        return enemy;
      }
    }
    return null;
  }

  public specificEnemyInTargetAquireRange(unit: Unit, enemy: Unit) {
    var locs = Utilities.getGridLocsInTargetAquireRange(unit);
    for (var l in locs) {
      var id = Game.getGridLoc(locs[l]);
      if (id !== null && id === enemy.id ) {
        return true;
      }
    }
    return false;
  }
}