/// <reference path="ICommand.ts" />
var AttackCommand = (function () {
    function AttackCommand(enemy) {
        this.name = "attack";
        this.enemy = enemy;
    }
    AttackCommand.prototype.GetLocation = function () {
        return this.enemy.loc;
    };

    AttackCommand.prototype.ToString = function () {
        return this.name;
    };

    AttackCommand.prototype.GetTarget = function () {
        return this.enemy;
    };
    return AttackCommand;
})();
