/// <reference path="../terrainTile.ts" />
/// <reference path="../unit.ts" />

interface IMap {
  GetTerrain(): TerrainTile[];
  GetUnits(): Unit[];
}