/// <reference path="../terrainTile.ts" />
/// <reference path="../unit.ts" />
/// <reference path="../units/orc.ts" />
/// <reference path="../units/knight.ts" />
/// <reference path="IMap.ts" />

class Map1 implements IMap {
  /*constructor() {
    if (this.GetGridSize() !== this.GetTerrain().length) {
      alert('INVALID MAP DETECTED!');
    }
  }*/

  public GetTerrain(): TerrainTile[] {
    var terrain = [];
    for (var i = 0; i < 5000; i++) {
      terrain.push(new GrassTile());
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

  public GetGridSize(): number {
    return this.GetNumberOfCols() * this.GetNumberOfRows();
  }

  public GetNumberOfCols(): number {
    return 100;
  }

  public GetNumberOfRows(): number {
    return 50;
  }
}


