class SelectionObject {
  public sX: number;
  public x: number;
  public sY: number;
  public y: number;
  public w: number;
  public h: number;
  public select: boolean;

  constructor(sX: number, sY: number) {
    this.sX = sX;
    this.x = sX;
    this.sY = sY;
    this.y = sY;
    this.w = 0;
    this.h = 0;
    this.select = true;
  }
}
