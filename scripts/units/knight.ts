class Knight extends Unit{
    constructor(id: number, loc: number, player: string) {
        super(id, loc, player);
        this.w = 30;
        this.h = 30;
        this.imageX = 576;
        this.imageY = 160;
        this.imageW = 32;
        this.imageH = 32;
        this.attackMax = 10;
        this.attackMin = 5;
        this.totalHealth = 100;
        this.health = this.totalHealth;
        this.attackSpeed = 25;
        this.sight = 50;
    }
}
