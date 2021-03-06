/// <reference path="unit.ts" />
class Orc extends Unit {
  w = 30;
  h = 30;
  gridWidth = 2;
  gridHeight = 2;
  name = "Orc";
  imageX = 0;
  imageY = 512;
  imageW = 64;
  imageH = 64;
  attackMax = 13;
  attackMin = 5;
  totalHealth = 120;
  health = this.totalHealth;
  attackSpeed = 15;
  src: string = "/images/orc.png";
  static image;

  public getImage(): void {
    if (Orc.image) {
      return Orc.image;
    } else {
      Orc.image = new Image();
      Orc.image.onload = function(): any {
        return Orc.image;
      };
      Orc.image.src = this.src;
    }
  }
}
