/// <reference path="coords.ts" />
/// <reference path="unit.ts" />
var Drawer = (function () {
    function Drawer(width, height, player, terrainCanvas, unitCanvas, fogCanvas, selectionCanvas) {
        //consts
        this.UPDATE_FPS = 10;
        this.FPS = 60;
        this.GREEN = "#39FF14";
        this.HEALTH_BAR_OFFSET = 10;
        this.HEALTH_BAR_HEIGHT = 5;
        this.FOG = "black";
        this.playerId = player;

        this.terrainCanvas = terrainCanvas;
        this.unitCanvas = unitCanvas;
        this.fogCanvas = fogCanvas;
        this.selectionCanvas = selectionCanvas;
        this.updateDimensions(width, height);

        this.terrainContext = terrainCanvas.getContext("2d");
        this.unitContext = unitCanvas.getContext("2d");
        this.fogContext = fogCanvas.getContext("2d");
        this.selectionContext = selectionCanvas.getContext("2d");

        Drawer.context = this;
    }
    Drawer.drawSquare = function (loc, color) {
        Drawer.context.drawSquare(loc, color);
    };

    Drawer.prototype.getTerrainContext = function () {
        return this.terrainContext;
    };

    Drawer.prototype.interpolate = function () {
        var units = Game.getUnits();
        for (var i = 0; i < units.length; i++) {
            var oldCoords = this.boxToCoords(units[i].prevLoc);
            var coords = this.boxToCoords(units[i].loc);
            units[i].x -= ((1 / (this.FPS / this.UPDATE_FPS)) * (oldCoords.x - coords.x)) / (units[i].moveSpeed + 1);
            units[i].y -= ((1 / (this.FPS / this.UPDATE_FPS)) * (oldCoords.y - coords.y)) / (units[i].moveSpeed + 1);
            if (units[i].prevLoc == units[i].loc) {
                units[i].x = coords.x;
                units[i].y = coords.y;
            }
        }
    };

    Drawer.prototype.updateDimensions = function (width, height) {
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        var calculatedWidth = $(window).height() * Game.getRatio();
        var calculatedHeight = $(window).width() / Game.getRatio();

        if (calculatedWidth > winWidth) {
            width = winWidth;
            height = calculatedHeight;
        } else if (calculatedHeight > winHeight) {
            width = calculatedWidth;
            height = winHeight;
        }
        this.boxSize = width / Game.getNumOfCols();

        this.terrainCanvas.width = width;
        this.terrainCanvas.height = height;
        this.unitCanvas.width = width;
        this.unitCanvas.height = height;
        this.fogCanvas.width = width;
        this.fogCanvas.height = height;
        this.selectionCanvas.width = width;
        this.selectionCanvas.height = height;

        this.canvasHeight = height;
        this.canvasWidth = width;

        this.boxSize = this.canvasWidth / Game.getNumOfCols();
        if (typeof (Game.getTerrainLoc(0)) != 'undefined') {
            this.drawTerrain();
        }
    };

    Drawer.prototype.getBoxWidth = function () {
        return this.boxSize;
    };

    Drawer.prototype.getBoxHeight = function () {
        return this.boxSize;
    };

    Drawer.prototype.drawUnits = function (units) {
        this.fogContext.globalCompositeOperation = 'source-over';
        this.fogContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.fogContext.fillStyle = this.FOG;
        this.fogContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.unitContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        for (var i = 0; i < units.length; i++) {
            if (units[i].player == this.playerId) {
                var coords = this.boxToCoords(units[i].loc);
                var x = coords.x;
                var y = coords.y;

                //this stuff does the "sight" circles in the fog
                var r1 = units[i].sightRange * this.boxSize;
                var r2 = r1 + 40;
                var density = .4;

                if (Client.DEBUG) {
                    this.drawUnitSightRange(units[i]);
                    this.drawUnitAquireTargetRange(units[i]);
                }

                var radGrd = this.fogContext.createRadialGradient(x + this.unitWidth() / 2, y + this.unitHeight() / 2, r1, x + this.unitWidth() / 2, y + this.unitHeight() / 2, r2);
                radGrd.addColorStop(0, 'rgba( 0, 0, 0,  1 )');
                radGrd.addColorStop(density, 'rgba( 0, 0, 0, .1 )');
                radGrd.addColorStop(1, 'rgba( 0, 0, 0,  0 )');
                this.fogContext.globalCompositeOperation = "destination-out";
                this.fogContext.fillStyle = radGrd;
                this.fogContext.fillRect(x - r2, y - r2, r2 * 2, r2 * 2);
            }
            this.drawUnit(units[i]);
        }
        this.selectionContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    };

    Drawer.prototype.drawTerrain = function () {
        var gridSize = Game.getNumOfRows() * Game.getNumOfCols();
        for (var i = 0; i < gridSize; i++) {
            var tile = Game.getTerrainLoc(i);
            if (tile.getImage()) {
                this.terrainContext.drawImage(tile.getImage(), tile.imageX, tile.imageY, tile.imageW, tile.imageH, this.boxToCoords(i).x, this.boxToCoords(i).y, this.boxSize, this.boxSize);
            } else {
                //console.log("failed to load image");
            }
        }
    };

    //returns the upper left corner of the box given its index
    Drawer.prototype.boxToCoords = function (i) {
        var y = Math.floor(i / Game.getNumOfCols()) * this.boxSize;
        var x = i % Game.getNumOfCols() * this.boxSize;
        return { x: x, y: y };
    };

    //given the row and col of a box this returns the box index
    Drawer.prototype.coordsToBox = function (x, y) {
        var newX = Math.floor((x % this.canvasWidth) / this.boxSize);
        var newY = Math.floor((y % this.canvasHeight) / this.boxSize);
        var boxNumber = newX + Game.getNumOfCols() * newY;
        return boxNumber;
    };

    //debugging function...just colors a specified grid loc with a color
    Drawer.prototype.drawSquare = function (loc, color) {
        var coords = this.boxToCoords(loc);
        this.fogContext.fillStyle = color;
        this.fogContext.fillRect(coords.x, coords.y, this.boxSize, this.boxSize);
        this.unitContext.fillStyle = color;
        this.unitContext.fillRect(coords.x, coords.y, this.boxSize, this.boxSize);
    };

    //used for debugging a* pathing
    Drawer.prototype.drawPathing = function (loc, color, val) {
        var coords = this.boxToCoords(loc);
        this.selectionContext.fillStyle = color;
        this.selectionContext.fillRect(coords.x, coords.y, this.boxSize, this.boxSize);
        this.selectionContext.fillStyle = "black";
        this.selectionContext.fillText(Math.round(val), coords.x, coords.y + this.boxSize / 2);
    };

    Drawer.prototype.drawSelect = function (selection) {
        this.selectionContext.globalAlpha = 0.3;
        this.selectionContext.fillStyle = this.GREEN;
        this.selectionContext.fillRect(selection.x, selection.y, selection.w, selection.h);
        this.selectionContext.globalAlpha = 1;
    };

    Drawer.prototype.drawGrid = function () {
        this.terrainContext.strokeStyle = this.GREEN;
        for (var i = 0; i <= Game.getNumOfCols(); i++) {
            this.terrainContext.moveTo(i * this.boxSize, 0);
            this.terrainContext.lineTo(i * this.boxSize, this.canvasHeight);
            this.terrainContext.stroke();
        }
        for (var i = 0; i <= Game.getNumOfRows(); i++) {
            this.terrainContext.moveTo(0, i * this.boxSize);
            this.terrainContext.lineTo(this.canvasWidth, i * this.boxSize);
            this.terrainContext.stroke();
        }
    };

    Drawer.prototype.drawUnit = function (unit) {
        var x = null;
        var y = null;
        if (unit.x == null || unit.y == null || isNaN(unit.x) || isNaN(unit.y)) {
            //this is pretty hacky storing x & y info on units (which arean't supposed to know about this kind of info...but it will have to do for now)
            var unitCoords = this.boxToCoords(unit.loc);
            unit.x = unitCoords.x;
            unit.y = unitCoords.y;
            console.log(unit.loc);
        }
        x = unit.x;
        y = unit.y;
        var coords = unit.getDrawCoordinates();

        //console.log(unit.x + " " + unit.y + " " + coords.x + " " + coords.y);
        this.unitContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x, y, this.unitWidth(), this.unitHeight());

        if (unit.selected) {
            this.unitContext.beginPath();
            this.unitContext.strokeStyle = this.GREEN;
            this.unitContext.arc(x + this.unitWidth() / 2, y + this.unitHeight() / 2, Math.max(this.unitWidth(), this.unitHeight()) * .75, 0, 2 * Math.PI);
            this.unitContext.stroke();

            //for all selected units with targets, indicate their targets with a red square on map (todo: change this to some sort of other marker)
            if (typeof (unit.target) !== 'undefined' && unit.target !== null) {
                this.drawSquare(unit.target, 'red');
            }
        }

        //draw the health bar above the unit...todo: move this elsewhere
        var percent = unit.health / unit.totalHealth;
        this.unitContext.fillStyle = "red";
        if (percent > .7) {
            this.unitContext.fillStyle = "green";
        } else if (percent > .4) {
            this.unitContext.fillStyle = "yellow";
        }
        this.unitContext.fillRect(x, y - this.HEALTH_BAR_OFFSET, this.unitWidth() * percent, this.HEALTH_BAR_HEIGHT);
        this.unitContext.fillStyle = "black";
        this.unitContext.fillRect(x + this.unitWidth() * percent, y - this.HEALTH_BAR_OFFSET, this.unitWidth() * (1 - percent), this.HEALTH_BAR_HEIGHT);
    };

    Drawer.prototype.unitWidth = function () {
        return this.boxSize * 2;
    };
    Drawer.prototype.unitHeight = function () {
        return this.boxSize * 2;
    };

    Drawer.prototype.drawUnitAquireTargetRange = function (unit) {
        var topLeft = unit.loc - unit.targetAquireRange - Game.getNumOfCols() * unit.targetAquireRange;
        var width = unit.targetAquireRange * 2 + unit.gridWidth;
        var height = unit.targetAquireRange * 2 + unit.gridHeight;
        var locs = utilities.getOccupiedSquares(topLeft, width, height);
        for (var l in locs) {
            this.drawSquare(locs[l], "purple");
        }
    };

    Drawer.prototype.drawUnitSightRange = function (unit) {
        var topLeft = unit.loc - unit.sightRange - Game.getNumOfCols() * unit.sightRange;
        var width = unit.sightRange * 2 + unit.gridWidth;
        var height = unit.sightRange * 2 + unit.gridHeight;
        var locs = utilities.getOccupiedSquares(topLeft, width, height);
        for (var l in locs) {
            this.drawSquare(locs[l], "orange");
        }
    };
    return Drawer;
})();
//# sourceMappingURL=drawer.js.map
