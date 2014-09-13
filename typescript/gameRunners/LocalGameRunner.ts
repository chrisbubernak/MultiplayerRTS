/// <reference path="IGameRunner.ts" />

class LocalGameRunner implements IGameRunner {
  public DEBUG: boolean = false;
  public STATEDEBUG: boolean = false;
  public DRAWGRID: boolean = false;

  private myGame: Game;
  private actions: any [] = new Array();
  private updateFPS: number = 10;
  private FPS: number = 60;
  private REAL_FPS: number = this.FPS;
  private shifted: boolean;
  private selection: SelectionObject;
  private drawer: Drawer;

  constructor() {
    var id: string = "Human";
    var enemyId: string = "Computer";
    var gameId: string = "LocalGame";

    this.myGame = new Game(true, id, enemyId, gameId);

    this.drawer = new Drawer(1,
      document.getElementById("terrainCanvas"),
      document.getElementById("unitCanvas"),
      document.getElementById("fogCanvas"),
      document.getElementById("selectionCanvas"),
      this);

    this.run();


    var that: LocalGameRunner = this;
    // mouse move stuff
    $(document).mousedown(function (e: any): void {
      // on left click...
      if (e.which === 1) {
        $(this).data("mousedown", true);
        var coords: Coords = that.drawer.getMousePos(document.getElementById("selectionCanvas"), e);
        that.setSelection(coords);
        that.myGame.unselectAll();
      } else if (e.which === 3) {
        // if right click...
        var units: Unit[] = Game.getUnits();
        for (var u: number = 0;  u < units.length; u++) {
          if (units[u].selected) {
            var tar: any = that.drawer.getMousePos(document.getElementById("selectionCanvas"), e);
            var a: Action = new Action(that.drawer.coordsToBox(tar.x, tar.y), Game.getUnits()[u].id, that.shifted);
            that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
          }
        }
      }
    });

    $(window).resize(function (): void {
      that.drawer.updateDimensions($(window).width(), $(window).height());
    });

    $(document).mouseup(function (e: any): void {
      $(this).data("mousedown", false);
    });

    $(document).mousemove(function (e: any): void {
      if ($(this).data("mousedown")) {
        var coords: Coords = that.drawer.getMousePos(document.getElementById("selectionCanvas"), e);
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
      } else if (code === 83) {
        if (that.STATEDEBUG) {
          that.STATEDEBUG = false;
        } else {
          that.STATEDEBUG = true;
        }
      }
      that.shifted = e.shiftKey;
      return true;
    });
    // mouse move stuff END

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
    var that: LocalGameRunner = this;
    setInterval(function (): void {
      that.drawer.interpolate();
      that.drawer.drawUnits(Game.getUnits());
      that.drawSelect();
      that.drawer.drawLowerMenu();
      diffTime = newTime - oldTime;
      oldTime = newTime;
      newTime = new Date().getTime();
    }, 1000 / this.FPS);

    // loop that runs much less frequently (10 fps)
    // and handles physics/updating the game state/networking 
    var fpsOut: any = document.getElementById("fps");
    // var conn = Game.conn;
    setInterval(function (): void {
      if (that.myGame.isOver()) {
        that.end("Game is over!");
        return;
      }

      var currentSimTick: number = that.myGame.getSimTick();
      that.myGame.update();
      that.getSelection();

      that.myGame.applyActions(that.actions, currentSimTick);
      that.actions = new Array();

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
    window.location.href = "/lobby";
  }

  public getSelection(): void {
    var that: LocalGameRunner = this;
    if ($(document).data("mousedown")) {
      // create the selection
      var selectionLoc: number = that.drawer.coordsToBox(that.selection.x, that.selection.y);
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
    }
  }
}
