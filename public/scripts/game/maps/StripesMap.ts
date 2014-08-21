/// <reference path="../terrainTile.ts" />
/// <reference path="../unit.ts" />
/// <reference path="../units/orc.ts" />
/// <reference path="../units/knight.ts" />
/// <reference path="IMap.ts" />

class StripesMap implements IMap {
  constructor() {
    if (this.GetGridSize() !== this.GetTerrain().length) {
      alert('INVALID MAP DETECTED!');
    }
  }

  public GetTerrain(): TerrainTile[] {
    var terrain = [];
    for (var i = 0; i < 5000; i++) {
      if (i % 10 <= 5) {
        terrain.push(new DirtTile());
      }
      else {
        terrain.push(new GrassTile());
      }
    }
    return terrain;
  }

  public GetUnits(): Unit[] {
    var u1 = new Knight(15, 1);
    var u2 = new Knight(315, 1);
    var u3 = new Knight(615, 1);
    var u4 = new Knight(915, 1);

    var u5 = new Orc(80, 2);
    var u6 = new Orc(380, 2);
    var u7 = new Orc(680, 2);
    var u8 = new Orc(980, 2);
    return [u1, u2, u3, u4, u5, u6, u7, u8];
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