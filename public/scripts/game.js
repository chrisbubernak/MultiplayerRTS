var BaseGameEntity = (function () {
    function BaseGameEntity() {
        this.id = BaseGameEntity.NextValidId;
        BaseGameEntity.NextValidId++;
    }
    BaseGameEntity.prototype.Update = function () {
        alert("update not implemented!!!");
    };
    BaseGameEntity.NextValidId = 0;
    return BaseGameEntity;
})();
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
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var WalkingState = (function (_super) {
    __extends(WalkingState, _super);
    function WalkingState() {
        _super.apply(this, arguments);
    }
    WalkingState.Instance = function () {
        if (WalkingState.instance == null) {
            WalkingState.instance = new WalkingState();
        }
        return WalkingState.instance;
    };
    WalkingState.prototype.ToString = function () {
        return "WalkingState";
    };
    WalkingState.prototype.Enter = function (unit) {
        if (unit.command && unit.command.ToString() === "walk") {
            unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
            unit.moveTimer = unit.moveSpeed;
        }
    };

    WalkingState.prototype.Execute = function (unit) {
        var doneWalking = (unit.path.length === 0 && unit.moveTimer >= unit.moveSpeed);

        if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) {
            unit.ChangeState(WaitingState.Instance());
        } else if (doneWalking) {
            unit.command = null;
            unit.ChangeState(WaitingState.Instance());
        } else {
            WalkingState.move(unit);
        }
    };

    WalkingState.prototype.Exit = function (unit) {
        unit.prevLoc = unit.loc;
    };

    WalkingState.move = function (unit) {
        unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

        if (unit.moveTimer >= unit.moveSpeed) {
            Game.unmarkGridLocs(unit);

            unit.prevLoc = unit.loc;

            var locs = Utilities.getOccupiedSquares(unit.path[0], unit.gridWidth, unit.gridHeight);
            for (var l = 0; l < locs.length; l++) {
                var gridLoc = Game.getGridLoc(locs[l]);
                if (gridLoc !== unit.id && gridLoc !== null) {
                    unit.path = Pathing.aStarToLoc(unit.loc, unit.path[unit.path.length - 1], unit);
                    break;
                }
            }

            var direction = Utilities.getDirection(unit.loc, unit.path[0]);
            if (direction) {
                unit.setDirection(direction);
            }
            unit.loc = unit.path[0] || unit.loc;
            unit.path.shift();
            unit.moveTimer = 0;

            Game.markOccupiedGridLocs(unit);
        } else {
            unit.moveTimer++;
        }
    };
    return WalkingState;
})(State);
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
            AttackingState.Instance().attack(unit, enemy);
        }
    };

    AttackingState.prototype.Exit = function (unit) {
        unit.attackTimer = 0;
    };

    AttackingState.prototype.attack = function (attacker, defender) {
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

    AttackingState.prototype.getEnemy = function (unit, prefTarget) {
        var enemies = new Array();

        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l = 0; l < locs.length; l++) {
            var neighbors = Utilities.neighbors(locs[l]);
            for (var n = 0; n < neighbors.length; n++) {
                var id = Game.getGridLoc(neighbors[n]);
                var enemy = Utilities.findUnit(id, Game.getUnits());
                if (enemy !== null && enemy.player !== unit.player) {
                    if (prefTarget === null || id === prefTarget.id) {
                        return enemy;
                    }
                    enemies.push(enemy);
                }
            }
        }
        if (enemies.length === 0) {
            return null;
        }
        return enemies[0];
    };
    return AttackingState;
})(State);
var PursuingState = (function (_super) {
    __extends(PursuingState, _super);
    function PursuingState() {
        _super.apply(this, arguments);
    }
    PursuingState.Instance = function () {
        if (PursuingState.instance == null) {
            PursuingState.instance = new PursuingState();
        }
        return PursuingState.instance;
    };

    PursuingState.prototype.ToString = function () {
        return "PursuingState";
    };

    PursuingState.prototype.Enter = function (unit) {
        unit.path = Pathing.aStarToLoc(unit.loc, unit.command.GetLocation(), unit);
        unit.moveTimer = unit.moveSpeed;
    };

    PursuingState.prototype.Execute = function (unit) {
        if (unit.newCommand && !(unit.moveTimer >= unit.moveSpeed)) {
            PursuingState.move(unit);
            return;
        }

        if (unit.newCommand) {
            unit.ChangeState(WaitingState.Instance());
            return;
        }

        var enemy = unit.command.GetTarget();

        var engageCommand = unit.command.ToString() === "engage";
        var currentTargetInPursueRange = PursuingState.Instance().specificEnemyInTargetAquireRange(unit, enemy);
        var potentialTarget = PursuingState.Instance().enemyInTargetAqureRange(unit);

        var enemyIsAlive = Utilities.findUnit(enemy.id, Game.getUnits());

        var closeEnoughToAttack = enemyIsAlive && PursuingState.Instance().specificEnemyInAttackRange(unit, enemy);

        var canWeStillSeeEnemy = enemyIsAlive && Utilities.canAnyUnitSeeEnemy(unit, enemy);

        if (unit.newCommand && unit.moveTimer >= unit.moveSpeed) {
            unit.ChangeState(WaitingState.Instance());
        } else if (!canWeStillSeeEnemy && unit.moveTimer >= unit.moveSpeed) {
            unit.command = null;
            unit.ChangeState(WaitingState.Instance());
        } else if (closeEnoughToAttack && unit.moveTimer >= unit.moveSpeed) {
            unit.ChangeState(AttackingState.Instance());
        } else if (engageCommand && !currentTargetInPursueRange && potentialTarget) {
            unit.command.SetTarget(potentialTarget);
            PursuingState.move(unit);
        } else {
            PursuingState.move(unit);
        }
    };

    PursuingState.prototype.Exit = function (unit) {
        unit.prevLoc = unit.loc;
    };

    PursuingState.prototype.enemeyInTargetRange = function (unit, enemy) {
    };

    PursuingState.move = function (unit) {
        unit.animateTimer = (unit.animateTimer + 1) % unit.numberOfAnimations;

        if (unit.moveTimer >= unit.moveSpeed) {
            Game.unmarkGridLocs(unit);

            var enemy = unit.command.GetTarget();
            if (enemy.prevLoc !== enemy.loc) {
                unit.path = Pathing.aStarToLoc(unit.loc, enemy.loc, unit);
            }

            unit.prevLoc = unit.loc;

            var locs = Utilities.getOccupiedSquares(unit.path[0], unit.gridWidth, unit.gridHeight);
            for (var l = 0; l < locs.length; l++) {
                var gridLoc = Game.getGridLoc(locs[l]);
                if (gridLoc !== unit.id && gridLoc !== null) {
                    unit.path = Pathing.aStarToLoc(unit.loc, unit.path[unit.path.length - 1], unit);
                    break;
                }
            }

            var direction = Utilities.getDirection(unit.loc, unit.path[0]);
            if (direction) {
                unit.setDirection(direction);
            }
            unit.loc = unit.path[0] || unit.loc;
            unit.path.shift();
            unit.moveTimer = 0;

            Game.markOccupiedGridLocs(unit);
        } else {
            unit.moveTimer++;
        }
    };
    return PursuingState;
})(State);
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
        var enemy = WaitingState.Instance().enemyInTargetAqureRange(unit);

        if (unit.command && unit.command.ToString() === "walk") {
            unit.ChangeState(WalkingState.Instance());
        } else if (unit.command && (unit.command.ToString() === "attack" || unit.command.ToString() === "engage")) {
            unit.ChangeState(PursuingState.Instance());
        } else if (enemy !== null) {
            unit.command = new EngageCommand(enemy);
            unit.newCommand = true;
        }
    };

    WaitingState.prototype.Exit = function (unit) {
        unit.newCommand = false;
    };
    return WaitingState;
})(State);
var Coords = (function () {
    function Coords(x, y) {
        this.x = x;
        this.y = y;
    }
    return Coords;
})();
var Unit = (function (_super) {
    __extends(Unit, _super);
    function Unit(loc, player) {
        _super.call(this);
        this.path = new Array();
        this.sightRange = 8;
        this.targetAquireRange = 4;
        this.moveSpeed = 2;
        this.inCombat = false;
        this.numberOfAnimations = 9;
        this.numberOfAttackAnimations = 6;
        this.command = null;
        this.newCommand = false;
        this.direction = "down";
        this.currentState = WaitingState.Instance();
        this.loc = loc;
        this.prevLoc = loc;
        this.player = player;
        this.attackTimer = 0;
        this.animateTimer = 0;
        this.attackArtTimer = 0;
    }
    Unit.prototype.getImage = function () {
        alert("CANT CALL getIMAGE ON UNIT SUPERTYPE");
    };

    Unit.prototype.update = function () {
        if (this.currentState != null) {
            this.currentState.Execute(this);
        }
    };

    Unit.prototype.ChangeState = function (pNewState) {
        if (!this.currentState || !pNewState) {
            alert("Error changing state from " + this.currentState + " to " + pNewState);
        }

        this.currentState.Exit(this);

        this.currentState = pNewState;

        this.currentState.Enter(this);
    };

    Unit.prototype.setDirection = function (direction) {
        this.direction = direction;
    };

    Unit.prototype.getDrawCoordinates = function () {
        var moving = this.isMoving();
        var attacking = this.isAttacking();

        if (this.direction === "up") {
            if (attacking) {
                return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 256);
            }
            return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY);
        }
        if (this.direction === "down") {
            if (attacking) {
                return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 384);
            }
            return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY + this.imageH * 2);
        }
        if (this.direction === "left") {
            if (attacking) {
                return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 320);
            }
            return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY + this.imageH);
        }
        if (this.direction === "right") {
            if (attacking) {
                return new Coords(this.imageX + Math.floor(this.attackArtTimer) * this.imageW, this.imageY + 448);
            }
            return new Coords(this.imageX + Math.floor(this.animateTimer) * this.imageW, this.imageY + this.imageH * 3);
        }
    };

    Unit.prototype.isMoving = function () {
        return this.path.length > 0;
    };

    Unit.prototype.isAttacking = function () {
        if (this.attackTimer > 0) {
            return true;
        }
        return false;
    };
    Unit.animationIncrememt = .1;
    Unit.attackAnimationIncrememt = .2;
    return Unit;
})(BaseGameEntity);
var Knight = (function (_super) {
    __extends(Knight, _super);
    function Knight() {
        _super.apply(this, arguments);
        this.w = 30;
        this.h = 30;
        this.gridWidth = 2;
        this.gridHeight = 2;
        this.imageX = 0;
        this.imageY = 512;
        this.imageW = 64;
        this.imageH = 64;
        this.attackMax = 10;
        this.attackMin = 5;
        this.totalHealth = 100;
        this.health = this.totalHealth;
        this.attackSpeed = 10;
        this.src = "/images/knight.png";
    }
    Knight.prototype.getImage = function () {
        if (Knight.image) {
            return Knight.image;
        } else {
            Knight.image = new Image();
            Knight.image.onload = function () {
                return Knight.image;
            };
            Knight.image.src = this.src;
        }
    };
    return Knight;
})(Unit);
var TerrainTile = (function () {
    function TerrainTile() {
        this.imageW = 224;
        this.imageH = 224;
        this.imageY = 0;
        this.walkable = true;
    }
    TerrainTile.src = "/images/terrain.jpg";
    return TerrainTile;
})();

var WaterTile = (function (_super) {
    __extends(WaterTile, _super);
    function WaterTile() {
        _super.call(this);
        this.imageX = 448;
        this.type = "water";
        this.walkable = false;
    }
    return WaterTile;
})(TerrainTile);

var GrassTile = (function (_super) {
    __extends(GrassTile, _super);
    function GrassTile() {
        _super.call(this);
        this.imageX = 224;
        this.type = "grass";
    }
    return GrassTile;
})(TerrainTile);

var DirtTile = (function (_super) {
    __extends(DirtTile, _super);
    function DirtTile() {
        _super.call(this);
        this.imageX = 0;
        this.type = "dirt";
    }
    return DirtTile;
})(TerrainTile);
var Drawer = (function () {
    function Drawer(playerNumber, terrainCanvas, unitCanvas, fogCanvas, selectionCanvas, gameRunner) {
        this.UPDATE_FPS = 10;
        this.FPS = 60;
        this.GREEN = "#39FF14";
        this.RED = "#FF0000";
        this.HEALTH_BAR_OFFSET = 10;
        this.HEALTH_BAR_HEIGHT = 5;
        this.FOG = "black";
        this.playerNumber = playerNumber;
        this.gameRunner = gameRunner;
        this.terrainCanvas = terrainCanvas;
        this.unitCanvas = unitCanvas;
        this.fogCanvas = fogCanvas;
        this.selectionCanvas = selectionCanvas;
        this.updateDimensions(1, 1);

        this.terrainContext = terrainCanvas.getContext("2d");
        this.unitContext = unitCanvas.getContext("2d");
        this.fogContext = fogCanvas.getContext("2d");
        this.selectionContext = selectionCanvas.getContext("2d");

        Drawer.context = this;
    }
    Drawer.drawSquare = function (loc, color) {
        Drawer.context.drawSquare(loc, color);
    };

    Drawer.prototype.getTerrainContext = function () {
        return this.terrainContext;
    };

    Drawer.prototype.interpolate = function () {
        var units = Game.getUnits();
        for (var i = 0; i < units.length; i++) {
            var oldCoords = this.boxToCoords(units[i].prevLoc);
            var coords = this.boxToCoords(units[i].loc);
            units[i].x -= ((1 / (this.FPS / this.UPDATE_FPS)) * (oldCoords.x - coords.x)) / (units[i].moveSpeed + 1);
            units[i].y -= ((1 / (this.FPS / this.UPDATE_FPS)) * (oldCoords.y - coords.y)) / (units[i].moveSpeed + 1);
            if (units[i].prevLoc === units[i].loc) {
                units[i].x = coords.x;
                units[i].y = coords.y;
            }
        }
    };

    Drawer.prototype.updateDimensions = function (width, height) {
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        var calculatedWidth = $(window).height() * Game.getRatio();
        var calculatedHeight = $(window).width() / Game.getRatio();

        if (calculatedWidth > winWidth) {
            width = winWidth;
            height = calculatedHeight;
        } else if (calculatedHeight > winHeight) {
            width = calculatedWidth;
            height = winHeight;
        }
        this.boxSize = width / Game.getNumOfCols();

        this.terrainCanvas.width = width;
        this.terrainCanvas.height = height;
        this.unitCanvas.width = width;
        this.unitCanvas.height = height;
        this.fogCanvas.width = width;
        this.fogCanvas.height = height;
        this.selectionCanvas.width = width;
        this.selectionCanvas.height = height;

        this.canvasHeight = height;
        this.canvasWidth = width;

        this.boxSize = this.canvasWidth / Game.getNumOfCols();
        if (typeof (Game.getTerrainLoc(0)) != 'undefined') {
            this.drawTerrain();
        }
    };

    Drawer.prototype.getBoxWidth = function () {
        return this.boxSize;
    };

    Drawer.prototype.getBoxHeight = function () {
        return this.boxSize;
    };

    Drawer.prototype.drawUnits = function (units) {
        this.fogContext.globalCompositeOperation = 'source-over';
        this.fogContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.fogContext.fillStyle = this.FOG;
        this.fogContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.unitContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        for (var i = 0; i < units.length; i++) {
            if (this.gameRunner.STATEDEBUG) {
                this.drawStateText(units[i]);
            }

            if (units[i].player === this.playerNumber) {
                var coords = this.boxToCoords(units[i].loc);
                var x = coords.x;
                var y = coords.y;

                var r1 = units[i].sightRange * this.boxSize;
                var r2 = r1 + 40;
                var density = .4;

                if (this.gameRunner.DEBUG) {
                    this.drawUnitSightRange(units[i]);
                    this.drawUnitAquireTargetRange(units[i]);
                    this.drawUnitLocsOccupied(units[i]);
                }

                var radGrd = this.fogContext.createRadialGradient(x + this.unitWidth() / 2, y + this.unitHeight() / 2, r1, x + this.unitWidth() / 2, y + this.unitHeight() / 2, r2);
                radGrd.addColorStop(0, 'rgba( 0, 0, 0,  1 )');
                radGrd.addColorStop(density, 'rgba( 0, 0, 0, .1 )');
                radGrd.addColorStop(1, 'rgba( 0, 0, 0,  0 )');
                this.fogContext.globalCompositeOperation = "destination-out";
                this.fogContext.fillStyle = radGrd;
                this.fogContext.fillRect(x - r2, y - r2, r2 * 2, r2 * 2);
            }
            this.drawUnit(units[i]);
        }
        this.selectionContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    };

    Drawer.prototype.drawTerrain = function () {
        var src = TerrainTile.src;
        var image = new Image();
        var that = this;
        image.onload = function () {
            var gridSize = Game.getNumOfRows() * Game.getNumOfCols();
            for (var i = 0; i < gridSize; i++) {
                var tile = Game.getTerrainLoc(i);
                that.terrainContext.drawImage(image, tile.imageX, tile.imageY, tile.imageW, tile.imageH, that.boxToCoords(i).x, that.boxToCoords(i).y, that.boxSize, that.boxSize);
            }
        };
        image.src = src;
    };

    Drawer.prototype.boxToCoords = function (i) {
        var y = Math.floor(i / Game.getNumOfCols()) * this.boxSize;
        var x = i % Game.getNumOfCols() * this.boxSize;
        return { x: x, y: y };
    };

    Drawer.prototype.coordsToBox = function (x, y) {
        var newX = Math.floor((x % this.canvasWidth) / this.boxSize);
        var newY = Math.floor((y % this.canvasHeight) / this.boxSize);
        var boxNumber = newX + Game.getNumOfCols() * newY;
        return boxNumber;
    };

    Drawer.prototype.drawSquare = function (loc, color) {
        var coords = this.boxToCoords(loc);
        this.fogContext.fillStyle = color;
        this.fogContext.fillRect(coords.x, coords.y, this.boxSize, this.boxSize);
        this.unitContext.fillStyle = color;
        this.unitContext.fillRect(coords.x, coords.y, this.boxSize, this.boxSize);
    };

    Drawer.prototype.drawPathing = function (loc, color, val) {
        var coords = this.boxToCoords(loc);
        this.selectionContext.fillStyle = color;
        this.selectionContext.fillRect(coords.x, coords.y, this.boxSize, this.boxSize);
        this.selectionContext.fillStyle = "black";
        this.selectionContext.fillText(Math.round(val), coords.x, coords.y + this.boxSize / 2);
    };

    Drawer.prototype.drawSelect = function (selection) {
        this.selectionContext.globalAlpha = 0.3;
        this.selectionContext.fillStyle = this.GREEN;
        this.selectionContext.fillRect(selection.x, selection.y, selection.w, selection.h);
        this.selectionContext.globalAlpha = 1;
    };

    Drawer.prototype.drawGrid = function () {
        this.drawTerrain();
        this.terrainContext.strokeStyle = this.GREEN;
        for (var i = 0; i <= Game.getNumOfCols(); i++) {
            this.terrainContext.moveTo(i * this.boxSize, 0);
            this.terrainContext.lineTo(i * this.boxSize, this.canvasHeight);
            this.terrainContext.stroke();
        }
        for (var i = 0; i <= Game.getNumOfRows(); i++) {
            this.terrainContext.moveTo(0, i * this.boxSize);
            this.terrainContext.lineTo(this.canvasWidth, i * this.boxSize);
            this.terrainContext.stroke();
        }
    };

    Drawer.prototype.drawUnit = function (unit) {
        var x = null;
        var y = null;
        if (unit.x == null || unit.y == null || isNaN(unit.x) || isNaN(unit.y)) {
            var unitCoords = this.boxToCoords(unit.loc);
            unit.x = unitCoords.x;
            unit.y = unitCoords.y;
            console.log(unit.loc);
        }
        x = unit.x;
        y = unit.y;
        var coords = unit.getDrawCoordinates();
        if (typeof unit.getImage() !== "undefined") {
            this.unitContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x, y, this.unitWidth(), this.unitHeight());
        }
        if (unit.selected) {
            this.unitContext.beginPath();
            this.unitContext.strokeStyle = this.GREEN;
            this.unitContext.arc(x + this.unitWidth() / 2, y + this.unitHeight() / 2, Math.max(this.unitWidth(), this.unitHeight()) * .75, 0, 2 * Math.PI);
            this.unitContext.stroke();

            if (unit.command !== null) {
                this.drawSquare(unit.command.GetLocation(), 'red');
            }

            if (unit.command && unit.command.ToString() === "attack") {
                var targetUnit = unit.command.GetTarget();
                this.unitContext.beginPath();
                this.unitContext.strokeStyle = this.RED;
                this.unitContext.arc(targetUnit.x + this.unitWidth() / 2, targetUnit.y + this.unitHeight() / 2, Math.max(this.unitWidth(), this.unitHeight()) * .75, 0, 2 * Math.PI);
                this.unitContext.stroke();
            }
        }

        var percent = unit.health / unit.totalHealth;
        this.unitContext.fillStyle = "red";
        if (percent > .7) {
            this.unitContext.fillStyle = "green";
        } else if (percent > .4) {
            this.unitContext.fillStyle = "yellow";
        }
        this.unitContext.fillRect(x, y - this.HEALTH_BAR_OFFSET, this.unitWidth() * percent, this.HEALTH_BAR_HEIGHT);
        this.unitContext.fillStyle = "black";
        this.unitContext.fillRect(x + this.unitWidth() * percent, y - this.HEALTH_BAR_OFFSET, this.unitWidth() * (1 - percent), this.HEALTH_BAR_HEIGHT);
    };

    Drawer.prototype.unitWidth = function () {
        return this.boxSize * 2;
    };
    Drawer.prototype.unitHeight = function () {
        return this.boxSize * 2;
    };

    Drawer.prototype.drawUnitAquireTargetRange = function (unit) {
        var locs = Utilities.getGridLocsInTargetAquireRange(unit);
        for (var l in locs) {
            this.drawSquare(locs[l], "purple");
        }
    };

    Drawer.prototype.drawUnitSightRange = function (unit) {
        var locs = Utilities.getGridLocsInSightRange(unit);
        for (var l in locs) {
            this.drawSquare(locs[l], "orange");
        }
    };

    Drawer.prototype.drawUnitLocsOccupied = function (unit) {
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            this.drawSquare(locs[l], "red");
        }
    };

    Drawer.prototype.drawStateText = function (unit) {
        var text = unit.currentState.ToString();
        this.unitContext.fillStyle = "red";
        this.unitContext.fillText(text, unit.x, unit.y + this.HEALTH_BAR_OFFSET);
    };
    return Drawer;
})();
var Orc = (function (_super) {
    __extends(Orc, _super);
    function Orc() {
        _super.apply(this, arguments);
        this.w = 30;
        this.h = 30;
        this.gridWidth = 2;
        this.gridHeight = 2;
        this.imageX = 0;
        this.imageY = 512;
        this.imageW = 64;
        this.imageH = 64;
        this.attackMax = 13;
        this.attackMin = 5;
        this.totalHealth = 120;
        this.health = this.totalHealth;
        this.attackSpeed = 15;
        this.src = "/images/orc.png";
    }
    Orc.prototype.getImage = function () {
        if (Orc.image) {
            return Orc.image;
        } else {
            Orc.image = new Image();
            Orc.image.onload = function () {
                return Orc.image;
            };
            Orc.image.src = this.src;
        }
    };
    return Orc;
})(Unit);
var SelectionObject = (function () {
    function SelectionObject(sX, sY) {
        this.sX = sX;
        this.x = sX;
        this.sY = sY;
        this.y = sY;
        this.w = 0;
        this.h = 0;
        this.select = true;
    }
    return SelectionObject;
})();
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

    Action.prototype.getShifted = function () {
        return this.shift;
    };
    return Action;
})();
var WalkCommand = (function () {
    function WalkCommand(location) {
        this.name = "walk";
        this.location = location;
    }
    WalkCommand.prototype.GetLocation = function () {
        return this.location;
    };

    WalkCommand.prototype.ToString = function () {
        return this.name;
    };
    return WalkCommand;
})();
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
var Game = (function () {
    function Game(host, id, enemyId, gameId) {
        this.simTick = 0;
        this.winner = null;
        Game.map = new StripesMap();
        this.gameId = gameId;
        this.id = id;
        this.enemyId = enemyId;
        this.host = host;
        if (host) {
            this.playerNumber = 1;
        } else {
            this.playerNumber = 2;
        }
    }
    Game.prototype.setup = function () {
        Game.terrain = Game.map.GetTerrain();

        document.oncontextmenu = function () {
            return false;
        };

        Game.grid = new Array(Game.terrain.length);
        for (var g in Game.grid) {
            Game.grid[g] = null;
        }

        Game.units = Game.map.GetUnits();
        for (var u in Game.units) {
            Game.markOccupiedGridLocs(Game.units[u]);
        }
    };

    Game.prototype.isOver = function () {
        if (Game.getUnitsForPlayer(2).length === 0) {
            if (this.host) {
                this.winner = this.id;
            } else {
                this.winner = this.enemyId;
            }
            return true;
        } else if (Game.getUnitsForPlayer(1).length === 0) {
            if (this.host) {
                this.winner = this.enemyId;
            } else {
                this.winner = this.id;
            }
            return true;
        }

        return false;
    };

    Game.getGridLoc = function (index) {
        return Game.grid[index];
    };

    Game.setGridLoc = function (index, unitId) {
        Game.grid[index] = unitId;
    };

    Game.getTerrainLoc = function (index) {
        return Game.terrain[index];
    };

    Game.getNumOfCols = function () {
        return Game.map.GetNumberOfCols();
    };

    Game.getNumOfRows = function () {
        return Game.map.GetNumberOfRows();
    };

    Game.getRatio = function () {
        return Game.getNumOfCols() / Game.getNumOfRows();
    };

    Game.prototype.getPlayerNumber = function () {
        return this.playerNumber;
    };

    Game.prototype.getGridLoc = function (g) {
        return Game.grid[g];
    };

    Game.removeUnit = function (unit) {
        var id = unit.id;
        for (var i = 0; i < (length = Game.units.length); i++) {
            if (Game.units[i].id == id) {
                Game.units.splice(i, 1);
                Game.unmarkGridLocs(unit);
                return;
            }
        }
    };

    Game.removeUnitById = function (unitId) {
        var id = unitId;
        for (var i = 0; i < (length = Game.units.length); i++) {
            if (Game.units[i].id == id) {
                Game.unmarkGridLocs(Game.units[i]);
                Game.units.splice(i, 1);
                return;
            }
        }
    };

    Game.getUnits = function () {
        return Game.units;
    };

    Game.markOccupiedGridLocs = function (unit) {
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            Game.setGridLoc(locs[l], unit.id);
        }
    };

    Game.unmarkGridLocs = function (unit) {
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l in locs) {
            Game.setGridLoc(locs[l], null);
        }
    };

    Game.getUnitsForPlayer = function (playerNumber) {
        var myUnits = new Array();
        for (var u in Game.units) {
            var unit = Game.units[u];
            if (unit.player === playerNumber) {
                myUnits.push(unit);
            }
        }
        return myUnits;
    };

    Game.prototype.applyActions = function (actions, simTick) {
        for (var a in actions) {
            var action = new Action(actions[a].target, actions[a].unit, actions[a].shift);
            var unit = Utilities.findUnit(action.getUnit(), Game.units);
            if (unit != null) {
                var targetLoc = action.getTarget();
                if (Game.grid[targetLoc] != null) {
                    var unitTarget = Utilities.findUnit(Game.grid[targetLoc], Game.units);
                    var isEnemy = this.areEnemies(unit, unitTarget);
                    var isVisible = Utilities.canAnyUnitSeeEnemy(unit, unitTarget);
                    if (isEnemy && isVisible) {
                        unit.command = new AttackCommand(unitTarget);
                    } else if (isEnemy && !isVisible) {
                        unit.command = new WalkCommand(unitTarget.loc);
                    } else if (!isEnemy && isVisible) {
                    } else {
                        alert("WE HAVE A PROBLEM ....unable to issue a command...logic error somewhere");
                    }
                } else {
                    unit.command = new WalkCommand(targetLoc);
                }
                unit.newCommand = true;
            }
        }
        this.simTick++;
    };

    Game.prototype.getSimTick = function () {
        return this.simTick;
    };

    Game.prototype.update = function () {
        for (var i = Game.units.length - 1; i >= 0; i--) {
            Game.units[i].update();
        }
    };

    Game.prototype.getMousePos = function (canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    Game.prototype.unselectAll = function () {
        for (var u in Game.getUnits()) {
            Game.units[u].selected = false;
        }
    };

    Game.prototype.areEnemies = function (unit1, unit2) {
        if (unit1.player !== unit2.player) {
            return true;
        }
    };
    Game.terrain = [];

    Game.grid = [];
    Game.units = new Array();
    return Game;
})();
var Utilities = (function () {
    function Utilities() {
    }
    Utilities.minIndex = function (array) {
        var min = array[0];
        var minIndex = 0;
        for (var i = 0; i < array.length; i++) {
            if (array[i] != null && array[i] < min) {
                min = array[i];
                minIndex = i;
            }
        }
        return minIndex;
    };

    Utilities.distance = function (a, b) {
        var x1 = (a % Game.getNumOfCols());
        var y1 = Math.floor(a / Game.getNumOfCols());
        var x2 = (b % Game.getNumOfCols());
        var y2 = Math.floor(b / Game.getNumOfCols());
        return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
    };

    Utilities.findUnit = function (id, units) {
        for (var i = 0; i < units.length; i++) {
            if (units[i].id === id) {
                return units[i];
            }
        }
        return null;
    };

    Utilities.collides = function (i, j) {
        return i.x < j.x + j.w && i.x + i.w > j.x && i.y < j.y + j.h && i.y + i.h > j.y;
    };

    Utilities.random = function () {
        var x = Math.sin(Utilities.SEED++) * 10000;
        return x - Math.floor(x);
    };

    Utilities.getOccupiedSquares = function (loc, width, height) {
        var locs = new Array();
        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                if (loc + (i * Game.getNumOfCols()) + j < (Game.getNumOfRows() * Game.getNumOfCols())) {
                    locs.push(loc + (i * Game.getNumOfCols()) + j);
                }
            }
        }
        return locs;
    };

    Utilities.getDirection = function (loc1, loc2) {
        if (loc1 < loc2) {
            if ((loc1 % Game.getNumOfCols()) <= (loc2 % Game.getNumOfCols())) {
                return "right";
            }
            return "down";
        } else {
            if (Math.floor(loc1 / Game.getNumOfCols()) > Math.floor(loc2 / Game.getNumOfCols())) {
                return "up";
            }
            return "left";
        }
        console.log("ERROR: Utilities.getDirection() did not set a direction");
    };

    Utilities.getGridLocsInSightRange = function (unit) {
        var topRow = Math.floor((unit.loc - unit.sightRange * Game.getNumOfCols()) / Game.getNumOfCols());
        var bottomRow = Math.floor((unit.loc + unit.gridHeight / 2 + unit.sightRange * Game.getNumOfCols()) / Game.getNumOfCols());
        var leftCol = (unit.loc - unit.sightRange) % Game.getNumOfCols();
        var unitLeftCol = (unit.loc % Game.getNumOfCols());
        var rightCol = (unit.loc + unit.gridWidth / 2 + unit.sightRange) % Game.getNumOfCols();
        var unitRightCol = (unit.loc % Game.getNumOfCols());

        if (topRow < 0) {
            topRow = 0;
        }
        if (bottomRow > Game.getNumOfRows()) {
            bottomRow = Game.getNumOfRows() - 1;
        }
        if (leftCol > unitLeftCol) {
            leftCol = 0;
        }
        if (rightCol < unitRightCol) {
            rightCol = Game.getNumOfCols() - 1;
        }

        var topLeft = topRow * Game.getNumOfCols() + leftCol;
        var width = rightCol - leftCol + 1;
        var height = bottomRow - topRow + 1;

        return Utilities.getOccupiedSquares(topLeft, width, height);
    };

    Utilities.getGridLocsInTargetAquireRange = function (unit) {
        var topRow = Math.floor((unit.loc - unit.targetAquireRange * Game.getNumOfCols()) / Game.getNumOfCols());
        var bottomRow = Math.floor((unit.loc + unit.gridHeight / 2 + unit.targetAquireRange * Game.getNumOfCols()) / Game.getNumOfCols());
        var leftCol = (unit.loc - unit.targetAquireRange) % Game.getNumOfCols();
        var unitLeftCol = (unit.loc % Game.getNumOfCols());
        var rightCol = (unit.loc + unit.gridWidth / 2 + unit.targetAquireRange) % Game.getNumOfCols();
        var unitRightCol = (unit.loc % Game.getNumOfCols());

        if (topRow < 0) {
            topRow = 0;
        }
        if (bottomRow > Game.getNumOfRows()) {
            bottomRow = Game.getNumOfRows() - 1;
        }
        if (leftCol > unitLeftCol) {
            leftCol = 0;
        }
        if (rightCol < unitRightCol) {
            rightCol = Game.getNumOfCols() - 1;
        }

        var topLeft = topRow * Game.getNumOfCols() + leftCol;
        var width = rightCol - leftCol + 1;
        var height = bottomRow - topRow + 1;

        return Utilities.getOccupiedSquares(topLeft, width, height);
    };

    Utilities.canAnyUnitSeeEnemy = function (unit, enemy) {
        var units = Game.getUnitsForPlayer(unit.player);
        for (var u = 0; u < units.length; u++) {
            var locs = Utilities.getGridLocsInSightRange(units[u]);
            for (var l = 0; l < locs.length; l++) {
                var id = Game.getGridLoc(locs[l]);
                if (id === enemy.id) {
                    return true;
                }
            }
        }
        return false;
    };

    Utilities.areLocsOccupiedBySameUnit = function (loc1, loc2) {
        var id1 = Game.getGridLoc(loc1);
        if (typeof id1 === "undefined" || id1 == null) {
            return false;
        }
        var id2 = Game.getGridLoc(loc2);
        if (typeof id2 === "undefined" || id2 === null) {
            return false;
        }
        if (id1 === id2) {
            console.log("it worked? " + id1 + " " + id2);
            return true;
        }
        return false;
    };

    Utilities.neighbors = function (boxNumber) {
        var neighbors = new Array();

        if (boxNumber % Game.getNumOfCols() !== 0) {
            neighbors.push(boxNumber - 1);
        }

        if ((boxNumber + 1) % Game.getNumOfCols() !== 0) {
            neighbors.push(boxNumber + 1);
        }

        if (boxNumber >= Game.getNumOfCols()) {
            neighbors.push(boxNumber - Game.getNumOfCols());
        }

        if (boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
            neighbors.push(boxNumber + Game.getNumOfCols());
        }

        if (boxNumber % Game.getNumOfCols() !== 0 && boxNumber >= Game.getNumOfCols()) {
            neighbors.push(boxNumber - Game.getNumOfCols() - 1);
        }

        if (boxNumber % Game.getNumOfCols() !== 0 && boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
            neighbors.push(boxNumber + Game.getNumOfCols() - 1);
        }

        if ((boxNumber + 1) % Game.getNumOfCols() !== 0 && boxNumber >= Game.getNumOfCols()) {
            neighbors.push(boxNumber - Game.getNumOfCols() + 1);
        }

        if ((boxNumber + 1) % Game.getNumOfCols() !== 0 && boxNumber < Game.getNumOfCols() * (Game.getNumOfRows() - 1)) {
            neighbors.push(boxNumber + Game.getNumOfCols() + 1);
        }
        return neighbors;
    };
    Utilities.SEED = 3;
    return Utilities;
})();
var PriorityQueue = (function () {
    function PriorityQueue() {
        this.array = new Array();
        this.array.push({});
    }
    PriorityQueue.prototype.indexOf = function (val) {
        for (var i = 1; i < this.array.length; i++) {
            if (this.array[i].val === val) {
                return i;
            }
        }
        return -1;
    };

    PriorityQueue.prototype.update = function (val, newPriority) {
        var index = this.indexOf(val);
        if (index === -1) {
            return;
        }

        var oldPriority = this.array[index].priority;
        this.array[index].priority = newPriority;
        if (newPriority > oldPriority) {
            this.bubbleDown(index);
        } else if (newPriority < oldPriority) {
            this.bubbleUp(index);
        }
    };

    PriorityQueue.prototype.isEmpty = function () {
        if (this.array.length > 1) {
            return false;
        }
        return true;
    };

    PriorityQueue.prototype.enqueue = function (val, priority) {
        var last = this.array.push({ val: val, priority: priority }) - 1;
        this.bubbleUp(last);
    };

    PriorityQueue.prototype.dequeue = function () {
        if (this.isEmpty()) {
            return null;
        }
        var min = this.array[1].val;
        var last = this.array.length - 1;
        this.array[1] = this.array[last];
        this.array.splice(last, 1);
        this.bubbleDown(1);
        return min;
    };

    PriorityQueue.prototype.parent = function (index) {
        return Math.floor(index / 2);
    };

    PriorityQueue.prototype.leftChild = function (index) {
        return index * 2;
    };

    PriorityQueue.prototype.rightChild = function (index) {
        return index * 2 + 1;
    };

    PriorityQueue.prototype.bubbleUp = function (index) {
        var cur = index;
        var parent = this.parent(cur);
        while (cur !== 1 && this.array[cur].priority < this.array[parent].priority) {
            var tempPriority = this.array[cur].priority;
            var tempVal = this.array[cur].val;
            this.array[cur].val = this.array[parent].val;
            this.array[cur].priority = this.array[parent].priority;
            this.array[parent].val = tempVal;
            this.array[parent].priority = tempPriority;
            cur = parent;
            parent = this.parent(parent);
        }
    };

    PriorityQueue.prototype.bubbleDown = function (index) {
        var cur = index;
        var left = this.leftChild(1);
        var right = this.rightChild(1);
        var tempVal;
        var tempPriority;
        while (this.array[left] != null) {
            if (this.array[right] == null) {
                if (this.array[left].priority < this.array[cur].priority) {
                    tempPriority = this.array[cur].priority;
                    tempVal = this.array[cur].val;
                    this.array[cur].val = this.array[left].val;
                    this.array[cur].priority = this.array[left].priority;
                    this.array[left].val = tempVal;
                    this.array[left].priority = tempPriority;
                    cur = left;
                } else {
                    break;
                }
            } else {
                if (this.array[left].priority <= this.array[right].priority && this.array[left].priority < this.array[cur].priority) {
                    tempPriority = this.array[cur].priority;
                    tempVal = this.array[cur].val;
                    this.array[cur].val = this.array[left].val;
                    this.array[cur].priority = this.array[left].priority;
                    this.array[left].val = tempVal;
                    this.array[left].priority = tempPriority;
                    cur = left;
                } else if (this.array[left].priority > this.array[right].priority && this.array[right].priority < this.array[cur].priority) {
                    tempPriority = this.array[cur].priority;
                    tempVal = this.array[cur].val;
                    this.array[cur].val = this.array[right].val;
                    this.array[cur].priority = this.array[right].priority;
                    this.array[right].val = tempVal;
                    this.array[right].priority = tempPriority;
                    cur = right;
                } else {
                    break;
                }
            }
            left = this.leftChild(cur);
            right = this.rightChild(cur);
        }
    };
    return PriorityQueue;
})();
var Pathing = (function () {
    function Pathing() {
    }
    Pathing.aStarToLoc = function (start, goal, unit) {
        var closedSet = new Array();
        var openSet = new PriorityQueue();
        var distanceToGoal = new PriorityQueue();
        var cameFrom = new Object();
        var gScore = new Object();
        var fScore = new Object();

        gScore[start] = 0;
        fScore[start] = gScore[start] + this.heuristic(start, goal);
        openSet.enqueue(start, fScore[start]);
        var cur;
        var nodesExplored = 0;
        var nodeThreshold = Game.getNumOfCols() * 2;
        while (!openSet.isEmpty() && nodesExplored < nodeThreshold) {
            nodesExplored++;
            cur = openSet.dequeue();

            if (cur == goal) {
                return this.getPath(cameFrom, goal, start);
            }

            closedSet.push(cur);
            var neighbors = Utilities.neighbors(cur);

            for (var i = neighbors.length - 1; i >= 0; i--) {
                var offGridRight = Math.floor(neighbors[i] / Game.getNumOfCols()) != Math.floor((neighbors[i] + unit.gridWidth - 1) / Game.getNumOfCols());
                var offGridBottom = neighbors[i] + (unit.gridHeight - 1) * Game.getNumOfCols() > Game.getNumOfCols() * Game.getNumOfRows();
                if (offGridRight || offGridBottom || (!Game.getTerrainLoc(neighbors[i]).walkable)) {
                    if (neighbors[i] == goal) {
                        var final = distanceToGoal.dequeue();
                        return this.getPath(cameFrom, final, start);
                    }
                    neighbors.splice(i, 1);
                    continue;
                }

                var locs = locs = Utilities.getOccupiedSquares(neighbors[i], unit.gridWidth, unit.gridHeight);
                for (var l in locs) {
                    var gridLoc = Game.getGridLoc(locs[l]);
                    var terrainLoc = Game.getTerrainLoc(locs[l]);

                    if ((gridLoc != unit.id && gridLoc != null) || !terrainLoc.walkable) {
                        if (neighbors[i] == goal) {
                            var final = distanceToGoal.dequeue();
                            return this.getPath(cameFrom, final || start, start);
                        }
                        neighbors.splice(i, 1);
                        break;
                    }
                }
            }

            for (var i = 0; i < neighbors.length; i++) {
                var t_gScore = gScore[cur] + Utilities.distance(cur, neighbors[i]);
                var heuristic = this.heuristic(neighbors[i], goal);
                var t_fScore = t_gScore + heuristic;
                distanceToGoal.enqueue(neighbors[i], heuristic);
                if ((closedSet.indexOf(neighbors[i]) != -1) && (t_fScore >= fScore[neighbors[i]])) {
                    continue;
                }
                if ((openSet.indexOf(neighbors[i]) == -1) || t_fScore < fScore[neighbors[i]]) {
                    cameFrom[neighbors[i]] = cur;

                    gScore[neighbors[i]] = t_gScore;
                    fScore[neighbors[i]] = t_fScore;
                    if (openSet.indexOf(neighbors[i]) == -1) {
                        openSet.enqueue(neighbors[i], fScore[neighbors[i]]);
                    } else {
                        openSet.update(neighbors[i], fScore[neighbors[i]]);
                    }
                }
            }
        }

        return this.getPath(cameFrom, distanceToGoal.dequeue(), start);
    };

    Pathing.getPath = function (cameFrom, cur, start) {
        var returnArray = new Array();
        while (cur != start) {
            returnArray.splice(0, 0, cur);
            cur = cameFrom[cur];
        }
        return returnArray;
    };

    Pathing.heuristic = function (a, b) {
        return Utilities.distance(a, b);
    };
    return Pathing;
})();
var Map1 = (function () {
    function Map1() {
        if (this.GetGridSize() !== this.GetTerrain().length) {
            alert('INVALID MAP DETECTED!');
        }
    }
    Map1.prototype.GetTerrain = function () {
        var terrain = [];
        for (var i = 0; i < 5000; i++) {
            terrain.push(new GrassTile());
        }
        return terrain;
    };

    Map1.prototype.GetUnits = function () {
        var u1 = new Knight(15, 1);
        var u2 = new Knight(315, 1);
        var u3 = new Knight(615, 1);
        var u4 = new Knight(915, 1);

        var u5 = new Orc(80, 2);
        var u6 = new Orc(380, 2);
        var u7 = new Orc(680, 2);
        var u8 = new Orc(980, 2);
        return [u1, u2, u3, u4, u5, u6, u7, u8];
    };

    Map1.prototype.GetGridSize = function () {
        return this.GetNumberOfCols() * this.GetNumberOfRows();
    };

    Map1.prototype.GetNumberOfCols = function () {
        return 100;
    };

    Map1.prototype.GetNumberOfRows = function () {
        return 50;
    };
    return Map1;
})();
var StripesMap = (function () {
    function StripesMap() {
        if (this.GetGridSize() !== this.GetTerrain().length) {
            alert('INVALID MAP DETECTED!');
        }
    }
    StripesMap.prototype.GetTerrain = function () {
        var terrain = [];
        for (var i = 0; i < 5000; i++) {
            if (i % 10 <= 5) {
                terrain.push(new DirtTile());
            } else {
                terrain.push(new GrassTile());
            }
        }
        return terrain;
    };

    StripesMap.prototype.GetUnits = function () {
        var u1 = new Knight(15, 1);
        var u2 = new Knight(315, 1);
        var u3 = new Knight(615, 1);
        var u4 = new Knight(915, 1);

        var u5 = new Orc(80, 2);
        var u6 = new Orc(380, 2);
        var u7 = new Orc(680, 2);
        var u8 = new Orc(980, 2);
        return [u1, u2, u3, u4, u5, u6, u7, u8];
    };

    StripesMap.prototype.GetGridSize = function () {
        return this.GetNumberOfCols() * this.GetNumberOfRows();
    };

    StripesMap.prototype.GetNumberOfCols = function () {
        return 100;
    };

    StripesMap.prototype.GetNumberOfRows = function () {
        return 50;
    };
    return StripesMap;
})();
var Mage = (function (_super) {
    __extends(Mage, _super);
    function Mage() {
        _super.apply(this, arguments);
    }
    return Mage;
})(Unit);
var LocalGameRunner = (function () {
    function LocalGameRunner() {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.actions = new Array();
        this.updateFPS = 10;
        this.FPS = 60;
        this.REAL_FPS = this.FPS;
        var id = "Human";
        var enemyId = "Computer";
        var gameId = "LocalGame";

        this.myGame = new Game(true, id, enemyId, gameId);

        this.drawer = new Drawer(1, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), this);

        this.run();

        var that = this;

        $(document).mousedown(function (e) {
            if (e.which === 1) {
                $(this).data("mousedown", true);
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.setSelection(coords);
                that.myGame.unselectAll();
            } else if (e.which === 3) {
                var units = Game.getUnits();
                for (var u = 0; u < units.length; u++) {
                    if (units[u].selected) {
                        var tar = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                        var a = new Action(that.drawer.coordsToBox(tar.x, tar.y), Game.getUnits()[u].id, that.shifted);
                        that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
                    }
                }
            }
        });

        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });

        $(document).mouseup(function (e) {
            $(this).data("mousedown", false);
        });

        $(document).mousemove(function (e) {
            if ($(this).data("mousedown")) {
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.updateSelection(that.selection, coords.x, coords.y);
            }
        });

        $(document).bind("keydown", function (e) {
            var code = e.keyCode || e.which;
            if (code === 71) {
                if (that.DRAWGRID) {
                    that.DRAWGRID = false;
                    that.drawer.drawTerrain();
                } else {
                    that.DRAWGRID = true;
                    that.drawer.drawGrid();
                }
            } else if (code === 68) {
                if (that.DEBUG) {
                    that.DEBUG = false;
                } else {
                    that.DEBUG = true;
                }
            } else if (code === 83) {
                if (that.STATEDEBUG) {
                    that.STATEDEBUG = false;
                } else {
                    that.STATEDEBUG = true;
                }
            }
            that.shifted = e.shiftKey;
            return true;
        });
    }
    LocalGameRunner.prototype.run = function () {
        this.myGame.setup();
        this.drawer.drawTerrain();

        var oldTime = new Date().getTime();
        var diffTime = 0;
        var newTime = 0;
        var oldTime2 = new Date().getTime();
        var diffTime2 = 0;
        var newTime2 = 0;

        var that = this;
        setInterval(function () {
            that.drawer.interpolate();
            that.drawer.drawUnits(Game.getUnits());
            that.drawSelect();
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        var fpsOut = document.getElementById("fps");

        setInterval(function () {
            if (that.myGame.isOver()) {
                that.end("Game is over!");
                return;
            }

            var currentSimTick = that.myGame.getSimTick();
            that.myGame.update();
            that.getSelection();

            that.myGame.applyActions(that.actions, currentSimTick);
            that.actions = new Array();

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            that.REAL_FPS = Math.round(1000 / diffTime);
            fpsOut.innerHTML = that.REAL_FPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
        }, 1000 / (that.updateFPS));
    };

    LocalGameRunner.prototype.drawSelect = function () {
        if ($(document).data("mousedown")) {
            this.drawer.drawSelect(this.selection);
        }
    };

    LocalGameRunner.prototype.setSelection = function (coords) {
        this.selection = new SelectionObject(coords.x, coords.y);
    };

    LocalGameRunner.prototype.updateSelection = function (selection, eX, eY) {
        selection.x = Math.min(selection.sX, eX);
        selection.y = Math.min(selection.sY, eY);
        selection.w = Math.abs(selection.sX - eX);
        selection.h = Math.abs(selection.sY - eY);
        return selection;
    };

    LocalGameRunner.prototype.end = function (message) {
        window.location.href = "/lobby";
    };

    LocalGameRunner.prototype.getSelection = function () {
        var that = this;
        if ($(document).data("mousedown")) {
            var selectionLoc = that.drawer.coordsToBox(that.selection.x, that.selection.y);
            var occupied = Utilities.getOccupiedSquares(selectionLoc, that.selection.w / that.drawer.getBoxWidth(), that.selection.h / that.drawer.getBoxHeight());
            for (var o = 0; o < occupied.length; o++) {
                var id = Game.getGridLoc(occupied[o]);
                if (id !== null && typeof id !== "undefined") {
                    var unit = Utilities.findUnit(id, Game.getUnits());
                    if (unit.player === that.myGame.getPlayerNumber()) {
                        unit.selected = true;
                    }
                }
            }
        }
    };
    return LocalGameRunner;
})();
var NetworkedGameRunner = (function () {
    function NetworkedGameRunner(id, enemyId, host, gameId) {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.actions = new Array();
        this.updateFPS = 10;
        this.FPS = 60;
        this.REAL_FPS = this.FPS;
        this.actionList = new Array();
        this.actionHistory = {};
        this.myId = id;
        this.gameId = gameId;
        this.peer = new Peer(id, { key: "vgs0u19dlxhqto6r" });
        this.myGame = new Game(host, id, enemyId, gameId);
        this.host = host;
        var playerNumber;
        if (this.host) {
            playerNumber = 1;
        } else {
            playerNumber = 2;
        }
        this.drawer = new Drawer(playerNumber, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), this);

        var that = this;

        $(document).mousedown(function (e) {
            if (e.which === 1) {
                $(this).data("mousedown", true);
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.setSelection(coords);
                that.myGame.unselectAll();
            } else if (e.which === 3) {
                var units = Game.getUnits();
                for (var u = 0; u < units.length; u++) {
                    if (units[u].selected) {
                        var tar = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                        var a = new Action(that.drawer.coordsToBox(tar.x, tar.y), Game.getUnits()[u].id, that.shifted);
                        that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
                    }
                }
            }
        });

        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });

        $(document).mouseup(function (e) {
            $(this).data("mousedown", false);
        });

        $(document).mousemove(function (e) {
            if ($(this).data("mousedown")) {
                var coords = that.myGame.getMousePos(document.getElementById("selectionCanvas"), e);
                that.updateSelection(that.selection, coords.x, coords.y);
            }
        });

        $(document).bind("keydown", function (e) {
            var code = e.keyCode || e.which;
            if (code === 71) {
                if (that.DRAWGRID) {
                    that.DRAWGRID = false;
                    that.drawer.drawTerrain();
                } else {
                    that.DRAWGRID = true;
                    that.drawer.drawGrid();
                }
            } else if (code === 68) {
                if (that.DEBUG) {
                    that.DEBUG = false;
                } else {
                    that.DEBUG = true;
                }
            }
            that.shifted = e.shiftKey;
            return true;
        });

        this.peer.on("error", function (err) {
            console.log("error connecting!");
            console.log(err);
        });

        this.peer.on("open", function () {
            console.log("peer is open!");

            if (host) {
                console.log("im initiating a connection");

                that.conn = that.peer.connect(enemyId, { reliable: true });
                that.conn.on("open", function () {
                    that.conn.send("Hey from player: " + id);
                    that.run();
                });
                that.conn.on("close", function () {
                    console.log("connection closed!");
                    that.end("Enemy Quit");
                });
                that.conn.on("data", function (data) {
                    if (!(typeof (data.simTick) === "undefined")) {
                        that.actionList[data.simTick] = data.actions;
                    }
                });
            } else {
                console.log("im waiting for a connection");

                that.peer.on("connection", function (conn) {
                    that.conn = conn;
                    console.log("client " + conn);
                    that.conn.on("open", function () {
                        that.conn.send("Hey from player: " + id);
                        that.run();
                    });
                    that.conn.on("close", function () {
                        console.log("connection closed!");
                        that.end("Enemy Quit");
                    });
                    that.conn.on("data", function (data) {
                        if (!(typeof (data.simTick) === "undefined")) {
                            that.myGame.applyActions(data.actions, data.simTick);
                            if (data.actions.length > 0) {
                                that.actionHistory[data.simTick] = data.actions;
                            }
                        }
                    });
                });
            }
        });
    }
    NetworkedGameRunner.prototype.run = function () {
        this.myGame.setup();
        this.drawer.drawTerrain();

        var oldTime = new Date().getTime();
        var diffTime = 0;
        var newTime = 0;
        var oldTime2 = new Date().getTime();
        var diffTime2 = 0;
        var newTime2 = 0;

        var that = this;
        setInterval(function () {
            that.drawer.interpolate();
            that.drawer.drawUnits(Game.getUnits());
            that.drawSelect();
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        var fpsOut = document.getElementById("fps");
        var intervalId = setInterval(function () {
            if (that.myGame.isOver()) {
                that.end("Game is over!");
                clearInterval(intervalId);
            }

            var currentSimTick = that.myGame.getSimTick();
            that.myGame.update();
            that.getSelection();

            if (!that.host) {
                that.conn.send({ actions: that.actions, simTick: currentSimTick });
                that.actions = new Array();
            } else if (that.host && that.actionList[currentSimTick]) {
                that.actions = that.actions.concat(that.actionList[currentSimTick]);
                that.conn.send({ actions: that.actions, simTick: currentSimTick });
                that.myGame.applyActions(that.actions, currentSimTick);
                if (that.actions.length > 0) {
                    that.actionHistory[currentSimTick] = that.actions;
                }
                that.actions = new Array();
            }

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            that.REAL_FPS = Math.round(1000 / diffTime);
            fpsOut.innerHTML = that.REAL_FPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
        }, 1000 / (that.updateFPS));
    };

    NetworkedGameRunner.prototype.drawSelect = function () {
        if ($(document).data("mousedown")) {
            this.drawer.drawSelect(this.selection);
        }
    };

    NetworkedGameRunner.prototype.setSelection = function (coords) {
        this.selection = new SelectionObject(coords.x, coords.y);
    };

    NetworkedGameRunner.prototype.updateSelection = function (selection, eX, eY) {
        selection.x = Math.min(selection.sX, eX);
        selection.y = Math.min(selection.sY, eY);
        selection.w = Math.abs(selection.sX - eX);
        selection.h = Math.abs(selection.sY - eY);
        return selection;
    };

    NetworkedGameRunner.prototype.end = function (message) {
        this.sendGameReportToServer();
        window.location.href = "/lobby";
    };

    NetworkedGameRunner.prototype.sendGameReportToServer = function () {
        console.log(this.actionHistory);

        var that = this;
        $.ajax({
            url: "/gameEnd",
            type: "POST",
            data: {
                gameId: that.gameId,
                reporter: that.myId,
                winner: that.myGame.winner,
                actions: JSON.stringify(that.actionHistory)
            },
            success: function (data, textStatus, jqXHR) {
                alert("SUCCESS");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("ERR");
            }
        });
    };

    NetworkedGameRunner.prototype.getSelection = function () {
        var that = this;
        if ($(document).data("mousedown")) {
            var selectionLoc = that.drawer.coordsToBox(that.selection.x, that.selection.y);
            var occupied = Utilities.getOccupiedSquares(selectionLoc, that.selection.w / that.drawer.getBoxWidth(), that.selection.h / that.drawer.getBoxHeight());
            for (var o = 0; o < occupied.length; o++) {
                var id = Game.getGridLoc(occupied[o]);
                if (id != null) {
                    var unit = Utilities.findUnit(id, Game.getUnits());
                    if (unit.player === that.myGame.getPlayerNumber()) {
                        unit.selected = true;
                    }
                }
            }
        }
    };
    return NetworkedGameRunner;
})();
var ReplayGameRunner = (function () {
    function ReplayGameRunner(actions) {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.actions = new Array();
        this.FPS = 60;
        this.REAL_FPS = this.FPS;
        this.updateFPS = 10;
        console.log(actions);
        this.actions = actions;

        var id = "test";

        this.myGame = new Game(true, id, "enemyId", "gameId");

        this.drawer = new Drawer(1, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), this);

        this.run();

        var that = this;
        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });
    }
    ReplayGameRunner.prototype.run = function () {
        this.myGame.setup();
        this.drawer.drawTerrain();

        var oldTime = new Date().getTime();
        var diffTime = 0;
        var newTime = 0;
        var oldTime2 = new Date().getTime();
        var diffTime2 = 0;
        var newTime2 = 0;

        var that = this;
        setInterval(function () {
            that.drawer.interpolate();
            that.drawer.drawUnits(Game.getUnits());
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        var fpsOut = document.getElementById("fps");

        setInterval(function () {
            if (that.myGame.isOver()) {
                that.end("Game is over!");
                return;
            }

            var currentSimTick = that.myGame.getSimTick();
            that.myGame.update();

            that.myGame.applyActions(that.actions[currentSimTick], currentSimTick);

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            that.REAL_FPS = Math.round(1000 / diffTime);
            fpsOut.innerHTML = that.REAL_FPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps";
        }, 1000 / (that.updateFPS));
    };

    ReplayGameRunner.prototype.end = function (message) {
        alert(message);
        window.location.href = "/lobby";
    };
    return ReplayGameRunner;
})();
