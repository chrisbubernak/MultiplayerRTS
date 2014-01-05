//class(ish) definition...

function Knight(id, loc, player) {
  this.id = id;
  this.loc = loc;
  this.prevLoc = loc;
  var coords = utilities.boxToCoords(loc);
  this.x = coords.x;
  this.y = coords.y;
  this.w = 30;
  this.h = 30;
  this.player = player;
  //use this to determine what part of the sprite colelction to use
  this.imageX = 32*2;
  this.imageY = 0;
  this.imageW = 32;
  this.imageH = 32;

  this.target = new Array();
  this.attackMax = 10;
  this.attackMin = 5;
  this.selected = false;
  this.color = "black";
  this.sight = Knight.SIGHT_RANGE;
  this.totalHealth = 100;
  this.health = this.totalHealth;

  this.attackSpeed = 25;
  this.attackTimer = 0;
}

Knight.prototype.imageReady = function(){
	return Knight.imageLoaded;
}

Knight.prototype.getImage = function(){
	return Knight.image;
}

Knight.SIGHT_RANGE = 50;
Knight.WIDTH = 32;
Knight.HEIGHT = 32;

//only want to load the image once per class (i.e. not for each unit)
Knight.image = new Image();
Knight.imageLoaded = false;
var imageLoaded = false;
Knight.image.onload = function() {
  Knight.imageLoaded = true;
};
Knight.image.src = '/images/knight.png';






