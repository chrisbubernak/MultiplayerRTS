/// <reference path="IGameRunner.ts" />

class ReplayGameRunner implements IGameRunner {
  public DEBUG: boolean = false;
  public STATEDEBUG: boolean = false;
  public DRAWGRID: boolean = false;

  private myGame: Game;
  private actions: any[] = new Array(); // todo: we should use our action type here
  private FPS: number = 60;
  private drawer: Drawer;
  private updateFPS: number = 10;

  constructor(actions: any[]) {
    this.actions = actions;

    var id: string = "test";

    this.myGame = new Game(true, id, "enemyId", "gameId");

    this.drawer = new Drawer(1,
      document.getElementById("terrainCanvas"),
      document.getElementById("unitCanvas"),
      document.getElementById("fogCanvas"),
      document.getElementById("selectionCanvas"),
      document.getElementById("menuCanvas"),
      this);

    this.run();

    var that: ReplayGameRunner = this;
    $(window).resize(function (): void {
      that.drawer.updateDimensions($(window).width(), $(window).height());
    });

  }

  public run(): void {
    this.myGame.setup();
    this.drawer.drawTerrain();

    // timing stuff
    var oldTime: number = new Date().getTime();
    var diffTime: number = 0;
    var newTime: number = 0;
    var oldTime2: number = new Date().getTime();
    var diffTime2: number = 0;
    var newTime2: number = 0;

    // loop that runs at 60 fps...aka drawing & selection stuff
    var that: ReplayGameRunner = this;
    setInterval(function (): void {
      that.drawer.interpolate();
      that.drawer.drawUnits(Game.getUnits());
      that.drawer.drawLowerMenu();
      diffTime = newTime - oldTime;
      oldTime = newTime;
      newTime = new Date().getTime();
    }, 1000 / this.FPS);

    // loop that runs much less frequently (10 fps)
    // and handles physics/updating the game state/networking 
    var fpsOut: any = document.getElementById("fps");
    // var conn = Game.conn;
    setInterval(function (): void {
      if (that.myGame.isOver()) {
        that.end("Game is over!");
        return;
      }

      var currentSimTick: number = that.myGame.getSimTick();
      that.myGame.update();

      if (typeof that.actions[currentSimTick] === "undefined") {
        that.myGame.applyActions(new Array(), currentSimTick);
      } else {
        that.myGame.applyActions(that.actions[currentSimTick], currentSimTick);
      }

      diffTime2 = newTime2 - oldTime2;
      oldTime2 = newTime2;
      newTime2 = new Date().getTime();
      var realFPS: number = Math.round(1000 / diffTime);
      that.drawer.REAL_FPS = realFPS;
      fpsOut.innerHTML = realFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
    }, 1000 / (that.updateFPS));
  }

  public end(message: string): void {
    window.location.href = "/lobby";
  }
}
