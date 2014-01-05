class Knight {
    id: number;
    loc: number;
    prevLoc: number;
    x: number;
    y: number;
    w: number = 30;
    h: number = 30;
    player: string;
    imageX: number = 64;
    imageY: number = 0;
    imageW: number = 32;
    imageH: number = 32;
    target = new Array();
    attackMax: number = 10;
    attackMin: number = 5;
    selected: boolean = false;
    color: string = "black";
    sight: number = 50;
    totalHealth: number = 100;
    health: number = this.totalHealth;
    attackSpeed: number = 25;
    attackTimer: number = 0;
    src: string = '/images/knight.png';
    static image;

    constructor(id : number, loc: number, player: string) {
        this.id = id;
        this.loc = loc;
        this.prevLoc = loc;
        var coords = utilities.boxToCoords(loc);
        this.x = coords.x;
        this.y = coords.y;
        this.player = player;
    }

    getImage() {
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
