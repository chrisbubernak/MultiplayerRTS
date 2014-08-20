/// <reference path="../terrainTile.ts" />
/// <reference path="../unit.ts" />
/// <reference path="../units/orc.ts" />
/// <reference path="../units/knight.ts" />
/// <reference path="IMap.ts" />

class Map1 implements IMap {
  public GetTerrain(): TerrainTile[] {
    var terrain = [];
    for (var i = 0; i < (length = 60 * 30); i++) {
      var type = Utilities.random();
      var grass = .5;
      if (terrain[i - 1] && terrain[i - 1].type == 'grass') {
        grass -= .2;
      }
      if (terrain[i - 30] && terrain[i - 30].type == 'grass') {
        grass -= .2;
      }
      if (type >= grass) {
        terrain[i] = new GrassTile();
      }
      else {
        terrain[i] = new DirtTile();
      }
    }
    /*for (var i = 0; i < 6; i++) {
      this.generateLake();
    }*/
    return terrain;
  }

  public GetUnits(): Unit[] {
    var u1 = new Knight(15, 1);
    var u2 = new Knight(28, 1);
    var u3 = new Orc(99, 2);
    var u4 = new Orc(105, 2);

    return [u1, u2, u3, u4];
  }



  /*private generateLake() {
    var first = Math.round(Utilities.random() * Game.NUM_OF_ROW * Game.NUM_OF_COL);
    var lake = new Array();
    var old = new Array();
    lake.push(first);
    var counter = 0;
    while (lake.length > 0 && counter < 23) {
      Game.terrain[lake[0]] = new WaterTile();
      var neighbors = Utilities.neighbors(lake[0]);
      for (var i = 0; i < neighbors.length; i++) {
        if (Utilities.random() > .35 && old.indexOf(neighbors[i]) == -1) {
          lake.push(neighbors[i]);
        }
      }
      old.push(lake.shift());
      counter++;
    }
    for (var i = 0; i < lake.length; i++) {
      Game.terrain[lake[i]] = new WaterTile();
    }
  }*/
}


