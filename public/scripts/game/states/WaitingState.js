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

    WaitingState.prototype.Enter = function (unit) {
    };

    WaitingState.prototype.Execute = function (unit) {
        if (unit.target) {
            unit.ChangeState(WalkingState.Instance()); //start walking there
        } else if (WaitingState.Instance().enemyInRange(unit)) {
            unit.ChangeState(AttackingState.Instance()); //start fighting
        }
    };

    WaitingState.prototype.Exit = function (unit) {
    };

    WaitingState.prototype.enemyInRange = function (unit) {
        var locs = utilities.getOccupiedSquares(unit.loc, unit.w, unit.h);
        for (var l in locs) {
            var neighbors = utilities.neighbors(locs[l]);
            for (var n in neighbors) {
                var id = Game.getGridLoc(neighbors[n]);
                var enemy = utilities.findUnit(id, Game.getUnits());
                if (enemy != null && enemy.player != unit.player) {
                    return true;
                }
            }
        }
        return false;
    };
    return WaitingState;
})(State);
