/// <reference path="../../scripts/unit.ts" />
class Knight extends Unit{
  w = 30;
  h = 30;
  imageX = 0;
  imageY = 512;
  imageW = 64;
  imageH = 64;
  attackMax = 10;
  attackMin = 5;
  totalHealth = 100;
  health = this.totalHealth;
  attackSpeed = 10;
}
