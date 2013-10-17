//class(ish) definitions...

var SIGHT_RANGE = 20;

function square(x, y) {
  this.x = x;
  this.y = y;
  this.w = UNIT_WIDTH;
  this.h = UNIT_HEIGHT;
  this.selected = false;
  this.color = "black";
  this.sight = SIGHT_RANGE;
}


square.prototype.move = function() {
  var square = this;
  if (square.target) {
    var tarSquare = {x:square.target.x, y:square.target.y, w:square.w, h:square.h};
    if (collides(square, tarSquare)){
	  square.target = null;
    } 
    else {
	  //make a list of the 8 points you could move to 
	  //check each for a collision, if it collides, remove it from canidate set
	  //for the remaining calculate the distance to the goal and choose the smallest
	  var moves = new Array();
	  moves.push(Object.create({x: square.x + Math.sqrt(2), y: square.y, w:square.w, h:square.h}));
	  moves.push(Object.create({x: square.x + 1, y: square.y + 1, w:square.w, h:square.h}));
	  moves.push(Object.create({x: square.x + 1, y: square.y - 1, w:square.w, h:square.h}));
	  moves.push(Object.create({x: square.x - Math.sqrt(2), y: square.y, w:square.w, h:square.h}));
	  moves.push(Object.create({x: square.x - 1, y: square.y + 1, w:square.w, h:square.h}));
	  moves.push(Object.create({x: square.x - 1, y: square.y - 1, w:square.w, h:square.h}));
	  moves.push(Object.create({x: square.x, y: square.y + Math.sqrt(2), w:square.w, h:square.h}));
	  moves.push(Object.create({x: square.x, y: square.y - Math.sqrt(2), w:square.w, h:square.h}));
	  var bad = new Array(); //array of bad moves
	  for (m in moves) {
	    tree.retrieve(moves[m], function(item) {
		  if(collides(moves[m], item) && item != square){
		    bad.push(m);
	  	  }
        });
	  }
	  var bestD;
	  var bestMove = square;
	  for (m in moves) {
	    if (bad.indexOf(m) == -1) {
		  d = Math.abs(tarSquare.x - moves[m].x)+Math.abs(tarSquare.y - moves[m].y);
		  if (bestD == null || d < bestD) {
		    bestD = d;
		    bestMove = moves[m];
		  }      
	    }
	  }
	  square.x = clampX(bestMove.x, UNIT_WIDTH);
	  square.y = clampY(bestMove.y, UNIT_HEIGHT);
    }
  } 
}
