//global constants
var MIN_X = 0;
var MAX_X = 500;
var NUMBER_OF_UNITS = 25;
var UNIT_WIDTH = 10;
	  
//globals
var squares = new Array();



      var checks = 0;

      var tree;
      var sX;
      var sY;
      var eX;
      var eY;    
      var ctx;

      $(document).ready(function() {
	          var c = document.getElementById("myCanvas");

      
        ctx = c.getContext("2d");
	    c.height = MAX_X;
        c.width = MAX_X;
        document.oncontextmenu = function() {return false;};
        $(document).mousedown(function(e) {
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


      function square(x, y) {
        this.x = x;
        this.y = y;
        this.w = UNIT_WIDTH;
        this.h = UNIT_HEIGHT;
        this.selected = false;
        this.color = "black";
      }

      function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
      }

      function run(){
        setup();
        var FPS = 30;
        setInterval(function() {
          tree.insert(squares);
          update();
          checkCollisions();
          tree.clear();
          draw();
          drawSelect();
	}, 100/FPS);
      }

      function drawSelect() {
        if($(document).data('mousedown')) {
          ctx.globalAlpha=0.2;
          ctx.fillStyle = "black";
          ctx.fillRect(sX, sY, eX-sX, eY-sY);
          ctx.globalAlpha = 1;
        }
      }

      function update(){
        for (var i = 0; i < squares.length; i++) {
          squares[i].move();
        }
      }

      function draw(){

        ctx.clearRect(0,0,700,700);


        for (var i = 0; i < squares.length; i++) {
          ctx.fillStyle = squares[i].color;
          if (squares[i].selected){
            squares[i].color = "purple";
          }
          else {
            squares[i].color = "black";
          }
          ctx.fillRect(squares[i].x, squares[i].y,squares[i].w,squares[i].h);
	}
        ctx.font = "bold 20px Arial";
        ctx.fillText("checks: " + checks, 20, 20);
        checks = 0;
      }

      function setup(){
        // init the quadtree
        var  args = {x : 0, y : 0, h : 700, w : 700, maxChildren : 5, maxDepth : 5};
        tree = QUAD.init(args);

        for (var i = 0; i<NUMBER_OF_UNITS; i++){
          squares.push(Object.create(new square(Math.random()*700, Math.random()*700)));
        }
      }

      function checkCollisions(){

        //tree.insert(squares); 
        if($(document).data('mousedown')) {
          tree.insert(Object.create(new select(sX, sY, eX, eY)));
        }
        for (var i = 0; i<squares.length; i++) {
          var region = tree.retrieve(squares[i], function(item) {
              checks++;
            if(collides(squares[i], item) && squares[i] != item){
              if (item.select) {
                squares[i].selected = true;
              }
              /*else {
                squares[i].color = "red";
                item.color = "red";
              }*/
            }
	  });
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

      function square(x, y) {
        this.x = x;
        this.y = y;
        this.w = 10;
        this.h = 10;
        this.selected = false;
        this.color = "black";
      }

      square.prototype.move = function() {
        var square = this;
        if (square.target) {
          var tarSquare = {x:square.target.x, y:square.target.y, w:square.w, h:square.h};
          if (collides(square, tarSquare)){
            square.target = null;
          } 
          else {
            if ((square.target.x - square.x) == 0) {
              alert("about to divide by 0....");
            }
            var slope = 1;
            if (square.x > square.target.x) {
              slope = -1;
            }
            //make a list of the 4 points you could move to (up, down, left, right)
            //check each for a collision, if it collides, remove it from canidate set
            //for the remaining calculate the distance to the goal and choose the smallest
            var moves = new Array();
            moves.push(Object.create({x: square.x + Math.sqrt(2), y: square.y, w:10, h:10}));
            moves.push(Object.create({x: square.x + 1, y: square.y + 1, w:10, h:10}));
            moves.push(Object.create({x: square.x + 1, y: square.y - 1, w:10, h:10}));
            moves.push(Object.create({x: square.x - Math.sqrt(2), y: square.y, w:10, h:10}));
            moves.push(Object.create({x: square.x - 1, y: square.y + 1, w:10, h:10}));
            moves.push(Object.create({x: square.x - 1, y: square.y - 1, w:10, h:10}));
            moves.push(Object.create({x: square.x, y: square.y + Math.sqrt(2), w:10, h:10}));
            moves.push(Object.create({x: square.x, y: square.y - Math.sqrt(2), w:10, h:10}));
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
              else {
              }
            }
            square.x = clamp(bestMove.x);
            square.y = clamp(bestMove.y);
            //var oldX = square.x;
            //var oldY = square.y;
            //square.x = clamp(square.x + slope*Math.cos((square.target.y - square.y)/((square.target.x - square.x)||.001)));
            //square.y = clamp(square.y + slope*Math.sin((square.target.y - square.y)/((square.target.x - square.x)||.001))); 
          }
        } 
      }
      

 






 
    function clamp(val){
      return Math.max(MIN_X - UNIT_WIDTH, Math.min(MAX_X - UNIT_WIDTH, val))
    }
