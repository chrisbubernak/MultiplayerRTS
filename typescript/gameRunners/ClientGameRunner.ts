/// <reference path="../game/game.ts" />
/// <reference path="../game/drawer.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="../definitions/Peer.d.ts" />
/// <reference path="IGameRunner.ts" />
/// <reference path="../game/coords.ts" />
/// <reference path="../game/selectionObject.ts" />
/// <reference path="../game/logger.ts" />

class ClientGameRunner implements IGameRunner {
  public DEBUG: boolean = false;
  public STATEDEBUG: boolean = false;
  public DRAWGRID: boolean = false;
  private UPDATE_FPS: number = 10;
  private FPS: number = 60;
  private FPS_DIV = document.getElementById("fps");

  private myGame: Game;
  private peer;
  private conn;
  private actions = new Array();
  private history = new Array();
  private shifted: boolean;
  private selection: SelectionObject;
  private drawer: Drawer;
  private gameId: string;
  private myId: string;
  private mouseX: number;
  private mouseY: number;
  private lastUpdateTime: number = new Date().getTime();
  private actualDrawingFPS: number;



  constructor(id: string, enemyId: string, gameId: string, mapId: string) {
    this.myId = id;
    this.gameId = gameId;
    this.peer = new Peer(id, { key: "vgs0u19dlxhqto6r" }); // todo: use our own server

    if (!this.peer) {
      Logger.LogError("peer = " + this.peer);
      this.end("peer = " + this.peer);
    }

    var playerNumber: number = 2;
    this.myGame = new Game(false, id, enemyId, gameId, mapId); // am i host? what is my id? what is the enemies id?

    this.drawer = new Drawer(playerNumber,
      document.getElementById("terrainCanvas"),
      document.getElementById("unitCanvas"),
      document.getElementById("fogCanvas"),
      document.getElementById("selectionCanvas"),
      document.getElementById("menuCanvas"),
      this);

    var that: ClientGameRunner = this;
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
            that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
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

      // wait for connection
      Logger.LogInfo("im waiting for a connection");
      that.peer.on("connection", function (conn: any): void {
        that.conn = conn;
        Logger.LogInfo("client " + conn);
        that.conn.on("open", function (): void {
          that.run();
          that.peer.disconnect();
        });
        that.conn.on("close", function (): void {
          Logger.LogInfo("connection closed!");
          that.end("Enemy Quit");
        });
        that.conn.on("data", function (data: any): void {
          that.receivedData(data);
        });
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

    // loop that runs at 60 fps...aka drawing & selection stuff
    var that: ClientGameRunner = this;
    setInterval(function (): void {
      that.drawer.interpolate();
      that.drawer.drawUnits(Game.getUnits());
      that.drawSelect();
      that.drawer.drawLowerMenu();
      that.drawer.moveViewPort(that.mouseX, that.mouseY);
      diffTime = newTime - oldTime;
      that.actualDrawingFPS = 1000 / diffTime;
      oldTime = newTime;
      newTime = new Date().getTime();
    }, 1000 / this.FPS);
   
    this.execute();
  }


  private execute(): void {
    this.myGame.update();
    
    if(this.myGame.isOver()) {
      this.end("Game is Over!");
    }

    var actionsToSend = this.actions;
    this.actions = new Array();

    var currentSimTick = this.myGame.getSimTick();

    var gameHash = this.myGame.getHash();

    this.conn.send({actions: {"client": actionsToSend}, simTick: currentSimTick, gameHash: gameHash});
    
    var currentTime: number = new Date().getTime();
    var timeSinceLastUpdate: number = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    this.drawer.REAL_FPS = this.actualDrawingFPS;
    this.FPS_DIV.innerHTML = Math.round(this.actualDrawingFPS) + " drawing fps " + Math.round(1000 / timeSinceLastUpdate) + " updating fps<br>GameHash: " +
    this.myGame.getHash() + "<br>heap usage: " +
      Math.round((((<any>window.performance).memory.usedJSHeapSize / (<any>window.performance).memory.totalJSHeapSize) * 100)) + "%";
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
    var that: ClientGameRunner = this;
    $.ajax({
      url: "/gameEnd",
      type: "POST",
      data: {
        gameId: that.gameId,
        reporter: that.myId,
        winner: that.myGame.winner,
        actions: JSON.stringify(that.history),
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


  private receivedData(data: any) {
    var actions = data.actions;

    var gameHash = this.myGame.getHash();

    if (gameHash != data.gameHash) {
      Logger.LogError("The host's game hash has diverged from mine at simTick " + data.simTick + " " +
        this.myGame.getSimTick() + ": h/" + data.gameHash + " c/" + gameHash);
    }

    this.history.push(actions);
    this.simTickIsOver();
  }


  private simTickIsOver() {
    var tick: number = this.myGame.getSimTick();
    this.myGame.applyActions(this.history[tick]);
    var that = this;
    setTimeout(
      function (): void {
        that.execute();
      }, 1000/that.UPDATE_FPS
    );
  }
}
