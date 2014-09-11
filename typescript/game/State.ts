/// <reference path="units/BaseGameEntity.ts" />

class State {
  public ToString(): string {
    return "State";
  }

  public Enter(entity: BaseGameEntity): void {
    alert(this + " State Enter Function Not Implemented!");
  }

  public Execute(entity: BaseGameEntity): void {
    alert(this + " State Enter Function Not Implemented!");
  }

  public Exit(entity: BaseGameEntity): void {
    alert(this + " State Enter Function Not Implemented!");
  }

  public specificEnemyInAttackRange(unit: Unit, enemy: Unit): boolean {
    var locs: number[] = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l: number = 0; l < locs.length; l++) {
      var neighbors: number[] = Utilities.neighbors(locs[l]);
      for (var n: number = 0; n < neighbors.length; n++) {
        var id: number = Game.getGridLoc(neighbors[n]);
        if (id === enemy.id) {
          return true;
        }
      }
    }
    return false;
  }

  public enemyInTargetAqureRange(unit: Unit): Unit {
    var locs: number[] = Utilities.getGridLocsInTargetAquireRange(unit);

    // sort by min distance to the unit so we find the closest enemy...not 100% this is working    
    locs.sort(function (a: number, b: number): number {
      // what this really should do instead of a -> loc is find the min distance from a to a spot occupied by the unit
      return Utilities.distance(a, unit.loc) - Utilities.distance(b, unit.loc);
    });

    for (var l: number = 0; l < locs.length; l++) {
      var id: number = Game.getGridLoc(locs[l]);
      var enemy: Unit = Utilities.findUnit(id, Game.getUnits());
      if (enemy !== null && enemy.player !== unit.player) {
        return enemy;
      }
    }
    return null;
  }

  public specificEnemyInTargetAquireRange(unit: Unit, enemy: Unit): boolean {
    var locs: number[] = Utilities.getGridLocsInTargetAquireRange(unit);
    for (var l: number = 0; l < locs.length; l++) {
      var id: number = Game.getGridLoc(locs[l]);
      if (id !== null && id === enemy.id ) {
        return true;
      }
    }
    return false;
  }
}
