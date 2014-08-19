/// <reference path="BaseGameEntity.ts" />
var State = (function () {
    function State() {
    }
    State.prototype.ToString = function () {
        return "State";
    };
    State.prototype.Enter = function (entity) {
        alert(this + " State Enter Function Not Implemented!");
    };
    State.prototype.Execute = function (entity) {
        alert(this + " State Enter Function Not Implemented!");
    };
    State.prototype.Exit = function (entity) {
        alert(this + " State Enter Function Not Implemented!");
    };

    State.prototype.specificEnemyInRange = function (unit, enemy) {
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            var neighbors = Utilities.neighbors(locs[l]);
            for (var n in neighbors) {
                var id = Game.getGridLoc(neighbors[n]);
                if (id === enemy.id) {
                    return true;
                }
            }
        }
        return false;
    };
    return State;
})();
//# sourceMappingURL=State.js.map
