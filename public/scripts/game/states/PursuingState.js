/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
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

    PursuingState.prototype.ToString = function () {
        return "PursuingState";
    };

    PursuingState.prototype.Enter = function (unit) {
        unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
        unit.moveTimer = unit.moveSpeed;
    };

    PursuingState.prototype.Execute = function (unit) {
        //TODO: If we start pursuing a unit and get an artificial attack command (now called engage) but then they run away and another unit is closer we should target that
        //just make sure we don't disregard an actual attack command
        if (unit.newCommand && !(unit.moveTimer >= unit.moveSpeed)) {
            PursuingState.move(unit);
            return;
        }

        if (unit.newCommand) {
            unit.ChangeState(WaitingState.Instance());
            return;
        }

        var enemy = unit.command.GetTarget();

        var engageCommand = unit.command.ToString() === "engage";
        var currentTargetInPursueRange = PursuingState.Instance().specificEnemyInTargetAquireRange(unit, enemy);
        var potentialTarget = PursuingState.Instance().enemyInTargetAqureRange(unit);

        var enemyIsAlive = Utilities.findUnit(enemy.id, Game.getUnits());

        //TODO: change this from specificenemyInrange -> specificenemyinattackrange
        var closeEnoughToAttack = enemyIsAlive && PursuingState.Instance().specificEnemyInRange(unit, enemy);

        var canWeStillSeeEnemy = enemyIsAlive && Utilities.canAnyUnitSeeEnemy(unit, enemy);

        if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) {
            unit.ChangeState(WaitingState.Instance());
        } else if (!canWeStillSeeEnemy && unit.moveTimer >= unit.moveSpeed) {
            unit.command = null;
            unit.ChangeState(WaitingState.Instance());
        } else if (closeEnoughToAttack && unit.moveTimer >= unit.moveSpeed) {
            unit.ChangeState(AttackingState.Instance());
        } else if (engageCommand && !currentTargetInPursueRange && potentialTarget) {
            //modify the engagecommandtohave the new target
            unit.command.SetTarget(potentialTarget);
            PursuingState.move(unit);
        } else {
            PursuingState.move(unit);
        }
    };

    PursuingState.prototype.Exit = function (unit) {
        unit.prevLoc = unit.loc;
    };

    PursuingState.prototype.enemeyInTargetRange = function (unit, enemy) {
    };

    PursuingState.move = function (unit) {
        //update our walking art
        unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

        if (unit.moveTimer >= unit.moveSpeed) {
            //mark this units occuppied locs as unoccupied
            Game.unmarkGridLocs(unit);

            //if the unit has a new target change our path
            var enemy = unit.command.GetTarget();
            if (enemy.prevLoc != enemy.loc) {
                unit.path = Pathing.aStarToLoc(unit.loc, enemy.loc, unit);
            }

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
    return PursuingState;
})(State);
