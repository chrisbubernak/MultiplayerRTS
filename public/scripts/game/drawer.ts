/// <reference path="coords.ts" />
/// <reference path="unit.ts" />

var drawer = (function () {
  //conts...
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
      fogContext.clearRect(0, 0, Game.getCanvasWidth(), Game.getCanvasHeight());
      fogContext.fillStyle = FOG;
      fogContext.fillRect(0, 0, Game.getCanvasWidth(), Game.getCanvasHeight());
      unitContext.clearRect(0, 0, Game.getCanvasWidth(), Game.getCanvasHeight());
      for (var i = 0; i < units.length; i++) {
        if (units[i].player == playerId) {
          var coords = utilities.boxToCoords(units[i].loc);
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
      selectionContext.clearRect(0, 0, Game.getCanvasWidth(), Game.getCanvasHeight())

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
                utilities.boxToCoords(i).x,
                utilities.boxToCoords(i).y,
                Game.getBoxSize(),
                Game.getBoxSize());
            }
            else {
                //console.log("failed to load image");
            }
        }
  	},

  	drawFog: function () {

  	},


    drawSquare: function (loc, color) {
      var coords = utilities.boxToCoords(loc);
      selectionContext.fillStyle = color;
      selectionContext.fillRect(coords.x, 
        coords.y, 
        Game.getBoxSize(), 
        Game.getBoxSize());
    },

    //used for debugging a* pathing
    drawPathing: function (loc, color, val) {
      var coords = utilities.boxToCoords(loc);
      selectionContext.fillStyle = color;
      selectionContext.fillRect(coords.x, 
        coords.y, 
        Game.getBoxSize(), 
        Game.getBoxSize());
      selectionContext.fillStyle = "black";
      selectionContext.fillText(Math.round(val), coords.x, coords.y + Game.getBoxSize()/2)
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

  	drawGrid : function() {
      terrainContext.strokeStyle = GREEN;
      for (var i = 0; i <= Game.getBoxesPerRow(); i++) {
        terrainContext.moveTo(i * Game.getBoxSize(), 0);
        terrainContext.lineTo(i * Game.getBoxSize(), Game.getCanvasHeight());
        terrainContext.stroke();
      }
      for (var i = 0; i <= Game.getBoxesPerCol(); i++) {
        terrainContext.moveTo(0, i * Game.getBoxSize());
        terrainContext.lineTo(Game.getCanvasWidth(), i * Game.getBoxSize());
        terrainContext.stroke();
      }
    }
  }

})();