/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WalkingState.ts" />
/// <reference path="AttackingState.ts" />
/// <reference path="../Pathing.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var PursuingState = (function (_super) {
    __extends(PursuingState, _super);
    function PursuingState() {
        _super.apply(this, arguments);
    }
    PursuingState.Instance = function () {
        if (PursuingState.instance == null) {
            PursuingState.instance = new PursuingState();
        }
        return PursuingState.instance;
    };

    PursuingState.prototype.Enter = function (unit) {
        unit.path = Pathing.aStar(unit.loc, unit.target, unit);
        unit.prevTar = unit.target;
        unit.moveTimer = unit.moveSpeed;
    };

    PursuingState.prototype.Execute = function (unit) {
        //if we don't have a unit to target, or we are no longer able to see that unit with any of our units
        //TODO: What if the unit we are pursuing dies???
        if ((!unit.unitTarget) || (!Utilities.canAnyUnitSeeEnemy(unit, unit.unitTarget))) {
            unit.ChangeState(WaitingState.Instance()); //stop pursing
        } else if (PursuingState.Instance().enemyInRange(unit)) {
            unit.ChangeState(AttackingState.Instance()); //start fighting
        } else {
            unit.target = unit.unitTarget.loc;
            PursuingState.move(unit);
        }
    };

    PursuingState.prototype.Exit = function (unit) {
    };

    PursuingState.prototype.enemyInRange = function (unit) {
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            var neighbors = Utilities.neighbors(locs[l]);
            for (var n in neighbors) {
                var id = Game.getGridLoc(neighbors[n]);
                var enemy = Utilities.findUnit(id, Game.getUnits());
                if (enemy != null && enemy.player != unit.player) {
                    return true;
                }
            }
        }
        return false;
    };

    PursuingState.move = function (unit) {
        //update our walking art
        unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

        if (unit.moveTimer >= unit.moveSpeed) {
            //mark this units occuppied locs as unoccupied
            Game.unmarkGridLocs(unit);

            //if the unit has a new target change our path
            if (unit.prevTar != unit.target) {
                console.log('TARGET MOVED!');
                unit.path = Pathing.aStar(unit.loc, unit.target, unit);
                unit.prevTar = unit.target;
            }

            unit.prevLoc = unit.loc;

            //if something now stands in the units path re-path around it
            var locs = Utilities.getOccupiedSquares(unit.path[0], unit.gridWidth, unit.gridHeight);
            for (var l in locs) {
                var gridLoc = Game.getGridLoc(locs[l]);
                if (gridLoc != unit.id && gridLoc != null) {
                    unit.path = Pathing.aStar(unit.loc, unit.path[unit.path.length - 1], unit);
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
    return PursuingState;
})(State);
