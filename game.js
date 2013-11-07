var Game = function(socket, id, clients) {
 this.clients = clients; //an array of all players ids in the game
 this.id = id; //this players id
 this.socket = socket;
 var that = this;
 this.socket.on('SendActionsToClient', function (data) {
  for (var a in data.actions){
    //var unit = $.grep(that.units, function(e){console.log(e.id + " " + data.actions[a].unit); return e.id == data.actions[a].unit; });   
    //unit.target = data.actions[a].target;
    //that.units[0].target = data.actions[a].target;
    that.units[that.findUnit(data.actions[a].unit)].target = data.actions[a].target;
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
Game.CANVAS_HEIGHT = 500;
Game.CANVAS_WIDTH = 700;
Game.NUMBER_OF_UNITS = 2;
Game.FOG = "rgba( 0, 0, 0, .7)";
Game.VERTICAL_LINES = 10;
Game.HORIZONTAL_LINES = 10;
Game.FPS = 60;
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
    that.socket.emit('SendActionsToServer', {actions: that.actions, simTick: that.simTick});
    that.actions = new Array();
    fpsOut.innerHTML = Math.round(1000/diffTime)  + " fps";
    that.interpolationCounter = 0;
    if (that.simTick%100 == 0){
      console.log("Sim: " + that.simTick)
      for (var i = 0; i < that.units.length; i++){
        console.log("x= " + that.units[i].x + " y= " + that.units[i].y);
      }
    }
  }, 1000/(Game.FPS/6));

    //every 10 seconds check the world for desync errors
    // (at the moment this means just comparing unit arrays)
    setInterval(function() {
      that.socket.emit('SendGameStateToServer', {units: that.units, simTick: that.simTick});
  }, 10000);

}





Game.prototype.setup = function(){ 
  var b = document.getElementById("background");
  this.btx = b.getContext("2d");
  b.height = Game.CANVAS_HEIGHT;
  b.width = Game.CANVAS_WIDTH;
  var imageObj = new Image();

  var btx = this.btx;
  imageObj.onload = function() {
        btx.drawImage(imageObj, 0, 0, 
          Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);
  };
  imageObj.src = 'grass.jpg';
  

  
  var c = document.getElementById("myCanvas");    
  this.ctx = c.getContext("2d");
  var f = document.getElementById("fog");
  this.ftx = f.getContext("2d");
  f.height = Game.CANVAS_HEIGHT;
  f.width = Game.CANVAS_WIDTH;
  c.height = Game.CANVAS_HEIGHT;
  c.width = Game.CANVAS_WIDTH;

  //disable the right click so we can use it for other purposes
  document.oncontextmenu = function() {return false;};
  
  var that = this;
  $(document).mousedown(function(e) {
    //on left click...
    if (e.button == 0) {
      $(this).data('mousedown', true);
      var coords = that.getMousePos(document.getElementById("myCanvas"), e);
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
          var tar = that.getMousePos(document.getElementById("myCanvas"), e);
          that.actions.push({unit: that.units[u].id, target: tar});
        }
      }
    }
  });
  
  $(document).mouseup(function(e) {
    $(this).data('mousedown', false);
  });

  $(document).mousemove(function(e) {
    if($(this).data('mousedown')) {
      var coords = that.getMousePos(document.getElementById("myCanvas"), e);
      that.eX = coords.x;
      that.eY = coords.y;
    }
  });


  // initialize the quadtree
  var  args = {x : 0, y : 0, h : Game.CANVAS_HEIGHT, w : Game.CANVAS_WIDTH, maxChildren : 5, maxDepth : 5};
  this.tree = QUAD.init(args);
  console.log(this.clients);
  for (var i = 0; i<Game.NUMBER_OF_UNITS; i++){
    this.units.push(
      Object.create(new Knight(
          this.createUnitId(),
          this.clampX(
            Game.random()*Game.CANVAS_WIDTH, Knight.WIDTH), 
          this.clampY(
            Game.random()*Game.CANVAS_HEIGHT, Knight.HEIGHT), 
          this.clients[0])));
    this.units.push(
      Object.create(new Knight(
          this.createUnitId(),
          this.clampX(
            Game.random()*Game.CANVAS_WIDTH, Knight.WIDTH), 
          this.clampY(
            Game.random()*Game.CANVAS_HEIGHT, Knight.HEIGHT), 
          this.clients[1])));
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
      if((item.player == that.id) && that.collides(selectBox, item) && item != selectBox) {
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
  	  //this stuff does the "sight" circles in the fog
  	  var r1 = this.units[i].sight;
      var r2 = 90;
  	  var density = .4;
      var radGrd = this.ftx.createRadialGradient( 
        this.units[i].x + this.units[i].w/2, 
        this.units[i].y + this.units[i].h/2, r1, 
        this.units[i].x + this.units[i].w/2 , 
        this.units[i].y + this.units[i].h/2, r2 );
      radGrd.addColorStop(       0, 'rgba( 0, 0, 0,  1 )' );
      radGrd.addColorStop( density, 'rgba( 0, 0, 0, .1 )' );
      radGrd.addColorStop(       1, 'rgba( 0, 0, 0,  0 )' );
      this.ftx.globalCompositeOperation = "destination-out";
      this.ftx.fillStyle = radGrd;
  	  this.ftx.fillRect( this.units[i].x - r2, this.units[i].y - r2, r2*2, r2*2 );
    }
    this.drawUnit(this.units[i]);

  }   

 
}

Game.prototype.drawGrid = function() {
  ctx.strokeStyle = "#39FF14";
  for (var i = 0; i < Game.VERTICAL_LINES; i++) {
    ctx.moveTo(i*Game.CANVAS_WIDTH/Game.VERTICAL_LINES, 0);
    ctx.lineTo(i*Game.CANVAS_WIDTH/Game.VERTICAL_LINES, Game.CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (var i = 0; i < Game.HORIZONTAL_LINES; i++) {
    ctx.moveTo(0, i*Game.CANVAS_WIDTH/Game.HORIZONTAL_LINES);
    ctx.lineTo(Game.CANVAS_HEIGHT, i*Game.CANVAS_WIDTH/Game.HORIZONTAL_LINES);
    ctx.stroke();
  }
}

Game.prototype.drawSelect = function() {
  var that = this;
  if($(document).data('mousedown')) {
    that.ctx.globalAlpha = 0.3;
	  that.ctx.fillStyle = "#39FF14";
    that.ctx.fillRect(that.sX, that.sY, that.eX - that.sX, that.eY - that.sY);
    that.ctx.globalAlpha = 1;
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
  return i.x < j.x + j.w && i.x + i.w > j.x && i.y < j.y + j.h && i.y + i.h > j.y;
} 

 //draw a unit
Game.prototype.drawUnit =  function(unit) {
  if(unit.imageReady()) {
    this.ctx.drawImage(unit.getImage(), unit.imageX,unit.imageY,unit.imageW,unit.imageH, unit.x, unit.y,unit.w,unit.h);
  }
  if (unit.selected) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "#39FF14";
    this.ctx.arc(unit.x + unit.w/2, unit.y + unit.h/2, Math.max(unit.w, unit.h)*.75, 0,2*Math.PI);
    this.ctx.stroke();
  }
}

//move a unit
Game.prototype.move = function(unit) {
  if (unit.target) {
    var tarSquare = {x:unit.target.x, y:unit.target.y, w:unit.w, h:unit.h};
    if (this.collides(unit, tarSquare)){
      unit.target = null;
    } 
    else {
    //make a list of the 8 points you could move to 
    //check each for a collision, if it collides, remove it from canidate set
    //for the remaining calculate the distance to the goal and choose the smallest
    var moves = new Array();
    moves.push(Object.create({x: unit.x + Math.sqrt(Game.MOVE_SPEED*2), y: unit.y, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x + Game.MOVE_SPEED, y: unit.y + Game.MOVE_SPEED, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x + Game.MOVE_SPEED, y: unit.y - Game.MOVE_SPEED, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x - Math.sqrt(Game.MOVE_SPEED*2), y: unit.y, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x - Game.MOVE_SPEED, y: unit.y + Game.MOVE_SPEED, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x - Game.MOVE_SPEED, y: unit.y - Game.MOVE_SPEED, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x, y: unit.y + Math.sqrt(Game.MOVE_SPEED*2), w:this.w, h:unit.h}));
    moves.push(Object.create({x: unit.x, y: unit.y - Math.sqrt(Game.MOVE_SPEED*2), w:unit.w, h:unit.h}));
    var bad = new Array(); //array of bad moves
    for (m in moves) {
      //use the var cur to refer back to this inside the anon func
      var cur = unit;
      var that = this;
      myGame.tree.retrieve(moves[m], function(item) {
      if(that.collides(moves[m], item) && item != cur){
        bad.push(m);
        }
        });
    }
    var bestD;
    var bestMove = unit;
    for (m in moves) {
      if (bad.indexOf(m) == -1) {
      d = Math.abs(tarSquare.x - moves[m].x)+Math.abs(tarSquare.y - moves[m].y);
      if (bestD == null || d < bestD) {
        bestD = d;
        bestMove = moves[m];
      }      
      }
    }
    unit.x = this.clampX(bestMove.x, unit.w);
    unit.y = this.clampY(bestMove.y, unit.h);
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