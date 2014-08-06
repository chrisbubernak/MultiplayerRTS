/// <reference path="game.ts" />


var utilities = (function () {
  var SEED = 3;

  return {

    minIndex: function (array) {
      var min = array[0];
      var minIndex = 0;
      for (var i = 0; i < array.length; i++) {
        if (array[i] != null && array[i] < min) {
          min = array[i];
          minIndex = i;
        }
      }
      return minIndex;
    },

    distance: function (a, b) {
      var x1 = (a % Game.getNumOfCols());
      var y1 = Math.floor(a / Game.getNumOfCols());
      var x2 = (b % Game.getNumOfCols());
      var y2 = Math.floor(b / Game.getNumOfCols());
      return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
    },

    //return the index of the unit with a given id
    findUnit: function (id, units) {
      for (var i = 0; i < units.length; i++) {
        if (units[i].id == id) {
          return units[i];
        }
      }
      return null;
    },

    collides: function (i, j) {
      //return i.loc == j.loc;
      return i.x < j.x + j.w && i.x + i.w > j.x && i.y < j.y + j.h && i.y + i.h > j.y;
    },

    random: function () {
      var x = Math.sin(SEED++) * 10000;
      return x - Math.floor(x);
    },

    //given a unit, return the locs that it occupies (given its height, width, and loc)
    getOccupiedSquares: function (loc, width, height) {
      var locs = new Array();
      for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
          if (loc + (i * Game.getNumOfCols()) + j < (Game.getNumOfRows() * Game.getNumOfCols())) {
            locs.push(loc + (i * Game.getNumOfCols()) + j);
          }
        }
      }
      return locs;
    },

    //figure out if the unit is moving up, down, left, or right and return that direction
    getDirection: function (loc1, loc2) {
      if (loc1 < loc2) { //we are moving right or down
        if ((loc1 % Game.getNumOfCols()) <= (loc2 % Game.getNumOfCols())) {
          return 'right';
        }
        return 'down';
      }
      else { // we are moving left or up
        if (Math.floor(loc1 / Game.getNumOfCols()) > Math.floor(loc2 / Game.getNumOfCols())) {
          return 'up';
        }
        return 'left';
      }
      console.log('ERROR: utilities.getDirection() did not set a direction');
    },

    getGridLocsInSightRange(unit: Unit) {
      var topLeft = unit.loc - unit.sightRange - Game.getNumOfCols() * unit.sightRange;
      var width = unit.sightRange * 2 + unit.gridWidth;
      if (Math.floor((topLeft + width) / Game.getNumOfCols()) !== Math.floor(topLeft / Game.getNumOfCols())) {
        width = (Game.getNumOfCols() - (topLeft % Game.getNumOfCols())) % Game.getNumOfCols();
      }
      var height = unit.sightRange * 2 + unit.gridHeight;
      return utilities.getOccupiedSquares(topLeft, width, height);
    },

    getGridLocsInTargetAquireRange(unit: Unit) {
      var topLeft = unit.loc - unit.targetAquireRange - Game.getNumOfCols() * unit.targetAquireRange;
      
      if (Math.floor(topLeft / Game.getNumOfCols()) < Math.floor(unit.loc / Game.getNumOfCols())) {
        console.log('ERR');
      }

      var width = unit.targetAquireRange * 2 + unit.gridWidth;
      //if the value we calculate for the top right (width + topleft) is not going to be on the same row as top left)
      //aka it wraps around the grid then just choose the largest value we can on the same line
      if (Math.floor((topLeft + width) / Game.getNumOfCols()) !== Math.floor(topLeft / Game.getNumOfCols())) {
        width = (Game.getNumOfCols() - (topLeft % Game.getNumOfCols())) % Game.getNumOfCols();
      }
      var height = unit.targetAquireRange * 2 + unit.gridHeight;
      return utilities.getOccupiedSquares(topLeft, width, height);
    },

    canAnyUnitSeeEnemy(unit: Unit, enemy: Unit) {
      //for each of my units check if they can see enemy
      var units = Game.getUnitsForPlayer(unit.player);
      for (var u in units) {
        var locs = utilities.getGridLocsInSightRange(units[u]);
        for (var l in locs) {
          var neighbors = utilities.neighbors(locs[l]);
          for (var n in neighbors) {
            var id = Game.getGridLoc(neighbors[n]);
            if (id === enemy.id) {
              return true;
            }
          }
        }
        return false;
      }
    },

    neighbors: function (boxNumber) {
      var neighbors = new Array();

      //if we arean't on the left edge of the board add neighbor to the left
      if (boxNumber % Game.getNumOfCols() != 0) {
        neighbors.push(boxNumber - 1);
      }
      //if we arean't on the right edge of the board add neighbor to the right 
      if ((boxNumber + 1) % Game.getNumOfCols() != 0) {
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
      if (boxNumber % Game.getNumOfCols() != 0 && boxNumber >= Game.getNumOfCols()) {
        neighbors.push(boxNumber - Game.getNumOfCols() - 1);
      }
      //if we arean't on the left edge and we arean't on the bottom of the board add the left/below neighbor
      if (boxNumber % Game.getNumOfCols() != 0 && boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
        neighbors.push(boxNumber + Game.getNumOfCols() - 1);
      }
      //if we arean't on the right edge of the board and we arean't on the top of the board add right/up neighbor
      if ((boxNumber + 1) % Game.getNumOfCols() != 0 && boxNumber >= Game.getNumOfCols()) {
        neighbors.push(boxNumber - Game.getNumOfCols() + 1);
      }
      //if we arean't on the right edge of the board and we arean't on the bottom of the board add right/below neighbor
      if ((boxNumber + 1) % Game.getNumOfCols() != 0 && boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
        neighbors.push(boxNumber + Game.getNumOfCols() + 1);
      }
      return neighbors;
    }
  }
})();