/// <reference path="../terrainTile.ts" />
/// <reference path="../units/unit.ts" />
/// <reference path="../units/orc.ts" />
/// <reference path="../units/knight.ts" />
/// <reference path="IMap.ts" />
/// <reference path="../logger.ts" />

class StripesMap implements IMap {
  constructor() {
    if (this.GetGridSize() !== this.GetTerrain().length) {
      Logger.LogError("INVALID MAP DETECTED!");
    }
  }

  public GetTerrain(): TerrainTile[] {
    var terrain: TerrainTile[] = Array();
    for (var i: number = 0; i < 5000; i++) {
      if (i % 10 <= 5) {
        terrain.push(new DirtTile());
      } else {
        terrain.push(new GrassTile());
      }
    }
    return terrain;
  }

  public GetUnits(): Unit[] {
    var u1: Unit = new Knight(15, 1);
    var u2: Unit = new Knight(315, 1);
    var u3: Unit = new Knight(615, 1);
    var u4: Unit = new Knight(915, 1);

    var u5: Unit = new Orc(80, 2);
    var u6: Unit = new Orc(380, 2);
    var u7: Unit = new Orc(680, 2);
    var u8: Unit = new Orc(980, 2);
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
