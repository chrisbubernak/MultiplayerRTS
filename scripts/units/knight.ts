/// <reference path="../../scripts/unit.ts" />
class Knight extends Unit{

   constructor(loc: number, player: string) {
     super(loc, player);
        this.w = 30;
        this.h = 30;
        this.imageX = 0; 
        this.imageY = 512;
        this.imageW = 64;
        this.imageH = 64;
        this.attackMax = 10;
        this.attackMin = 5;
        this.totalHealth = 100;
        this.health = this.totalHealth;
        this.attackSpeed = 10;
    }
}
