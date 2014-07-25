/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="units/orc.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="unit.ts" />
/// <reference path="utilities.ts" />
/// <reference path="selectionObject.ts" />
/// <reference path="action.ts" />
var Game = (function () {
    //Public Methods:
    function Game(conn, host, id, enemyId, gameId) {
        //"private" variables
        this.simTick = 0;
        this.gameId = gameId;
        this.id = id; //this players id
        this.enemyId = enemyId;
        this.host = host;
    }
    Game.prototype.setup = function () {
        this.generateTerrain();

        //disable the right click so we can use it for other purposes
        document.oncontextmenu = function () {
            return false;
        };

        Game.grid = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
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

            var p1unit = new Knight(Math.round(utilities.random() * Game.NUM_OF_COL * Game.NUM_OF_ROW), p1);
            Game.markOccupiedGridLocs(p1unit);
            Game.units.push(p1unit);
            var p2unit = new Orc(Math.round(utilities.random() * Game.NUM_OF_COL * Game.NUM_OF_ROW), p2);
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

    Game.getNumOfCols = function () {
        return Game.NUM_OF_COL;
    };

    Game.getNumOfRows = function () {
        return Game.NUM_OF_ROW;
    };

    Game.getRatio = function () {
        return Game.RATIO;
    };

    Game.prototype.getId = function () {
        return this.id;
    };

    Game.prototype.getGridLoc = function (g) {
        return Game.grid[g];
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
        var locs = utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            Game.setGridLoc(locs[l], unit.id);
        }
    };

    Game.unmarkGridLocs = function (unit) {
        //unmark the locs occupied by this unit
        var locs = utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            Game.setGridLoc(locs[l], null);
        }
    };

    Game.getUnitsForPlayer = function (id) {
        var myUnits = new Array();
        for (var u in Game.units) {
            var unit = Game.units[u];
            if (unit.player === id) {
                myUnits.push(unit);
            }
        }
        return myUnits;
    };

    Game.prototype.applyActions = function (actions, simTick) {
        for (var a in actions) {
            //this is a little silly at the moment to convert the data into an object but I'd like to
            //be able to just pass around this object in the future without modifying the following code
            var action = new Action(actions[a].target, actions[a].unit, actions[a].shift);
            var unit = utilities.findUnit(action.getUnit(), Game.units);
            if (unit != null) {
                var targetLoc = action.getTarget();
                unit.target = targetLoc;
                if (Game.grid[targetLoc] != null) {
                    unit.unitTarget = utilities.findUnit(Game.grid[targetLoc], Game.units);
                } else {
                    unit.unitTarget = null;
                }
            }
        }
        this.simTick++;
    };

    Game.prototype.getSimTick = function () {
        return this.simTick;
    };

    Game.prototype.update = function () {
        for (var i = Game.units.length - 1; i >= 0; i--) {
            Game.units[i].update();
        }
    };

    Game.prototype.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    Game.prototype.unselectAll = function () {
        for (var u in Game.getUnits()) {
            Game.units[u].selected = false;
        }
    };

    //Private Methods:
    Game.prototype.generateTerrain = function () {
        for (var i = 0; i < (length = Game.NUM_OF_COL * Game.NUM_OF_ROW); i++) {
            var type = utilities.random();
            var grass = .5;
            if (Game.terrain[i - 1] && Game.terrain[i - 1].type == 'grass') {
                grass -= .2;
            }
            if (Game.terrain[i - Game.NUM_OF_COL] && Game.terrain[i - Game.NUM_OF_COL].type == 'grass') {
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
        var first = Math.round(utilities.random() * Game.NUM_OF_ROW * Game.NUM_OF_COL);
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
    Game.RATIO = 1.6;
    Game.NUM_OF_COL = 40;
    Game.NUM_OF_ROW = (Game.NUM_OF_COL / Game.RATIO);

    Game.terrain = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
    Game.NUMBER_OF_UNITS = 3;
    Game.grid = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
    Game.units = new Array();
    return Game;
})();
