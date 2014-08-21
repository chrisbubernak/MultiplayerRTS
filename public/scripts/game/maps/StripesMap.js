/// <reference path="../terrainTile.ts" />
/// <reference path="../unit.ts" />
/// <reference path="../units/orc.ts" />
/// <reference path="../units/knight.ts" />
/// <reference path="IMap.ts" />
var StripesMap = (function () {
    function StripesMap() {
        if (this.GetGridSize() !== this.GetTerrain().length) {
            alert('INVALID MAP DETECTED!');
        }
    }
    StripesMap.prototype.GetTerrain = function () {
        var terrain = [];
        for (var i = 0; i < 5000; i++) {
            if (i % 10 <= 5) {
                terrain.push(new DirtTile());
            } else {
                terrain.push(new GrassTile());
            }
        }
        return terrain;
    };

    StripesMap.prototype.GetUnits = function () {
        var u1 = new Knight(15, 1);
        var u2 = new Knight(315, 1);
        var u3 = new Knight(615, 1);
        var u4 = new Knight(915, 1);

        var u5 = new Orc(80, 2);
        var u6 = new Orc(380, 2);
        var u7 = new Orc(680, 2);
        var u8 = new Orc(980, 2);
        return [u1, u2, u3, u4, u5, u6, u7, u8];
    };

    StripesMap.prototype.GetGridSize = function () {
        return this.GetNumberOfCols() * this.GetNumberOfRows();
    };

    StripesMap.prototype.GetNumberOfCols = function () {
        return 100;
    };

    StripesMap.prototype.GetNumberOfRows = function () {
        return 50;
    };
    return StripesMap;
})();
