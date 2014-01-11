class TerrainTile {
    imageW: number = 224;
    imageH: number = 224;
    imageY: number = 0;
    type: string;
    walkable: boolean = true;
    src: string = '/images/terrain.jpg';
    static image;

    public getImage() {
        if (TerrainTile.image) {
            return TerrainTile.image;
        }
        else {
            TerrainTile.image = new Image();
            TerrainTile.image.onload = function () {
                return TerrainTile.image;
            };
            TerrainTile.image.src = this.src;
        }
    }

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

class DirtTile extends TerrainTile{
    imageX: number = 0;
    constructor() {
        super();
        this.type = 'dirt';
    }
}




