/// <reference path="../game/game.ts" />
/// <reference path="../game/drawer.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="../definitions/Peer.d.ts" />
/// <reference path="GameRunner.ts" />
var NetworkedGameRunner = (function () {
    function NetworkedGameRunner(id, enemyId, host, gameId) {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.actions = new Array();
        this.FPS = 60;
        this.RealFPS = this.FPS;
        this.updateFPS = 10;
        this.actionList = new Array();
        this.actionHistory = {};
        this.myId = id;
        this.gameId = gameId;
        this.peer = new Peer(id, { key: 'vgs0u19dlxhqto6r' }); //TODO: use our own server
        this.myGame = new Game(host, id, enemyId, gameId); //am i host? what is my id? what is the enemies id?
        this.host = host;
        var playerNumber;
        if (this.host) {
            playerNumber = 1;
        } else {
            playerNumber = 2;
        }
        this.drawer = new Drawer(playerNumber, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), this);

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
        this.peer.on('error', function (err) {
            console.log('error connecting!');
            console.log(err);
        });

        var that = this;
        this.peer.on('open', function () {
            console.log('peer is open!');

            //IF HOST
            if (host) {
                console.log('im initiating a connection');

                //connect to peer
                that.conn = that.peer.connect(enemyId, { reliable: true });
                that.conn.on('open', function () {
                    that.conn.send('Hey from player: ' + id);
                    that.run();
                });
                that.conn.on('close', function () {
                    console.log('connection closed!');
                    that.end('Enemy Quit');
                });
                that.conn.on('data', function (data) {
                    if (!(typeof (data.simTick) === 'undefined')) {
                        //if we are the host it means the client sent us their actions
                        //store these so we can send back an authoritatve action list
                        that.actionList[data.simTick] = data.actions;
                    }
                });
            } else {
                console.log('im waiting for a connection');

                //wait for connection
                that.peer.on('connection', function (conn) {
                    that.conn = conn;
                    console.log('client ' + conn);
                    that.conn.on('open', function () {
                        that.conn.send('Hey from player: ' + id);
                        that.run();
                    });
                    that.conn.on('close', function () {
                        console.log('connection closed!');
                        that.end('Enemy Quit');
                    });
                    that.conn.on('data', function (data) {
                        if (!(typeof (data.simTick) === 'undefined')) {
                            //if we are the client it means the host sent us an update and we should apply it
                            that.myGame.applyActions(data.actions, data.simTick);
                            if (data.actions.length > 0) {
                                that.actionHistory[data.simTick] = data.actions;
                            }
                        }
                    });
                });
            }
        });
    }
    NetworkedGameRunner.prototype.run = function () {
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
        var intervalId = setInterval(function () {
            if (that.myGame.isOver()) {
                that.end("Game is over!");
                clearInterval(intervalId);
                return;
            }

            var currentSimTick = that.myGame.getSimTick();
            that.myGame.update();
            that.getSelection();

            //if we arean't the host just send our actions to the host
            if (!that.host) {
                that.conn.send({ actions: that.actions, simTick: currentSimTick });
                that.actions = new Array();
            } else if (that.host && that.actionList[currentSimTick]) {
                that.actions = that.actions.concat(that.actionList[currentSimTick]);
                that.conn.send({ actions: that.actions, simTick: currentSimTick });
                that.myGame.applyActions(that.actions, currentSimTick);
                if (that.actions.length > 0) {
                    that.actionHistory[currentSimTick] = that.actions;
                }
                that.actions = new Array();
            }

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            that.RealFPS = Math.round(1000 / diffTime);
            fpsOut.innerHTML = that.RealFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
        }, 1000 / (that.updateFPS));
    };

    NetworkedGameRunner.prototype.drawSelect = function () {
        var that = this;
        if ($(document).data('mousedown')) {
            this.drawer.drawSelect(this.selection);
        }
    };

    NetworkedGameRunner.prototype.setSelection = function (coords) {
        this.selection = new SelectionObject(coords.x, coords.y);
    };

    NetworkedGameRunner.prototype.updateSelection = function (selection, eX, eY) {
        selection.x = Math.min(selection.sX, eX);
        selection.y = Math.min(selection.sY, eY);
        selection.w = Math.abs(selection.sX - eX);
        selection.h = Math.abs(selection.sY - eY);
        return selection;
    };

    NetworkedGameRunner.prototype.end = function (message) {
        this.sendGameReportToServer();
        window.location.href = "/lobby";
    };

    NetworkedGameRunner.prototype.sendGameReportToServer = function () {
        console.log(this.actionHistory);

        var that = this;
        $.ajax({
            url: "/gameEnd",
            type: "POST",
            data: {
                gameId: that.gameId,
                reporter: that.myId,
                winner: that.myGame.winner,
                actions: JSON.stringify(that.actionHistory)
            },
            success: function (data, textStatus, jqXHR) {
                alert('SUCCESS');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('ERR');
            }
        });
    };

    NetworkedGameRunner.prototype.getSelection = function () {
        var that = this;
        if ($(document).data('mousedown')) {
            //create the selection
            var selectionLoc = that.drawer.coordsToBox(that.selection.x, that.selection.y);
            var occupied = Utilities.getOccupiedSquares(selectionLoc, that.selection.w / that.drawer.getBoxWidth(), that.selection.h / that.drawer.getBoxHeight());
            for (var o in occupied) {
                var id = Game.getGridLoc(occupied[o]);
                if (id != null) {
                    var unit = Utilities.findUnit(id, Game.getUnits());
                    if (unit.player === that.myGame.getPlayerNumber()) {
                        unit.selected = true;
                    }
                }
            }
        }
    };
    NetworkedGameRunner.updateFPS = 10;
    return NetworkedGameRunner;
})();
//# sourceMappingURL=NetworkedGameRunner.js.map
