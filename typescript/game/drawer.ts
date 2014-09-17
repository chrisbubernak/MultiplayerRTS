/// <reference path="coords.ts" />
/// <reference path="units/unit.ts" />
/// <reference path="rectangle.ts" />
/// <reference path="../gameRunners/IGameRunner.ts" />

class Drawer {
  private static context: Drawer;

  // consts
  private UPDATE_FPS: number = 10;
  private GREEN: string = "#39FF14";
  private RED: string = "#FF0000";
  private HEALTH_BAR_OFFSET: number = 10;
  private HEALTH_BAR_HEIGHT: number = 5;
  private FOG: string = "black";

  public REAL_FPS: number = 60;


  // globals
  private boxWidth: number;
  private boxHeight: number;
  private winWidth: number;
  private winHeight: number;
  private gameHeight: number;
  private gameWidth: number;
  private menuHeight: number;
  private menuWidth: number;
  private terrainCanvas: any;
  private unitCanvas: any;
  private fogCanvas: any;
  private menuCanvas: any;
  private selectionCanvas: any;
  private terrainContext: any;
  private menuContext: any;
  private unitContext: any;
  private fogContext: any;
  private selectionContext: any;
  private playerNumber: number;
  private gameRunner: IGameRunner;

  constructor(
    playerNumber: number,
    terrainCanvas: any,
    unitCanvas: any,
    fogCanvas: any,
    selectionCanvas: any,
    menuCanvas: any,
    gameRunner: IGameRunner) {

    this.playerNumber = playerNumber;
    this.gameRunner = gameRunner;
    this.terrainCanvas = terrainCanvas;
    this.unitCanvas = unitCanvas;
    this.fogCanvas = fogCanvas;
    this.selectionCanvas = selectionCanvas;
    this.menuCanvas = menuCanvas;
    this.updateDimensions(1, 1);

    this.terrainContext = terrainCanvas.getContext("2d");
    this.unitContext = unitCanvas.getContext("2d");
    this.fogContext = fogCanvas.getContext("2d");
    this.selectionContext = selectionCanvas.getContext("2d");
    this.menuContext = menuCanvas.getContext("2d");
    Drawer.context = this;
  }

  public static drawSquare(loc: number, color: string): void {
    Drawer.context.drawSquare(loc, color);
  }

  public getTerrainContext(): any {
    return this.terrainContext;
  }

  public interpolate(): void {
    var units: Unit[] = Game.getUnits();
    for (var i: number = 0; i < units.length; i++) {
      var oldCoords:  Coords = this.boxToCoords(units[i].prevLoc);
      var coords: Coords = this.boxToCoords(units[i].loc);
      units[i].x -= ((1 / (this.REAL_FPS / this.UPDATE_FPS)) * (oldCoords.x - coords.x)) / (units[i].moveSpeed + 1);
      units[i].y -= ((1 / (this.REAL_FPS / this.UPDATE_FPS)) * (oldCoords.y - coords.y)) / (units[i].moveSpeed + 1);
      if (units[i].prevLoc === units[i].loc) {
        units[i].x = coords.x;
        units[i].y = coords.y;
      }
    }
  }

  public updateDimensions(width: number, height: number): void {
    this.winWidth = $(window).width();
    this.winHeight = $(window).height();
    /*var calculatedWidth: number = $(window).height() * Game.getRatio();
    var calculatedHeight: number = $(window).width() / Game.getRatio();

    this.gameWidth = winWidth;
    this.gameHeight = height * 0.7;
     if (calculatedWidth > winWidth) {
      width = winWidth;
      height = calculatedHeight;
    } else if (calculatedHeight > winHeight) {
      width = calculatedWidth;
      height = winHeight;
    } */

    this.gameHeight = this.winHeight * 0.7;
    this.gameWidth = this.winWidth * 1.0;
    this.menuHeight = this.winHeight * 0.3;
    this.menuWidth = this.winWidth * 1.0;

    this.boxWidth = this.gameWidth / Game.getNumOfCols();
    this.boxHeight = this.gameHeight / Game.getNumOfRows();

    this.terrainCanvas.width = this.gameWidth;
    this.terrainCanvas.height = this.gameHeight;
    this.unitCanvas.width = this.gameWidth;
    this.unitCanvas.height = this.gameHeight;
    this.fogCanvas.width = this.gameWidth;
    this.fogCanvas.height = this.gameHeight;
    this.selectionCanvas.width = this.gameWidth;
    this.selectionCanvas.height = this.gameHeight;

    this.menuCanvas.style.top = this.gameHeight + "px";
    this.menuCanvas.width = this.menuWidth;
    this.menuCanvas.height = this.menuHeight;

    // don't want to draw it before it exists
    if (typeof (Game.getTerrainLoc(0)) !== "undefined") {
      this.drawTerrain();
    }
  }

  public getBoxWidth(): number {
    return this.boxWidth;
  }

  public getBoxHeight(): number {
    return this.boxHeight;
  }

  public drawUnits(units: Unit[]): void {
    this.fogContext.globalCompositeOperation = "source-over";
    this.fogContext.clearRect(0, 0, this.gameWidth, this.gameHeight);
    this.fogContext.fillStyle = this.FOG;
    this.fogContext.fillRect(0, 0, this.gameWidth, this.gameHeight);
    this.unitContext.clearRect(0, 0, this.gameWidth, this.gameHeight);
    for (var i: number = 0; i < units.length; i++) {

      if (this.gameRunner.STATEDEBUG) {
        this.drawStateText(units[i]);
      }


      if (units[i].player === this.playerNumber) {
        var coords: Coords = this.boxToCoords(units[i].loc);
        var x: number = coords.x;
        var y: number = coords.y;
        // this stuff does the "sight" circles in the fog
        var r1: number = units[i].sightRange * Math.max(this.getBoxWidth(), this.getBoxHeight());
        var r2: number = r1 + 40;
        var density: number = 0.4;

        if (this.gameRunner.DEBUG) {
          this.drawUnitSightRange(units[i]);
          this.drawUnitAquireTargetRange(units[i]);
          this.drawUnitLocsOccupied(units[i]);
        }

        var radGrd: any = this.fogContext.createRadialGradient(
          x + this.unitWidth() / 2,
          y + this.unitHeight() / 2, r1,
          x + this.unitWidth() / 2,
          y + this.unitHeight() / 2, r2);
        radGrd.addColorStop(0, "rgba( 0, 0, 0,  1 )");
        radGrd.addColorStop(density, "rgba( 0, 0, 0, .1 )");
        radGrd.addColorStop(1, "rgba( 0, 0, 0,  0 )");
        this.fogContext.globalCompositeOperation = "destination-out";
        this.fogContext.fillStyle = radGrd;
        this.fogContext.fillRect(x - r2, y - r2, r2 * 2, r2 * 2);
      }
      this.drawUnit(units[i]);
    }
    this.selectionContext.clearRect(0, 0, this.gameWidth, this.gameHeight);
  }

  public drawTerrain(): void {
    this.terrainContext.clearRect(0, 0, this.gameWidth, this.gameHeight);

    var src: string = TerrainTile.src;
    var image: any = new Image();
    var that: Drawer = this;
    image.onload = function (): void {
      var gridSize: number = Game.getNumOfRows() * Game.getNumOfCols();
      for (var i: number = 0; i < gridSize; i++) {
        var tile: TerrainTile = Game.getTerrainLoc(i);
        that.terrainContext.drawImage(
          image,
          tile.imageX,
          tile.imageY,
          tile.imageW,
          tile.imageH,
          that.boxToCoords(i).x,
          that.boxToCoords(i).y,
          that.getBoxWidth(),
          that.getBoxHeight());
      }
    };
    image.src = src;
  }

  // returns the upper left corner of the box given its index
  public boxToCoords(i: number): any {
    var y: number = Math.floor(i / Game.getNumOfCols()) * this.getBoxHeight();
    var x: number = i % Game.getNumOfCols() * this.getBoxWidth();
      return { x: x, y: y };
  }

  // given the row and col of a box this returns the box index
  public coordsToBox(x: number, y: number): number {
    var newX: number = Math.floor((x % this.gameWidth) / this.getBoxWidth());
    var newY: number = Math.floor((y % this.gameHeight) / this.getBoxHeight());
    var boxNumber: number = newX + Game.getNumOfCols() * newY;
    return boxNumber;
  }

  // debugging function...just colors a specified grid loc with a color
  public drawSquare(loc: number, color: string): void {
    var coords: Coords = this.boxToCoords(loc);
    this.fogContext.fillStyle = color;
    this.fogContext.fillRect(coords.x,
      coords.y,
      this.getBoxWidth(),
      this.getBoxHeight());
    this.unitContext.fillStyle = color;
    this.unitContext.fillRect(coords.x,
      coords.y,
      this.getBoxWidth(),
      this.getBoxHeight());
  }

  // used for debugging a* pathing
  public drawPathing(loc: number, color: string, val: number): void {
    var coords: Coords = this.boxToCoords(loc);
    this.selectionContext.fillStyle = color;
    this.selectionContext.fillRect(coords.x,
      coords.y,
      this.getBoxWidth(),
      this.getBoxHeight());
    this.selectionContext.fillStyle = "black";
    this.selectionContext.fillText(Math.round(val),
      coords.x,
      coords.y + this.getBoxHeight() / 2);
  }

  public drawSelect(selection: SelectionObject): void {
    this.selectionContext.globalAlpha = 0.3;
    this.selectionContext.fillStyle = this.GREEN;
    this.selectionContext.fillRect(selection.x,
      selection.y,
      selection.w,
      selection.h);
    this.selectionContext.globalAlpha = 1;
  }

  public drawGrid(): void {
    this.drawTerrain();
    this.terrainContext.strokeStyle = this.GREEN;
    for (var i: number = 0; i <= Game.getNumOfCols(); i++) {
      this.terrainContext.moveTo(i * this.getBoxWidth(), 0);
      this.terrainContext.lineTo(i * this.getBoxWidth(), this.gameHeight);
      this.terrainContext.stroke();
    }
    for (var j: number = 0; j <= Game.getNumOfRows(); j++) {
      this.terrainContext.moveTo(0, j * this.getBoxHeight());
      this.terrainContext.lineTo(this.gameWidth, j * this.getBoxHeight());
      this.terrainContext.stroke();
    }
  }

  private drawUnit(unit: Unit): void {
    var x: number = null; // todo: remove nulls!!!
    var y: number = null;
    if (unit.x === null || unit.y === null || isNaN(unit.x) || isNaN(unit.y)) {
      // this is pretty hacky storing x & y info on units 
      // (which arean't supposed to know about this kind of info
      // ...but it will have to do for now)
      var unitCoords: Coords = this.boxToCoords(unit.loc);
      unit.x = unitCoords.x;
      unit.y = unitCoords.y;
    }
    x = unit.x;
    y = unit.y;
    var coords: Coords = unit.getDrawCoordinates();
    if (typeof unit.getImage() !== "undefined") {
      this.unitContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x, y, this.unitWidth(), this.unitHeight());
    }
    if (unit.selected) {
      this.unitContext.beginPath();
      this.unitContext.strokeStyle = this.GREEN;
      this.unitContext.arc(x + this.unitWidth() / 2,
        y + this.unitHeight() / 2,
        Math.max(this.unitWidth(), this.unitHeight()) * 0.75,
        0,
        2 * Math.PI);
      this.unitContext.stroke();
      // for all selected units with targets, indicate their targets with a red square on map 
      // todo: change this to some sort of other marker)
      if (unit.command !== null) {
        this.drawSquare(unit.command.GetLocation(), "red");
      }
      // for all selected units with a unit targed indicate their targets with a red circle
      if (unit.command && unit.command.ToString() === "attack") {
        var targetUnit: Unit = (<AttackCommand>unit.command).GetTarget();
        this.unitContext.beginPath();
        this.unitContext.strokeStyle = this.RED;
        this.unitContext.arc(targetUnit.x + this.unitWidth() / 2,
          targetUnit.y + this.unitHeight() / 2,
          Math.max(this.unitWidth(), this.unitHeight()) * 0.75,
          0,
          2 * Math.PI);
        this.unitContext.stroke();
      }

    }

    // draw the health bar above the unit...todo: move this elsewhere
    var percent: number = unit.health / unit.totalHealth;
    this.unitContext.fillStyle = "red";
    if (percent > .7) {
      this.unitContext.fillStyle = "green";
    } else if (percent > .4) {
      this.unitContext.fillStyle = "yellow";
    }
    this.unitContext.fillRect(x, y - this.HEALTH_BAR_OFFSET, this.unitWidth() * percent, this.HEALTH_BAR_HEIGHT);
    this.unitContext.fillStyle = "black";
    this.unitContext.fillRect(x + this.unitWidth() * percent,
      y - this.HEALTH_BAR_OFFSET,
      this.unitWidth() * (1 - percent),
      this.HEALTH_BAR_HEIGHT);
  }

  private unitWidth(): number {
    return this.getBoxWidth() * 2;
  }
  private unitHeight(): number {
    return this.getBoxHeight() * 2;
  }

  private drawUnitAquireTargetRange(unit: Unit): void {
    var locs: number[] = Utilities.getGridLocsInTargetAquireRange(unit);
    for (var l: number = 0; l < locs.length; l++) {
      this.drawSquare(locs[l], "purple");
    }
  }

  private drawUnitSightRange(unit: Unit): void {
    var locs: number[] = Utilities.getGridLocsInSightRange(unit);
    for (var l: number = 0; l < locs.length; l++) {
      this.drawSquare(locs[l], "orange");
    }
  }

  private drawUnitLocsOccupied(unit: Unit): void {
    var locs: number[] = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
    for (var l: number = 0; l < locs.length; l++) {
      this.drawSquare(locs[l], "red");
    }
  }

  private drawStateText(unit: Unit): void {
    var text: string = unit.currentState.ToString();
    this.unitContext.fillStyle = "red";
    this.unitContext.fillText(text, unit.x, unit.y + this.HEALTH_BAR_OFFSET);
  }

  public getMousePos(canvas: any, evt: any): any {
    var rect: any = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

  public drawLowerMenu(): void {
    // draw the bottom console
    this.menuContext.fillStyle = "black";
    this.menuContext.fillRect(0, 0, this.menuWidth, this.menuHeight);
    this.menuContext.strokeStyle = "red";
    this.menuContext.rect(0, 0, this.menuWidth, this.menuHeight);
    this.menuContext.moveTo(this.menuHeight, 0);
    this.menuContext.lineTo(this.menuHeight, this.gameHeight);
    this.menuContext.stroke();

    var selectedUnits: Unit[] = Array();
    var allUnits: Unit[] = Game.getUnits();

    for (var u: number = 0; u < allUnits.length; u++) {
      if (allUnits[u].selected && (allUnits[u].player === this.playerNumber)) {
        selectedUnits.push(allUnits[u]);
      }
    }
    if (selectedUnits.length <= 0) {
      return;
    } else {
      var x1: number = 0;
      var x2: number = this.menuHeight;
      var x3: number = this.menuHeight * 2;
      var y1: number = 0;
      var y2: number = this.menuHeight;

      // draw the first/most selected unit
      this.drawFirstSelectedUnit(selectedUnits[0], new Rectangle(x1, x2, y1, y2));

      // draw little icons for all of the selected units
      this.drawAllSelectedUnits(selectedUnits, new Rectangle(x2, x3, y1, y2));
    }
  }

  private writeText(text: string, x: number, y: number): void {
    this.menuContext.fillText(text, x, y);
  }

  private drawAllSelectedUnits(selectedUnits: Unit[], rect: Rectangle): void {
    var unitsPerCol: number = Math.floor(rect.getHeight() / this.unitHeight());
    // then draw all the units in our selected group
    for (var i: number = 0; i < selectedUnits.length; i++) {
      var unit: Unit = selectedUnits[i];
      var coords: Coords = unit.getMenuDrawCoordinates();
      var x: number = rect.getLeft() + this.unitWidth() * Math.floor(i / unitsPerCol);
      var y: number = rect.getTop() + (i % unitsPerCol) * this.unitHeight();
      this.menuContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH,
        x, y, this.unitWidth(), this.unitHeight());
    }
  }

  private drawFirstSelectedUnit(unit: Unit, rect: Rectangle): void {
    var coords: Coords = unit.getMenuDrawCoordinates();
    this.menuContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH / 2,
      rect.getLeft(), rect.getTop(), rect.getWidth(), rect.getHeight() / 2);

    var xOffset: number = rect.getLeft();
    var yOffset: number = rect.getTop() + rect.getHeight() / 2;
    var fontSize: number = 12;
    var textHeight: number = fontSize * 1.5;
    this.menuContext.font = fontSize + "px helvetica";
    this.menuContext.fillStyle = "white";

    this.writeText("\tRace: " + unit.getName(), xOffset, yOffset + textHeight);
    this.writeText("\tHealth: " + (Math.round(100 * unit.health) / 100) + "/" + unit.totalHealth, xOffset, yOffset + textHeight * 2);
    this.writeText("\tKills: " + 0, xOffset, yOffset + textHeight * 3);
    this.writeText("\tAttack: " + unit.attackMin + "-" + unit.attackMax + "dmg", xOffset, yOffset + textHeight * 4);
    this.writeText("\tAttackSpeed: " + Math.round((this.UPDATE_FPS / unit.attackSpeed) * 100) / 100 + "/sec",
      xOffset,
      yOffset + textHeight * 5);
  }

}
