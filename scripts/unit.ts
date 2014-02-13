/// <reference path="BaseGameEntity.ts" />
/// <reference path="State.ts" />
/// <reference path="states/WaitingState.ts" />
/// <reference path="states/WalkingState.ts" />

class Unit extends BaseGameEntity {
  currentState: State;

  loc: number;
  prevLoc: number;
  x: number;
  y: number;
  w: number;
  h: number;
  player: string;
  imageX: number;
  imageY: number;
  imageW: number;
  imageH: number;
  target: number;
  prevTar: number;
  inCombatWith: Unit = null;
  path = new Array();
  attackMax: number;
  attackMin: number;
  selected: boolean;
  sightRange: number = 175;
  attackRange: number = 75;
  totalHealth: number;
  health: number;
  attackSpeed: number;
  attackTimer: number;
  inCombat: boolean = false;
  animateTimer: number; 
  attackArtTimer: number;
  numberOfAnimations: number = 9;
  numberOfAttackAnimations: number = 6;
  src: string = '/images/knight.png';
  static image;
  static animationIncrememt: number = .1;
  static attackAnimationIncrememt: number = .2;

  direction: string = 'down';

  constructor(loc: number, player: string) {
    super();
    this.currentState = WaitingState.Instance();
    this.loc = loc;
    this.prevLoc = loc;
    var coords = utilities.boxToCoords(loc);
    this.x = coords.x;
    this.y = coords.y;
    this.player = player;
    this.attackTimer = 0;
    this.animateTimer = 0;
    this.attackArtTimer = 0;
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

  public getImage() {
    if (Unit.image) {
      return Unit.image;
    }
    else {
      Unit.image = new Image();
      Unit.image.onload = function () {
        return Unit.image;
      };
      Unit.image.src = this.src;
    }
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
        return { x: this.imageX + Math.floor(this.attackArtTimer) * this.imageW, y: this.imageY + 256 }
      }
      return { x: this.imageX + Math.floor(this.animateTimer) * this.imageW, y: this.imageY }
    }
    if (this.direction == 'down') {
      if (attacking) {
        return { x: this.imageX + Math.floor(this.attackArtTimer) * this.imageW, y: this.imageY + 384 }
      }
      return { x: this.imageX + Math.floor(this.animateTimer) * this.imageW, y: this.imageY + this.imageH*2 }
    }
    if (this.direction == 'left') {
      if (attacking) {
        return { x: this.imageX + Math.floor(this.attackArtTimer) * this.imageW, y: this.imageY + 320 }
      }
      return { x: this.imageX + Math.floor(this.animateTimer) * this.imageW, y: this.imageY + this.imageH  }
    }
    if (this.direction == 'right') {
      if (attacking) {
        return { x: this.imageX + Math.floor(this.attackArtTimer) * this.imageW, y: this.imageY + 448 }
      }
      return { x: this.imageX + Math.floor(this.animateTimer) * this.imageW, y: this.imageY + this.imageH *3 }
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


