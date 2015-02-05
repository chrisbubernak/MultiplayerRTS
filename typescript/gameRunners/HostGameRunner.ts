/// <reference path="../game/game.ts" />
/// <reference path="../game/drawer.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="../definitions/Peer.d.ts" />
/// <reference path="IGameRunner.ts" />
/// <reference path="../game/coords.ts" />
/// <reference path="../game/selectionObject.ts" />
/// <reference path="../game/logger.ts" />

class HostGameRunner implements IGameRunner {
  public DEBUG: boolean = false;
  public STATEDEBUG: boolean = false;
  public DRAWGRID: boolean = false;

  private myGame: Game;
  private peer;
  private conn;
  private actions = new Array();
  private updateFPS: number = 10;
  private FPS: number = 60;
  private actionList = new Array();
  private receivedGameHashes = new Array();
  private actionHistory = {};
  private currentClientSimTick: number;
  private shifted: boolean;
  private selection: SelectionObject;
  private drawer: Drawer;
  private gameId: string;
  private myId: string;
  private mouseX: number;
  private mouseY: number;

  constructor(id: string, enemyId: string, gameId: string, mapId: string) {
    this.myId = id;
    this.gameId = gameId;
    this.peer = new Peer(id, { key: "vgs0u19dlxhqto6r" }); // todo: use our own server

    if (!this.peer) {
      Logger.LogError("peer = " + this.peer);
      this.end("peer = " + this.peer);
    }

    this.myGame = new Game(true, id, enemyId, gameId, mapId); // am i host? what is my id? what is the enemies id?
    var playerNumber: number = 1;
    
    this.drawer = new Drawer(playerNumber,
      document.getElementById("terrainCanvas"),
      document.getElementById("unitCanvas"),
      document.getElementById("fogCanvas"),
      document.getElementById("selectionCanvas"),
      document.getElementById("menuCanvas"),
      this);

    var that: HostGameRunner = this;
    // mouse move stuff
    $(document).mousedown(function (e: any): void {
      // on left click...
      if (e.which === 1) {
        $(this).data("mousedown", true);
        var coords: Coords = that.drawer.screenCoordsToMapCoords(
          that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
        that.setSelection(coords);
        that.myGame.unselectAll();
      } else if (e.which === 3) {
        // if right click...
        var units: Unit[] = Game.getUnits();
        for (var u: number = 0; u < units.length; u++) {
          if (units[u].selected) {
            var tar: number = that.drawer.screenCoordsToMapLoc(
              that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
            var a: Action = new Action(tar,
              Game.getUnits()[u].id,
              that.shifted);
            that.actions.push({ target: a.getTarget(), unit: a.getUnit()});
          }
        }
      }
    });

    $(window).resize(function(): any {
      that.drawer.updateDimensions($(window).width(), $(window).height());
    });

    $(document).mouseup(function (e: any): void {
      // when we catch a mouse up event see what is in our selection
      var selectionLoc: number = that.drawer.mapCoordsToMapLoc(new Coords(that.selection.x, that.selection.y));
      var occupied: number[] = Utilities.getOccupiedSquares(selectionLoc,
        that.selection.w / that.drawer.getBoxWidth(),
        that.selection.h / that.drawer.getBoxHeight());
        for (var o: number = 0; o < occupied.length; o++) {
          var id: number = Game.getGridLoc(occupied[o]);
          if (id !== null && typeof id !== "undefined") {
            var unit: Unit = Utilities.findUnit(id, Game.getUnits());
            if (unit.player === that.myGame.getPlayerNumber()) {
              unit.selected = true;
            }
          }
        }
      $(this).data("mousedown", false);
    });

    $(document).mousemove(function (e: any): void {
      that.mouseX = e.clientX;
      that.mouseY = e.clientY;
      if ($(this).data("mousedown")) {
        var coords: Coords = that.drawer.screenCoordsToMapCoords(
          that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
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
      Logger.LogError("error connecting!: " + err);
      that.end("error connecting!: " + err);
    });

    this.peer.on("open", function (): void {
      Logger.LogInfo("peer is open");

      // try to connect to client
      Logger.LogInfo("im initiating a connection");
      that.conn = that.peer.connect(enemyId, { reliable: true });
      that.conn.on("open", function (): void {
        that.conn.send("Hey from player: " + id);
        that.run();
      });
      that.conn.on("close", function (): void {
        Logger.LogInfo("connection closed!");
        that.end("Enemy Quit");
      });
      that.conn.on("data", function (data: any): void {
        if (!(typeof (data.simTick) === "undefined")) {
          // the client sent us their actions
          // store these so we can send back an authoritatve action list 
          that.actionList[data.simTick] = data.actions;
          that.currentClientSimTick = data.simTick;
          that.receivedGameHashes[data.simTick] = data.gameHash;
        }
      });
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
    var that: HostGameRunner = this;
    setInterval(function (): void {
      that.drawer.interpolate();
      that.drawer.drawUnits(Game.getUnits());
      that.drawSelect();
      that.drawer.drawLowerMenu();
      that.drawer.moveViewPort(that.mouseX, that.mouseY);
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

      if (that.actionList[currentSimTick]) {
        // if we've already recieved the clients move for this simTick send the client a list of both of our moves
        that.actions = that.actions.concat(that.actionList[currentSimTick]);
        that.conn.send({ actions: that.actions, simTick: currentSimTick, gameHash: that.myGame.getHash() });
        that.myGame.applyActions(that.actions, currentSimTick);
        if (that.actions.length > 0) {
          that.actionHistory[currentSimTick] = that.actions;
        }

        var clientHash = that.receivedGameHashes[currentSimTick];
        var hostHash = that.myGame.getHash();
        if (clientHash != hostHash) {
          Logger.LogError("The client's game hash has diverged from mine at simTick " + currentSimTick + " " +
            that.currentClientSimTick + ": " + hostHash + " " + clientHash);
        }

        that.actions = new Array();
      }

      diffTime2 = newTime2 - oldTime2;
      oldTime2 = newTime2;
      newTime2 = new Date().getTime();
      var realFPS: number = Math.round(1000 / diffTime);
      that.drawer.REAL_FPS = realFPS;
      fpsOut.innerHTML = realFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps<br>GameHash: " +
      that.myGame.getHash() + "<br>heap usage: " +
        Math.round((((<any>window.performance).memory.usedJSHeapSize / (<any>window.performance).memory.totalJSHeapSize) * 100)) + "%";
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
    var that: HostGameRunner = this;
    $.ajax({
      url: "/gameEnd",
      type: "POST",
      data: {
        gameId: that.gameId,
        reporter: that.myId,
        winner: that.myGame.winner,
        actions: JSON.stringify(that.actionHistory),
        gameHash: that.myGame.getHash()
      },
      // todo: get types for these callback func params
      success: function (data: any, textStatus: any, jqXHR: any): void {
        Logger.LogInfo("SUCCESS sending game report");
      },
      error: function (jqXHR: any, textStatus: any, errorThrown: any): void {
        Logger.LogError("Error sending game report");
      }
    });
  }
}
