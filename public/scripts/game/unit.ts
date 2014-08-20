/// <reference path="BaseGameEntity.ts" />
/// <reference path="State.ts" />
/// <reference path="states/WaitingState.ts" />
/// <reference path="states/WalkingState.ts" />
/// <reference path="coords.ts" />
/// <reference path="commands/ICommand.ts" />

class Unit extends BaseGameEntity {
  currentState: State;

  loc: number;
  prevLoc: number;
  x: number;
  y: number;
  w: number; //refers to size of image...refactor me!!
  h: number; //refers to size of image...refactor me!!
  gridWidth: number; //width in # of grid locs
  gridHeight: number; //height in #of  grid locs
  player: number; //e.g. 1, 2, 3....etc
  imageX: number;
  imageY: number;
  imageW: number;
  imageH: number;
  path = new Array();
  attackMax: number;
  attackMin: number;
  selected: boolean;
  sightRange: number = 8; //# of grid locs away unit can see (aka if it is 4 then unit has vision of a 16 unit square  
  targetAquireRange: number = 4; //# of grid locs away a unit will engage another unit from
  totalHealth: number;
  health: number;
  attackSpeed: number;
  moveSpeed: number = 2; //the number of update frames it takes for a unit to move from one grid loc to the next
  moveTimer: number;
  attackTimer: number;
  inCombat: boolean = false;
  animateTimer: number; 
  attackArtTimer: number;
  numberOfAnimations: number = 9;
  numberOfAttackAnimations: number = 6;
  command: ICommand = null;
  newCommand: boolean = false; //do we have a new command that we need to process?
  static animationIncrememt: number = .1;
  static attackAnimationIncrememt: number = .2;

  direction: string = 'down';

  constructor(loc: number, player: number) {
    super();
    this.currentState = WaitingState.Instance();
    this.loc = loc;
    this.prevLoc = loc;
    this.player = player;
    this.attackTimer = 0;
    this.animateTimer = 0;
    this.attackArtTimer = 0;
  }

  public getImage() {
  }

  public update() {
    if (this.currentState != null) {
      this.currentState.Execute(this);
    }
  }

  public ChangeState(pNewState: State) {
    //make sure both states are valid before attempting to call their methods
    if (!this.currentState || !pNewState) {
      alert('Error changing state from ' + this.currentState + ' to ' + pNewState);
    }

    //exit the old state
    this.currentState.Exit(this);

    //change state to new state
    this.currentState = pNewState;

    //call entry method on new state
    this.currentState.Enter(this);
  }



  public setDirection(direction: string) {
    this.direction = direction;
  }

  public getDrawCoordinates() {
    //only update animation if the unit is actually moving
    var moving = this.isMoving();
    var attacking = this.isAttacking();

    if (this.direction == 'up') {
      if (attacking) {
        return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 256);
      }
      return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY)
    }
    if (this.direction == 'down') {
      if (attacking) {
        return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 384);
      }
      return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY + this.imageH * 2);
    }
    if (this.direction == 'left') {
      if (attacking) {
        return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 320);
      }
      return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY + this.imageH);
    }
    if (this.direction == 'right') {
      if (attacking) {
        return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 448);
      }
      return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY + this.imageH * 3);
    }
  }

  private isMoving() {
    //right now the definition of moving is if your target array has values in it
    return this.path.length > 0;
  }

  private isAttacking() {
    if (this.attackTimer > 0) {
      return true;
    }
    return false;
  }
}


