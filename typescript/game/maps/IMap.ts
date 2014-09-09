/// <reference path="../terrainTile.ts" />
/// <reference path="../units/unit.ts" />

interface IMap {
  GetTerrain(): TerrainTile[];
  GetUnits(): Unit[];
  GetNumberOfCols(): number;
  GetNumberOfRows(): number;
  GetGridSize(): number;
}