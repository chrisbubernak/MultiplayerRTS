/// <reference path="terrainTile.ts" />
/// <reference path="drawer.ts" />
/// <reference path="units/knight.ts" />
/// <reference path="units/orc.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="units/unit.ts" />
/// <reference path="Utilities.ts" />
/// <reference path="selectionObject.ts" />
/// <reference path="action.ts" />
/// <reference path="commands/ICommand.ts" />
/// <reference path="commands/WalkCommand.ts" />
/// <reference path="commands/AttackCommand.ts" />
/// <reference path="maps/IMap.ts" />

class Game {
  // static variables
  private static terrain: TerrainTile[] = Array();
  private static grid: number[] = Array();
  private static units: Unit[] = Array();
  private static map: IMap;


  // "private" variables
  private simTick: number = 0;
  private gameId: string;
  private id: string;
  private playerNumber: number;
  private enemyId: string;
  private host: boolean;


  public winner: string = null;

  // public Methods:
  constructor(host: boolean, id: string, enemyId: string, gameId: string) {
    Game.map = new SmallMap();
    this.gameId = gameId;
    this.id = id; // this players id
    this.enemyId = enemyId;
    this.host = host;
    if (host) {
      this.playerNumber = 1;
    } else {
      this.playerNumber = 2;
    }
  }

  public setup(): void {
    Game.terrain = Game.map.GetTerrain();

    // todo: move this to gamerunners, game shouldn't know about this
    // disable the right click so we can use it for other purposes
    document.oncontextmenu = function (): boolean { return false; };

    Game.grid = new Array(Game.terrain.length);
    for (var g: number = 0; g < Game.grid.length; g++) {
      Game.grid[g] = null;
    }

    Game.units = Game.map.GetUnits();
    for (var u: number = 0; u < Game.units.length; u++) {
      Game.markOccupiedGridLocs(Game.units[u]);
    }
  }

  public isOver(): boolean {
    // check if either player is out of units & return based on that
    if (Game.getUnitsForPlayer(2).length === 0) {
      if (this.host) {
        this.winner = this.id;
      } else {
        this.winner = this.enemyId;
      }
      return true;
    } else if (Game.getUnitsForPlayer(1).length === 0) {
      if (this.host) {
        this.winner = this.enemyId;
      } else {
        this.winner = this.id;
      }
      return true;
    }

    return false;
  }

  public static getGridLoc(index: number): number {
    return Game.grid[index];
  }

  public static setGridLoc(index: number, unitId: number): void {
    Game.grid[index] = unitId;
  }

  public static getTerrainLoc(index: number): TerrainTile {
    return Game.terrain[index];
  }

  public static getNumOfCols(): number {
    return Game.map.GetNumberOfCols();
  }

  public static getNumOfRows(): number {
    return Game.map.GetNumberOfRows();
  }

  public static getRatio(): number {
    return Game.getNumOfCols() / Game.getNumOfRows();
  }

  public getPlayerNumber(): number {
    return this.playerNumber;
  }

  public getGridLoc(g: number): number {
    return Game.grid[g];
  }

  public static removeUnit(unit: Unit): void {
    var id: number = unit.id;
    for (var i: number = 0; i < (length = Game.units.length); i++) {
      if (Game.units[i].id === id) {
        Game.units.splice(i, 1);
        Game.unmarkGridLocs(unit);
        return;
      }
    }
  }

  public static removeUnitById(unitId: number): void {
    var id: number = unitId;
    for (var i: number = 0; i < (length = Game.units.length); i++) {
      if (Game.units[i].id === id) {
        Game.unmarkGridLocs(Game.units[i]);
        Game.units.splice(i, 1);
        return;
      }
    }
  }

  public static getUnits(): Unit[] {
    return Game.units;
  }

  public static markOccupiedGridLocs(unit: Unit): void {
    // mark the locs occupied by this unit
    var locs: number[] = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l: number = 0; l < locs.length; l++) {
      Game.setGridLoc(locs[l], unit.id);
    }
  }

  public static unmarkGridLocs(unit: Unit): void {
    // unmark the locs occupied by this unit
    var locs: number[] = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l: number = 0; l < locs.length; l++) {
      Game.setGridLoc(locs[l], null);
    }
  }

  public static getUnitsForPlayer(playerNumber: number): Unit[] {
    var myUnits: Unit[] = new Array();
    for (var u: number = 0; u < Game.units.length; u++) {
      var unit: Unit = Game.units[u];
      if (unit.player === playerNumber) {
        myUnits.push(unit);
      }
    }
    return myUnits;
  }

  public applyActions(actions: any, simTick: number): void {
    for (var a: number = 0; a < actions.length; a++) {
      // this is a little silly at the moment to convert the data into an object but I'd like to 
      // be able to just pass around this object in the future without modifying the following code
      var action: Action = new Action(actions[a].target, actions[a].unit, actions[a].shift);
      var unit: Unit = Utilities.findUnit(action.getUnit(), Game.units);
      if (unit != null) {
        // new logic!
        var targetLoc: number = action.getTarget();
        if (Game.grid[targetLoc] != null) {
          var unitTarget: Unit = Utilities.findUnit(Game.grid[targetLoc], Game.units);
          var isEnemy: boolean = this.areEnemies(unit, unitTarget);
          var isVisible: boolean = Utilities.canAnyUnitSeeEnemy(unit, unitTarget);
          if (isEnemy && isVisible) {
            unit.command = new AttackCommand(unitTarget);
          } else if (isEnemy && !isVisible) {
            // if we try and walk to a hidden loc that contains an enemy, just issue a walk to that location
            unit.command = new WalkCommand(unitTarget.loc);
          } else if (!isEnemy && isVisible) {
            // if we try and walk to one of our units issue a follow command, this doesn't exist yet tho!
            // alert(issue a follow command: curLoc: " + unit.loc + " tar: " + targetLoc);
          } else {
            alert("WE HAVE A PROBLEM ....unable to issue a command...logic error somewhere");
          }
        } else {
          unit.command = new WalkCommand(targetLoc);
        }
        // set this so the unit knows to transition to waiting state        
        unit.newCommand = true;
      }
    }
    this.simTick++;
  }

  public getSimTick(): number {
    return this.simTick;
  }

  public getHash(): number {
    var hash: number = 0;
    var units: Unit[] = Game.units;
    for (var i: number = 0; i < units.length; i++) {
      hash += Math.floor(Math.pow(((units[i].loc * units[i].id) % units[i].health), i));
    }
    return hash;
  }


  public update(): void {
    // iterate backwards b/c we could be removing units from the unit list 
    // there might be a bug here if unit 5 kills unit 4...
    for (var i: number = Game.units.length - 1; i >= 0; i--) {
      Game.units[i].update();
    }
  }

  public unselectAll(): void {
    for (var u: number = 0; u < Game.getUnits().length; u++) {
      Game.units[u].selected = false;
    }
  }

  // private Methods:
  private areEnemies(unit1: Unit, unit2: Unit): boolean {
    if (unit1.player !== unit2.player) {
      return true;
    }
    return false;
  }
}

