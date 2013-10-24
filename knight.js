//class(ish) definition...

var SIGHT_RANGE = 20;

var knightImg = new Image();
var imageLoaded = false;
knightImg.onload = function() {
  imageLoaded = true;
};
knightImg.src = 'knight.png';


function Knight(x, y) {
  this.x = x;
  this.y = y;
  this.w = Knight.WIDTH;
  this.h = Knight.HEIGHT;
  this.selected = false;
  this.color = "black";
  this.sight = Knight.SIGHT_RANGE;
}
Knight.SIGHT_RANGE = 50;
Knight.WIDTH = 32;
Knight.HEIGHT = 32;

 //draw the knight
Knight.prototype.draw =  function(context) {
  if(imageLoaded) {
    context.drawImage(knightImg, 32*2,0,32,32, this.x, this.y,this.w,this.h);
  }
  if (this.selected) {
  	context.beginPath();
  	context.strokeStyle = "#39FF14";
    context.arc(this.x + this.w/2, this.y + this.h/2, Math.max(this.w, this.h)*.75, 0,2*Math.PI);
    context.stroke();
  }
}

Knight.prototype.move = function() {
  if (this.target) {
    var tarSquare = {x:this.target.x, y:this.target.y, w:this.w, h:this.h};
    if (Game.collides(this, tarSquare)){
	  this.target = null;
    } 
    else {
	  //make a list of the 8 points you could move to 
	  //check each for a collision, if it collides, remove it from canidate set
	  //for the remaining calculate the distance to the goal and choose the smallest
	  var moves = new Array();
	  moves.push(Object.create({x: this.x + Math.sqrt(2), y: this.y, w:this.w, h:this.h}));
	  moves.push(Object.create({x: this.x + 1, y: this.y + 1, w:this.w, h:this.h}));
	  moves.push(Object.create({x: this.x + 1, y: this.y - 1, w:this.w, h:this.h}));
	  moves.push(Object.create({x: this.x - Math.sqrt(2), y: this.y, w:this.w, h:this.h}));
	  moves.push(Object.create({x: this.x - 1, y: this.y + 1, w:this.w, h:this.h}));
	  moves.push(Object.create({x: this.x - 1, y: this.y - 1, w:this.w, h:this.h}));
	  moves.push(Object.create({x: this.x, y: this.y + Math.sqrt(2), w:this.w, h:this.h}));
	  moves.push(Object.create({x: this.x, y: this.y - Math.sqrt(2), w:this.w, h:this.h}));
	  var bad = new Array(); //array of bad moves
	  for (m in moves) {
	  	//use the var cur to refer back to this inside the anon func
	  	var cur = this;
	    myGame.tree.retrieve(moves[m], function(item) {
		  if(Game.collides(moves[m], item) && item != cur){
		    bad.push(m);
	  	  }
        });
	  }
	  var bestD;
	  var bestMove = this;
	  for (m in moves) {
	    if (bad.indexOf(m) == -1) {
		  d = Math.abs(tarSquare.x - moves[m].x)+Math.abs(tarSquare.y - moves[m].y);
		  if (bestD == null || d < bestD) {
		    bestD = d;
		    bestMove = moves[m];
		  }      
	    }
	  }
	  this.x = myGame.clampX(bestMove.x, this.w);
	  this.y = myGame.clampY(bestMove.y, this.h);
    }
  } 
}
