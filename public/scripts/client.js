/// <reference path="game/game.ts" />
/// <reference path="peer.js" />
/// <reference path="game/drawer.ts" />
/// <reference path="game/jquery.ts" />
/// <reference path="definitions/node.d.ts" />
/// <reference path="definitions/jquery.d.ts" />
/// <reference path="definitions/peer.d.ts" />
var Client = (function () {
    function Client(id, enemyId, host) {
        this.actions = new Array();
        this.FPS = 60;
        this.RealFPS = this.FPS;
        this.updateFPS = 10;
        this.actionList = new Array();
        //TODO: Refactor....we should load all our resources somewhere else but for now this makes the game not break
        var t = new TerrainTile();
        t.getImage();
        var gameId = 123;
        this.peer = new Peer(id, { key: 'vgs0u19dlxhqto6r' }); //TODO: use our own server
        this.myGame;
        this.host = host;

        var that = this;

        //mouse move stuff
        $(document).mousedown(function (e) {
            //on left click...
            if (e.which == 1) {
                $(this).data('mousedown', true);
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.myGame.setSelection(coords);
                that.myGame.unselectAll();
            } else if (e.which == 3) {
                var units = Game.getUnits();
                for (var u in units) {
                    if (units[u].selected) {
                        var tar = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                        that.actions.push({ unit: Game.getUnits()[u].id, target: tar, shift: that.shifted });
                    }
                }
            }
        });

        $(document).mouseup(function (e) {
            $(this).data('mousedown', false);
        });

        $(document).mousemove(function (e) {
            if ($(this).data('mousedown')) {
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.myGame.updateSelection(that.myGame.getSelectionObject(), coords.x, coords.y);
            }
        });

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
                    that.myGame = new Game(that.conn, host, id, enemyId, gameId); //am i host? what is my id? what is the enemies id?
                    that.run();
                });
                that.conn.on('close', function () {
                    console.log('connection closed!');
                    that.myGame.end('Enemy Quit');
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
                        that.myGame = new Game(conn, host, id, enemyId, gameId); //am i host? what is my id? what is the enemies id?
                        that.run();
                    });
                    that.conn.on('close', function () {
                        console.log('connection closed!');
                        that.myGame.end('Enemy Quit');
                    });
                    that.conn.on('data', function (data) {
                        if (!(typeof (data.simTick) === 'undefined')) {
                            //if we are the client it means the host sent us an update and we should apply it
                            that.myGame.applyActions(data.actions, data.simTick);
                        }
                    });
                });
            }
        });
    }
    Client.prototype.run2 = function () {
        var that = this;
        var interval = setInterval(function () {
            if (that.myGame.isOver()) {
                //stops this callback from firing again once the game is over
                clearInterval(that.interval);

                //return to lobby code goes here
                return;
            }

            if (that.host) {
                if (that.actionsFromClient != null) {
                    that.myGame.applyActions(that.actions, that.myGame.getSimTick());
                }
            } else {
                //send actions to host
                //wait for full action list to come from host
                //game.apply(actions)
                //game.counter++
            }
        }, 1000 / (Client.updateFPS));
    };

    Client.prototype.run = function () {
        this.myGame.setup();

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
            that.myGame.interpolate();
            drawer.drawUnits(Game.getUnits());
            that.myGame.drawSelect();

            //debugging stuff...
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        //loop that runs much less frequently (10 fps)
        //and handles physics/updating the game state/networking
        var fpsOut = document.getElementById("fps");

        //var conn = Game.conn;
        setInterval(function () {
            that.myGame.update();
            that.myGame.getSelection();

            //if we arean't the host just send our actions to the host
            if (!that.host) {
                that.conn.send({ actions: that.actions, simTick: that.myGame.getSimTick() });
                that.actions = new Array();
            } else if (that.host && that.actionList[that.myGame.getSimTick()]) {
                that.actions = that.actions.concat(that.actionList[that.myGame.getSimTick()]);
                that.conn.send({ actions: that.actions, simTick: that.myGame.getSimTick() });
                that.myGame.applyActions(that.actions, that.myGame.getSimTick());
                that.actions = new Array();
            }

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            that.RealFPS = Math.round(1000 / diffTime);
            fpsOut.innerHTML = that.RealFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
        }, 1000 / (that.updateFPS));
    };
    Client.updateFPS = 10;
    return Client;
})();
