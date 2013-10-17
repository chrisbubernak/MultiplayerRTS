//global constants
var CANVAS_HEIGHT = 700;
var CANVAS_WIDTH = 1000;
var NUMBER_OF_UNITS = 25;
var UNIT_WIDTH = 10;
var UNIT_HEIGHT = 10;
var FOG = "rgba( 0, 0, 0, .7)";

//globals
var squares = new Array();
var tree;
var sX;
var sY;
var eX;
var eY;    
var ctx; //canvas context (this contains units)
var ftx; //fog contex
var btx; //background contex (contains the background image)

$(document).ready(function() {
  var b = document.getElementById("background");
  btx = b.getContext("2d");
  b.height = CANVAS_HEIGHT;
  b.width = CANVAS_WIDTH;
  var imageObj = new Image();
  imageObj.onload = function() {
        btx.drawImage(imageObj, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };
  imageObj.src = 'grass.jpg';
  var c = document.getElementById("myCanvas");    
  ctx = c.getContext("2d");
  var f = document.getElementById("fog");
  ftx = f.getContext("2d");
  f.height = CANVAS_HEIGHT;
  f.width = CANVAS_WIDTH;
  c.height = CANVAS_HEIGHT;
  c.width = CANVAS_WIDTH;

  //disable the right click so we can use it for other purposes
  document.oncontextmenu = function() {return false;};
  
  $(document).mousedown(function(e) {
    //on left click...
    if (e.button == 0) {
      $(this).data('mousedown', true);
      var coords = getMousePos(document.getElementById("myCanvas"), e);
      sX = coords.x;
      sY = coords.y;
      eX = coords.x;
      eY = coords.y;
      for (var s in squares) {
        squares[s].selected = false;
      }
    }
	//if right click...
    else if (e.button == 2){
      for (var s in squares) {
        if (squares[s].selected){
          squares[s].target = getMousePos(document.getElementById("myCanvas"), e);
        }
      }
    }
  });
  
  $(document).mouseup(function(e) {
    $(this).data('mousedown', false);
  });

  $(document).mousemove(function(e) {
    if($(this).data('mousedown')) {
      var coords = getMousePos(document.getElementById("myCanvas"), e);
	  eX = coords.x;
	  eY = coords.y;
    }
  });
        
  run();
});


//run the game
function run(){
  setup();
  //this is the goal...
  var FPS = 60;
  var startTime;
  var endTime;
  setInterval(function() {
	tree.insert(squares);
    update();
    getSelection();
    tree.clear();
    draw();
    drawSelect();
  }, 100/FPS);
}


function setup(){
  // initialize the quadtree
  var  args = {x : 0, y : 0, h : CANVAS_HEIGHT, w : CANVAS_WIDTH, maxChildren : 5, maxDepth : 5};
  tree = QUAD.init(args);
  for (var i = 0; i<NUMBER_OF_UNITS; i++){
    squares.push(Object.create(new square(clampX(Math.random()*CANVAS_WIDTH, UNIT_WIDTH), clampY(Math.random()*CANVAS_HEIGHT, UNIT_HEIGHT))));
  }
}


function update(){
  for (var i = 0; i < squares.length; i++) {
    squares[i].move();
  }
}

function getSelection(){
  if($(document).data('mousedown')) {
    //create the selection
	var selectBox = Object.create(new select(sX, sY, eX, eY));
	var region = tree.retrieve(selectBox, function(item) {
      if(collides(selectBox, item) && item != selectBox) {
	    item.selected = true;
      }
    });
  }
}

function draw(){
  ftx.globalCompositeOperation = 'source-over';
  ftx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
  ftx.fillStyle = FOG;
  ftx.fillRect(0, 0,  CANVAS_WIDTH, CANVAS_HEIGHT);
	
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for (var i = 0; i < squares.length; i++) {
    ctx.fillStyle = squares[i].color;
    if (squares[i].selected){
      squares[i].color = "purple";
    }
    else {
	  squares[i].color = "black";
	}
     
	//this stuff does the "sight" circles in the fog
	var r1 = 30;
    var r2 = 50;
	var density = .4;
    var radGrd = ftx.createRadialGradient( squares[i].x, squares[i].y, r1, squares[i].x, squares[i].y, r2 );
    radGrd.addColorStop(       0, 'rgba( 0, 0, 0,  1 )' );
    radGrd.addColorStop( density, 'rgba( 0, 0, 0, .1 )' );
    radGrd.addColorStop(       1, 'rgba( 0, 0, 0,  0 )' );
    ftx.globalCompositeOperation = "destination-out";
    ftx.fillStyle = radGrd;
    ftx.fillRect( squares[i].x - r2, squares[i].y - r2, r2*2, r2*2 );
	
	//draw the square
	ctx.fillRect(squares[i].x, squares[i].y, squares[i].w, squares[i].h);
  }     
}

function drawSelect() {
  if($(document).data('mousedown')) {
    ctx.globalAlpha = 0.3;
	ctx.fillStyle = "#39FF14";
    ctx.fillRect(sX, sY, eX - sX, eY - sY);
    ctx.globalAlpha = 1;
  }
}

function collides(i, j) {
  return i.x < j.x + j.w && i.x + i.w > j.x && i.y < j.y + j.h && i.y + i.h > j.y;
} 

function select(sX, sY, eX, eY) {
  this.x = Math.min(sX, eX);
  this.y = Math.min(sY, eY);
  this.w = Math.abs(sX - eX);
  this.h = Math.abs(sY - eY);
  this.select = true;
}
	  
//utility functions      
function clampX(x, width){
  return Math.max(0 - width, Math.min(CANVAS_WIDTH - width, x))
}

function clampY(y, height){
  return Math.max(0 - height, Math.min(CANVAS_HEIGHT - height, y))
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

