/// <reference path="BaseGameEntity.ts" />
/// <reference path="State.ts" />
/// <reference path="states/WaitingState.ts" />
/// <reference path="states/WalkingState.ts" />
/// <reference path="coords.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Unit = (function (_super) {
    __extends(Unit, _super);
    function Unit(loc, player) {
        _super.call(this);
        this.inCombatWith = null;
        this.path = new Array();
        this.sightRange = 175;
        this.attackRange = 75;
        this.moveSpeed = 2;
        this.inCombat = false;
        this.numberOfAnimations = 9;
        this.numberOfAttackAnimations = 6;
        this.direction = 'down';
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
    Unit.prototype.update = function () {
        if (this.currentState != null) {
            this.currentState.Execute(this);
        }
    };

    Unit.prototype.ChangeState = function (pNewState) {
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
    };

    Unit.prototype.setDirection = function (direction) {
        this.direction = direction;
    };

    Unit.prototype.getDrawCoordinates = function () {
        //only update animation if the unit is actually moving
        var moving = this.isMoving();
        var attacking = this.isAttacking();

        if (this.direction == 'up') {
            if (attacking) {
                return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 256);
            }
            return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY);
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
    };

    Unit.prototype.isMoving = function () {
        //right now the definition of moving is if your target array has values in it
        return this.path.length > 0;
    };

    Unit.prototype.isAttacking = function () {
        if (this.attackTimer > 0) {
            return true;
        }
        return false;
    };
    Unit.animationIncrememt = .1;
    Unit.attackAnimationIncrememt = .2;
    return Unit;
})(BaseGameEntity);
