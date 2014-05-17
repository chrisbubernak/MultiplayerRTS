/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="units/orc.ts" />
/// <reference path="jquery.js" />
/// <reference path="unit.ts" />
/// <reference path="utilities.ts" />
var Game = (function () {
    //Public Methods:
    function Game(conn, host, id, enemyId, gameId) {
        //"private" variables
        this.selection = new Object();
        this.actions = new Array();
        this.simTick = 0;
        this.actionList = new Array();
        this.gameId = gameId;
        this.id = id; //this players id
        this.enemyId = enemyId;
        Game.conn = conn;
        this.host = host;
    }
    Game.prototype.setup = function () {
        drawer.init(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT, this.id, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"));
        this.generateTerrain();
        drawer.drawTerrain(Game.terrain);

        //disable the right click so we can use it for other purposes
        document.oncontextmenu = function () {
            return false;
        };

        Game.grid = new Array(Game.boxesPerRow * Game.boxesPerCol);
        for (var g in Game.grid) {
            Game.grid[g] = null;
        }

        var that = this;

        for (var i = 0; i < Game.NUMBER_OF_UNITS; i++) {
            var p1;
            var p2;
            if (this.host) {
                p1 = this.id;
                p2 = this.enemyId;
            } else {
                p1 = this.enemyId;
                p2 = this.id;
            }

            var p1unit = new Knight(Math.round(utilities.random() * Game.boxesPerRow * Game.boxesPerCol), p1);
            Game.markOccupiedGridLocs(p1unit);
            Game.units.push(p1unit);
            var p2unit = new Orc(Math.round(utilities.random() * Game.boxesPerRow * Game.boxesPerCol), p2);
            Game.markOccupiedGridLocs(p2unit);
            Game.units.push(p2unit);
        }
    };
    Game.prototype.isOver = function () {
        //check if either player is out of units & return based on that
        return false;
    };

    Game.prototype.end = function (message) {
        alert(message);
    };

    Game.getGridLoc = function (index) {
        return Game.grid[index];
    };

    Game.setGridLoc = function (index, unitId) {
        Game.grid[index] = unitId;
    };

    Game.getTerrainLoc = function (index) {
        return Game.terrain[index];
    };

    Game.getBoxSize = function () {
        return Game.boxSize;
    };

    Game.getCanvasWidth = function () {
        return Game.CANVAS_WIDTH;
    };

    Game.getCanvasHeight = function () {
        return Game.CANVAS_HEIGHT;
    };

    Game.getBoxesPerRow = function () {
        return Game.boxesPerRow;
    };

    Game.removeUnit = function (unit) {
        var id = unit.id;
        for (var i = 0; i < (length = Game.units.length); i++) {
            if (Game.units[i].id == id) {
                Game.units.splice(i, 1);
                Game.unmarkGridLocs(unit);
                return;
            }
        }
    };

    Game.getUnits = function () {
        return Game.units;
    };

    Game.markOccupiedGridLocs = function (unit) {
        //mark the locs occupied by this unit
        var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
        for (var l in locs) {
            Game.setGridLoc(locs[l], unit.id);
        }
    };

    Game.unmarkGridLocs = function (unit) {
        //unmark the locs occupied by this unit
        var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
        for (var l in locs) {
            Game.setGridLoc(locs[l], null);
        }
    };

    Game.prototype.applyActions = function (actions, simTick) {
        for (var a in actions) {
            var unit = utilities.findUnit(actions[a].unit, Game.units);
            if (unit != null) {
                var targetLoc = utilities.coordsToBox(actions[a].target.x, actions[a].target.y);
                unit.target = targetLoc;
            }
        }
        this.simTick++;
    };

    Game.prototype.getSimTick = function () {
        return this.simTick;
    };

    Game.prototype.interpolate = function () {
        for (var i = 0; i < Game.units.length; i++) {
            var oldCoords = utilities.boxToCoords(Game.units[i].prevLoc);
            var coords = utilities.boxToCoords(Game.units[i].loc);
            Game.units[i].x -= ((1 / (Game.FPS / Game.updateFPS)) * (oldCoords.x - coords.x)) / (Game.units[i].moveSpeed + 1);
            Game.units[i].y -= ((1 / (Game.FPS / Game.updateFPS)) * (oldCoords.y - coords.y)) / (Game.units[i].moveSpeed + 1);
        }
    };

    Game.prototype.drawSelect = function () {
        var that = this;
        if ($(document).data('mousedown')) {
            drawer.drawSelect(that.selection);
        }
    };

    Game.prototype.update = function () {
        for (var i = Game.units.length - 1; i >= 0; i--) {
            Game.units[i].update();
        }
    };

    Game.prototype.getSelection = function () {
        var that = this;
        if ($(document).data('mousedown')) {
            //create the selection
            var selectionLoc = utilities.coordsToBox(that.selection.x, that.selection.y);
            var occupied = utilities.getOccupiedSquares(selectionLoc, that.selection.w, that.selection.h);
            for (var o in occupied) {
                var id = Game.grid[occupied[o]];
                if (id != null) {
                    var unit = utilities.findUnit(id, Game.units);
                    if (unit.player == that.id) {
                        unit.selected = true;
                    }
                }
            }
        }
    };

    Game.prototype.getSelectionObject = function () {
        return this.selection;
    };

    Game.prototype.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    Game.prototype.setSelection = function (coords) {
        this.selection = Object.create(new this.select(coords.x, coords.y));
    };

    Game.prototype.unselectAll = function () {
        for (var u in Game.getUnits()) {
            Game.units[u].selected = false;
        }
    };

    Game.prototype.select = function (sX, sY) {
        //TODO: make selection into its own object!!!
        var selection = new Object();
        selection.sX = sX;
        selection.x = sX;
        selection.sY = sY;
        selection.y = sY;
        selection.w = 0;
        selection.h = 0;
        selection.select = true;
        return selection;
    };

    Game.prototype.updateSelection = function (selection, eX, eY) {
        selection.x = Math.min(selection.sX, eX);
        selection.y = Math.min(selection.sY, eY);
        selection.w = Math.abs(selection.sX - eX);
        selection.h = Math.abs(selection.sY - eY);
        return selection;
    };

    Game.prototype.getCanvasHeight = function () {
        return Game.CANVAS_HEIGHT;
    };

    Game.prototype.getCanvasWidth = function () {
        return Game.CANVAS_WIDTH;
    };

    //Private Methods:
    Game.prototype.generateTerrain = function () {
        for (var i = 0; i < (length = Game.boxesPerRow * Game.boxesPerCol); i++) {
            var type = utilities.random();
            var grass = .5;
            if (Game.terrain[i - 1] && Game.terrain[i - 1].type == 'grass') {
                grass -= .2;
            }
            if (Game.terrain[i - Game.boxesPerRow] && Game.terrain[i - Game.boxesPerRow].type == 'grass') {
                grass -= .2;
            }
            if (type >= grass) {
                Game.terrain[i] = new GrassTile();
            } else {
                Game.terrain[i] = new DirtTile();
            }
        }
        for (var i = 0; i < 6; i++) {
            this.generateLake();
        }
    };

    Game.prototype.generateLake = function () {
        var first = Math.round(utilities.random() * Game.boxesPerCol * Game.boxesPerRow);
        var lake = new Array();
        var old = new Array();
        lake.push(first);
        var counter = 0;
        while (lake.length > 0 && counter < 23) {
            Game.terrain[lake[0]] = new WaterTile();
            var neighbors = utilities.neighbors(lake[0]);
            for (var i = 0; i < neighbors.length; i++) {
                if (utilities.random() > .35 && old.indexOf(neighbors[i]) == -1) {
                    lake.push(neighbors[i]);
                }
            }
            old.push(lake.shift());
            counter++;
        }
        for (var i = 0; i < lake.length; i++) {
            Game.terrain[lake[i]] = new WaterTile();
        }
    };
    Game.CANVAS_WIDTH = 1440;
    Game.CANVAS_HEIGHT = 720;
    Game.boxesPerRow = 90;
    Game.ratio = Game.CANVAS_WIDTH / Game.CANVAS_HEIGHT;
    Game.boxesPerCol = Game.boxesPerRow / Game.ratio;
    Game.boxSize = Game.CANVAS_WIDTH / Game.boxesPerRow;
    Game.terrain = new Array(Game.boxesPerRow * Game.boxesPerCol);
    Game.NUMBER_OF_UNITS = 3;
    Game.SEED = 3;
    Game.grid = new Array(Game.boxesPerRow * Game.boxesPerCol);
    Game.units = new Array();

    Game.updateFPS = 10;
    Game.FPS = 60;
    return Game;
})();
