var Game = function(isClient) {

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
}

//static constants
Game.CANVAS_HEIGHT = 700;
Game.CANVAS_WIDTH = 1000;
Game.NUMBER_OF_UNITS = 25;
Game.FOG = "rgba( 0, 0, 0, .7)";
Game.VERTICAL_LINES = 10;
Game.HORIZONTAL_LINES = 10;
Game.FPS = 60;

//run the game
Game.prototype.run = function(){
  this.setup();

  //timing stuff
  var oldTime = new Date().getTime();
  var diffTime = 0;
  var newTime = 0;

  //use g as a reference to this inside the anonymous function
  var g = this;

  setInterval(function() {
  g.tree.insert(g.units);
    g.update();
    g.getSelection();
    g.tree.clear();
    g.draw();
    g.drawSelect();
    diffTime = newTime - oldTime;
    oldTime = newTime;
    newTime = new Date().getTime();
  }, 1000/Game.FPS);

  //calculate FPS for debugging purposes
  var fpsOut = document.getElementById("fps");
  setInterval(function() {
      fpsOut.innerHTML = Math.round(1000/diffTime)  + " fps";
  }, 1000);
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
          that.units[u].target = that.getMousePos(document.getElementById("myCanvas"), e);
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
  for (var i = 0; i<Game.NUMBER_OF_UNITS; i++){
    this.units.push(
      Object.create(new Knight(
          this.clampX(
            Math.random()*Game.CANVAS_WIDTH, Knight.WIDTH), 
          this.clampY(
            Math.random()*Game.CANVAS_HEIGHT, Knight.HEIGHT))));
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
      if(that.collides(selectBox, item) && item != selectBox) {
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
    moves.push(Object.create({x: unit.x + Math.sqrt(2), y: unit.y, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x + 1, y: unit.y + 1, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x + 1, y: unit.y - 1, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x - Math.sqrt(2), y: unit.y, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x - 1, y: unit.y + 1, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x - 1, y: unit.y - 1, w:unit.w, h:unit.h}));
    moves.push(Object.create({x: unit.x, y: unit.y + Math.sqrt(2), w:this.w, h:unit.h}));
    moves.push(Object.create({x: unit.x, y: unit.y - Math.sqrt(2), w:unit.w, h:unit.h}));
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