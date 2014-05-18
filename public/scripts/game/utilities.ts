/// <reference path="game.ts" />


var utilities = (function () {
  var SEED = 3;

  return {
    //returns the upper left corner of the box given its index 
    boxToCoords : function(i) {
      var y = Math.floor(i/Game.getBoxesPerRow())*Game.getBoxSize();
      var x = i % Game.getBoxesPerRow() * Game.getBoxSize();
      return {x: x, y: y}
    },


    //given the row and col of a box this returns the box index
    coordsToBox : function(x , y) {
      var newX = Math.floor((x % Game.getCanvasWidth()) / Game.getBoxSize());
      var newY = Math.floor((y % Game.getCanvasHeight()) / Game.getBoxSize());
      var boxNumber = newX+Game.getBoxesPerRow()*newY;
      return boxNumber;
    },

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

    distance : function(a, b){
      return Math.sqrt(Math.pow((a.x-b.x),2) + Math.pow((a.y - b.y),2));
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
    getOccupiedSquares: function (loc, w, h) {
      var locs = new Array();
      var width = Math.ceil(w / Game.getBoxSize());
      var height = Math.ceil(h / Game.getBoxSize());
      for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
          locs.push(loc + (i * Game.getBoxesPerRow())+j);
        }
      }
      return locs;
    },


    //figure out if the unit is moving up, down, left, or right and return that direction
    getDirection: function (loc1, loc2) {
      var coords1 = utilities.boxToCoords(loc1);
      var coords2 = utilities.boxToCoords(loc2);
      if (Math.abs(coords1.x - coords2.x) > Math.abs(coords1.y - coords2.y)) {
        if (coords1.x > coords2.x) {
          return 'left';
        }
        if (coords1.x < coords2.x) {
          return 'right';
        }
      }
      else {
        if (coords1.y > coords2.y) {
          return 'up';
        }
        if (coords2.y > coords1.y) {
          return 'down';
        }
      }

        return;
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