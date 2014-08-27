/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="units/orc.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="unit.ts" />
/// <reference path="Utilities.ts" />
/// <reference path="selectionObject.ts" />
/// <reference path="action.ts" />
/// <reference path="commands/ICommand.ts" />
/// <reference path="commands/WalkCommand.ts" />
/// <reference path="commands/AttackCommand.ts" />
/// <reference path="maps/IMap.ts" />

class Game {
  //static variables

  //private static RATIO: number = 2;
  //private static NUM_OF_COL: number = 60;
  //private static NUM_OF_ROW: number = (Game.NUM_OF_COL / Game.RATIO);

  private static terrain = [];// = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
  //private static NUMBER_OF_UNITS : number = 3;
  private static grid = [];// = new Array(Game.NUM_OF_COL * Game.NUM_OF_ROW);
  private static units = new Array(); //array of units
  private static map;


  //"private" variables
  private simTick: number = 0;
  private gameId: string;
  private id: string;
  private playerNumber: number;
  private enemyId;
  private host;


  public winner: string = null;

  //Public Methods:
  constructor(host, id, enemyId, gameId) {
    Game.map = new StripesMap();
    this.gameId = gameId;
    this.id = id; //this players id
    this.enemyId = enemyId;
    this.host = host;
    if (host) {
      this.playerNumber = 1;
    }
    else {
      this.playerNumber = 2;
    }
  }

  public setup() {
    Game.terrain = Game.map.GetTerrain();
    //disable the right click so we can use it for other purposes
    document.oncontextmenu = function () { return false; };

    Game.grid = new Array(Game.terrain.length);
    for (var g in Game.grid) {
      Game.grid[g] = null;
    }

    Game.units = Game.map.GetUnits();
    for (var u in Game.units) {
      Game.markOccupiedGridLocs(Game.units[u]);
    }
  }

  public isOver() {
    //check if either player is out of units & return based on that
    if (Game.getUnitsForPlayer(2).length === 0) {
      if (this.host) {
        this.winner = this.id;
      }
      else {
        this.winner = this.enemyId;
      }
      return true;
    }
    else if (Game.getUnitsForPlayer(1).length === 0) {
      if (this.host) {
        this.winner = this.enemyId;
      }
      else {
        this.winner = this.id;
      }
      return true;
    }

    return false; //for now always return false
  }

  public static getGridLoc(index: number) {
    return Game.grid[index];
  }

  public static setGridLoc(index: number, unitId: number) {
    Game.grid[index] = unitId;
  }

  public static getTerrainLoc(index: number) {
    return Game.terrain[index];
  }

  public static getNumOfCols() {
    return Game.map.GetNumberOfCols();
  }

  public static getNumOfRows() {
    return Game.map.GetNumberOfRows();
  }

  public static getRatio() {
    return Game.getNumOfCols() / Game.getNumOfRows();
  }

  public getPlayerNumber() {
    return this.playerNumber;
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

  public static removeUnitById(unitId: number) {
    var id = unitId;
    for (var i = 0; i < (length = Game.units.length); i++) {
      if (Game.units[i].id == id) {
        Game.unmarkGridLocs(Game.units[i]);
        Game.units.splice(i, 1);
        return;
      }
    }
  }

  public static getUnits() {
    return Game.units;
  }

  public static markOccupiedGridLocs(unit: Unit) {
    //mark the locs occupied by this unit
    var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l in locs) {
      Game.setGridLoc(locs[l], unit.id);
    }
  }

  public static unmarkGridLocs(unit: Unit) {
    //unmark the locs occupied by this unit
    var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l in locs) {
      Game.setGridLoc(locs[l], null);
    }
  }

  public static getUnitsForPlayer(playerNumber: number) {
    var myUnits = new Array();
    for (var u in Game.units) {
      var unit = Game.units[u];
      if (unit.player === playerNumber) {
        myUnits.push(unit);
      }
    }
    return myUnits;
  }

  public applyActions(actions, simTick: number) {
    for (var a in actions) {
      //this is a little silly at the moment to convert the data into an object but I'd like to 
      //be able to just pass around this object in the future without modifying the following code
      var action = new Action(actions[a].target, actions[a].unit, actions[a].shift);
      var unit = Utilities.findUnit(action.getUnit(), Game.units);
      if (unit != null) {
        //new logic!
        var targetLoc = action.getTarget();
        if (Game.grid[targetLoc] != null) {
          var unitTarget = Utilities.findUnit(Game.grid[targetLoc], Game.units);
          var isEnemy = this.areEnemies(unit, unitTarget);
          var isVisible = Utilities.canAnyUnitSeeEnemy(unit, unitTarget);
          if (isEnemy && isVisible) {
            unit.command = new AttackCommand(unitTarget);
          }
          //if we try and walk to a hidden loc that contains an enemy, just issue a walk to that location
          else if (isEnemy && !isVisible) {
            unit.command = new WalkCommand(unitTarget.loc);
          }
          //if we try and walk to one of our units issue a follow command, this doesn't exist yet tho!
          else if (!isEnemy && isVisible) {
            //issue a follow command
          }
          else {
            alert("WE HAVE A PROBLEM ....unable to issue a command...logic error somewhere");
          }
        }
        else {
          unit.command = new WalkCommand(targetLoc);
        }
        unit.newCommand = true; //set this so the unit knows to transition to waiting state
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

  private areEnemies(unit1, unit2) {
    if (unit1.player !== unit2.player) {
      return true;
    }
  }
}

