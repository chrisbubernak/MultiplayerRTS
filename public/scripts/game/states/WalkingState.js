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
        unit.moveTimer = unit.moveSpeed;
    };

    WalkingState.prototype.Execute = function (unit) {
        //if we have an enemey targeted and one of our units can see them start pursuing
        /*if (!(unit.target && unit.unitTarget && WalkingState.Instance().canAnyUnitSeeEnemy(unit, unit.unitTarget))) {
        if (unit.unitTarget) {
        console.log(unit.target + " " + unit.unitTarget + " " + WalkingState.Instance().canAnyUnitSeeEnemy(unit, unit.unitTarget));
        }
        }
        if (unit.target && unit.unitTarget && WalkingState.Instance().canAnyUnitSeeEnemy(unit, unit.unitTarget)) {
        console.log('PURSUING');
        unit.ChangeState(PursuingState.Instance());
        }*/
        //make sure is path is empty and make sure we've finished interpolating (i.e that the move timer = movespeed)
        if (unit.path.length == 0 && unit.moveTimer >= unit.moveSpeed) {
            unit.target = null;
            unit.prevLoc = unit.loc;
            unit.ChangeState(WaitingState.Instance());
        } else {
            WalkingState.move(unit);
        }
    };

    WalkingState.prototype.Exit = function (unit) {
    };

    WalkingState.prototype.canAnyUnitSeeEnemy = function (unit, enemy) {
        //for each of my units check if they can see enemy
        var units = Game.getUnitsForPlayer(unit.player);
        for (var u in units) {
            var topLeft = unit.loc - unit.sightRange - Game.getNumOfCols() * unit.sightRange;
            var width = unit.sightRange * 2 + unit.gridWidth;
            var height = unit.sightRange * 2 + unit.gridHeight;
            var locs = utilities.getOccupiedSquares(topLeft, width, height);
            for (var l in locs) {
                var neighbors = utilities.neighbors(locs[l]);
                for (var n in neighbors) {
                    var id = Game.getGridLoc(neighbors[n]);
                    if (id === enemy.id) {
                        return true;
                    }
                }
            }
            return false;
        }
    };

    WalkingState.move = function (unit) {
        //update our walking art
        unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

        if (unit.moveTimer >= unit.moveSpeed) {
            //mark this units occuppied locs as unoccupied
            Game.unmarkGridLocs(unit);

            //if the unit has a new target change our path
            if (unit.prevTar != unit.target) {
                unit.path = Pathing.aStar(unit.loc, unit.target, unit);
                unit.prevTar = unit.target;
            }

            unit.prevLoc = unit.loc;

            //if something now stands in the units path re-path around it
            var locs = utilities.getOccupiedSquares(unit.path[0], unit.gridWidth, unit.gridHeight);
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
            unit.moveTimer = 0;

            //mark the new locs occupied by this unit as true
            Game.markOccupiedGridLocs(unit);
        } else {
            unit.moveTimer++;
        }
    };
    return WalkingState;
})(State);
