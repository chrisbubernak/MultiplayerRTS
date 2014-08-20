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
    return terrain;
  }

  public GetUnits(): Unit[] {
    var u1 = new Knight(15, 1);
    var u2 = new Knight(28, 1);
    var u3 = new Orc(99, 2);
    var u4 = new Orc(105, 2);

    return [u1, u2, u3, u4];
  }

}


