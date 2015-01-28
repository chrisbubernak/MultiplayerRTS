/// <reference path="../terrainTile.ts" />
/// <reference path="../units/unit.ts" />
/// <reference path="../units/orc.ts" />
/// <reference path="../units/knight.ts" />
/// <reference path="IMap.ts" />

class TinyMap implements IMap {
  constructor() {
    if (this.GetGridSize() !== this.GetTerrain().length) {
      alert("INVALID MAP DETECTED!");
    }
  }

  public GetTerrain(): TerrainTile[] {
    var terrain: TerrainTile[] = Array();
    for (var i: number = 0; i < 1000; i++) {
      if ((i > 100 && i < 110) ||
        (i >180 && i < 200) || 
        (i > 230 && i < 236)) {
        terrain.push(new WaterTile());
      } else {
        terrain.push(new GrassTile());
      }
    }
    return terrain;
  }

  public GetUnits(): Unit[] {
    var u1: Unit = new Knight(15, 1);
    var u2: Unit = new Knight(165, 1);
    var u3: Unit = new Knight(215, 1);

    var u4: Unit = new Orc(80, 2);
    var u5: Unit = new Orc(320, 2);
    var u6: Unit = new Orc(240, 2);

    return [u1, u2, u3, u4, u5, u6];
  }

  public GetGridSize(): number {
    return this.GetNumberOfCols() * this.GetNumberOfRows();
  }

  public GetNumberOfCols(): number {
    return 50;
  }

  public GetNumberOfRows(): number {
    return 20;
  }
}


