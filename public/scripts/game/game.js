/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="units/orc.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="unit.ts" />
/// <reference path="Utilities.ts" />
/// <reference path="selectionObject.ts" />
/// <reference path="action.ts" />
/// <reference path="commands/ICommand.ts" />
/// <reference path="commands/WalkCommand.ts" />
/// <reference path="commands/AttackCommand.ts" />
/// <reference path="maps/IMap.ts" />
var Game = (function () {
    //Public Methods:
    function Game(host, id, enemyId, gameId) {
        //"private" variables
        this.simTick = 0;
        this.map = new Map1();
        this.gameId = gameId;
        this.id = id; //this players id
        this.enemyId = enemyId;
        this.host = host;
        if (host) {
            this.playerNumber = 1;
        } else {
            this.playerNumber = 2;
        }
    }
    Game.prototype.setup = function () {
        Game.terrain = this.map.GetTerrain();

        //disable the right click so we can use it for other purposes
        document.oncontextmenu = function () {
            return false;
        };

        Game.grid = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
        for (var g in Game.grid) {
            Game.grid[g] = null;
        }

        Game.units = this.map.GetUnits();
        for (var u in Game.units) {
            Game.markOccupiedGridLocs(Game.units[u]);
        }
    };
    Game.prototype.isOver = function () {
        //check if either player is out of units & return based on that
        if (Game.getUnitsForPlayer(2).length === 0) {
            return true;
        } else if (Game.getUnitsForPlayer(1).length === 0) {
            return true;
        }

        return false;
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

    Game.prototype.getPlayerNumber = function () {
        return this.playerNumber;
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

    Game.removeUnitById = function (unitId) {
        var id = unitId;
        for (var i = 0; i < (length = Game.units.length); i++) {
            if (Game.units[i].id == id) {
                Game.unmarkGridLocs(Game.units[i]);
                Game.units.splice(i, 1);
                return;
            }
        }
    };

    Game.getUnits = function () {
        return Game.units;
    };

    Game.markOccupiedGridLocs = function (unit) {
        //mark the locs occupied by this unit
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            Game.setGridLoc(locs[l], unit.id);
        }
    };

    Game.unmarkGridLocs = function (unit) {
        //unmark the locs occupied by this unit
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            Game.setGridLoc(locs[l], null);
        }
    };

    Game.getUnitsForPlayer = function (playerNumber) {
        var myUnits = new Array();
        for (var u in Game.units) {
            var unit = Game.units[u];
            if (unit.player === playerNumber) {
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
            var unit = Utilities.findUnit(action.getUnit(), Game.units);
            if (unit != null) {
                //new logic!
                var targetLoc = action.getTarget();
                if (Game.grid[targetLoc] != null) {
                    var unitTarget = Utilities.findUnit(Game.grid[targetLoc], Game.units);
                    var isEnemy = this.areEnemies(unit, unitTarget);
                    var isVisible = Utilities.canAnyUnitSeeEnemy(unit, unitTarget);
                    if (isEnemy && isVisible) {
                        unit.command = new AttackCommand(unitTarget);
                    } else if (isEnemy && !isVisible) {
                        unit.command = new WalkCommand(unitTarget.loc);
                    } else if (!isEnemy && isVisible) {
                        //issue a follow command
                    } else {
                        alert("WE HAVE A PROBLEM ....unable to issue a command...logic error somewhere");
                    }
                } else {
                    unit.command = new WalkCommand(targetLoc);
                }
                unit.newCommand = true; //set this so the unit knows to transition to waiting state
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
    Game.prototype.areEnemies = function (unit1, unit2) {
        if (unit1.player !== unit2.player) {
            return true;
        }
    };
    Game.RATIO = 2;
    Game.NUM_OF_COL = 60;
    Game.NUM_OF_ROW = (Game.NUM_OF_COL / Game.RATIO);

    Game.terrain = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
    Game.NUMBER_OF_UNITS = 3;
    Game.grid = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
    Game.units = new Array();
    return Game;
})();
//# sourceMappingURL=game.js.map
