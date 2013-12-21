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
    var targetLoc = utilities.coordsToBox(data.actions[a].target.x, data.actions[a].target.y);
    if (data.actions[a].shift) {
      utilities.findUnit(data.actions[a].unit, that.units).target.push(targetLoc);
    }
    else {
      utilities.findUnit(data.actions[a].unit, that.units).target = [targetLoc];
    }
  }
  that.simTick++;
});

//"private" variables
this.units = new Array(); //array of units
this.tree; //the quad tree

//stores the coordinates of the players selection
this.selection = new Object();

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
Game.FPS = 60;
Game.updateFPS = 10;
Game.SEED = 3;
Game.MOVE_SPEED = 10;


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
    drawer.drawUnits(that.units);
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
        var unitLoc = utilities.boxToCoords(that.units[i].loc);
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
  drawer.init(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT, this.id,
    document.getElementById("terrainCanvas"),
    document.getElementById("unitCanvas"),
    document.getElementById("fogCanvas"),
    document.getElementById("selectionCanvas"))
  drawer.drawTerrain();

  //disable the right click so we can use it for other purposes
  document.oncontextmenu = function() {return false;};
  
  var that = this;

  //keep track of when shift is held down so we can queue up unit movements
  //for debugging also listen for g clicked ...this signifies to draw the grid
  $(document).bind('keyup keydown', function(e){
    var code = e.keyCode || e.which;
    if(code == 71) { 
      drawer.drawGrid();
    }
    that.shifted = e.shiftKey;
    return true;
  });



  $(document).mousedown(function(e) {
    //on left click...
    if (e.button == 0) {
      $(this).data('mousedown', true);
      var coords = that.getMousePos(document.getElementById("selectionCanvas"), e);
      that.selection = Object.create(new that.select(coords.x, coords.y, coords.x, coords.y));
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
      that.updateSelection(that.selection, coords.x, coords.y); 
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
	//var selectBox = Object.create(new that.select(that.sX, that.sY, that.eX, that.eY));
	var region = that.tree.retrieve(that.selection, function(item) {
      var loc = utilities.boxToCoords(item.loc);
      loc.w = item.w;
      loc.h = item.h;
      if((item.player == that.id) && utilities.collides(that.selection, loc) && item != that.selection) {
	      item.selected = true;
      }
    });
  }
}



Game.prototype.drawSelect = function() {
  var that = this;
  if($(document).data('mousedown')) {
    drawer.drawSelect(that.selection);
  }
}

Game.prototype.select = function(sX, sY) {
  var selection = new Object();
  selection.sX = sX;
  selection.x = sX;
  selection.sY = sY;
  selection.y = sY;
  selection.w = 0;
  selection.h = 0;
  selection.select = true;
  return selection;
}

Game.prototype.updateSelection = function(selection, eX, eY) {
  selection.x = Math.min(selection.sX, eX);
  selection.y = Math.min(selection.sY, eY);
  selection.w = Math.abs(selection.sX - eX);
  selection.h = Math.abs(selection.sY - eY);
  return selection;
}

Game.prototype.getMousePos = function (canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
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
      var neighbors = utilities.neighbors(box);
      var moves = new Array();
      for (var i = 0; i < neighbors.length; i++){
        var move = utilities.distance(utilities.boxToCoords(unit.target), utilities.boxToCoords(neighbors[i]));
        moves.push(move);
      }

      var bestMoveIndex = utilities.minIndex(moves);
      unit.loc = neighbors[bestMoveIndex];
    }
  } 
}

