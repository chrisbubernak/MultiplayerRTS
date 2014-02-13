/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="jquery.js" />
/// <reference path="quadtree.ts" />


class Game {
  //static variables
  private static CANVAS_WIDTH : number = 1440;//1280;//960;//900//960;
  private static CANVAS_HEIGHT : number = 720; //640//540//640;
  private static boxesPerRow : number = 90;//30//60;
  private static ratio : number = Game.CANVAS_WIDTH / Game.CANVAS_HEIGHT;
  private static boxesPerCol : number = Game.boxesPerRow / Game.ratio;
  private static boxSize : number = Game.CANVAS_WIDTH / Game.boxesPerRow;
  private static terrain = new Array(Game.boxesPerRow * Game.boxesPerCol);
  private static NUMBER_OF_UNITS : number = 2;
  private static FPS : number = 60;
  private static updateFPS : number = 10;
  private static SEED : number = 3;
  private static grid = new Array(Game.boxesPerRow * Game.boxesPerCol);
  private static units = new Array(); //array of units

  //"private" variables
  private tree; //the quad tree
  private selection = new Object(); //stores the coordinates of the players selection
  private actions = new Array();
  private simTick : number = 0;
  private gameId: string;
  private clients;
  private id: string;
  private socket;
  private shifted: boolean;

  constructor(socket, id, clients, gameId) {
    this.gameId = gameId;
    this.clients = clients; //an array of all players ids in the game
    this.id = id; //this players id
    this.socket = socket;
    var that = this;
    this.socket.on('SendActionsToClient', function (data) {
      for (var a in data.actions) {
        var unit = utilities.findUnit(data.actions[a].unit, Game.units);
        var targetLoc = utilities.coordsToBox(data.actions[a].target.x, data.actions[a].target.y);
        unit.target = targetLoc;
      }
      that.simTick++;
    });
  }

  //Public Methods:

  public run() {
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
    setInterval(function () {
      that.tree.insert(Game.units);
      that.update();
      that.getSelection();
      that.tree.clear();
      that.socket.emit('SendActionsToServer', { actions: that.actions, simTick: that.simTick, game: that.gameId });
      that.actions = new Array();
      diffTime2 = newTime2 - oldTime2;
      oldTime2 = newTime2;
      newTime2 = new Date().getTime();
      fpsOut.innerHTML = Math.round(1000 / diffTime) + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
      /*DEBUGGING CODE!!!!!!!!!!!!!!!!!
      if (that.simTick%100 == 0){
        console.log("Sim: " + that.simTick)
        for (var i = 0; i < Game.units.length; i++){
          var unitLoc = utilities.boxToCoords(Game.units[i].loc);
          console.log("x= " + unitLoc.x + " y= " + unitLoc.y);
        }
      }*/
    }, 1000 / (Game.updateFPS));

    //every 10 seconds check the world for desync errors (at the moment this means just comparing unit arrays)
    setInterval(function () {
      that.socket.emit('SendGameStateToServer', { units: Game.units, simTick: that.simTick });
    }, 10000);
  }

  public static getGridLoc(index : number) {
    return Game.grid[index];
  }

  public static setGridLoc(index: number, unitId: number) {
    Game.grid[index] = unitId;
  }

  public static getTerrainLoc(index: number) {
    return Game.terrain[index];
  }

  public static getBoxSize() {
    return Game.boxSize;
  }

  public static getCanvasWidth() {
    return Game.CANVAS_WIDTH;
  }

  public static getCanvasHeight() {
    return Game.CANVAS_HEIGHT;
  }

  public static getBoxesPerRow() {
    return Game.boxesPerRow;
  }

  public static removeUnit(unit: Unit) {
    var id = unit.id;
    for (var i = 0; i < (length = Game.units.length); i++) {
      if (Game.units[i].id == id) {
        Game.units.splice(i, 1);
        //mark the old locs occupied by this unit as false
        var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h)
        for (var l in locs) {
          this.grid[locs[l]] = null;
        }
        return;
      }
    }
  }

  public static getUnits() {
    return Game.units;
  }
  //Private Methods:

  private setup() {
    drawer.init(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT, this.id,
      document.getElementById("terrainCanvas"),
      document.getElementById("unitCanvas"),
      document.getElementById("fogCanvas"),
      document.getElementById("selectionCanvas"))
    this.generateTerrain();
    drawer.drawTerrain(Game.terrain);

    //disable the right click so we can use it for other purposes
    document.oncontextmenu = function () { return false; };

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
      }
      //if right click...
      else if (e.button == 2) {
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
      Game.units.push(
        Object.create(new Knight(
          Math.round(utilities.random() * Game.boxesPerRow * Game.boxesPerCol),
          this.clients[0]
          )));
      Game.units.push(
        Object.create(new Knight(
          Math.round(utilities.random() * Game.boxesPerRow * Game.boxesPerCol),
          this.clients[1]
          )));
    }
  }

  private update() {
    //iterate backwards b/c we could be removing units from the unit list 
    //inside the combat function which would break this loop
    for (var i = Game.units.length - 1; i >= 0; i--) {
      //this.combat(Game.units[i]);
      Game.units[i].update();
    }
  }

  private interpolate() {
    for (var i = 0; i < Game.units.length; i++) {
      if (Game.units[i].prevLoc != Game.units[i].loc) {
        var oldCoords = utilities.boxToCoords(Game.units[i].prevLoc);
        var coords = utilities.boxToCoords(Game.units[i].loc);
        Game.units[i].x -= (1 / (Game.FPS / Game.updateFPS)) * (oldCoords.x - coords.x);
        Game.units[i].y -= (1 / (Game.FPS / Game.updateFPS)) * (oldCoords.y - coords.y);
      }
      else {
        var coords = utilities.boxToCoords(Game.units[i].loc);
        Game.units[i].x = coords.x;
        Game.units[i].y = coords.y;
      }
    }
  }

  private drawSelect() {
    var that = this;
    if ($(document).data('mousedown')) {
      drawer.drawSelect(that.selection);
    }
  }

  private getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  private select(sX: number, sY: number) {
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
  }

  private updateSelection(selection, eX, eY) {
    selection.x = Math.min(selection.sX, eX);
    selection.y = Math.min(selection.sY, eY);
    selection.w = Math.abs(selection.sX - eX);
    selection.h = Math.abs(selection.sY - eY);
    return selection;
  }

  private getSelection() {
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
  }

  private generateTerrain() {
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
      }
      else {
        Game.terrain[i] = new DirtTile();
      }
    }
    for (var i = 0; i < 6; i++) {
      this.generateLake();
    }
  }

  private generateLake() {
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
  }
}

