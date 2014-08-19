/// <reference path="../unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WaitingState.ts" />
/// <reference path="../Pathing.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AttackingState = (function (_super) {
    __extends(AttackingState, _super);
    function AttackingState() {
        _super.apply(this, arguments);
    }
    AttackingState.Instance = function () {
        if (AttackingState.instance == null) {
            AttackingState.instance = new AttackingState();
        }
        return AttackingState.instance;
    };

    AttackingState.prototype.ToString = function () {
        return "AttackingState";
    };

    AttackingState.prototype.Enter = function (unit) {
        unit.attackTimer = 0;
    };

    AttackingState.prototype.Execute = function (unit) {
        if (unit.newCommand) {
            unit.ChangeState(WaitingState.Instance());
            return;
        }

        unit.attackArtTimer = ((unit.attackTimer / unit.attackSpeed) * unit.numberOfAttackAnimations) % unit.numberOfAttackAnimations;
        var enemy = unit.command.GetTarget();

        var enemyIsAlive = Utilities.findUnit(enemy.id, Game.getUnits());

        var closeEnoughToAttack = enemyIsAlive && AttackingState.Instance().specificEnemyInAttackRange(unit, enemy);

        var canWeStillSeeEnemy = enemyIsAlive && Utilities.canAnyUnitSeeEnemy(unit, enemy);

        if (!canWeStillSeeEnemy && unit.attackTimer === 0) {
            unit.command = null;
            unit.ChangeState(WaitingState.Instance());
        } else if (!closeEnoughToAttack && unit.attackTimer === 0) {
            unit.ChangeState(PursuingState.Instance());
        } else {
            AttackingState.Instance().attack(unit, enemy); //attack them
        }
    };

    AttackingState.prototype.Exit = function (unit) {
        unit.attackTimer = 0;
    };

    AttackingState.prototype.attack = function (attacker, defender) {
        //try and figure out which way the unit is moving and change its direction, otherwise just leave it alone
        var direction = Utilities.getDirection(attacker.loc, defender.loc);
        if (direction) {
            attacker.setDirection(direction);
        }

        if (attacker.attackTimer >= attacker.attackSpeed) {
            if (AttackingState.Instance().specificEnemyInAttackRange(attacker, defender)) {
                var attackRange = attacker.attackMax - attacker.attackMin;
                var damage = Utilities.random() * attackRange + attacker.attackMin;
                defender.health -= damage;
                if (defender.health <= 0) {
                    Game.removeUnit(defender);
                }
            }
            attacker.attackTimer = 0;
        } else {
            attacker.attackTimer++;
        }
    };

    //returns an enemy to attack, will try and keep attacking same unit if a prefTarget is supplied
    AttackingState.prototype.getEnemy = function (unit, prefTarget) {
        var enemies = new Array();

        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            var neighbors = Utilities.neighbors(locs[l]);
            for (var n in neighbors) {
                var id = Game.getGridLoc(neighbors[n]);
                var enemy = Utilities.findUnit(id, Game.getUnits());
                if (enemy != null && enemy.player != unit.player) {
                    if (prefTarget == null || id == prefTarget.id) {
                        return enemy;
                    }
                    enemies.push(enemy);
                }
            }
        }
        if (enemies.length == 0) {
            return null;
        }
        return enemies[0];
    };
    return AttackingState;
})(State);
//# sourceMappingURL=AttackingState.js.map
