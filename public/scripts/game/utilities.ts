/// <reference path="game.ts" />


var utilities = (function () {
  var SEED = 3;

  return {

    minIndex : function(array){
      var min = array[0];
      var minIndex = 0;
      for (var i = 0 ; i < array.length; i++) {
        if (array[i] != null && array[i] < min) {
          min = array[i];
          minIndex = i;
        } 
      }
      return minIndex;
    },

    distance: function (a, b) {
      var x1 = (a.loc % Game.getBoxesPerRow());
      var y1 = (a.loc % Game.getBoxesPerRow());
      var x2 = (b.loc % Game.getBoxesPerRow());
      var y2 = (b.loc % Game.getBoxesPerRow());
      return Math.sqrt(Math.pow(x1-x2,2)) + Math.sqrt(Math.pow(y1-y2,2));
      //return Math.sqrt(Math.pow((a.x-b.x),2) + Math.pow((a.y - b.y),2));
    },

    //return the index of the unit with a given id
    findUnit : function(id, units){
      for (var i = 0; i < units.length; i++){
        if (units[i].id == id) {
          return units[i];
        }
      }
      return null;
    },

    collides : function(i, j) {
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
          locs.push(loc + (i * Game.getBoxesPerRow())+j);
        }
      }
      return locs;
    },

    //figure out if the unit is moving up, down, left, or right and return that direction
    getDirection: function (loc1, loc2) {
      if (loc1 < loc2) { //we are moving right or down
        if (loc1 % Game.getBoxesPerRow() < loc2 % Game.getBoxesPerRow()) {
          return 'right';
        }
        return 'down';
      }
      else { // we are moving left or up
        if (loc1 % Game.getBoxesPerRow() < loc2 % Game.getBoxesPerRow()) {
          return 'up';
        }
        return 'left';
      }
      console.log('ERROR: utilities.getDirection() did not set a direction');
    },

    neighbors : function(boxNumber) {
      var neighbors = new Array();

      //if we arean't on the left edge of the board add neighbor to the left
      if (boxNumber % Game.getBoxesPerRow() != 0){
        neighbors.push(boxNumber - 1);
      }
      //if we arean't on the right edge of the board add neighbor to the right 
      if ((boxNumber + 1) % Game.getBoxesPerRow() != 0){
        neighbors.push(boxNumber + 1);
      }
       //if we arean't on the top of the board add neighbor above us
      if (boxNumber >= Game.getBoxesPerRow()){
        neighbors.push(boxNumber - Game.getBoxesPerRow());
       } 
      //if we arean't on the bottom of the board add neighbor beneath us
      if (boxNumber < Game.getBoxesPerRow() * (Game.getBoxesPerCol()-1)){
        neighbors.push(boxNumber + Game.getBoxesPerRow());
      }
      //diagonal cases...refactor this logic later for speed ups!!

      //if we arean't on the left edge and we arean't on the top of the board add the left/up beighbor
      if (boxNumber % Game.getBoxesPerRow() != 0 && boxNumber >= Game.getBoxesPerRow()){
        neighbors.push(boxNumber - Game.getBoxesPerRow() -1);
      }
      //if we arean't on the left edge and we arean't on the bottom of the board add the left/below neighbor
      if (boxNumber % Game.getBoxesPerRow() != 0 && boxNumber < Game.getBoxesPerRow() * (Game.getBoxesPerCol()-1)){
        neighbors.push(boxNumber + Game.getBoxesPerRow()-1);
      }
      //if we arean't on the right edge of the board and we arean't on the top of the board add right/up neighbor
      if ((boxNumber + 1) % Game.getBoxesPerRow() != 0 && boxNumber >= Game.getBoxesPerRow()){
        neighbors.push(boxNumber - Game.getBoxesPerRow() +1);
      }
      //if we arean't on the right edge of the board and we arean't on the bottom of the board add right/below neighbor
      if ((boxNumber + 1) % Game.getBoxesPerRow() != 0 && boxNumber < Game.getBoxesPerRow() * (Game.getBoxesPerCol()-1)){
        neighbors.push(boxNumber + Game.getBoxesPerRow()+1);
      }
      return neighbors;
    } 
  }
})();