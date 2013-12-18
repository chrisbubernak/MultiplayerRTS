var Game = function(socket, id, clients, gameId) {

 document.getElementById("gameId").innerHTML = "Game: " + gameId;
 document.getElementById("clientId").innerHTML = "Client: " + id;

 this.gameId = gameId;
 this.clients = clients; //an array of all players ids in the game
 this.id = id; //this players id
 this.socket = socket;
 var that = this;
 this.socket.on('SendActionsToClient', function (data) {
  for (var a in data.actions){
    var targetLoc = that.coordsToBox(data.actions[a].target.x, data.actions[a].target.y);
    if (data.actions[a].shift) {
      that.units[that.findUnit(data.actions[a].unit)].target.push(targetLoc);
    }
    else {
      that.units[that.findUnit(data.actions[a].unit)].target = [targetLoc];
    }
  }
  that.simTick++;
});

//"private" variables
this.units = new Array(); //array of units
this.tree; //the quad tree

this.sX; //variables for the selection object...gotta refactor
this.sY;
this.eX;
this.eY;    

this.ctx; //canvas context (this contains units)
this.ftx; //fog contex
this.btx; //background contex (contains the background image)

this.actions = new Array();
this.simTick = 0;
this.unitId = 0;

//used as a primitive way to do interpolation of unit positioning
//so that we can "move" them during the drawing phase without actually
//changing their position
this.interpolationCounter = 0;
}


//static constants
Game.CANVAS_HEIGHT = 540;
Game.CANVAS_WIDTH = 900;
Game.boxesPerRow = 30;
Game.ratio = Game.CANVAS_WIDTH/Game.CANVAS_HEIGHT;
Game.boxesPerCol = Game.boxesPerRow/Game.ratio;
Game.boxSize = Game.CANVAS_WIDTH/Game.boxesPerRow;

Game.NUMBER_OF_UNITS = 2;
Game.FOG = "black";//rgba( 0, 0, 0, .7)";
Game.FPS = 60;
Game.updateFPS = 10;
Game.SEED = 3;
Game.MOVE_SPEED = 10;
Game.HEALTH_BAR_OFFSET = 10;
Game.HEALTH_BAR_HEIGHT = 5;
Game.GREEN = "#39FF14";

Game.random = function() {
    var x = Math.sin(Game.SEED++) * 10000;
    return x - Math.floor(x);
}

Game.prototype.createUnitId = function() {
  this.unitId++;
  return this.unitId;
}

//run the game
Game.prototype.run = function(){
  this.setup();

  //timing stuff
  var oldTime = new Date().getTime();
  var diffTime = 0;
  var newTime = 0;
  var oldTime2 = new Date().getTime();
  var diffTime2 = 0;
  var newTime2 = 0;

  //loop that runs at 60 fps...aka drawing & selection stuff
  var that = this;
  setInterval(function() {
    that.draw();
    that.drawSelect();
    diffTime = newTime - oldTime;
    oldTime = newTime;
    newTime = new Date().getTime();
    that.interpolationCounter++;
  }, 1000/Game.FPS);

  //loop that runs much less (ideally 10fps)
  //at the moment this runs at 60 but that won't scale
  //need to move the updating to the other loop and do 
  //some sort of interpolation
  var fpsOut = document.getElementById("fps");
  setInterval(function() {

    that.tree.insert(that.units);
    that.update();
    that.getSelection();
    that.tree.clear();
    that.socket.emit('SendActionsToServer', {actions: that.actions, simTick: that.simTick, game: that.gameId});
    that.actions = new Array();
    diffTime2 = newTime2 - oldTime2;
    oldTime2 = newTime2;
    newTime2 = new Date().getTime();
    fpsOut.innerHTML = Math.round(1000/diffTime)  + " drawing fps " + Math.round(1000/diffTime2) + " updating fps";
    that.interpolationCounter = 0;
    if (that.simTick%100 == 0){
      console.log("Sim: " + that.simTick)
      for (var i = 0; i < that.units.length; i++){
        var unitLoc = that.boxToCoords(that.units[i].loc);
        console.log("x= " + unitLoc.x + " y= " + unitLoc.y);
      }
    }
  }, 1000/(Game.updateFPS));

    //every 10 seconds check the world for desync errors
    // (at the moment this means just comparing unit arrays)
    setInterval(function() {
      that.socket.emit('SendGameStateToServer', {units: that.units, simTick: that.simTick});
  }, 10000);

}





Game.prototype.setup = function(){ 
  var t = document.getElementById("terrainCanvas");
  this.ttx = t.getContext("2d");
  t.height = Game.CANVAS_HEIGHT;
  t.width = Game.CANVAS_WIDTH;
  var imageObj = new Image();

  var ttx = this.ttx;
  var that = this;
  imageObj.onload = function() {
        ttx.drawImage(imageObj, 0, 0, 
          Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
  };
  imageObj.src = 'grass.jpg';
  

  
  var c = document.getElementById("unitCanvas");    
  this.ctx = c.getContext("2d");
  var f = document.getElementById("fogCanvas");
  this.ftx = f.getContext("2d");
  f.height = Game.CANVAS_HEIGHT;
  f.width = Game.CANVAS_WIDTH;
  c.height = Game.CANVAS_HEIGHT;
  c.width = Game.CANVAS_WIDTH;

  var s = document.getElementById("selectionCanvas");
  this.stx = s.getContext("2d");
  s.height = Game.CANVAS_HEIGHT;
  s.width = Game.CANVAS_WIDTH;



  //disable the right click so we can use it for other purposes
  document.oncontextmenu = function() {return false;};
  
  var that = this;

  //keep track of when shift is held down so we can queue up unit movements
  //for debugging also listen for g clicked ...this signifies to draw the grid
  $(document).bind('keyup keydown', function(e){
    var code = e.keyCode || e.which;
    if(code == 71) { 
      that.drawGrid();
    }
    that.shifted = e.shiftKey;
    return true;
  });



  $(document).mousedown(function(e) {
    //on left click...
    if (e.button == 0) {
      $(this).data('mousedown', true);
      var coords = that.getMousePos(document.getElementById("selectionCanvas"), e);
      that.sX = coords.x;
      that.sY = coords.y;
      that.eX = coords.x;
      that.eY = coords.y;
      for (var u in that.units ) {
        that.units[u].selected = false;
      }
    }
  //if right click...
    else if (e.button == 2){
      for (var u in that.units) {
        if (that.units[u].selected){
          var tar = that.getMousePos(document.getElementById("selectionCanvas"), e);
          that.actions.push({unit: that.units[u].id, target: tar, shift: that.shifted});
        }
      }
    }
  });
  
  $(document).mouseup(function(e) {
    $(this).data('mousedown', false);
  });

  $(document).mousemove(function(e) {
    if($(this).data('mousedown')) {
      var coords = that.getMousePos(document.getElementById("selectionCanvas"), e);
      that.eX = coords.x;
      that.eY = coords.y;
    }
  });


  // initialize the quadtree
  var  args = {x : 0, y : 0, h : Game.CANVAS_HEIGHT, w : Game.CANVAS_WIDTH, maxChildren : 5, maxDepth : 5};
  this.tree = QUAD.init(args);
  for (var i = 0; i<Game.NUMBER_OF_UNITS; i++){
    this.units.push(
      Object.create(new Knight(
          this.createUnitId(),
          Math.round(Game.random()*Game.boxesPerRow*Game.boxesPerCol),
          this.clients[0]
    )));
    this.units.push(
      Object.create(new Knight(
          this.createUnitId(),
          Math.round(Game.random()*Game.boxesPerRow*Game.boxesPerCol), 
          this.clients[1]
    )));
  }
}


Game.prototype.update = function(){
  for (var i = 0; i < this.units.length; i++) {
    this.move(this.units[i]);
  }
}

Game.prototype.getSelection = function(){
  var that = this;
  if($(document).data('mousedown')) {
    //create the selection
	var selectBox = Object.create(new that.select(that.sX, that.sY, that.eX, that.eY));
	var region = that.tree.retrieve(selectBox, function(item) {
      var loc = that.boxToCoords(item.loc);
      loc.w = item.w;
      loc.h = item.h;
      if((item.player == that.id) && that.collides(selectBox, loc) && item != selectBox) {
	      item.selected = true;
      }
    });
  }
}

Game.prototype.draw = function(){
  this.ftx.globalCompositeOperation = 'source-over';
  this.ftx.clearRect(0,0,Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
  this.ftx.fillStyle = Game.FOG;
  this.ftx.fillRect(0, 0,  Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
	
  this.ctx.clearRect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
  for (var i = 0; i < this.units.length; i++) {
    if (this.units[i].player == this.id) {

      var coords = this.boxToCoords(this.units[i].loc);
      var oldCoords = this.boxToCoords(this.units[i].prevLoc);
      if (this.units[i].target.length > 0) {
        var x = oldCoords.x - (this.interpolationCounter/(Game.FPS/Game.updateFPS))*(oldCoords.x - coords.x);
        var y = oldCoords.y - (this.interpolationCounter/(Game.FPS/Game.updateFPS))*(oldCoords.y - coords.y);
      }
      else {
        var x = coords.x;
        var y = coords.y;
      }
  	  //this stuff does the "sight" circles in the fog
  	  var r1 = this.units[i].sight;
      var r2 = 150;
  	  var density = .4;
      var radGrd = this.ftx.createRadialGradient( 
        x + this.units[i].w/2, 
        y + this.units[i].h/2, r1, 
        x + this.units[i].w/2 , 
        y + this.units[i].h/2, r2 );
      radGrd.addColorStop(       0, 'rgba( 0, 0, 0,  1 )' );
      radGrd.addColorStop( density, 'rgba( 0, 0, 0, .1 )' );
      radGrd.addColorStop(       1, 'rgba( 0, 0, 0,  0 )' );
      this.ftx.globalCompositeOperation = "destination-out";
      this.ftx.fillStyle = radGrd;
  	  this.ftx.fillRect( x - r2, y - r2, r2*2, r2*2 );
    }
    this.drawUnit(this.units[i]);
  }    
  this.stx.clearRect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);

}

Game.prototype.drawGrid = function() {
  this.ttx.strokeStyle = Game.GREEN;
  for (var i = 0; i <= Game.boxesPerRow; i++) {
    this.ttx.moveTo(i*Game.boxSize, 0);
    this.ttx.lineTo(i*Game.boxSize, Game.CANVAS_HEIGHT);
    this.ttx.stroke();
  }
  for (var i = 0; i <= Game.boxesPerCol; i++) {
    this.ttx.moveTo(0, i*Game.boxSize);
    this.ttx.lineTo(Game.CANVAS_WIDTH, i*Game.boxSize);
    this.ttx.stroke();
  }
}

Game.prototype.drawSelect = function() {
  var that = this;
  if($(document).data('mousedown')) {
    that.stx.globalAlpha = 0.3;
	  that.stx.fillStyle = Game.GREEN;
    that.stx.fillRect(that.sX, that.sY, that.eX - that.sX, that.eY - that.sY);
    that.stx.globalAlpha = 1;
  }
}

Game.prototype.select = function(sX, sY, eX, eY) {
  this.x = Math.min(sX, eX);
  this.y = Math.min(sY, eY);
  this.w = Math.abs(sX - eX);
  this.h = Math.abs(sY - eY);
  this.select = true;
}
	  
//utility functions      
Game.prototype.clampX = function(x, width){
  return Math.max(0 - width, Math.min(Game.CANVAS_WIDTH - width, x))
}

Game.prototype.clampY = function(y, height){
  return Math.max(0 - height, Math.min(Game.CANVAS_HEIGHT - height, y))
}

Game.prototype.getMousePos = function (canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

Game.prototype.collides = function(i, j) {
  //return i.loc == j.loc;
  return i.x < j.x + j.w && i.x + i.w > j.x && i.y < j.y + j.h && i.y + i.h > j.y;
} 

 //draw a unit
Game.prototype.drawUnit =  function(unit) {
  var coords = this.boxToCoords(unit.loc);
  var oldCoords = this.boxToCoords(unit.prevLoc);
  if (unit.target.length > 0) {
    var x = oldCoords.x - (this.interpolationCounter/(Game.FPS/Game.updateFPS))*(oldCoords.x - coords.x);
    var y = oldCoords.y - (this.interpolationCounter/(Game.FPS/Game.updateFPS))*(oldCoords.y - coords.y);
  }
  else {
    var x = coords.x;
    var y = coords.y;
  }
  if(unit.imageReady()) {
    this.ctx.drawImage(unit.getImage(), unit.imageX,unit.imageY,unit.imageW,unit.imageH, x, y,unit.w,unit.h);
  }
  if (unit.selected) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = Game.GREEN;
    this.ctx.arc(x + unit.w/2, y + unit.h/2, Math.max(unit.w, unit.h)*.75, 0, 2*Math.PI);
    this.ctx.stroke();
  }
  //draw the health bar above the unit...todo: move this elsewhere
  var percent = unit.health/unit.totalHealth;
  this.ctx.fillStyle="red";
  if( percent > .7) {
    this.ctx.fillStyle = "green";
  }
  else if (percent > .4) {
    this.ctx.fillStyle = "yellow";
  }
  this.ctx.fillRect(x, y - Game.HEALTH_BAR_OFFSET, unit.w * percent, Game.HEALTH_BAR_HEIGHT);
  this.ctx.fillStyle = "black";
  this.ctx.fillRect(x + unit.w*percent, y - Game.HEALTH_BAR_OFFSET, unit.w * (1-percent), Game.HEALTH_BAR_HEIGHT);
}

Game.prototype.move = function(unit){
  if (unit.target.length > 0) {
    var tarSquare = unit.target[0];
    unit.prevLoc = unit.loc;
    if (tarSquare == unit.loc){
      unit.target.shift();
    }
    else { 
      this.interpolationCounter = 0;
      var box = unit.loc;
      var neighbors = this.neighbors(box);
      var moves = new Array();
      for (var i = 0; i < neighbors.length; i++){
        moves.push(this.distance(this.boxToCoords(unit.target), this.boxToCoords(neighbors[i])));
      }
      var bestMoveIndex = this.minIndex(moves);
      unit.loc = neighbors[bestMoveIndex];
    }
  } 
}

//return the index of the unit with a given id
Game.prototype.findUnit = function(id){
  for (var i = 0; i < this.units.length; i++){
    if (this.units[i].id == id) {
      return i;
    }
  }
  return -1;
}

Game.prototype.distance = function(a, b){
  return Math.sqrt(Math.pow((a.x-b.x),2) + Math.pow((a.y - b.y),2));
}

Game.prototype.minIndex = function(array){
  var min = array[0];
  var minIndex = 0;
  for (var i = 0 ; i < array.length; i++) {
    if (array[i] < min) {
      min = array[i];
      minIndex = i;
    }
  }
  return minIndex;
}


  //given the row and col of a box this returns the box index
 Game.prototype.coordsToBox = function(x , y) {
    var newX = Math.floor((x%Game.CANVAS_WIDTH)/Game.boxSize);
    var newY = Math.floor((y%Game.CANVAS_HEIGHT)/Game.boxSize);
    var boxNumber = newX+Game.boxesPerRow*newY;
    return boxNumber;
  }

  //returns the upper left corner of the box given its index 
  Game.prototype.boxToCoords = function(i) {
    var y = Math.floor(i/Game.boxesPerRow)*Game.boxSize;
    var x = i%Game.boxesPerRow*Game.boxSize;
    return {x: x, y: y}
  }

  Game.prototype.neighbors = function(boxNumber) {
    var neighbors = new Array();
    //if we arean't on the left edge of the board add neighbor to the left
    if (boxNumber%Game.boxesPerRow != 0){
      neighbors.push(boxNumber - 1);
    }
    //if we arean't on the right edge of the board add neighbor to the right 
    if ((boxNumber+1)%Game.boxesPerRow != 0){
      neighbors.push(boxNumber + 1);
    }
    //if we arean't on the top of the board add neighbor above us
    if (boxNumber >= Game.boxesPerRow){
      neighbors.push(boxNumber - Game.boxesPerRow);
    } 
    //if we arean't on the bottom of the board add neighbor beneath us
    if (boxNumber < Game.boxesPerRow*(Game.boxesPerCol-1)){
      neighbors.push(boxNumber + Game.boxesPerRow);
    }

    //diagonal cases...refactor this logic later for speed ups!!

    //if we arean't on the left edge and we arean't on the top of the board add the left/up beighbor
    if (boxNumber%Game.boxesPerRow != 0 && boxNumber >= Game.boxesPerRow){
      neighbors.push(boxNumber - Game.boxesPerRow -1);
    }
    //if we arean't on the left edge and we arean't on the bottom of the board add the left/below neighbor
    if (boxNumber%Game.boxesPerRow != 0 && Game.boxesPerRow*(Game.boxesPerCol-1)){
      neighbors.push(boxNumber + Game.boxesPerRow-1);
    }
    //if we arean't on the right edge of the board and we arean't on the top of the board add right/up neighbor
    if ((boxNumber+1)%Game.boxesPerRow != 0 && boxNumber >= Game.boxesPerRow){
      neighbors.push(boxNumber - Game.boxesPerRow +1);
    }
    //if we arean't on the right edge of the board and we arean't on the bottom of the board add right/below neighbor
    if ((boxNumber+1)%Game.boxesPerRow != 0 && Game.boxesPerRow*(Game.boxesPerCol-1)){
      neighbors.push(boxNumber + Game.boxesPerRow+1);
    }
    return neighbors;
  }