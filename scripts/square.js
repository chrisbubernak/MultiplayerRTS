//class(ish) definition...
var SIGHT_RANGE = 20;

var knightImg = new Image();
var imageLoaded = false;
knightImg.onload = function () {
    imageLoaded = true;
};
knightImg.src = 'knight.png';

function knight(x, y) {
    this.x = x;
    this.y = y;
    this.w = UNIT_WIDTH;
    this.h = UNIT_HEIGHT;
    this.selected = false;
    this.color = "black";
    this.sight = SIGHT_RANGE;
}

//draw the knight
knight.prototype.draw = function (context) {
    if (imageLoaded) {
        var sx = 150;
        var sy = 0;
        var swidth = 30;
        var sheight = 30;
        var width = 30;
        var height = 30;
        context.drawImage(knightImg, 32 * 2, 0, 32, 32, this.x, this.y, 32, 32);
    }
    if (this.selected) {
        context.beginPath();
        context.strokeStyle = "#39FF14";
        context.arc(this.x + this.w, this.y + this.h, Math.max(this.w, this.h) * 1.25, 0, 2 * Math.PI);
        context.stroke();
    }
};

knight.prototype.move = function () {
    if (this.target) {
        var tarSquare = { x: this.target.x, y: this.target.y, w: this.w, h: this.h };
        if (collides(this, tarSquare)) {
            this.target = null;
        } else {
            //make a list of the 8 points you could move to
            //check each for a collision, if it collides, remove it from canidate set
            //for the remaining calculate the distance to the goal and choose the smallest
            var moves = new Array();
            moves.push(Object.create({ x: this.x + Math.sqrt(2), y: this.y, w: this.w, h: this.h }));
            moves.push(Object.create({ x: this.x + 1, y: this.y + 1, w: this.w, h: this.h }));
            moves.push(Object.create({ x: this.x + 1, y: this.y - 1, w: this.w, h: this.h }));
            moves.push(Object.create({ x: this.x - Math.sqrt(2), y: this.y, w: this.w, h: this.h }));
            moves.push(Object.create({ x: this.x - 1, y: this.y + 1, w: this.w, h: this.h }));
            moves.push(Object.create({ x: this.x - 1, y: this.y - 1, w: this.w, h: this.h }));
            moves.push(Object.create({ x: this.x, y: this.y + Math.sqrt(2), w: this.w, h: this.h }));
            moves.push(Object.create({ x: this.x, y: this.y - Math.sqrt(2), w: this.w, h: this.h }));
            var bad = new Array();
            for (m in moves) {
                //use the var cur to refer back to this inside the anon func
                var cur = this;
                tree.retrieve(moves[m], function (item) {
                    if (collides(moves[m], item) && item != cur) {
                        bad.push(m);
                    }
                });
            }
            var bestD;
            var bestMove = this;
            for (m in moves) {
                if (bad.indexOf(m) == -1) {
                    d = Math.abs(tarSquare.x - moves[m].x) + Math.abs(tarSquare.y - moves[m].y);
                    if (bestD == null || d < bestD) {
                        bestD = d;
                        bestMove = moves[m];
                    }
                }
            }
            this.x = clampX(bestMove.x, UNIT_WIDTH);
            this.y = clampY(bestMove.y, UNIT_HEIGHT);
        }
    }
};
