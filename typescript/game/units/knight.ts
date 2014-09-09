/// <reference path="unit.ts" />

class Knight extends Unit{
  w = 30;
  h = 30;
  gridWidth = 2;
  gridHeight = 2;
  imageX = 0;
  imageY = 512;
  imageW = 64;
  imageH = 64;
  attackMax = 10;
  attackMin = 5;
  totalHealth = 100;
  health = this.totalHealth;
  attackSpeed = 10;
  src: string = '/images/knight.png';
  static image;

  public getImage() {
    if (Knight.image) {
      return Knight.image;
    }
    else {
      Knight.image = new Image();
      Knight.image.onload = function () {
        return Knight.image;
      };
      Knight.image.src = this.src;
    }
  }
}
