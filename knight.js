//class(ish) definition...

function Knight(id, x, y, player) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.w = 32;
  this.h = 32;
  this.player = player;
  //use this to determine what part of the sprite colelction to use
  this.imageX = 32*2;
  this.imageY = 0;
  this.imageW = 32;
  this.imageH = 32;

  this.target = new Array();

  this.selected = false;
  this.color = "black";
  this.sight = Knight.SIGHT_RANGE;
  this.health = 50;
  this.totalHealth = 50;
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
Knight.image.src = 'knight.png';






