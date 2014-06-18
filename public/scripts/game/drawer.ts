/// <reference path="coords.ts" />
/// <reference path="unit.ts" />

class Drawer {
  private static context: Drawer;

  //consts
  private CANVAS_WIDTH: number = 1440;
  private CANVAS_HEIGHT: number = 720;
  private BOX_SIZE: number = this.CANVAS_WIDTH / Game.getBoxesPerRow();
  private UPDATE_FPS: number = 10;
  private FPS: number = 60;
  private GREEN: string = "#39FF14";
  private HEALTH_BAR_OFFSET: number = 10;
  private HEALTH_BAR_HEIGHT: number = 5;
  private FOG: string = "black";

  //globals
  private terrainContext;
  private unitContext;
  private fogContext;
  private selectionContext;
  private playerId;

  constructor(width, height, player,
    terrainCanvas, unitCanvas, fogCanvas, selectionCanvas) {

    terrainCanvas.width = width;
    terrainCanvas.height = height;
    this.playerId = player;
    unitCanvas.width = width;
    unitCanvas.height = height;
    fogCanvas.width = width;
    fogCanvas.height = height;
    selectionCanvas.width = width;
    selectionCanvas.height = height;

    this.terrainContext = terrainCanvas.getContext("2d");
    this.unitContext = unitCanvas.getContext("2d");
    this.fogContext = fogCanvas.getContext("2d");
    this.selectionContext = selectionCanvas.getContext("2d");

    Drawer.context = this;
  }

  public static drawSquare(loc, color) {
    Drawer.context.drawSquare(loc, color);
  }

  public getTerrainContext() {
    return this.terrainContext;
  }

  public interpolate() {
    var units = Game.getUnits();
    for (var i = 0; i < units.length; i++) {
      var oldCoords = this.boxToCoords(units[i].prevLoc);
      var coords = this.boxToCoords(units[i].loc);
      units[i].x -= ((1 / (this.FPS / this.UPDATE_FPS)) * (oldCoords.x - coords.x)) / (units[i].moveSpeed + 1);
      units[i].y -= ((1 / (this.FPS / this.UPDATE_FPS)) * (oldCoords.y - coords.y)) / (units[i].moveSpeed + 1);
      if (units[i].prevLoc == units[i].loc) {
        units[i].x = coords.x;
        units[i].y = coords.y;
      }
    }
  }

  public getBoxWidth() {
    return this.BOX_SIZE;
  }

  public getBoxHeight() {
    return this.BOX_SIZE;
  }

  public drawUnits(units) {
    this.fogContext.globalCompositeOperation = 'source-over';
    this.fogContext.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    this.fogContext.fillStyle = this.FOG;
    this.fogContext.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    this.unitContext.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    for (var i = 0; i < units.length; i++) {
      if (units[i].player == this.playerId) {
        var coords = this.boxToCoords(units[i].loc);
        var x = coords.x;
        var y = coords.y;
        //this stuff does the "sight" circles in the fog
        var r1 = units[i].sightRange;
        var r2 = r1 + 50;
        var density = .4;

        var radGrd = this.fogContext.createRadialGradient(
          x + units[i].w / 2,
          y + units[i].h / 2, r1,
          x + units[i].w / 2,
          y + units[i].h / 2, r2);
        radGrd.addColorStop(0, 'rgba( 0, 0, 0,  1 )');
        radGrd.addColorStop(density, 'rgba( 0, 0, 0, .1 )');
        radGrd.addColorStop(1, 'rgba( 0, 0, 0,  0 )');
        this.fogContext.globalCompositeOperation = "destination-out";
        this.fogContext.fillStyle = radGrd;
        this.fogContext.fillRect(x - r2, y - r2, r2 * 2, r2 * 2);
      }
      this.drawUnit(units[i]);
    }
    this.selectionContext.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT)
  }

  public drawTerrain() {
    var gridSize = Game.getBoxesPerCol() * Game.getBoxesPerRow();
    for (var i = 0; i < gridSize; i++) {
      var tile = Game.getTerrainLoc(i);
      if (tile.getImage()) {
        this.terrainContext.drawImage(
          tile.getImage(),
          tile.imageX,
          tile.imageY,
          tile.imageW,
          tile.imageH,
          this.boxToCoords(i).x,
          this.boxToCoords(i).y,
          this.BOX_SIZE,
          this.BOX_SIZE);
      }
      else {
        //console.log("failed to load image");
      }
    }
  }

  //returns the upper left corner of the box given its index 
  public boxToCoords(i) {
    var y = Math.floor(i / Game.getBoxesPerRow()) * this.BOX_SIZE;
    var x = i % Game.getBoxesPerRow() * this.BOX_SIZE;
      return { x: x, y: y }
  }

  //given the row and col of a box this returns the box index
  public coordsToBox(x, y) {
    var newX = Math.floor((x % this.CANVAS_WIDTH) / this.BOX_SIZE);
    var newY = Math.floor((y % this.CANVAS_HEIGHT) / this.BOX_SIZE);
    var boxNumber = newX + Game.getBoxesPerRow() * newY;
    return boxNumber;
  }

  //debugging function...just colors a specified grid loc with a color
  public drawSquare(loc, color) {
    var coords = this.boxToCoords(loc);
    this.unitContext.fillStyle = color;
    this.unitContext.fillRect(coords.x,
      coords.y,
      this.BOX_SIZE,
      this.BOX_SIZE);
  }

  //used for debugging a* pathing
  public drawPathing(loc, color, val) {
    var coords = this.boxToCoords(loc);
    this.selectionContext.fillStyle = color;
    this.selectionContext.fillRect(coords.x,
      coords.y,
      this.BOX_SIZE,
      this.BOX_SIZE);
    this.selectionContext.fillStyle = "black";
    this.selectionContext.fillText(Math.round(val), coords.x, coords.y + this.BOX_SIZE / 2)
  }

  public drawSelect(selection) {
    this.selectionContext.globalAlpha = 0.3;
    this.selectionContext.fillStyle = this.GREEN;
    this.selectionContext.fillRect(selection.x,
      selection.y,
      selection.w,
      selection.h);
    this.selectionContext.globalAlpha = 1;
  }

  public drawGrid() {
    this.terrainContext.strokeStyle = this.GREEN;
    for (var i = 0; i <= Game.getBoxesPerRow(); i++) {
      this.terrainContext.moveTo(i * this.BOX_SIZE, 0);
      this.terrainContext.lineTo(i * this.BOX_SIZE, this.CANVAS_HEIGHT);
      this.terrainContext.stroke();
    }
    for (var i = 0; i <= Game.getBoxesPerCol(); i++) {
      this.terrainContext.moveTo(0, i * this.BOX_SIZE);
      this.terrainContext.lineTo(this.CANVAS_WIDTH, i * this.BOX_SIZE);
      this.terrainContext.stroke();
    }
  }

  private drawUnit(unit: Unit) {
    var x = null;
    var y = null;
    if (unit.x == null || unit.y == null || isNaN(unit.x) || isNaN(unit.y)) {
      //this is pretty hacky storing x & y info on units (which arean't supposed to know about this kind of info...but it will have to do for now)
      var unitCoords = this.boxToCoords(unit.loc);
      unit.x = unitCoords.x;
      unit.y = unitCoords.y;
    }
    x = unit.x;
    y = unit.y;
    var coords = unit.getDrawCoordinates();
    this.unitContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x - unit.w / 2, y - unit.h, unit.w * 2, unit.h * 2);

    if (unit.selected) {
      this.unitContext.beginPath();
      this.unitContext.strokeStyle = this.GREEN;
      this.unitContext.arc(x + unit.w / 2, y + unit.h / 2, Math.max(unit.w, unit.h) * .75, 0, 2 * Math.PI);
      this.unitContext.stroke();
      //for all selected units with targets, indicate their targets with a red square on map (todo: change this to some sort of other marker)
      if (typeof (unit.target) !== 'undefined' && unit.target !== null) {
        this.drawSquare(unit.target, 'red');
      }
    }
    //draw the health bar above the unit...todo: move this elsewhere
    var percent = unit.health / unit.totalHealth;
    this.unitContext.fillStyle = "red";
    if (percent > .7) {
      this.unitContext.fillStyle = "green";
    }
    else if (percent > .4) {
      this.unitContext.fillStyle = "yellow";
    }
    this.unitContext.fillRect(x, y - this.HEALTH_BAR_OFFSET, unit.w * percent, this.HEALTH_BAR_HEIGHT);
    this.unitContext.fillStyle = "black";
    this.unitContext.fillRect(x + unit.w * percent, y - this.HEALTH_BAR_OFFSET, unit.w * (1 - percent), this.HEALTH_BAR_HEIGHT);
  }

}