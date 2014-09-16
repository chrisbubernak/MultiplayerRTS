/// <reference path="../terrainTile.ts" />
/// <reference path="../terrainTile.ts" />
/// <reference path="../units/unit.ts" />
/// <reference path="../units/orc.ts" />
/// <reference path="../units/knight.ts" />
/// <reference path="IMap.ts" />

class SmallMap implements IMap {
  constructor() {
    if (this.GetGridSize() !== this.GetTerrain().length) {
      alert("INVALID MAP DETECTED!");
    }
  }

  public GetTerrain(): TerrainTile[] {
    var terrain: TerrainTile[] = Array();
    for (var i: number = 0; i < 2000; i++) {
      if ( 
        (i % this.GetNumberOfCols() === 0) || 
        ((i + 1) % (this.GetNumberOfCols()) === 0) || 
        (Math.floor( i / this.GetNumberOfCols()) === 0) 
        ) {
        terrain.push(new DirtTile())
      } else {
        terrain.push(new GrassTile());
      }
    }
    return terrain;
  }

  public GetUnits(): Unit[] {
    var u1: Unit = new Knight(15, 1);
    var u2: Unit = new Orc(315, 1);

    var u3: Unit = new Orc(80, 2);
    var u4: Unit = new Orc(380, 2);
    return [u1, u2, u3, u4];
  }

  public GetGridSize(): number {
    return this.GetNumberOfCols() * this.GetNumberOfRows();
  }

  public GetNumberOfCols(): number {
    return 100;
  }

  public GetNumberOfRows(): number {
    return 20;
  }
}
