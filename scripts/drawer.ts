var drawer = (function() {
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
      fogContext.clearRect(0,0,Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
      fogContext.fillStyle = FOG;
      fogContext.fillRect(0, 0,  Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
      unitContext.clearRect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
      for (var i = 0; i < units.length; i++) {
        if (units[i].player == playerId) {
          var coords = utilities.boxToCoords(units[i].loc);
          var x = coords.x;
          var y = coords.y;
  	      //this stuff does the "sight" circles in the fog
  	      var r1 = units[i].sight;
          var r2 = 150;
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
      selectionContext.clearRect(0,0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT)
  	},

  	drawUnit: function(unit) {
      var coords = utilities.boxToCoords(unit.loc);
      var x = unit.x
      var y = unit.y;
      if(unit.imageReady()) {    
        unitContext.drawImage(unit.getImage(), unit.imageX,unit.imageY,unit.imageW,unit.imageH, x, y,unit.w,unit.h);
      }
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
      var imageObj = new Image();
      var that = this;
      imageObj.onload = function() {
        for (var i = 0; i < Game.boxesPerRow * Game.boxesPerCol; i++) {
          terrainContext.drawImage(imageObj, Math.round(utilities.random()) * this.width/2, 0,this.width/2,this.height/2,utilities.boxToCoords(i).x,utilities.boxToCoords(i).y,Game.boxSize, Game.boxSize);
        }
      };
      imageObj.src = '/images/terrain.jpg';
  	},

  	drawFog: function () {

  	},


    drawSquare: function (loc, color) {
      var coords = utilities.boxToCoords(loc);
      selectionContext.fillStyle = color;
      selectionContext.fillRect(coords.x, 
          coords.y, 
          Game.boxSize, 
          Game.boxSize);
    },

    //used for debugging a* pathing
    drawPathing: function (loc, color, val) {
      var coords = utilities.boxToCoords(loc);
      selectionContext.fillStyle = color;
      selectionContext.fillRect(coords.x, 
          coords.y, 
          Game.boxSize, 
          Game.boxSize);
      selectionContext.fillStyle = "black";
      selectionContext.fillText(Math.round(val), coords.x, coords.y+Game.boxSize/2)
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
  	},

  	drawGrid : function() {
      terrainContext.strokeStyle = GREEN;
      for (var i = 0; i <= Game.boxesPerRow; i++) {
        terrainContext.moveTo(i*Game.boxSize, 0);
        terrainContext.lineTo(i*Game.boxSize, Game.CANVAS_HEIGHT);
        terrainContext.stroke();
      }
      for (var i = 0; i <= Game.boxesPerCol; i++) {
        terrainContext.moveTo(0, i*Game.boxSize);
        terrainContext.lineTo(Game.CANVAS_WIDTH, i*Game.boxSize);
        terrainContext.stroke();
      }
    }
  }

})();