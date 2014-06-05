/// <reference path="coords.ts" />
/// <reference path="unit.ts" />

var drawer = (function () {
  var CANVAS_WIDTH: number = 1440;//1280;//960;//900//960;
  var CANVAS_HEIGHT: number = 720; //640//540//640;
  var ratio: number = CANVAS_WIDTH / CANVAS_HEIGHT;
  var boxSize: number = CANVAS_WIDTH / Game.getBoxesPerRow();
  var updateFPS: number = 10;
  var FPS: number = 60;

  //consts...
  var GREEN = "#39FF14";
  var HEALTH_BAR_OFFSET = 10;
  var HEALTH_BAR_HEIGHT = 5;
  var FOG = "black";

  //globals...
  var terrainContext;
  var unitContext;
  var fogContext;
  var selectionContext;
  var playerId;


  return {
  	init: function (width, height, player,
  		            terrainCanvas, unitCanvas, fogCanvas, selectionCanvas) {
  	  terrainCanvas.width = width;
  	  terrainCanvas.height = height;
  	  playerId = player;
  	  unitCanvas.width = width;
  	  unitCanvas.height = height;
  	  fogCanvas.width = width;
  	  fogCanvas.height = height;
      selectionCanvas.width = width;
      selectionCanvas.height = height;

      terrainContext = terrainCanvas.getContext("2d");
      unitContext = unitCanvas.getContext("2d");
      fogContext = fogCanvas.getContext("2d");
      selectionContext = selectionCanvas.getContext("2d");
  	},

  	getTerrainContext: function() {
  		return terrainContext;
  	},

  	drawUnits: function(units) {
  	  fogContext.globalCompositeOperation = 'source-over';
      fogContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      fogContext.fillStyle = FOG;
      fogContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      unitContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      for (var i = 0; i < units.length; i++) {
        if (units[i].player == playerId) {
          var coords = this.boxToCoords(units[i].loc);
          var x = coords.x;
          var y = coords.y;
  	      //this stuff does the "sight" circles in the fog
  	      var r1 = units[i].sightRange;
          var r2 = r1 + 50;
          var density = .4;

          var radGrd = fogContext.createRadialGradient( 
            x + units[i].w/2, 
            y + units[i].h/2, r1, 
            x + units[i].w/2 , 
            y + units[i].h/2, r2 );
          radGrd.addColorStop(       0, 'rgba( 0, 0, 0,  1 )' );
          radGrd.addColorStop( density, 'rgba( 0, 0, 0, .1 )' );
          radGrd.addColorStop(       1, 'rgba( 0, 0, 0,  0 )' );
          fogContext.globalCompositeOperation = "destination-out";
          fogContext.fillStyle = radGrd;
  	      fogContext.fillRect( x - r2, y - r2, r2*2, r2*2 );
        }
        drawer.drawUnit(units[i]);   
      }
      selectionContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      //debugging....
      for (var u in units) {
        drawer.drawSquare(units[u].target, 'red');
      }
  	},

    drawUnit: function (unit: Unit) {
      var x = unit.x
      var y = unit.y;  
      var coords = unit.getDrawCoordinates(); 
      unitContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x - unit.w / 2, y - unit.h, unit.w * 2, unit.h * 2);
      
      if (unit.selected) {
        unitContext.beginPath();
        unitContext.strokeStyle = GREEN;
        unitContext.arc(x + unit.w/2, y + unit.h/2, Math.max(unit.w, unit.h)*.75, 0, 2*Math.PI);
        unitContext.stroke();
      }
      //draw the health bar above the unit...todo: move this elsewhere
      var percent = unit.health/unit.totalHealth;
      unitContext.fillStyle="red";
      if( percent > .7) {
        unitContext.fillStyle = "green";
      }
      else if (percent > .4) {
        unitContext.fillStyle = "yellow";
      }
      unitContext.fillRect(x, y - HEALTH_BAR_OFFSET, unit.w * percent, HEALTH_BAR_HEIGHT);
      unitContext.fillStyle = "black";
      unitContext.fillRect(x + unit.w*percent, y - HEALTH_BAR_OFFSET, unit.w * (1-percent), HEALTH_BAR_HEIGHT);
    },

    interpolate: function () {
      var units = Game.getUnits();
      for (var i = 0; i < units.length; i++) {
        var oldCoords = drawer.boxToCoords(units[i].prevLoc);
        var coords = drawer.boxToCoords(units[i].loc);
        units[i].x -= ((1 / (FPS / updateFPS)) * (oldCoords.x - coords.x)) / (units[i].moveSpeed + 1);
        units[i].y -= ((1 / (FPS / updateFPS)) * (oldCoords.y - coords.y)) / (units[i].moveSpeed + 1);
      }
    },

  	drawTerrain: function(tiles) {       
        for (var i = 0; i < (length = tiles.length); i++) {
            var tile = tiles[i];
            if (tile.getImage()) {
              terrainContext.drawImage(
                tile.getImage(),
                tile.imageX,
                tile.imageY,
                tile.imageW,
                tile.imageH,
                this.boxToCoords(i).x,
                this.boxToCoords(i).y,
                boxSize,
                boxSize);
            }
            else {
                //console.log("failed to load image");
            }
        }
  	},

  	drawFog: function () {

    },

    //returns the upper left corner of the box given its index 
    boxToCoords: function (i) {
      var y = Math.floor(i / Game.getBoxesPerRow()) * boxSize;
      var x = i % Game.getBoxesPerRow() * boxSize;
      return { x: x, y: y }
    },


    //given the row and col of a box this returns the box index
    coordsToBox: function (x, y) {
      var newX = Math.floor((x % CANVAS_WIDTH) / boxSize);
      var newY = Math.floor((y % CANVAS_HEIGHT) / boxSize);
      var boxNumber = newX + Game.getBoxesPerRow() * newY;
      return boxNumber;
    },


    drawSquare: function (loc, color) {
      var coords = this.boxToCoords(loc);
      selectionContext.fillStyle = color;
      selectionContext.fillRect(coords.x, 
        coords.y, 
        boxSize, 
        boxSize);
    },

    //used for debugging a* pathing
    drawPathing: function (loc, color, val) {
      var coords = this.boxToCoords(loc);
      selectionContext.fillStyle = color;
      selectionContext.fillRect(coords.x, 
        coords.y, 
        boxSize, 
        boxSize);
      selectionContext.fillStyle = "black";
      selectionContext.fillText(Math.round(val), coords.x, coords.y + boxSize/2)
     //selectionContext.globalAlpha = 1;
    },

  	drawSelect: function (selection) {
      selectionContext.globalAlpha = 0.3;
	    selectionContext.fillStyle = GREEN;
      selectionContext.fillRect(selection.x, 
          selection.y, 
          selection.w, 
          selection.h);
      selectionContext.globalAlpha = 1;
      //console.log(selection.y + " " + selection.x + " " + selection.w + " " + selection.h);
    },

    getBoxSize: function () {
      return boxSize;
    },

  	drawGrid : function() {
      terrainContext.strokeStyle = GREEN;
      for (var i = 0; i <= Game.getBoxesPerRow(); i++) {
        terrainContext.moveTo(i * boxSize, 0);
        terrainContext.lineTo(i * boxSize, CANVAS_HEIGHT);
        terrainContext.stroke();
      }
      for (var i = 0; i <= Game.getBoxesPerCol(); i++) {
        terrainContext.moveTo(0, i * boxSize);
        terrainContext.lineTo(CANVAS_WIDTH, i * boxSize);
        terrainContext.stroke();
      }
    }
  }

})();