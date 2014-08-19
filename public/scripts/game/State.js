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

    State.prototype.specificEnemyInAttackRange = function (unit, enemy) {
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

    State.prototype.enemyInTargetAqureRange = function (unit) {
        var locs = Utilities.getGridLocsInTargetAquireRange(unit);

        locs.sort(function (a, b) {
            return Utilities.distance(a, unit.loc) - Utilities.distance(b, unit.loc);
        });

        for (var l in locs) {
            var id = Game.getGridLoc(locs[l]);
            var enemy = Utilities.findUnit(id, Game.getUnits());
            if (enemy != null && enemy.player != unit.player) {
                return enemy;
            }
        }
        return null;
    };

    State.prototype.specificEnemyInTargetAquireRange = function (unit, enemy) {
        var locs = Utilities.getGridLocsInTargetAquireRange(unit);
        for (var l in locs) {
            var id = Game.getGridLoc(locs[l]);
            if (id !== null && id === enemy.id) {
                return true;
            }
        }
        return false;
    };
    return State;
})();
//# sourceMappingURL=State.js.map
