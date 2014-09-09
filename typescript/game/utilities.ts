/// <reference path="game.ts" />
class Utilities {
  private static SEED = 3;

  public static minIndex(array) {
    var min = array[0];
    var minIndex = 0;
    for (var i = 0; i < array.length; i++) {
      if (array[i] != null && array[i] < min) {
        min = array[i];
        minIndex = i;
      }
    }
    return minIndex;
  }

  public static distance(a: number, b: number) {
    var x1 = (a % Game.getNumOfCols());
    var y1 = Math.floor(a / Game.getNumOfCols());
    var x2 = (b % Game.getNumOfCols());
    var y2 = Math.floor(b / Game.getNumOfCols());
    return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
  }

  //return the index of the unit with a given id
  public static findUnit(id: number, units: Unit[]) {
    for (var i = 0; i < units.length; i++) {
      if (units[i].id === id) {
        return units[i];
      }
    }
    return null;
  }

  public static collides(i: Unit, j: Unit) {
    //return i.loc == j.loc;
    return i.x < j.x + j.w && i.x + i.w > j.x && i.y < j.y + j.h && i.y + i.h > j.y;
  }

  public static random() {
    var x = Math.sin(Utilities.SEED++) * 10000;
    return x - Math.floor(x);
  }

  //given a unit, return the locs that it occupies (given its height, width, and loc)
  public static getOccupiedSquares(loc: number, width: number, height: number) {
    var locs = new Array();
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        if (loc + (i * Game.getNumOfCols()) + j < (Game.getNumOfRows() * Game.getNumOfCols())) {
          locs.push(loc + (i * Game.getNumOfCols()) + j);
        }
      }
    }
    return locs;
  }

  //figure out if the unit is moving up, down, left, or right and return that direction
  public static getDirection(loc1: number, loc2: number) {
    if (loc1 < loc2) { //we are moving right or down
      if ((loc1 % Game.getNumOfCols()) <= (loc2 % Game.getNumOfCols())) {
        return "right";
      }
      return "down";
    } else { // we are moving left or up
      if (Math.floor(loc1 / Game.getNumOfCols()) > Math.floor(loc2 / Game.getNumOfCols())) {
        return "up";
      }
      return "left";
    }
    console.log("ERROR: Utilities.getDirection() did not set a direction");
  }

  public static getGridLocsInSightRange(unit: Unit) {
    //figure out where we are going off the screen...and apply corrections

    var topRow = Math.floor((unit.loc - unit.sightRange * Game.getNumOfCols()) / Game.getNumOfCols());
    var bottomRow = Math.floor((unit.loc + unit.gridHeight / 2 + unit.sightRange * Game.getNumOfCols()) / Game.getNumOfCols());
    var leftCol = (unit.loc - unit.sightRange) % Game.getNumOfCols();
    var unitLeftCol = (unit.loc % Game.getNumOfCols());
    var rightCol = (unit.loc + unit.gridWidth / 2 + unit.sightRange) % Game.getNumOfCols();
    var unitRightCol = (unit.loc % Game.getNumOfCols());

    if (topRow < 0) {
      topRow = 0;
    }
    if (bottomRow > Game.getNumOfRows()) {
      bottomRow = Game.getNumOfRows() - 1;
    }
    if (leftCol > unitLeftCol) {
      leftCol = 0;
    }
    if (rightCol < unitRightCol) {
      rightCol = Game.getNumOfCols() - 1;
    }

    var topLeft = topRow * Game.getNumOfCols() + leftCol;
    var width = rightCol - leftCol + 1;
    var height = bottomRow - topRow + 1;

    return Utilities.getOccupiedSquares(topLeft, width, height);
  }

  public static getGridLocsInTargetAquireRange(unit: Unit) {
    //figure out where we are going off the screen...and apply corrections

    var topRow = Math.floor((unit.loc - unit.targetAquireRange * Game.getNumOfCols()) / Game.getNumOfCols());
    var bottomRow = Math.floor((unit.loc + unit.gridHeight / 2 + unit.targetAquireRange * Game.getNumOfCols()) / Game.getNumOfCols());
    var leftCol = (unit.loc - unit.targetAquireRange) % Game.getNumOfCols();
    var unitLeftCol = (unit.loc % Game.getNumOfCols());
    var rightCol = (unit.loc + unit.gridWidth / 2 + unit.targetAquireRange) % Game.getNumOfCols();
    var unitRightCol = (unit.loc % Game.getNumOfCols());

    if (topRow < 0) {
      topRow = 0;
    }
    if (bottomRow > Game.getNumOfRows()) {
      bottomRow = Game.getNumOfRows() - 1;
    }
    if (leftCol > unitLeftCol) {
      leftCol = 0;
    }
    if (rightCol < unitRightCol) {
      rightCol = Game.getNumOfCols() - 1;
    }

    var topLeft = topRow * Game.getNumOfCols() + leftCol;
    var width = rightCol - leftCol + 1;
    var height = bottomRow - topRow + 1;

    return Utilities.getOccupiedSquares(topLeft, width, height);
  }

  public static canAnyUnitSeeEnemy(unit: Unit, enemy: Unit) {
    //for each of my units check if they can see enemy
    var units = Game.getUnitsForPlayer(unit.player);
    for (var u  = 0; u < units.length; u++) {
      var locs = Utilities.getGridLocsInSightRange(units[u]);
      for (var l = 0; l < locs.length; l++) {
        var id = Game.getGridLoc(locs[l]);
        if (id === enemy.id) {
          return true;
        }
      }
    }
    return false;
  }

  public static areLocsOccupiedBySameUnit(loc1: number, loc2: number) {
    var id1 = Game.getGridLoc(loc1);
    if (typeof id1 === "undefined" || id1 == null) {
      return false;
    }
    var id2 = Game.getGridLoc(loc2);
    if (typeof id2 === "undefined" || id2 === null) {
      return false;
    }
    if (id1 === id2) {
      console.log("it worked? " + id1 + " " + id2);
      return true;
    }
    return false;
  }

  public static neighbors(boxNumber: number) {
    var neighbors = new Array();

    //if we arean't on the left edge of the board add neighbor to the left
    if (boxNumber % Game.getNumOfCols() !== 0) {
      neighbors.push(boxNumber - 1);
    }
    //if we arean't on the right edge of the board add neighbor to the right 
    if ((boxNumber + 1) % Game.getNumOfCols() !== 0) {
      neighbors.push(boxNumber + 1);
    }
    //if we arean't on the top of the board add neighbor above us
    if (boxNumber >= Game.getNumOfCols()) {
      neighbors.push(boxNumber - Game.getNumOfCols());
    }
    //if we arean't on the bottom of the board add neighbor beneath us
    if (boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
      neighbors.push(boxNumber + Game.getNumOfCols());
    }
    //diagonal cases...refactor this logic later for speed ups!!

    //if we arean't on the left edge and we arean't on the top of the board add the left/up beighbor
    if (boxNumber % Game.getNumOfCols() !== 0 && boxNumber >= Game.getNumOfCols()) {
      neighbors.push(boxNumber - Game.getNumOfCols() - 1);
    }
    //if we arean't on the left edge and we arean't on the bottom of the board add the left/below neighbor
    if (boxNumber % Game.getNumOfCols() !== 0 && boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
      neighbors.push(boxNumber + Game.getNumOfCols() - 1);
    }
    //if we arean't on the right edge of the board and we arean't on the top of the board add right/up neighbor
    if ((boxNumber + 1) % Game.getNumOfCols() !== 0 && boxNumber >= Game.getNumOfCols()) {
      neighbors.push(boxNumber - Game.getNumOfCols() + 1);
    }
    //if we arean't on the right edge of the board and we arean't on the bottom of the board add right/below neighbor
    if ((boxNumber + 1) % Game.getNumOfCols() !== 0 && boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
      neighbors.push(boxNumber + Game.getNumOfCols() + 1);
    }
    return neighbors;
  }

}
