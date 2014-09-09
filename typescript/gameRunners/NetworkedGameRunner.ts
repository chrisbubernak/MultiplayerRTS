/// <reference path="../game/game.ts" />
/// <reference path="../game/drawer.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="../definitions/Peer.d.ts" />
/// <reference path="GameRunner.ts" />
/// <reference path="../game/coords.ts" />
/// <reference path="../game/selectionObject.ts" />

class NetworkedGameRunner implements GameRunner {
  public DEBUG: boolean = false;
  public STATEDEBUG: boolean = false;
  public DRAWGRID: boolean = false;

  private myGame: Game;
  private host: Boolean;
  private peer;
  private conn;
  private actions = new Array();
  private updateFPS: number = 10;
  private FPS: number = 60;
  private REAL_FPS: number = this.FPS;
  private actionList = new Array();
  private actionHistory = {};
  private shifted: boolean;
  private selection: SelectionObject;
  private drawer: Drawer;
  private gameId: string;
  private myId: string;

  constructor(id: string, enemyId: string, host: boolean, gameId: string) {
    this.myId = id;
    this.gameId = gameId;
    this.peer = new Peer(id, { key: "vgs0u19dlxhqto6r" }); // todo: use our own server
    this.myGame = new Game(host, id, enemyId, gameId); // am i host? what is my id? what is the enemies id?
    this.host = host;
    var playerNumber: number;
    if (this.host) {
      playerNumber = 1;
    } else {
      playerNumber = 2;
    }
    this.drawer = new Drawer(playerNumber,
      document.getElementById("terrainCanvas"),
      document.getElementById("unitCanvas"),
      document.getElementById("fogCanvas"),
      document.getElementById("selectionCanvas"),
      this);

    var that: NetworkedGameRunner = this;
    // mouse move stuff
    $(document).mousedown(function (e: any): void {
      // on left click...
      if (e.which === 1) {
        $(this).data("mousedown", true);
        var coords: Coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
        that.setSelection(coords);
        that.myGame.unselectAll();
      } else if (e.which === 3) {
        // if right click...
        var units: Unit[] = Game.getUnits();
        for (var u: number = 0; u < units.length; u++) {
          if (units[u].selected) {
            // todo: create a custom class for the return of getMousePos
            var tar: any = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
            var a: Action = new Action(that.drawer.coordsToBox(tar.x, tar.y),
              Game.getUnits()[u].id,
              that.shifted);
            that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
          }
        }
      }
    });

    $(window).resize(function(): any {
      that.drawer.updateDimensions($(window).width(), $(window).height());
    });

    $(document).mouseup(function (e: any): void {
      $(this).data("mousedown", false);
    });

    $(document).mousemove(function (e: any): void {
      if ($(this).data("mousedown")) {
        var coords: Coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
        that.updateSelection(that.selection, coords.x, coords.y);
      }
    });

    // keep track of when shift is held down so we can queue up unit movements
    // for debugging also listen for g clicked ...this signifies to draw the grid
    $(document).bind("keydown", function (e: any): boolean {
      var code: number = e.keyCode || e.which;
      if (code === 71) {
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
    // mouse move stuff END


    this.peer.on("error", function (err: string): void {
      console.log("error connecting!");
      console.log(err);
    });

    this.peer.on("open", function (): void {
      console.log("peer is open!");

      // if i am host
      if (host) {
        console.log("im initiating a connection");
        // connect to peer
        that.conn = that.peer.connect(enemyId, { reliable: true });
        that.conn.on("open", function (): void {
          that.conn.send("Hey from player: " + id);
          that.run();
        });
        that.conn.on("close", function (): void {
          console.log("connection closed!");
          that.end("Enemy Quit");
        });
        that.conn.on("data", function (data: any): void {
          if (!(typeof (data.simTick) === "undefined")) {
            // if we are the host it means the client sent us their actions
            // store these so we can send back an authoritatve action list 
            that.actionList[data.simTick] = data.actions;
          }
        });
      } else {
        // if i am the client
        console.log("im waiting for a connection");
        // wait for connection
        that.peer.on("connection", function (conn: any): void {
          that.conn = conn;
          console.log("client " + conn);
          that.conn.on("open", function (): void {
            that.conn.send("Hey from player: " + id);
            that.run();
          });
          that.conn.on("close", function (): void {
            console.log("connection closed!");
            that.end("Enemy Quit");
          });
          that.conn.on("data", function (data: any): void {
            if (!(typeof (data.simTick) === "undefined")) {
              // if we are the client it means the host sent us an update and we should apply it
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

  public run(): void {
    this.myGame.setup();
    this.drawer.drawTerrain();

    // timing stuff
    var oldTime: number = new Date().getTime();
    var diffTime: number = 0;
    var newTime: number = 0;
    var oldTime2: number = new Date().getTime();
    var diffTime2: number = 0;
    var newTime2: number = 0;

    // loop that runs at 60 fps...aka drawing & selection stuff
    var that: NetworkedGameRunner = this;
    setInterval(function (): void {
      that.drawer.interpolate();
      that.drawer.drawUnits(Game.getUnits());
      that.drawSelect();
      diffTime = newTime - oldTime;
      oldTime = newTime;
      newTime = new Date().getTime();
    }, 1000 / this.FPS);

    // loop that runs much less frequently (10 fps)
    // and handles physics/updating the game state/networking 
    var fpsOut: any = document.getElementById("fps");
    var intervalId: number = setInterval(function (): void {
      if (that.myGame.isOver()) {
        that.end("Game is over!");
        clearInterval(intervalId);
      }

      var currentSimTick: number = that.myGame.getSimTick();
      that.myGame.update();
      that.getSelection();
      // if we arean't the host just send our actions to the host
      if (!that.host) {
        that.conn.send({ actions: that.actions, simTick: currentSimTick });
        that.actions = new Array();
      } else if (that.host && that.actionList[currentSimTick]) {
        // if we are the host and we've already recieved the clients move for this simTick send the client a list of both of our moves
        that.actions = that.actions.concat(that.actionList[currentSimTick]);
        that.conn.send({ actions: that.actions, simTick: currentSimTick});
        that.myGame.applyActions(that.actions, currentSimTick);
        if (that.actions.length > 0) {
          that.actionHistory[currentSimTick] = that.actions;
        }
        that.actions = new Array();
      }

      diffTime2 = newTime2 - oldTime2;
      oldTime2 = newTime2;
      newTime2 = new Date().getTime();
      that.REAL_FPS = Math.round(1000 / diffTime);
      fpsOut.innerHTML = that.REAL_FPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
    }, 1000 / (that.updateFPS));
  }

  public drawSelect(): void {
    if ($(document).data("mousedown")) {
      this.drawer.drawSelect(this.selection);
    }
  }

  public setSelection(coords: Coords): void {
    this.selection = new SelectionObject(coords.x, coords.y);
  }

  public updateSelection(selection: SelectionObject, eX: number, eY: number): SelectionObject {
    selection.x = Math.min(selection.sX, eX);
    selection.y = Math.min(selection.sY, eY);
    selection.w = Math.abs(selection.sX - eX);
    selection.h = Math.abs(selection.sY - eY);
    return selection;
  }

  public end(message: string): void {
    this.sendGameReportToServer();
    window.location.href = "/lobby";
  }

  private sendGameReportToServer(): void {
    console.log(this.actionHistory);

    var that: NetworkedGameRunner = this;
    $.ajax({
      url: "/gameEnd",
      type: "POST",
      data: {
        gameId: that.gameId,
        reporter: that.myId,
        winner: that.myGame.winner,
        actions: JSON.stringify(that.actionHistory)
      },
      // todo: get types for these callback func params
      success: function (data: any, textStatus: any, jqXHR: any): void {
        alert("SUCCESS");
      },
      error: function (jqXHR: any, textStatus: any, errorThrown: any): void {
        alert("ERR");
      }
    });
  }

  public getSelection(): void {
    var that: NetworkedGameRunner = this;
    if ($(document).data("mousedown")) {
      // create the selection
      var selectionLoc: number = that.drawer.coordsToBox(that.selection.x, that.selection.y);
      var occupied: number[] = Utilities.getOccupiedSquares(selectionLoc,
        that.selection.w / that.drawer.getBoxWidth(),
        that.selection.h / that.drawer.getBoxHeight());
      for (var o: number = 0; o < occupied.length; o++) {
        var id: number = Game.getGridLoc(occupied[o]);
        if (id != null) {
          var unit: Unit = Utilities.findUnit(id, Game.getUnits());
          if (unit.player === that.myGame.getPlayerNumber()) {
            unit.selected = true;
          }
        }
      }
    }
  }
}
