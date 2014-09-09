/// <reference path="../../_references.ts" />
class TerrainTile {
  imageW: number = 224;
  imageH: number = 224;
  imageY: number = 0;
  type: string;
  walkable: boolean = true;
  public static src: string = '/images/terrain.jpg';
}

class WaterTile extends TerrainTile {
  imageX: number = 448;
  constructor() {
    super();
    this.type = 'water';
    this.walkable = false;
  }
}

class GrassTile extends TerrainTile {
  imageX: number = 224;
  constructor() {
    super();
    this.type = 'grass';
  }
}

class DirtTile extends TerrainTile {
  imageX: number = 0;
  constructor() {
    super();
    this.type = 'dirt';
  }
}




