/// <reference path="unit.ts" />
var Action = (function () {
    function Action(target, unit, shift) {
        this.target = target;
        this.unit = unit;
        this.shift = shift;
    }
    Action.prototype.getTarget = function () {
        return this.target;
    };

    Action.prototype.getUnit = function () {
        return this.unit;
    };
    return Action;
})();
