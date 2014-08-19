/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WalkingState.ts" />
/// <reference path="AttackingState.ts" />
/// <reference path="PursuingState.ts" />
/// <reference path="../Pathing.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WaitingState = (function (_super) {
    __extends(WaitingState, _super);
    function WaitingState() {
        _super.apply(this, arguments);
    }
    WaitingState.Instance = function () {
        if (WaitingState.instance == null) {
            WaitingState.instance = new WaitingState();
        }
        return WaitingState.instance;
    };

    WaitingState.prototype.ToString = function () {
        return "WaitingState";
    };

    WaitingState.prototype.Enter = function (unit) {
    };

    WaitingState.prototype.Execute = function (unit) {
        //see if there is an enemy in sight
        var enemy = WaitingState.Instance().enemyInSight(unit);

        //if we recieve have a walk command, transition to walking
        if (unit.command && unit.command.ToString() === "walk") {
            unit.ChangeState(WalkingState.Instance());
        } else if (unit.command && unit.command.ToString() === "attack") {
            unit.ChangeState(PursuingState.Instance());
        } else if (enemy !== null) {
            //artificially issue an attack command to the unit
            unit.command = new AttackCommand(enemy);
        }
    };

    WaitingState.prototype.Exit = function (unit) {
        unit.newCommand = false;
    };

    WaitingState.prototype.enemyInRange = function (unit) {
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

    WaitingState.prototype.enemyInSight = function (unit) {
        var locs = Utilities.getGridLocsInTargetAquireRange(unit);
        for (var l in locs) {
            var neighbors = Utilities.neighbors(locs[l]);
            for (var n in neighbors) {
                var id = Game.getGridLoc(neighbors[n]);
                var enemy = Utilities.findUnit(id, Game.getUnits());
                if (enemy != null && enemy.player != unit.player) {
                    return enemy;
                }
            }
        }
        return null;
    };
    return WaitingState;
})(State);
