/// <reference path="coords.ts" />
/// <reference path="unit.ts" />
/// <reference path="../gameRunners/NetworkedGameRunner.ts" />

class Drawer {
  private static context: Drawer;

  //consts
  private UPDATE_FPS: number = 10;
  private FPS: number = 60;
  private GREEN: string = "#39FF14";
  private RED: string = "#FF0000";
  private HEALTH_BAR_OFFSET: number = 10;
  private HEALTH_BAR_HEIGHT: number = 5;
  private FOG: string = "black";



  //globals
  private boxSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private terrainCanvas;
  private unitCanvas;
  private fogCanvas;
  private selectionCanvas;
  private terrainContext;
  private unitContext;
  private fogContext;
  private selectionContext;
  private playerId;
  private gameRunner: GameRunner;

  constructor(width, height, player,
    terrainCanvas, unitCanvas, fogCanvas, selectionCanvas, gameRunner) {

    this.playerId = player;
    this.gameRunner = gameRunner;
    this.terrainCanvas = terrainCanvas;
    this.unitCanvas = unitCanvas;
    this.fogCanvas = fogCanvas;
    this.selectionCanvas = selectionCanvas;
    this.updateDimensions(width, height);

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

  public updateDimensions(width: number, height: number) {
    var winWidth = $(window).width();
    var winHeight = $(window).height();
    var calculatedWidth = $(window).height() * Game.getRatio();
    var calculatedHeight = $(window).width() / Game.getRatio();

    if (calculatedWidth > winWidth) {
      width = winWidth;
      height = calculatedHeight;
    }
    else if (calculatedHeight > winHeight) {
      width = calculatedWidth;
      height = winHeight;
    }
    this.boxSize = width / Game.getNumOfCols();

    this.terrainCanvas.width = width;
    this.terrainCanvas.height = height;
    this.unitCanvas.width = width;
    this.unitCanvas.height = height;
    this.fogCanvas.width = width;
    this.fogCanvas.height = height;
    this.selectionCanvas.width = width;
    this.selectionCanvas.height = height;

    this.canvasHeight = height;
    this.canvasWidth = width;

    this.boxSize = this.canvasWidth / Game.getNumOfCols();
    if (typeof (Game.getTerrainLoc(0)) != 'undefined') { //don't want to draw it before it exists
      this.drawTerrain();
    }
  }

  public getBoxWidth() {
    return this.boxSize;
  }

  public getBoxHeight() {
    return this.boxSize;
  }

  public drawUnits(units: Unit[]) {
    this.fogContext.globalCompositeOperation = 'source-over';
    this.fogContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.fogContext.fillStyle = this.FOG;
    this.fogContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.unitContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    for (var i = 0; i < units.length; i++) {

      if (this.gameRunner.STATEDEBUG) {
        this.drawStateText(units[i]);
      }


      if (units[i].player == this.playerId) {
        var coords = this.boxToCoords(units[i].loc);
        var x = coords.x;
        var y = coords.y;
        //this stuff does the "sight" circles in the fog
        var r1 = units[i].sightRange * this.boxSize;
        var r2 = r1 + 40;
        var density = .4;

        if (this.gameRunner.DEBUG) {
          this.drawUnitSightRange(units[i]);
          this.drawUnitAquireTargetRange(units[i]);
        }

        var radGrd = this.fogContext.createRadialGradient(
          x + this.unitWidth() / 2,
          y + this.unitHeight() / 2, r1,
          x + this.unitWidth() / 2,
          y + this.unitHeight() / 2, r2);
        radGrd.addColorStop(0, 'rgba( 0, 0, 0,  1 )');
        radGrd.addColorStop(density, 'rgba( 0, 0, 0, .1 )');
        radGrd.addColorStop(1, 'rgba( 0, 0, 0,  0 )');
        this.fogContext.globalCompositeOperation = "destination-out";
        this.fogContext.fillStyle = radGrd;
        this.fogContext.fillRect(x - r2, y - r2, r2 * 2, r2 * 2);
      }
      this.drawUnit(units[i]);
    }
    this.selectionContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
  }

  public drawTerrain() {
    var src = TerrainTile.src;
    var image = new Image();
    var that = this;
    image.onload = function () {
      var gridSize = Game.getNumOfRows() * Game.getNumOfCols();
      for (var i = 0; i < gridSize; i++) {
        var tile = Game.getTerrainLoc(i);
        that.terrainContext.drawImage(
          image,
          tile.imageX,
          tile.imageY,
          tile.imageW,
          tile.imageH,
          that.boxToCoords(i).x,
          that.boxToCoords(i).y,
          that.boxSize,
          that.boxSize);
      }
    };
    image.src = src;
  }

  //returns the upper left corner of the box given its index
  public boxToCoords(i) {
    var y = Math.floor(i / Game.getNumOfCols()) * this.boxSize;
    var x = i % Game.getNumOfCols() * this.boxSize;
      return { x: x, y: y }
  }

  //given the row and col of a box this returns the box index
  public coordsToBox(x, y) {
    var newX = Math.floor((x % this.canvasWidth) / this.boxSize);
    var newY = Math.floor((y % this.canvasHeight) / this.boxSize);
    var boxNumber = newX + Game.getNumOfCols() * newY;
    return boxNumber;
  }

  //debugging function...just colors a specified grid loc with a color
  public drawSquare(loc, color) {
    var coords = this.boxToCoords(loc);
    this.fogContext.fillStyle = color;
    this.fogContext.fillRect(coords.x,
      coords.y,
      this.boxSize,
      this.boxSize);
    this.unitContext.fillStyle = color;
    this.unitContext.fillRect(coords.x,
      coords.y,
      this.boxSize,
      this.boxSize);
  }

  //used for debugging a* pathing
  public drawPathing(loc, color, val) {
    var coords = this.boxToCoords(loc);
    this.selectionContext.fillStyle = color;
    this.selectionContext.fillRect(coords.x,
      coords.y,
      this.boxSize,
      this.boxSize);
    this.selectionContext.fillStyle = "black";
    this.selectionContext.fillText(Math.round(val), coords.x, coords.y + this.boxSize / 2)
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
    this.drawTerrain();
    this.terrainContext.strokeStyle = this.GREEN;
    for (var i = 0; i <= Game.getNumOfCols(); i++) {
      this.terrainContext.moveTo(i * this.boxSize, 0);
      this.terrainContext.lineTo(i * this.boxSize, this.canvasHeight);
      this.terrainContext.stroke();
    }
    for (var i = 0; i <= Game.getNumOfRows(); i++) {
      this.terrainContext.moveTo(0, i * this.boxSize);
      this.terrainContext.lineTo(this.canvasWidth, i * this.boxSize);
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
      console.log(unit.loc);
    }
    x = unit.x;
    y = unit.y;
    var coords = unit.getDrawCoordinates();
    //console.log(unit.x + " " + unit.y + " " + coords.x + " " + coords.y);
    if (typeof unit.getImage() !== "undefined") {
      this.unitContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x, y, this.unitWidth(), this.unitHeight());
    }
    if (unit.selected) {
      this.unitContext.beginPath();
      this.unitContext.strokeStyle = this.GREEN;
      this.unitContext.arc(x + this.unitWidth() / 2, y + this.unitHeight() / 2, Math.max(this.unitWidth(), this.unitHeight()) * .75, 0, 2 * Math.PI);
      this.unitContext.stroke();
      //for all selected units with targets, indicate their targets with a red square on map (todo: change this to some sort of other marker)
      if (typeof (unit.target) !== 'undefined' && unit.target !== null) {
        this.drawSquare(unit.target, 'red');
      }
      //for all selected units with a unit targed indicate their targets with a red circle
      if (typeof (unit.unitTarget) !== 'undefined' && unit.unitTarget !== null) {
        var targetUnit = unit.unitTarget;
        this.unitContext.beginPath();
        this.unitContext.strokeStyle = this.RED;
        this.unitContext.arc(targetUnit.x + this.unitWidth() / 2, targetUnit.y + this.unitHeight() / 2, Math.max(this.unitWidth(), this.unitHeight()) * .75, 0, 2 * Math.PI);
        this.unitContext.stroke();
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
    this.unitContext.fillRect(x, y - this.HEALTH_BAR_OFFSET, this.unitWidth() * percent, this.HEALTH_BAR_HEIGHT);
    this.unitContext.fillStyle = "black";
    this.unitContext.fillRect(x + this.unitWidth() * percent, y - this.HEALTH_BAR_OFFSET, this.unitWidth() * (1 - percent), this.HEALTH_BAR_HEIGHT);
  }

  private unitWidth() {
    return this.boxSize * 2;
  }
  private unitHeight() {
    return this.boxSize * 2;
  }

  private drawUnitAquireTargetRange(unit: Unit) {
    var locs = Utilities.getGridLocsInTargetAquireRange(unit);
    for (var l in locs) {
      this.drawSquare(locs[l], "purple");
    }
  }

  private drawUnitSightRange(unit: Unit) {
    var locs = Utilities.getGridLocsInSightRange(unit);
    for (var l in locs) {
      this.drawSquare(locs[l], "orange");
    }
  }

  private drawStateText(unit: Unit) {
    var text = unit.currentState.ToString();
    this.unitContext.fillStyle = "red";
    this.unitContext.fillText(text, unit.x, unit.y + this.HEALTH_BAR_OFFSET);
  }
}