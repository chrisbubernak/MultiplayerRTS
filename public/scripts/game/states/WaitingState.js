/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WalkingState.ts" />
/// <reference path="AttackingState.ts" />
/// <reference path="PursuingState.ts" />
/// <reference path="../Pathing.ts" />
/// <reference path="../commands/EngageCommand.ts" />
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
        //see if there is an enemy in target aquire range
        var enemy = WaitingState.Instance().enemyInTargetAqureRange(unit);

        //if we recieve have a walk command, transition to walking
        if (unit.command && unit.command.ToString() === "walk") {
            unit.ChangeState(WalkingState.Instance());
        } else if (unit.command && (unit.command.ToString() === "attack" || unit.command.ToString() === "engage")) {
            unit.ChangeState(PursuingState.Instance());
        } else if (enemy !== null) {
            //artificially issue an engage command to the unit
            unit.command = new EngageCommand(enemy);
            unit.newCommand = true;
        }
    };

    WaitingState.prototype.Exit = function (unit) {
        unit.newCommand = false;
    };
    return WaitingState;
})(State);
