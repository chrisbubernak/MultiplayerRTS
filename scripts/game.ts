var Game = function(socket, id, clients, gameId) {

 //document.getElementById("gameId").innerHTML = "Game: " + gameId;
 //document.getElementById("clientId").innerHTML = "Client: " + id;

 this.gameId = gameId;
 this.clients = clients; //an array of all players ids in the game
 this.id = id; //this players id
 this.socket = socket;
 var that = this;
 this.socket.on('SendActionsToClient', function (data) {
  for (var a in data.actions){
    var unit = utilities.findUnit(data.actions[a].unit, that.units);
    var targetLoc = utilities.coordsToBox(data.actions[a].target.x, data.actions[a].target.y);
    var path = that.aStar(unit.loc, targetLoc, unit);   
    if (data.actions[a].shift) {
      for (var p in path) {
        unit.target.push(path[p]);
      }
    }
    else {
      unit.target = [];
      for (var p in path) {
        unit.target.push(path[p]);
      }
    }
  }
  that.simTick++;
});


//"private" variables
this.units = new Array(); //array of units
this.tree; //the quad tree

//stores the coordinates of the players selection
this.selection = new Object();

this.actions = new Array();
this.simTick = 0;
this.unitId = 0;


//static constants
Game.CANVAS_WIDTH = 1280;//960;//900//960;
Game.CANVAS_HEIGHT = 720; //640//540//640;
Game.boxesPerRow = 80;//30//60;
Game.ratio = Game.CANVAS_WIDTH/Game.CANVAS_HEIGHT;
Game.boxesPerCol = Game.boxesPerRow/Game.ratio;
Game.boxSize = Game.CANVAS_WIDTH/Game.boxesPerRow;

Game.grid = new Array(Game.boxesPerRow*Game.boxesPerCol);

Game.NUMBER_OF_UNITS = 2;
Game.FPS = 60;
Game.updateFPS = 10;
Game.SEED = 3;
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
    if (this.units[i].prevLoc != this.units[i].loc) {
      var oldCoords = utilities.boxToCoords(this.units[i].prevLoc);
      var coords = utilities.boxToCoords(this.units[i].loc);
      this.units[i].x -= (1/(Game.FPS/Game.updateFPS))*(oldCoords.x - coords.x);
      this.units[i].y -= (1/(Game.FPS/Game.updateFPS))*(oldCoords.y - coords.y);
    }
    else {
      var coords = utilities.boxToCoords(this.units[i].loc);
      this.units[i].x = coords.x;
      this.units[i].y = coords.y;
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
  
  Game.grid = new Array(Game.boxesPerRow*Game.boxesPerCol);
  for (var g in Game.grid) {
    Game.grid[g] = null;
  }

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
  //iterate backwards b/c we could be removing units from the unit list 
  //inside the combat function which would break this loop
  for (var i = this.units.length - 1; i >= 0; i--) {
    this.move(this.units[i]);
    this.combat(this.units[i]);
  }
}




Game.prototype.combat = function(unit) {
  //need to check attacktimer & make sure the unit is not in the process of moving
  if (unit.attackTimer > 0 || unit.target.length > 0) {
    unit.attackTimer--;
    return;
  }
  for (var l in locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h)) {
    for (var n in neighbors = utilities.neighbors(locs[l])) {
      var id = Game.grid[neighbors[n]];
      var enemy = utilities.findUnit(id, this.units);
      if ( enemy != null && enemy.player != unit.player) {
        this.attack(unit, enemy);
        unit.attackTimer = unit.attackSpeed;
        return;
      }
    }
  }
}

Game.prototype.attack = function(attacker, defender) {
  var attackRange = attacker.attackMax - attacker.attackMin;
  var damage = utilities.random()*attackRange + attacker.attackMin;
  defender.health -= damage;
  for (var l in locs = utilities.getOccupiedSquares(attacker.loc, attacker.w, attacker.h)) {
    drawer.drawSquare(locs[l], "red");
  }
  if (defender.health <=0) {
    this.removeUnit(defender);
  }
}

//THE WRONG UNIT IS BEING KILLED RIGHT NOW
Game.prototype.removeUnit = function(unit) {
  var id = unit.id;
  for (var i = 0; i < (length = this.units.length); i++){
    if (this.units[i].id == id) {
        this.units.shift(i, 1);
        //mark the old locs occupied by this unit as false
        for (var l in locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h)) {
          Game.grid[locs[l]] = null; 
        }
        return;
    }
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
    unit.prevLoc = unit.loc;

    //mark the old locs occupied by this unit as false
    for (var l in locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h)) {
      Game.grid[locs[l]] = null; 
    }
    
    //if something now stands in the units path re-path around it
    for (var l in locs = utilities.getOccupiedSquares(unit.target[0], unit.w, unit.h)) {
      if (Game.grid[locs[l]]!=unit.id && Game.grid[locs[l]] != null) {
        unit.target = this.aStar(unit.loc, unit.target[unit.target.length-1], unit);
        break;
      }
    }

    unit.loc = unit.target[0]; 
    var curCoords = utilities.boxToCoords(unit.loc);

    unit.target.shift();
    //every time the unit moves a location reset its attack timer
    unit.attackTimer = unit.attackSpeed;
  }
  else if (unit.target.length === 0) {
    unit.prevLoc = unit.loc;

  }
  //mark the locs occupied by this unit as true
  for (var l in locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h)) {
    Game.grid[locs[l]] = unit.id; 
  }
}


  Game.prototype.aStar = function(start, goal, unit) {
    //this probably needs to be changed but for now if they want to move somewhere that is blocked or off the screen just stop moving
    var coords = utilities.boxToCoords(goal);
    if ((coords.x + unit.w) > Game.CANVAS_WIDTH || (coords.y + unit.h) > Game.CANVAS_HEIGHT) {
      return [start];
    }    
    //make sure that we could occupy the goal state without colliding with anything
    for (var l in locs = utilities.getOccupiedSquares(goal, unit.w, unit.h)) {
      if (Game.grid[locs[l]] != unit.id && Game.grid[locs[l]] != null) {
        return [start];
      }
    }

    var closedSet = new Array();
    var openSet = new PriorityQueue();
    var cameFrom = new Object();
    var gScore = new Object();
    var fScore = new Object();

    gScore[start] = 0;
    fScore[start] = gScore[start] + this.heuristic(start, goal);
    openSet.enqueue(start, fScore[start]);
    var cur;
    while (!openSet.isEmpty()) {
      var cur = openSet.dequeue();
      if (cur == goal) {
        return this.getPath(cameFrom, goal, start);
      }
      closedSet.push(cur);
      var neighbors = utilities.neighbors(cur);

      //check all of the neighbor moves for collisions
      for (var i = neighbors.length; i >= 0; i--) { 
        //first make sure this move won't leave part of the unit hanging off the screen...
        var coords = utilities.boxToCoords(neighbors[i]);
        if((coords.x + unit.w) > Game.CANVAS_WIDTH || (coords.y + unit.h) > Game.CANVAS_HEIGHT ) {
          //drawer.drawPathing(neighbors[i], "blue", 0);
          neighbors.splice(i, 1);
          continue;
        }

        //for each move make sure this unit could move there without colliding with any thing
        for (var l in locs = utilities.getOccupiedSquares(neighbors[i], unit.w, unit.h)) {
          if (Game.grid[locs[l]] != unit.id && Game.grid[locs[l]] != null) {
             //drawer.drawPathing(neighbors[i], "blue", 0);
             neighbors.splice(i, 1);
             break;
          }
        }
      }

      for (var i = 0; i <neighbors.length; i++) {
        var t_gScore = gScore[cur] + utilities.distance(utilities.boxToCoords(cur), utilities.boxToCoords(neighbors[i]))/Game.boxSize;
        var t_fScore = t_gScore + this.heuristic(neighbors[i], goal);
        if ((closedSet.indexOf(neighbors[i])!=-1) && (t_fScore >=fScore[neighbors[i]])) {
          continue;
        }
        if ((openSet.indexOf(neighbors[i])==-1) || t_fScore < fScore[neighbors[i]]) {
          cameFrom[neighbors[i]] = cur;

          gScore[neighbors[i]] = t_gScore;
          fScore[neighbors[i]] = t_fScore;
          if (openSet.indexOf(neighbors[i])==-1) {
            openSet.enqueue(neighbors[i], fScore[neighbors[i]]);
            //drawer.drawPathing(neighbors[i], "red", fScore[neighbors[i]]);
          }
          //if the neighbor was already in the openset we need to update it in the priority queue
          else {
            openSet.update(neighbors[i], fScore[neighbors[i]]);
          }
        }
        
      }
    }
    alert("ERROR!");
  }

  //this should return the path as an array going from first move to last
  Game.prototype.getPath = function(cameFrom, cur, start) {
    var returnArray = new Array();
    while (cur != start) {
      returnArray.splice(0, 0, cur);
      cur = cameFrom[cur];
      //drawer.drawPathing(cur, "green", 0);
    }
    return returnArray;
  }

  Game.prototype.heuristic = function(a, b) {
    var c = utilities.boxToCoords(a);
    var d = utilities.boxToCoords(b);
    var dx = Math.abs(c.x - d.x)/Game.boxSize;
    var dy = Math.abs(c.y - d.y)/Game.boxSize;
    return dx + dy;
  }

