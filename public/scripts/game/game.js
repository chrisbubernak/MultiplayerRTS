/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="units/orc.ts" />
/// <reference path="jquery.js" />
/// <reference path="quadtree.ts" />
/// <reference path="unit.ts" />
/// <reference path="utilities.ts" />
var Game = (function () {
    //constructor(socket, id, clients, gameId) {
    function Game(conn, host, id, enemyId, gameId) {
        this.selection = new Object();
        this.actions = new Array();
        this.simTick = 0;
        this.actionList = new Array();
        this.gameId = gameId;
        this.id = id; //this players id
        this.enemyId = enemyId;
        Game.conn = conn;
        this.host = host;

        var that = this;
        Game.conn.on('data', function (data) {
            if (!(typeof (data.simTick) === 'undefined')) {
                if (that.host) {
                    that.actionList[data.simTick] = data.actions;
                } else {
                    that.applyActions(data.actions, data.simTick); //if we are the client it means the host sent us an update and we should apply it
                }
            }
        });
    }
    //Public Methods:
    Game.prototype.run = function () {
        this.setup();

        //timing stuff
        var oldTime = new Date().getTime();
        var diffTime = 0;
        var newTime = 0;
        var oldTime2 = new Date().getTime();
        var diffTime2 = 0;
        var newTime2 = 0;

        //loop that runs at 60 fps...aka drawing & selection stuff
        var that = this;
        setInterval(function () {
            that.interpolate();
            drawer.drawUnits(Game.units);
            that.drawSelect();

            //debugging stuff...
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / Game.FPS);

        //loop that runs much less frequently (10 fps)
        //and handles physics/updating the game state/networking
        var fpsOut = document.getElementById("fps");

        //var conn = Game.conn;
        setInterval(function () {
            that.tree.insert(Game.units);
            that.update();
            that.getSelection();
            that.tree.clear();

            //if we arean't the host just send our actions to the host
            if (!that.host) {
                Game.conn.send({ actions: that.actions, simTick: that.simTick });
                that.actions = new Array();
            } else if (that.host && that.actionList[that.simTick]) {
                that.actions = that.actions.concat(that.actionList[that.simTick]);
                Game.conn.send({ actions: that.actions, simTick: that.simTick });
                that.applyActions(that.actions, that.simTick);
                that.actions = new Array();
            }

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            Game.RealFPS = Math.round(1000 / diffTime);
            fpsOut.innerHTML = Game.RealFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
        }, 1000 / (Game.updateFPS));
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

    //Private Methods:
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

        //keep track of when shift is held down so we can queue up unit movements
        //for debugging also listen for g clicked ...this signifies to draw the grid
        $(document).bind('keyup keydown', function (e) {
            var code = e.keyCode || e.which;
            if (code == 71) {
                drawer.drawGrid();
            }
            that.shifted = e.shiftKey;
            return true;
        });

        $(document).mousedown(function (e) {
            //on left click...
            if (e.button == 0) {
                $(this).data('mousedown', true);
                var coords = that.getMousePos(document.getElementById("selectionCanvas"), e);
                that.selection = Object.create(new that.select(coords.x, coords.y, coords.x + 1, coords.y + 1));
                for (var u in Game.units) {
                    Game.units[u].selected = false;
                }
            } else if (e.button == 2) {
                for (var u in Game.units) {
                    if (Game.units[u].selected) {
                        var tar = that.getMousePos(document.getElementById("selectionCanvas"), e);
                        that.actions.push({ unit: Game.units[u].id, target: tar, shift: that.shifted });
                    }
                }
            }
        });

        $(document).mouseup(function (e) {
            $(this).data('mousedown', false);
        });

        $(document).mousemove(function (e) {
            if ($(this).data('mousedown')) {
                var coords = that.getMousePos(document.getElementById("selectionCanvas"), e);
                that.updateSelection(that.selection, coords.x, coords.y);
            }
        });

        // initialize the quadtree
        var args = { x: 0, y: 0, h: Game.CANVAS_HEIGHT, w: Game.CANVAS_WIDTH, maxChildren: 5, maxDepth: 5 };
        this.tree = QUAD.init(args);
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

    Game.prototype.applyActions = function (actions, simTick) {
        for (var a in actions) {
            var unit = utilities.findUnit(actions[a].unit, Game.units);
            var targetLoc = utilities.coordsToBox(actions[a].target.x, actions[a].target.y);
            unit.target = targetLoc;
        }
        this.simTick++;
    };

    Game.prototype.update = function () {
        for (var i = Game.units.length - 1; i >= 0; i--) {
            Game.units[i].update();
        }
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

    Game.prototype.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
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

    Game.prototype.getSelection = function () {
        var that = this;
        if ($(document).data('mousedown')) {
            //create the selection
            var region = that.tree.retrieve(that.selection, function (item) {
                var loc = utilities.boxToCoords(item.loc);
                loc.w = item.w;
                loc.h = item.h;
                if ((item.player == that.id) && utilities.collides(that.selection, loc) && item != that.selection) {
                    item.selected = true;
                }
            });
        }
    };

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
    Game.FPS = 60;
    Game.RealFPS = Game.FPS;
    Game.updateFPS = 10;
    Game.SEED = 3;
    Game.grid = new Array(Game.boxesPerRow * Game.boxesPerCol);
    Game.units = new Array();
    return Game;
})();
