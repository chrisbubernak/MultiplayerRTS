/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="units/orc.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="unit.ts" />
/// <reference path="utilities.ts" />
/// <reference path="selectionObject.ts" />
/// <reference path="action.ts" />

class Game {
  //static variables
  private static boxesPerRow : number = 90;//30//60;
  private static boxesPerCol: number = 45;
  private static terrain = new Array(Game.boxesPerRow * Game.boxesPerCol);
  private static NUMBER_OF_UNITS : number = 3;
  private static grid = new Array(Game.boxesPerRow * Game.boxesPerCol);
  private static units = new Array(); //array of units


  //"private" variables
  private simTick : number = 0;
  private gameId: string;
  private id: string;
  private enemyId;
  private host; 


  //Public Methods:
  constructor(conn, host, id, enemyId, gameId) {
    this.gameId = gameId;
    this.id = id; //this players id
    this.enemyId = enemyId;
    this.host = host;
  }

  public setup() {
    this.generateTerrain();
    drawer.drawTerrain(Game.terrain);

    //disable the right click so we can use it for other purposes
    document.oncontextmenu = function () { return false; };

    Game.grid = new Array(Game.boxesPerRow * Game.boxesPerCol);
    for (var g in Game.grid) {
      Game.grid[g] = null;
    }

    var that = this;

    for (var i = 0; i < Game.NUMBER_OF_UNITS; i++) {
      var p1;
      var p2;
      if (this.host) {
        p1 = this.id;
        p2 = this.enemyId;
      }
      else {
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
  }
  public isOver() {
    //check if either player is out of units & return based on that

    return false; //for now always return false
  }

  public end(message: string) {
    alert(message);
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

  public static getBoxesPerRow() {
    return Game.boxesPerRow;
  }

  public static getBoxesPerCol() {
    return Game.boxesPerCol;
  }

  public getId() {
    return this.id;
  }

  public getGridLoc(g) {
    return Game.grid[g];
  } 

  public static removeUnit(unit: Unit) {
    var id = unit.id;
    for (var i = 0; i < (length = Game.units.length); i++) {
      if (Game.units[i].id == id) {
        Game.units.splice(i, 1);
        Game.unmarkGridLocs(unit);
        return;
      }
    }
  }

  public static getUnits() {
    return Game.units;
  }

  public static markOccupiedGridLocs(unit: Unit) {
    //mark the locs occupied by this unit
    var locs = utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l in locs) {
      Game.setGridLoc(locs[l], unit.id);
    }
  }

  public static unmarkGridLocs(unit: Unit) {
    //unmark the locs occupied by this unit
    var locs = utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l in locs) {
      Game.setGridLoc(locs[l], null);
    }
  }

  public applyActions(actions: Array<Action>, simTick: number) {
    for (var a in actions) {
      var unit = utilities.findUnit(actions[a].getUnit(), Game.units);
      if (unit != null) {
        var targetLoc = actions[a].getTarget();
        unit.target = targetLoc;
      }
    }
    this.simTick++;
  }

  public getSimTick() {
    return this.simTick;
  }

  public update() {
    //iterate backwards b/c we could be removing units from the unit list 
    //I THINK THERE IS A BUG WHERE IF UNIT 5 IS UPDATING AND KILLS UNIT 4 UNIT WILL THEN HAVE UPDATE
    //CALLED ON IT AGAIN....NEED TO INVESTIGATE
    for (var i = Game.units.length - 1; i >= 0; i--) {
      Game.units[i].update();
    }
  }



  public getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }


  public unselectAll() {
    for (var u in Game.getUnits()) {
      Game.units[u].selected = false;
    }
  }

  //Private Methods:

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

