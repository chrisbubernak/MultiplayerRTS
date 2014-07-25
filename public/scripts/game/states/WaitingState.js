﻿/// <reference path="../unit.ts" />
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

    WaitingState.prototype.Enter = function (unit) {
    };

    WaitingState.prototype.Execute = function (unit) {
        if (unit.target && (unit.unitTarget === null)) {
            unit.ChangeState(WalkingState.Instance()); //start walking there
        } else if (unit.target && unit.unitTarget) {
            unit.ChangeState(PursuingState.Instance());
        } else if (WaitingState.Instance().enemyInRange(unit)) {
            unit.ChangeState(AttackingState.Instance()); //start fighting
        } else if (WaitingState.Instance().enemyInSight(unit) !== null) {
            var unitTarget = WaitingState.Instance().enemyInSight(unit);
            unit.unitTarget = unitTarget;
            unit.target = unitTarget.loc;
            unit.ChangeState(PursuingState.Instance());
        }
    };

    WaitingState.prototype.Exit = function (unit) {
    };

    WaitingState.prototype.enemyInRange = function (unit) {
        var locs = utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
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

    WaitingState.prototype.enemyInSight = function (unit) {
        var topLeft = unit.loc - unit.targetAquireRange - Game.getNumOfCols() * unit.targetAquireRange;
        var width = unit.targetAquireRange * 2 + unit.gridWidth;
        var height = unit.targetAquireRange * 2 + unit.gridHeight;
        var locs = utilities.getOccupiedSquares(topLeft, width, height);
        for (var l in locs) {
            var neighbors = utilities.neighbors(locs[l]);
            for (var n in neighbors) {
                var id = Game.getGridLoc(neighbors[n]);
                var enemy = utilities.findUnit(id, Game.getUnits());
                if (enemy != null && enemy.player != unit.player) {
                    return enemy;
                }
            }
        }
        return null;
    };
    return WaitingState;
})(State);
