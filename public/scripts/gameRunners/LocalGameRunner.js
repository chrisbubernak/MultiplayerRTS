/// <reference path="../GameRunner.ts" />
var LocalGameRunner = (function () {
    function LocalGameRunner() {
        this.DEBUG = false;
        this.DRAWGRID = false;
        this.actions = new Array();
        this.FPS = 60;
        this.RealFPS = this.FPS;
        this.updateFPS = 10;
        this.actionList = new Array();
        var id = "test";
        this.myGame;
        this.drawer = new Drawer(1440, 720, id, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), this);

        var that = this;

        //mouse move stuff
        $(document).mousedown(function (e) {
            //on left click...
            if (e.which == 1) {
                $(this).data('mousedown', true);
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.setSelection(coords);
                that.myGame.unselectAll();
            } else if (e.which == 3) {
                var units = Game.getUnits();
                for (var u in units) {
                    if (units[u].selected) {
                        var tar = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                        var a = new Action(that.drawer.coordsToBox(tar.x, tar.y), Game.getUnits()[u].id, that.shifted);
                        that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
                    }
                }
            }
        });

        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });

        $(document).mouseup(function (e) {
            $(this).data('mousedown', false);
        });

        $(document).mousemove(function (e) {
            if ($(this).data('mousedown')) {
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.updateSelection(that.selection, coords.x, coords.y);
            }
        });
        var that = this;

        //keep track of when shift is held down so we can queue up unit movements
        //for debugging also listen for g clicked ...this signifies to draw the grid
        $(document).bind('keydown', function (e) {
            var code = e.keyCode || e.which;
            if (code == 71) {
                if (that.DRAWGRID) {
                    that.DRAWGRID = false;
                    that.drawer.drawTerrain();
                } else {
                    that.DRAWGRID = true;
                    that.drawer.drawGrid();
                }
            } else if (code === 68) {
                if (that.DEBUG) {
                    that.DEBUG = false;
                } else {
                    that.DEBUG = true;
                }
            }
            that.shifted = e.shiftKey;
            return true;
        });

        //mouse move stuff END
        this.myGame = new Game(false, id, "enemyId", "gameId");
        this.run();
    }
    LocalGameRunner.prototype.run = function () {
        this.myGame.setup();
        this.drawer.drawTerrain();

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
            that.drawer.interpolate();
            that.drawer.drawUnits(Game.getUnits());
            that.drawSelect();
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        //loop that runs much less frequently (10 fps)
        //and handles physics/updating the game state/networking
        var fpsOut = document.getElementById("fps");

        //var conn = Game.conn;
        setInterval(function () {
            if (that.myGame.isOver()) {
                that.end("Game is over!");
                return;
            }

            var currentSimTick = that.myGame.getSimTick();
            that.myGame.update();
            that.getSelection();

            that.myGame.applyActions(that.actions, currentSimTick);
            that.actions = new Array();

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            that.RealFPS = Math.round(1000 / diffTime);
            fpsOut.innerHTML = that.RealFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
        }, 1000 / (that.updateFPS));
    };

    LocalGameRunner.prototype.drawSelect = function () {
        var that = this;
        if ($(document).data('mousedown')) {
            this.drawer.drawSelect(this.selection);
        }
    };

    LocalGameRunner.prototype.setSelection = function (coords) {
        this.selection = new SelectionObject(coords.x, coords.y);
    };

    LocalGameRunner.prototype.updateSelection = function (selection, eX, eY) {
        selection.x = Math.min(selection.sX, eX);
        selection.y = Math.min(selection.sY, eY);
        selection.w = Math.abs(selection.sX - eX);
        selection.h = Math.abs(selection.sY - eY);
        return selection;
    };

    LocalGameRunner.prototype.end = function (message) {
        alert(message);
        window.location.href = "/lobby";
    };

    LocalGameRunner.prototype.getSelection = function () {
        var that = this;
        if ($(document).data('mousedown')) {
            //create the selection
            var selectionLoc = that.drawer.coordsToBox(that.selection.x, that.selection.y);
            var occupied = Utilities.getOccupiedSquares(selectionLoc, that.selection.w / that.drawer.getBoxWidth(), that.selection.h / that.drawer.getBoxHeight());
            for (var o in occupied) {
                var id = Game.getGridLoc(occupied[o]);
                if (id != null) {
                    var unit = Utilities.findUnit(id, Game.getUnits());
                    if (unit.player == that.myGame.getId()) {
                        unit.selected = true;
                    }
                }
            }
        }
    };
    LocalGameRunner.updateFPS = 10;
    return LocalGameRunner;
})();
//# sourceMappingURL=LocalGameRunner.js.map
