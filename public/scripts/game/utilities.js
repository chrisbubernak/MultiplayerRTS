/// <reference path="game.ts" />
var Utilities = (function () {
    function Utilities() {
    }
    Utilities.minIndex = function (array) {
        var min = array[0];
        var minIndex = 0;
        for (var i = 0; i < array.length; i++) {
            if (array[i] != null && array[i] < min) {
                min = array[i];
                minIndex = i;
            }
        }
        return minIndex;
    };

    Utilities.distance = function (a, b) {
        var x1 = (a % Game.getNumOfCols());
        var y1 = Math.floor(a / Game.getNumOfCols());
        var x2 = (b % Game.getNumOfCols());
        var y2 = Math.floor(b / Game.getNumOfCols());
        return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
    };

    //return the index of the unit with a given id
    Utilities.findUnit = function (id, units) {
        for (var i = 0; i < units.length; i++) {
            if (units[i].id == id) {
                return units[i];
            }
        }
        return null;
    };

    Utilities.collides = function (i, j) {
        //return i.loc == j.loc;
        return i.x < j.x + j.w && i.x + i.w > j.x && i.y < j.y + j.h && i.y + i.h > j.y;
    };

    Utilities.random = function () {
        var x = Math.sin(Utilities.SEED++) * 10000;
        return x - Math.floor(x);
    };

    //given a unit, return the locs that it occupies (given its height, width, and loc)
    Utilities.getOccupiedSquares = function (loc, width, height) {
        var locs = new Array();
        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                if (loc + (i * Game.getNumOfCols()) + j < (Game.getNumOfRows() * Game.getNumOfCols())) {
                    locs.push(loc + (i * Game.getNumOfCols()) + j);
                }
            }
        }
        return locs;
    };

    //figure out if the unit is moving up, down, left, or right and return that direction
    Utilities.getDirection = function (loc1, loc2) {
        if (loc1 < loc2) {
            if ((loc1 % Game.getNumOfCols()) <= (loc2 % Game.getNumOfCols())) {
                return 'right';
            }
            return 'down';
        } else {
            if (Math.floor(loc1 / Game.getNumOfCols()) > Math.floor(loc2 / Game.getNumOfCols())) {
                return 'up';
            }
            return 'left';
        }
        console.log('ERROR: Utilities.getDirection() did not set a direction');
    };

    Utilities.getGridLocsInSightRange = function (unit) {
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
    };

    Utilities.getGridLocsInTargetAquireRange = function (unit) {
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
    };

    Utilities.canAnyUnitSeeEnemy = function (unit, enemy) {
        //for each of my units check if they can see enemy
        var units = Game.getUnitsForPlayer(unit.player);
        console.log(units.length);
        for (var u in units) {
            var locs = Utilities.getGridLocsInSightRange(units[u]);
            for (var l in locs) {
                var id = Game.getGridLoc(locs[l]);
                if (id === enemy.id) {
                    console.log('a unit can see the enemy!');
                    return true;
                }
            }
        }
        return false;
    };

    Utilities.neighbors = function (boxNumber) {
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
    };
    Utilities.SEED = 3;
    return Utilities;
})();
//# sourceMappingURL=Utilities.js.map
