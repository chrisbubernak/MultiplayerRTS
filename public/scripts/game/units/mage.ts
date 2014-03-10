/// <reference path="../../scripts/unit.ts" />
class Mage extends Unit {
    constructor(id: number, loc: number, player: string) {
        super(id, loc, player);
        this.w = 30;
        this.h = 30;
        this.imageX = 0;
        this.imageY = 0;
        this.imageW = 32;
        this.imageH = 32;
        this.attackMax = 35;
        this.attackMin = 10;
        this.totalHealth = 80;
        this.health = this.totalHealth;
        this.attackSpeed = 45;
    }
}
