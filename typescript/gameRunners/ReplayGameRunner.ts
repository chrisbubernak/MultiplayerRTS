/// <reference path="GameRunner.ts" />

class ReplayGameRunner implements GameRunner {
  public DEBUG: boolean = false;
  public STATEDEBUG: boolean = false;
  public DRAWGRID: boolean = false;

  private myGame: Game;
  private interval;
  private actions = new Array();
  private static updateFPS: number = 10;
  private FPS: number = 60;
  private RealFPS: number = this.FPS;
  private updateFPS: number = 10;
  private actionList = new Array();
  private shifted: boolean;
  private selection: SelectionObject;
  private drawer: Drawer;

  constructor(actions) {
    console.log(actions);
    this.actions = actions;
    /*for (var i = 0; i < 10000; i++) {
      this.actions.push([]);
    }
    var action1 = new Action(20, 0, false);
    var action2 = new Action(500, 1, false);
    var action3 = new Action(120, 2, false);
    var action4 = new Action(1000, 3, false);
    var action5 = new Action(589, 1, false);
    var action6 = new Action(400, 3, false);
    var action7 = new Action(2000, 2, false);

    this.actions[100].push(action1);
    this.actions[50].push(action3);
    this.actions[120].push(action2);
    this.actions[130].push(action4);
    this.actions[135].push(action5);
    this.actions[136].push(action6);
    this.actions[200].push(action7);*/

    var id = "test";

    this.myGame = new Game(true, id, "enemyId", "gameId");

    this.drawer = new Drawer(1,
      document.getElementById("terrainCanvas"),
      document.getElementById("unitCanvas"),
      document.getElementById("fogCanvas"),
      document.getElementById("selectionCanvas"),
      this);

    this.run();


    var that = this;
    
    $(window).resize(function () {
      that.drawer.updateDimensions($(window).width(), $(window).height());
    });

  }

  public run() {
    this.myGame.setup();
    this.drawer.drawTerrain();

    //timing stuff
    var oldTime = new Date().getTime();
    var diffTime = 0;
    var newTime = 0;
    var oldTime2 = new Date().getTime();
    var diffTime2 = 0;
    var newTime2 = 0;

    //loop that runs at 60 fps...aka drawing & selection stuff
    var that = this;
    setInterval(function () {
      that.drawer.interpolate();
      that.drawer.drawUnits(Game.getUnits());
      diffTime = newTime - oldTime;
      oldTime = newTime;
      newTime = new Date().getTime();
    }, 1000 / this.FPS);

    //loop that runs much less frequently (10 fps)
    //and handles physics/updating the game state/networking 
    var fpsOut = document.getElementById("fps");
    //var conn = Game.conn;
    setInterval(function () {
      if (that.myGame.isOver()) {
        that.end("Game is over!");
        return;
      }

      var currentSimTick = that.myGame.getSimTick();
      that.myGame.update();

      that.myGame.applyActions(that.actions[currentSimTick], currentSimTick);

      diffTime2 = newTime2 - oldTime2;
      oldTime2 = newTime2;
      newTime2 = new Date().getTime();
      that.RealFPS = Math.round(1000 / diffTime);
      fpsOut.innerHTML = that.RealFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
    }, 1000 / (that.updateFPS));
  }

  public end(message: string) {
    alert(message);
    window.location.href = "/lobby";
  }
}