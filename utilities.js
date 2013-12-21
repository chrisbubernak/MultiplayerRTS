var utilities = (function() {

  return {
    //returns the upper left corner of the box given its index 
    boxToCoords : function(i) {
      var y = Math.floor(i/Game.boxesPerRow)*Game.boxSize;
      var x = i%Game.boxesPerRow*Game.boxSize;
      return {x: x, y: y}
    },
    
  }
})();