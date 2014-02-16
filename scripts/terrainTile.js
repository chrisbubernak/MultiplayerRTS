var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TerrainTile = (function () {
    function TerrainTile() {
        this.imageW = 224;
        this.imageH = 224;
        this.imageY = 0;
        this.walkable = true;
        this.src = '/images/terrain.jpg';
    }
    TerrainTile.prototype.getImage = function () {
        if (TerrainTile.image) {
            return TerrainTile.image;
        } else {
            TerrainTile.image = new Image();
            TerrainTile.image.onload = function () {
                return TerrainTile.image;
            };
            TerrainTile.image.src = this.src;
        }
    };
    return TerrainTile;
})();

var WaterTile = (function (_super) {
    __extends(WaterTile, _super);
    function WaterTile() {
        _super.call(this);
        this.imageX = 448;
        this.type = 'water';
        this.walkable = false;
    }
    return WaterTile;
})(TerrainTile);

var GrassTile = (function (_super) {
    __extends(GrassTile, _super);
    function GrassTile() {
        _super.call(this);
        this.imageX = 224;
        this.type = 'grass';
    }
    return GrassTile;
})(TerrainTile);

var DirtTile = (function (_super) {
    __extends(DirtTile, _super);
    function DirtTile() {
        _super.call(this);
        this.imageX = 0;
        this.type = 'dirt';
    }
    return DirtTile;
})(TerrainTile);
