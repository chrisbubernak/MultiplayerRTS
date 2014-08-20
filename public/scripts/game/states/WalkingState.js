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
    WalkingState.prototype.ToString = function () {
        return "WalkingState";
    };
    WalkingState.prototype.Enter = function (unit) {
        if (unit.command && unit.command.ToString() === "walk") {
            unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
            unit.moveTimer = unit.moveSpeed;
        }
    };

    WalkingState.prototype.Execute = function (unit) {
        //if we have reached our location/our path length is 0
        var doneWalking = (unit.path.length == 0 && unit.moveTimer >= unit.moveSpeed);
        if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) {
            unit.ChangeState(WaitingState.Instance());
        } else if (doneWalking) {
            unit.command = null;
            unit.ChangeState(WaitingState.Instance());
        } else {
            WalkingState.move(unit);
        }
    };

    WalkingState.prototype.Exit = function (unit) {
        unit.prevLoc = unit.loc;
    };

    WalkingState.move = function (unit) {
        //update our walking art
        unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

        if (unit.moveTimer >= unit.moveSpeed) {
            //mark this units occuppied locs as unoccupied
            Game.unmarkGridLocs(unit);

            unit.prevLoc = unit.loc;

            //if something now stands in the units path re-path around it
            var locs = Utilities.getOccupiedSquares(unit.path[0], unit.gridWidth, unit.gridHeight);
            for (var l in locs) {
                var gridLoc = Game.getGridLoc(locs[l]);
                if (gridLoc != unit.id && gridLoc != null) {
                    unit.path = Pathing.aStarToLoc(unit.loc, unit.path[unit.path.length - 1], unit);
                    break;
                }
            }

            //try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
            var direction = Utilities.getDirection(unit.loc, unit.path[0]);
            if (direction) {
                unit.setDirection(direction);
            }
            unit.loc = unit.path[0] || unit.loc;
            unit.path.shift();
            unit.moveTimer = 0;

            //mark the new locs occupied by this unit as true
            Game.markOccupiedGridLocs(unit);
        } else {
            unit.moveTimer++;
        }
    };
    return WalkingState;
})(State);
