class TerrainTile {
  imageX: number;
  imageW: number = 224;
  imageH: number = 224;
  imageY: number = 0;
  type: string;
  walkable: boolean = true;
  public static src: string = "/images/terrain.jpg";
}

class WaterTile extends TerrainTile {
  constructor() {
    super();
    this.type = "water";
    this.walkable = false;
    this.imageX = 448;
  }
}

class GrassTile extends TerrainTile {
  constructor() {
    super();
    this.type = "grass";
    this.imageX = 224;
  }
}

class DirtTile extends TerrainTile {
  constructor() {
    super();
    this.type = "dirt";
    this.imageX = 0;
  }
}




