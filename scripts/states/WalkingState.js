/// <reference path="../State.ts" />
/// <reference path="WaitingState.ts" />
/// <reference path="../Pathing.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WalkingState = (function (_super) {
    __extends(WalkingState, _super);
    function WalkingState() {
        _super.apply(this, arguments);
    }
    WalkingState.Instance = function () {
        if (WalkingState.instance == null) {
            WalkingState.instance = new WalkingState();
        }
        return WalkingState.instance;
    };

    WalkingState.prototype.Enter = function (unit) {
        unit.path = Pathing.aStar(unit.loc, unit.target, unit);
        unit.prevTar = unit.target;
    };

    WalkingState.prototype.Execute = function (unit) {
        //update our walking art
        unit.animateTimer = (unit.animateTimer + Unit.animationIncrememt) % unit.numberOfAnimations;

        if (unit.path.length == 0) {
            unit.target = null;
            unit.prevLoc = unit.loc;
            unit.ChangeState(WaitingState.Instance());
        } else {
            WalkingState.move(unit);
        }
    };

    WalkingState.prototype.Exit = function (unit) {
    };

    WalkingState.move = function (unit) {
        //mark this units occuppied locs as unoccupied
        Game.unmarkGridLocs(unit);

        //if the unit has a new target change our path
        if (unit.prevTar != unit.target) {
            unit.path = Pathing.aStar(unit.loc, unit.target, unit);
            unit.prevTar = unit.target;
        }

        unit.prevLoc = unit.loc;

        //mark the old locs occupied by this unit as false
        var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
        for (var l in locs) {
            Game.setGridLoc(locs[l], null);
        }

        //if something now stands in the units path re-path around it
        var locs = utilities.getOccupiedSquares(unit.path[0], unit.w, unit.h);
        for (var l in locs) {
            var gridLoc = Game.getGridLoc(locs[l]);
            if (gridLoc != unit.id && gridLoc != null) {
                unit.path = Pathing.aStar(unit.loc, unit.path[unit.path.length - 1], unit);
                break;
            }
        }

        //try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
        var direction = utilities.getDirection(unit.loc, unit.path[0]);
        if (direction) {
            unit.setDirection(direction);
        }
        unit.loc = unit.path[0] || unit.loc;
        unit.path.shift();

        //mark the new locs occupied by this unit as true
        Game.markOccupiedGridLocs(unit);
    };
    return WalkingState;
})(State);
