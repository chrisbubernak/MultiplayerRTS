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


//static constants
Game.CANVAS_HEIGHT = 540//640;
Game.CANVAS_WIDTH = 900//960;
Game.boxesPerRow = 30//60;
Game.ratio = Game.CANVAS_WIDTH/Game.CANVAS_HEIGHT;
Game.boxesPerCol = Game.boxesPerRow/Game.ratio;
Game.boxSize = Game.CANVAS_WIDTH/Game.boxesPerRow;

Game.grid = new Array(Game.boxesPerRow*Game.boxesPerCol);

Game.NUMBER_OF_UNITS = 2;
Game.FPS = 60;
Game.updateFPS = 10;
Game.SEED = 3;
Game.MOVE_SPEED = 10;
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
    that.interpolate();
    drawer.drawUnits(that.units);
    that.drawSelect();

    //debugging stuff...
    diffTime = newTime - oldTime;
    oldTime = newTime;
    newTime = new Date().getTime();
  }, 1000/Game.FPS);

  //loop that runs much less frequently (10 fps)
  //and handles physics/updating the game state/networking 
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


Game.prototype.interpolate = function () {
  for (var i = 0; i < this.units.length; i++ ) {
    if (this.units[i].target.length > 0) {
      var oldCoords = utilities.boxToCoords(this.units[i].prevLoc);
      var coords = utilities.boxToCoords(this.units[i].loc);
      this.units[i].x -= (1/(Game.FPS/Game.updateFPS))*(oldCoords.x - coords.x);
      this.units[i].y -= (1/(Game.FPS/Game.updateFPS))*(oldCoords.y - coords.y);
    }
  }
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
      that.selection = Object.create(new that.select(coords.x, coords.y, coords.x+1, coords.y+1));
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
          Math.round(utilities.random()*Game.boxesPerRow*Game.boxesPerCol),
          this.clients[0]
    )));
    this.units.push(
      Object.create(new Knight(
          this.createUnitId(),
          Math.round(utilities.random()*Game.boxesPerRow*Game.boxesPerCol), 
          this.clients[1]
    )));
  }
}


Game.prototype.update = function(){
  Game.grid = new Array(Game.boxesPerRow*Game.boxesPerCol);
  for (var i = 0; i < this.units.length; i++) {
    this.move(this.units[i]);
  }
}

Game.prototype.getSelection = function(){
  var that = this;
  if($(document).data('mousedown')) {
    //create the selection
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
  //if we are still in the process of moving...
  if (unit.target.length > 0) {
    var tarSquare = unit.target[0];
    unit.prevLoc = unit.loc;
    var curCoords = utilities.boxToCoords(unit.loc);
    //if the unit made it to its target, remove this from its move queue and set its positioning to this location
    if (tarSquare == unit.loc){
      unit.target.shift();
      unit.x = curCoords.x;
      unit.y = curCoords.y;
    }
    else { 
      var test = new Date().getTime();
      unit.loc = this.aStar(unit.loc, tarSquare);    
      console.log((new Date().getTime() - test) + " ms");
    }
  } 
  Game.grid[unit.loc] = true; //mark this loc as occupied ...if units take up more than 1 space we'll have to do more here
}


  Game.prototype.aStar = function(start, goal) {
    var closedSet = new Array();
    var openSet = new Array();
    openSet.push(start);
    var cameFrom = new Object();
    var gScore = new Object();
    var fScore = new Object();

    gScore[start] = 0;
    fScore[start] = gScore[start] + this.heuristic(start, goal);
    var cur;
    while (openSet.length > 0) {
      var cur = this.locWithlowestFScore(openSet, fScore);
      /*console.log(openSet);
      console.log(closedSet)
      console.log(fScore);
      console.log(cameFrom)
      alert("CUR: " + cur + " " + fScore[cur]);*/
      if (cur == goal) {
        return this.getPath(cameFrom, goal, start);
      }
      openSet.splice(openSet.indexOf(cur), 1);
      closedSet.push(cur);
      var neighbors = utilities.neighbors(cur);
      /*for (var i = neighbors.length; i >= 0; i--) { AVOID COLLISIONS
        if (Game.grid[neighbors[i]] != undefined) {
           neighbors.splice(i, 1);
        }
      }*/
      //console.log("NEIGHBORS of " +cur +": " + neighbors)
      //drawer.drawPathing(cur, "blue", fScore[cur]);
      for (var i = 0; i <neighbors.length; i++) {
        var t_gScore = gScore[cur] + 1;//utilities.distance(utilities.boxToCoords(cur), utilities.boxToCoords(neighbors[i]));
        var t_fScore = t_gScore + this.heuristic(neighbors[i], goal);
        //console.log("* " +neighbors[i] + " " + closedSet + " " + t_fScore + " " + fScore[neighbors[i]])
        if ((closedSet.indexOf(neighbors[i])!=-1) && (t_fScore >=fScore[neighbors[i]])) {
          continue;
        }
        if ((openSet.indexOf(neighbors[i])==-1) || t_fScore < fScore[neighbors[i]]) {
          cameFrom[neighbors[i]] = cur;

          gScore[neighbors[i]] = t_gScore;
          fScore[neighbors[i]] = t_fScore;
          if (openSet.indexOf(neighbors[i])==-1) {
            openSet.push(neighbors[i]);
            //drawer.drawPathing(neighbors[i], "red", fScore[neighbors[i]]);
          }
        }
        
      }
    }
    alert("ERROR!");
  }

  Game.prototype.locWithlowestFScore = function(array, obj) {
    var sortable = [];
    for (var key in obj) {
      sortable.push([key, obj[key]]);
    }
    sortable.sort(function(a, b) {return a[1] - b[1]});
    for (var i = 0; i < sortable.length; i++) {
      if (array.indexOf(parseInt(sortable[i][0])) != -1) {
        return parseInt(sortable[i][0]);
      }
    }
  }

  Game.prototype.getPath = function(cameFrom, cur, start) {
    if(cameFrom[cur] == start) {
      return cur;
    }
    if (cur in cameFrom) {
      return this.getPath(cameFrom, cameFrom[cur], start);
    }
    else {
      return cur;
    }
  }

  Game.prototype.heuristic = function(a, b) {
    var c = utilities.boxToCoords(a);
    var d = utilities.boxToCoords(b);
    var dx = Math.abs(c.x - d.x)/Game.boxSize;
    var dy = Math.abs(c.y - d.y)/Game.boxSize;
    return dx + dy;

    //return utilities.distance(utilities.boxToCoords(a), utilities.boxToCoords(b));
  }

