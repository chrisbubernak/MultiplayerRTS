/// <reference path="ICommand.ts" />
//this command is artificially issued to units when an enemy walks to close and they want to pursue that unit
//we have to differentiate between this and when a user explicitly gives out an attack command and wants
//a unit to keep attacking a specific enemy no matter what
var EngageCommand = (function () {
    function EngageCommand(enemy) {
        this.name = "engage";
        this.enemy = enemy;
    }
    EngageCommand.prototype.GetLocation = function () {
        return this.enemy.loc;
    };

    EngageCommand.prototype.ToString = function () {
        return this.name;
    };

    EngageCommand.prototype.GetTarget = function () {
        return this.enemy;
    };

    EngageCommand.prototype.SetTarget = function (enemy) {
        this.enemy = enemy;
    };
    return EngageCommand;
})();
