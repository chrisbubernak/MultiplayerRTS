var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
        this.type = "water";
        this.walkable = false;
        this.imageX = 448;
    }
    return WaterTile;
})(TerrainTile);

var GrassTile = (function (_super) {
    __extends(GrassTile, _super);
    function GrassTile() {
        _super.call(this);
        this.type = "grass";
        this.imageX = 224;
    }
    return GrassTile;
})(TerrainTile);

var DirtTile = (function (_super) {
    __extends(DirtTile, _super);
    function DirtTile() {
        _super.call(this);
        this.type = "dirt";
        this.imageX = 0;
    }
    return DirtTile;
})(TerrainTile);
var Coords = (function () {
    function Coords(x, y) {
        this.x = x;
        this.y = y;
    }
    return Coords;
})();
var Logger = (function () {
    function Logger() {
    }
    Logger.LogInColor = function (text, color) {
        var IS_DEBUG = true;
        if (IS_DEBUG) {
            var time = new Date();
            var timeString = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
            var newMessage = document.createElement("div");
            newMessage.innerHTML = timeString + " " + text;
            newMessage.classList.add("debugMessage");
            newMessage.style.color = color;

            document.body.appendChild(newMessage);

            Logger.Queue.push(newMessage);

            if (Logger.Queue.length > Logger.MaxQueueLength) {
                var stale = Logger.Queue.shift();
                document.body.removeChild(stale);
            }

            for (var i = 0; i < Logger.Queue.length; i++) {
                var cur = Logger.Queue[i];
                cur.style.top = (cur.offsetTop - 18) + "px";
            }
        }
    };

    Logger.Log = function (text) {
        Logger.LogInColor(text, "#7FFF00");
    };

    Logger.LogError = function (text) {
        Logger.LogInColor(text, "red");
    };

    Logger.LogInfo = function (text) {
        Logger.LogInColor(text, "yellow");
    };
    Logger.Queue = [];
    Logger.MaxQueueLength = 12;
    return Logger;
})();
var BaseGameEntity = (function () {
    function BaseGameEntity() {
        this.id = BaseGameEntity.nextValidId;
        BaseGameEntity.nextValidId++;
    }
    BaseGameEntity.prototype.Update = function () {
        Logger.LogError("update not implemented for BaseGameEntity");
    };
    BaseGameEntity.nextValidId = 0;
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
        for (var l = 0; l < locs.length; l++) {
            var neighbors = Utilities.neighbors(locs[l]);
            for (var n = 0; n < neighbors.length; n++) {
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

        for (var l = 0; l < locs.length; l++) {
            var id = Game.getGridLoc(locs[l]);
            var enemy = Utilities.findUnit(id, Game.getUnits());
            if (enemy !== null && enemy.player !== unit.player) {
                return enemy;
            }
        }
        return null;
    };

    State.prototype.specificEnemyInTargetAquireRange = function (unit, enemy) {
        var locs = Utilities.getGridLocsInTargetAquireRange(unit);
        for (var l = 0; l < locs.length; l++) {
            var id = Game.getGridLoc(locs[l]);
            if (id !== null && id === enemy.id) {
                return true;
            }
        }
        return false;
    };
    return State;
})();
var WalkingState = (function (_super) {
    __extends(WalkingState, _super);
    function WalkingState() {
        _super.apply(this, arguments);
    }
    WalkingState.Instance = function () {
        if (typeof WalkingState.instance === "undefined") {
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
            if (unit.command && unit.command.ToString() === "walk") {
                unit.ChangeState(WalkingState.Instance());
            } else if (unit.command && (unit.command.ToString() === "attack" || unit.command.ToString() === "engage")) {
                unit.ChangeState(PursuingState.Instance());
            }
        } else if (doneWalking) {
            unit.command = null;
            unit.ChangeState(WaitingState.Instance());
        } else {
            WalkingState.move(unit);
        }
    };

    WalkingState.prototype.Exit = function (unit) {
        unit.prevLoc = unit.loc;
        unit.newCommand = false;
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
        if (typeof AttackingState.instance === "undefined") {
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
    return AttackingState;
})(State);
var PursuingState = (function (_super) {
    __extends(PursuingState, _super);
    function PursuingState() {
        _super.apply(this, arguments);
    }
    PursuingState.Instance = function () {
        if (typeof PursuingState.instance === "undefined") {
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
        if (typeof WaitingState.instance === "undefined") {
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
var Unit = (function (_super) {
    __extends(Unit, _super);
    function Unit(loc, player) {
        _super.call(this);
        this.name = "Unit";
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
    Unit.prototype.getName = function () {
        return this.name;
    };

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
            alert("Error changing state from " + this.currentState.ToString() + " to " + pNewState);
        }

        this.currentState.Exit(this);

        this.currentState = pNewState;

        this.currentState.Enter(this);
    };

    Unit.prototype.setDirection = function (direction) {
        this.direction = direction;
    };

    Unit.prototype.getMenuDrawCoordinates = function () {
        return new Coords(this.imageX, this.imageY + this.imageH * 2);
    };

    Unit.prototype.getDrawCoordinates = function () {
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
var Rectangle = (function () {
    function Rectangle(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
    Rectangle.prototype.getLeft = function () {
        return this.left;
    };

    Rectangle.prototype.getRight = function () {
        return this.right;
    };

    Rectangle.prototype.getTop = function () {
        return this.top;
    };

    Rectangle.prototype.getBottom = function () {
        return this.bottom;
    };

    Rectangle.prototype.getWidth = function () {
        return Math.abs(this.left - this.right);
    };

    Rectangle.prototype.getHeight = function () {
        return Math.abs(this.top - this.bottom);
    };
    return Rectangle;
})();
var Drawer = (function () {
    function Drawer(playerNumber, terrainCanvas, unitCanvas, fogCanvas, selectionCanvas, menuCanvas, gameRunner) {
        this.UPDATE_FPS = 10;
        this.GREEN = "#39FF14";
        this.RED = "#FF0000";
        this.HEALTH_BAR_OFFSET = 10;
        this.HEALTH_BAR_HEIGHT = 5;
        this.FOG = "black";
        this.SCREEN_MOVE_DIST = 20;
        this.DIST_TO_TRIGGER_SCREEN_MOVE = 20;
        this.REAL_FPS = 60;
        this.playerNumber = playerNumber;
        this.gameRunner = gameRunner;
        this.terrainCanvas = terrainCanvas;
        this.unitCanvas = unitCanvas;
        this.fogCanvas = fogCanvas;
        this.selectionCanvas = selectionCanvas;
        this.menuCanvas = menuCanvas;
        this.updateDimensions(1, 1);

        this.terrainContext = terrainCanvas.getContext("2d");
        this.unitContext = unitCanvas.getContext("2d");
        this.fogContext = fogCanvas.getContext("2d");
        this.selectionContext = selectionCanvas.getContext("2d");
        this.menuContext = menuCanvas.getContext("2d");
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
            var oldCoords = this.mapLocToMapCoords(units[i].prevLoc);
            var coords = this.mapLocToMapCoords(units[i].loc);
            units[i].x -= ((1 / (this.REAL_FPS / this.UPDATE_FPS)) * (oldCoords.x - coords.x)) / (units[i].moveSpeed + 1);
            units[i].y -= ((1 / (this.REAL_FPS / this.UPDATE_FPS)) * (oldCoords.y - coords.y)) / (units[i].moveSpeed + 1);
            if (units[i].prevLoc === units[i].loc) {
                units[i].x = coords.x;
                units[i].y = coords.y;
            }
        }
    };

    Drawer.prototype.updateDimensions = function (width, height) {
        this.winWidth = $(window).width();
        this.winHeight = $(window).height();

        this.boxWidth = 30;
        this.boxHeight = 30;

        this.gameHeight = Game.getNumOfRows() * this.boxHeight;
        this.gameWidth = Game.getNumOfCols() * this.boxWidth;
        this.menuHeight = this.winHeight * 0.3;
        this.menuWidth = this.winWidth * 1.0;

        this.viewPort = new Rectangle(0, this.winWidth, 0, this.winHeight - this.menuHeight);

        this.terrainCanvas.width = this.winWidth;
        this.terrainCanvas.height = this.winHeight;
        this.unitCanvas.width = this.winWidth;
        this.unitCanvas.height = this.winHeight;
        this.fogCanvas.width = this.winWidth;
        this.fogCanvas.height = this.winHeight;
        this.selectionCanvas.width = this.winWidth;
        this.selectionCanvas.height = this.winHeight;

        this.menuCanvas.style.top = (this.winHeight - this.menuHeight) + "px";
        this.menuCanvas.width = this.menuWidth;
        this.menuCanvas.height = this.menuHeight;

        if (typeof (Game.getTerrainLoc(0)) !== "undefined") {
            this.drawTerrain();
        }
    };

    Drawer.prototype.getBoxWidth = function () {
        return this.boxWidth;
    };

    Drawer.prototype.getBoxHeight = function () {
        return this.boxHeight;
    };

    Drawer.prototype.drawUnits = function (units) {
        this.fogContext.globalCompositeOperation = "source-over";
        this.fogContext.clearRect(0, 0, this.gameWidth, this.gameHeight);
        this.fogContext.fillStyle = this.FOG;
        this.fogContext.fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.unitContext.clearRect(0, 0, this.gameWidth, this.gameHeight);
        for (var i = 0; i < units.length; i++) {
            if (this.gameRunner.STATEDEBUG) {
                this.drawStateText(units[i]);
            }

            if (units[i].player === this.playerNumber) {
                var coords = this.mapLocToScreenCoords(units[i].loc);
                var x = coords.x;
                var y = coords.y;

                var r1 = units[i].sightRange * Math.max(this.getBoxWidth(), this.getBoxHeight());
                var r2 = r1 + 40;
                var density = 0.4;

                if (this.gameRunner.DEBUG) {
                    this.drawUnitSightRange(units[i]);
                    this.drawUnitAquireTargetRange(units[i]);
                    this.drawUnitLocsOccupied(units[i]);
                }

                var radGrd = this.fogContext.createRadialGradient(x + this.unitWidth() / 2, y + this.unitHeight() / 2, r1, x + this.unitWidth() / 2, y + this.unitHeight() / 2, r2);
                radGrd.addColorStop(0, "rgba( 0, 0, 0,  1 )");
                radGrd.addColorStop(density, "rgba( 0, 0, 0, .1 )");
                radGrd.addColorStop(1, "rgba( 0, 0, 0,  0 )");
                this.fogContext.globalCompositeOperation = "destination-out";
                this.fogContext.fillStyle = radGrd;
                this.fogContext.fillRect(x - r2, y - r2, r2 * 2, r2 * 2);
            }
            this.drawUnit(units[i]);
        }
        this.selectionContext.clearRect(0, 0, this.gameWidth, this.gameHeight);
    };

    Drawer.prototype.drawTerrain = function () {
        this.terrainContext.clearRect(0, 0, this.gameWidth, this.gameHeight);

        var src = TerrainTile.src;
        var image = new Image();
        var that = this;
        image.onload = function () {
            var gridSize = Game.getNumOfRows() * Game.getNumOfCols();
            for (var i = 0; i < gridSize; i++) {
                var tile = Game.getTerrainLoc(i);
                that.terrainContext.drawImage(image, tile.imageX, tile.imageY, tile.imageW, tile.imageH, that.mapLocToScreenCoords(i).x, that.mapLocToScreenCoords(i).y, that.getBoxWidth(), that.getBoxHeight());
            }
        };
        image.src = src;
    };

    Drawer.prototype.mapCoordsToMapLoc = function (coords) {
        var newX = Math.floor(coords.x / this.getBoxWidth());
        var newY = Math.floor(coords.y / this.getBoxHeight());

        return newX + Game.getNumOfCols() * newY;
    };

    Drawer.prototype.screenCoordsToMapCoords = function (coords) {
        return new Coords(coords.x + this.viewPort.getLeft(), coords.y + this.viewPort.getTop());
    };

    Drawer.prototype.mapCoordsToScreenCoords = function (coords) {
        return new Coords(coords.x - this.viewPort.getLeft(), coords.y - this.viewPort.getTop());
    };

    Drawer.prototype.screenCoordsToMapLoc = function (coords) {
        return this.mapCoordsToMapLoc(this.screenCoordsToMapCoords(coords));
    };

    Drawer.prototype.mapLocToMapCoords = function (loc) {
        var y = Math.floor(loc / Game.getNumOfCols()) * this.getBoxHeight();
        var x = loc % Game.getNumOfCols() * this.getBoxWidth();
        return new Coords(x, y);
    };

    Drawer.prototype.mapLocToScreenCoords = function (loc) {
        return this.mapCoordsToScreenCoords(this.mapLocToMapCoords(loc));
    };

    Drawer.prototype.drawSquare = function (loc, color) {
        var coords = this.mapLocToScreenCoords(loc);
        this.fogContext.fillStyle = color;
        this.fogContext.fillRect(coords.x, coords.y, this.getBoxWidth(), this.getBoxHeight());
        this.unitContext.fillStyle = color;
        this.unitContext.fillRect(coords.x, coords.y, this.getBoxWidth(), this.getBoxHeight());
    };

    Drawer.prototype.drawPathing = function (loc, color, val) {
        var coords = this.mapLocToScreenCoords(loc);
        this.selectionContext.fillStyle = color;
        this.selectionContext.fillRect(coords.x, coords.y, this.getBoxWidth(), this.getBoxHeight());
        this.selectionContext.fillStyle = "black";
        this.selectionContext.fillText(Math.round(val), coords.x, coords.y + this.getBoxHeight() / 2);
    };

    Drawer.prototype.drawSelect = function (selection) {
        var screenCoords = this.mapCoordsToScreenCoords(new Coords(selection.x, selection.y));
        this.selectionContext.globalAlpha = 0.3;
        this.selectionContext.fillStyle = this.GREEN;
        this.selectionContext.fillRect(screenCoords.x, screenCoords.y, selection.w, selection.h);
        this.selectionContext.globalAlpha = 1;
    };

    Drawer.prototype.drawGrid = function () {
        Logger.LogInfo("Draw Grid is commented out");
    };

    Drawer.prototype.drawUnit = function (unit) {
        var x = null;
        var y = null;
        if (unit.x === null || unit.y === null || isNaN(unit.x) || isNaN(unit.y)) {
            var unitCoords = this.mapLocToScreenCoords(unit.loc);
            unit.x = unitCoords.x;
            unit.y = unitCoords.y;
        }
        var mapCoords = this.mapCoordsToScreenCoords(new Coords(unit.x, unit.y));
        x = mapCoords.x;
        y = mapCoords.y;
        var coords = unit.getDrawCoordinates();
        if (typeof unit.getImage() !== "undefined") {
            this.unitContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x, y, this.unitWidth(), this.unitHeight());
        }
        if (unit.selected) {
            this.unitContext.beginPath();
            this.unitContext.strokeStyle = this.GREEN;
            this.unitContext.arc(x + this.unitWidth() / 2, y + this.unitHeight() / 2, Math.max(this.unitWidth(), this.unitHeight()) * 0.75, 0, 2 * Math.PI);
            this.unitContext.stroke();

            if (unit.command !== null) {
                this.drawSquare(unit.command.GetLocation(), "red");
            }

            if (unit.command && unit.command.ToString() === "attack") {
                var targetUnit = unit.command.GetTarget();
                this.unitContext.beginPath();
                this.unitContext.strokeStyle = this.RED;
                this.unitContext.arc(targetUnit.x + this.unitWidth() / 2, targetUnit.y + this.unitHeight() / 2, Math.max(this.unitWidth(), this.unitHeight()) * 0.75, 0, 2 * Math.PI);
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
        return this.getBoxWidth() * 2;
    };
    Drawer.prototype.unitHeight = function () {
        return this.getBoxHeight() * 2;
    };

    Drawer.prototype.drawUnitAquireTargetRange = function (unit) {
        var locs = Utilities.getGridLocsInTargetAquireRange(unit);
        for (var l = 0; l < locs.length; l++) {
            this.drawSquare(locs[l], "purple");
        }
    };

    Drawer.prototype.drawUnitSightRange = function (unit) {
        var locs = Utilities.getGridLocsInSightRange(unit);
        for (var l = 0; l < locs.length; l++) {
            this.drawSquare(locs[l], "orange");
        }
    };

    Drawer.prototype.drawUnitLocsOccupied = function (unit) {
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l = 0; l < locs.length; l++) {
            this.drawSquare(locs[l], "red");
        }
    };

    Drawer.prototype.drawStateText = function (unit) {
        var text = unit.currentState.ToString();
        this.unitContext.fillStyle = "red";
        this.unitContext.fillText(text, unit.x, unit.y + this.HEALTH_BAR_OFFSET);
    };

    Drawer.prototype.getMousePos = function (canvas, evt) {
        var x = evt.clientX;
        var y = evt.clientY;
        return new Coords(x, y);
    };

    Drawer.prototype.moveViewPort = function (x, y) {
        var oldViewPort = this.viewPort;
        var left = oldViewPort.getLeft();
        var right = oldViewPort.getRight();
        var top = oldViewPort.getTop();
        var bottom = oldViewPort.getBottom();
        var needsUpdate = false;
        if (x < this.DIST_TO_TRIGGER_SCREEN_MOVE && left > 0) {
            left -= this.SCREEN_MOVE_DIST;
            right -= this.SCREEN_MOVE_DIST;
            needsUpdate = true;
        }
        if (x > (this.viewPort.getWidth() - this.DIST_TO_TRIGGER_SCREEN_MOVE) && right < this.gameWidth) {
            left += this.SCREEN_MOVE_DIST;
            right += this.SCREEN_MOVE_DIST;
            needsUpdate = true;
        }
        if (y < this.DIST_TO_TRIGGER_SCREEN_MOVE && top > 0) {
            top -= this.SCREEN_MOVE_DIST;
            bottom -= this.SCREEN_MOVE_DIST;
            needsUpdate = true;
        }
        if (y > this.viewPort.getHeight() - this.DIST_TO_TRIGGER_SCREEN_MOVE && (y < this.viewPort.getHeight()) && bottom < this.gameHeight) {
            top += this.SCREEN_MOVE_DIST;
            bottom += this.SCREEN_MOVE_DIST;
            needsUpdate = true;
        }
        if (needsUpdate) {
            this.viewPort = new Rectangle(left, right, top, bottom);
            this.drawTerrain();
        }
    };

    Drawer.prototype.drawLowerMenu = function () {
        this.menuContext.fillStyle = "black";
        this.menuContext.fillRect(0, 0, this.menuWidth, this.menuHeight);
        this.menuContext.strokeStyle = "red";
        this.menuContext.rect(0, 0, this.menuWidth, this.menuHeight);
        this.menuContext.moveTo(this.menuHeight, 0);
        this.menuContext.lineTo(this.menuHeight, this.winHeight - this.menuHeight);
        this.menuContext.stroke();

        var selectedUnits = Array();
        var allUnits = Game.getUnits();

        for (var u = 0; u < allUnits.length; u++) {
            if (allUnits[u].selected && (allUnits[u].player === this.playerNumber)) {
                selectedUnits.push(allUnits[u]);
            }
        }
        if (selectedUnits.length <= 0) {
            return;
        } else {
            var x1 = 0;
            var x2 = this.menuHeight;
            var x3 = this.menuHeight * 2;
            var y1 = 0;
            var y2 = this.menuHeight;

            this.drawFirstSelectedUnit(selectedUnits[0], new Rectangle(x1, x2, y1, y2));

            this.drawAllSelectedUnits(selectedUnits, new Rectangle(x2, x3, y1, y2));
        }
    };

    Drawer.prototype.writeText = function (text, x, y) {
        this.menuContext.fillText(text, x, y);
    };

    Drawer.prototype.drawAllSelectedUnits = function (selectedUnits, rect) {
        var unitsPerCol = Math.floor(rect.getHeight() / this.unitHeight());

        for (var i = 0; i < selectedUnits.length; i++) {
            var unit = selectedUnits[i];
            var coords = unit.getMenuDrawCoordinates();
            var x = rect.getLeft() + this.unitWidth() * Math.floor(i / unitsPerCol);
            var y = rect.getTop() + (i % unitsPerCol) * this.unitHeight();
            this.menuContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH, x, y, this.unitWidth(), this.unitHeight());
        }
    };

    Drawer.prototype.drawFirstSelectedUnit = function (unit, rect) {
        var coords = unit.getMenuDrawCoordinates();
        this.menuContext.drawImage(unit.getImage(), coords.x, coords.y, unit.imageW, unit.imageH / 2, rect.getLeft(), rect.getTop(), rect.getWidth(), rect.getHeight() / 2);

        var xOffset = rect.getLeft();
        var yOffset = rect.getTop() + rect.getHeight() / 2;
        var fontSize = 12;
        var textHeight = fontSize * 1.5;
        this.menuContext.font = fontSize + "px helvetica";
        this.menuContext.fillStyle = "white";

        this.writeText("\tRace: " + unit.getName(), xOffset, yOffset + textHeight);
        this.writeText("\tHealth: " + (Math.round(100 * unit.health) / 100) + "/" + unit.totalHealth, xOffset, yOffset + textHeight * 2);
        this.writeText("\tKills: " + 0, xOffset, yOffset + textHeight * 3);
        this.writeText("\tAttack: " + unit.attackMin + "-" + unit.attackMax + "dmg", xOffset, yOffset + textHeight * 4);
        this.writeText("\tAttackSpeed: " + Math.round((this.UPDATE_FPS / unit.attackSpeed) * 100) / 100 + "/sec", xOffset, yOffset + textHeight * 5);
    };
    return Drawer;
})();
var Knight = (function (_super) {
    __extends(Knight, _super);
    function Knight() {
        _super.apply(this, arguments);
        this.w = 30;
        this.h = 30;
        this.name = "Knight";
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
var Orc = (function (_super) {
    __extends(Orc, _super);
    function Orc() {
        _super.apply(this, arguments);
        this.w = 30;
        this.h = 30;
        this.gridWidth = 2;
        this.gridHeight = 2;
        this.name = "Orc";
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
var Map1 = (function () {
    function Map1() {
        if (this.GetGridSize() !== this.GetTerrain().length) {
            Logger.LogError("INVALID MAP DETECTED!");
        }
    }
    Map1.prototype.GetTerrain = function () {
        var terrain = Array();
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
var SmallMap = (function () {
    function SmallMap() {
        if (this.GetGridSize() !== this.GetTerrain().length) {
            Logger.LogError("INVALID MAP DETECTED!");
        }
    }
    SmallMap.prototype.GetTerrain = function () {
        var terrain = Array();
        for (var i = 0; i < this.GetGridSize(); i++) {
            if ((i % this.GetNumberOfCols() === 0) || ((i + 1) % (this.GetNumberOfCols()) === 0) || (Math.floor(i / this.GetNumberOfCols()) === 0) || (Math.ceil(i / this.GetNumberOfCols()) === this.GetNumberOfRows())) {
                terrain.push(new DirtTile());
            } else {
                terrain.push(new GrassTile());
            }
        }
        return terrain;
    };

    SmallMap.prototype.GetUnits = function () {
        var u1 = new Knight(15, 1);
        var u2 = new Orc(315, 1);
        var u3 = new Knight(35, 1);
        var u4 = new Orc(320, 1);
        var u5 = new Knight(322, 1);
        var u6 = new Orc(40, 1);

        var u7 = new Orc(80, 2);
        var u8 = new Orc(380, 2);
        return [u1, u2, u3, u4, u5, u6, u7, u8];
    };

    SmallMap.prototype.GetGridSize = function () {
        return this.GetNumberOfCols() * this.GetNumberOfRows();
    };

    SmallMap.prototype.GetNumberOfCols = function () {
        return 100;
    };

    SmallMap.prototype.GetNumberOfRows = function () {
        return 30;
    };
    return SmallMap;
})();
var StripesMap = (function () {
    function StripesMap() {
        if (this.GetGridSize() !== this.GetTerrain().length) {
            Logger.LogError("INVALID MAP DETECTED!");
        }
    }
    StripesMap.prototype.GetTerrain = function () {
        var terrain = Array();
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
var TinyMap = (function () {
    function TinyMap() {
        if (this.GetGridSize() !== this.GetTerrain().length) {
            Logger.LogError("INVALID MAP DETECTED!");
        }
    }
    TinyMap.prototype.GetTerrain = function () {
        var terrain = Array();
        for (var i = 0; i < 1000; i++) {
            if ((i > 100 && i < 110) || (i > 180 && i < 200) || (i > 230 && i < 236)) {
                terrain.push(new WaterTile());
            } else {
                terrain.push(new GrassTile());
            }
        }
        return terrain;
    };

    TinyMap.prototype.GetUnits = function () {
        var u1 = new Knight(15, 1);
        var u2 = new Knight(165, 1);
        var u3 = new Knight(215, 1);

        var u4 = new Orc(80, 2);
        var u5 = new Orc(320, 2);
        var u6 = new Orc(240, 2);

        return [u1, u2, u3, u4, u5, u6];
    };

    TinyMap.prototype.GetGridSize = function () {
        return this.GetNumberOfCols() * this.GetNumberOfRows();
    };

    TinyMap.prototype.GetNumberOfCols = function () {
        return 50;
    };

    TinyMap.prototype.GetNumberOfRows = function () {
        return 20;
    };
    return TinyMap;
})();
var MapFactory = (function () {
    function MapFactory() {
    }
    MapFactory.GetMap = function (id) {
        if (id === null || id === undefined || MapFactory.dict[id] === undefined) {
            Logger.LogError("invalid mapid: " + id);
            return undefined;
        }

        return MapFactory.dict[id];
    };
    MapFactory.dict = {
        "0": new TinyMap(),
        "1": new Map1(),
        "2": new SmallMap(),
        "3": new StripesMap()
    };
    return MapFactory;
})();
var Game = (function () {
    function Game(host, id, enemyId, gameId, mapId) {
        this.simTick = 0;
        Game.map = MapFactory.GetMap(mapId);
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
        for (var g = 0; g < Game.grid.length; g++) {
            Game.grid[g] = null;
        }

        Game.units = Game.map.GetUnits();
        for (var u = 0; u < Game.units.length; u++) {
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
            if (Game.units[i].id === id) {
                Game.units.splice(i, 1);
                Game.unmarkGridLocs(unit);
                return;
            }
        }
    };

    Game.removeUnitById = function (unitId) {
        var id = unitId;
        for (var i = 0; i < (length = Game.units.length); i++) {
            if (Game.units[i].id === id) {
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
        for (var l = 0; l < locs.length; l++) {
            Game.setGridLoc(locs[l], unit.id);
        }
    };

    Game.unmarkGridLocs = function (unit) {
        var locs = Utilities.getOccupiedSquares(unit.loc, unit.gridWidth, unit.gridHeight);
        for (var l = 0; l < locs.length; l++) {
            Game.setGridLoc(locs[l], null);
        }
    };

    Game.getUnitsForPlayer = function (playerNumber) {
        var myUnits = new Array();
        for (var u = 0; u < Game.units.length; u++) {
            var unit = Game.units[u];
            if (unit.player === playerNumber) {
                myUnits.push(unit);
            }
        }
        return myUnits;
    };

    Game.prototype.applyActions = function (players) {
        for (var player in players) {
            var actions = players[player];
            for (var a = 0; a < actions.length; a++) {
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
                            Logger.LogError("unable to issue a command...logic error somewhere");
                        }
                    } else {
                        unit.command = new WalkCommand(targetLoc);
                    }

                    unit.newCommand = true;
                }
            }
        }
        this.simTick++;
    };

    Game.prototype.getSimTick = function () {
        return this.simTick;
    };

    Game.prototype.getHash = function () {
        var hash = 0;
        var units = Game.units;
        for (var i = 0; i < units.length; i++) {
            hash += Math.floor(Math.pow(((units[i].loc * units[i].id) % units[i].health), i));
        }
        return hash;
    };

    Game.prototype.update = function () {
        for (var i = Game.units.length - 1; i >= 0; i--) {
            Game.units[i].update();
        }
    };

    Game.prototype.unselectAll = function () {
        for (var u = 0; u < Game.getUnits().length; u++) {
            Game.units[u].selected = false;
        }
    };

    Game.prototype.areEnemies = function (unit1, unit2) {
        if (unit1.player !== unit2.player) {
            return true;
        }
        return false;
    };
    Game.terrain = Array();
    Game.grid = Array();
    Game.units = Array();
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
        Logger.LogError("utilities.collides IS BROKEN!!!!");
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
        Logger.LogError("ERROR: Utilities.getDirection() did not set a direction");
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
            Logger.LogInfo("areLocsOccupiedBySameUnit worked? " + id1 + " " + id2);
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
        if (start === null || start === undefined || goal === null || goal === undefined || unit === null || unit === undefined) {
            Logger.LogError("Problem with Pathing.aStarToLoc()");
            Logger.LogError("start: " + start);
            Logger.LogError("goal: " + goal);
            Logger.LogError("unit: " + unit);
            return;
        }

        var closedSet = new Array();
        var openSet = new PriorityQueue();

        var final;

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

            if (cur === goal) {
                return this.getPath(cameFrom, goal, start);
            }

            closedSet.push(cur);
            var neighbors = Utilities.neighbors(cur);

            for (var i = neighbors.length - 1; i >= 0; i--) {
                var offGridRight = Math.floor(neighbors[i] / Game.getNumOfCols()) !== Math.floor((neighbors[i] + unit.gridWidth - 1) / Game.getNumOfCols());
                var offGridBottom = neighbors[i] + (unit.gridHeight - 1) * Game.getNumOfCols() > Game.getNumOfCols() * Game.getNumOfRows();
                if (offGridRight || offGridBottom || (!Game.getTerrainLoc(neighbors[i]).walkable)) {
                    if (neighbors[i] === goal) {
                        final = distanceToGoal.dequeue();
                        return this.getPath(cameFrom, final, start);
                    }
                    neighbors.splice(i, 1);
                    continue;
                }

                var locs = Utilities.getOccupiedSquares(neighbors[i], unit.gridWidth, unit.gridHeight);
                for (var l = 0; l < locs.length; l++) {
                    var gridLoc = Game.getGridLoc(locs[l]);
                    var terrainLoc = Game.getTerrainLoc(locs[l]);

                    if ((gridLoc !== unit.id && gridLoc !== null) || !terrainLoc.walkable) {
                        if (neighbors[i] === goal) {
                            final = distanceToGoal.dequeue();
                            return this.getPath(cameFrom, final || start, start);
                        }
                        neighbors.splice(i, 1);
                        break;
                    }
                }
            }

            for (var j = 0; j < neighbors.length; j++) {
                var tempGScore = gScore[cur] + Utilities.distance(cur, neighbors[j]);
                var heuristic = this.heuristic(neighbors[j], goal);
                var tempFScore = tempGScore + heuristic;
                distanceToGoal.enqueue(neighbors[j], heuristic);
                if ((closedSet.indexOf(neighbors[j]) !== -1) && (tempFScore >= fScore[neighbors[j]])) {
                    continue;
                }
                if ((openSet.indexOf(neighbors[j]) === -1) || tempFScore < fScore[neighbors[j]]) {
                    cameFrom[neighbors[j]] = cur;

                    gScore[neighbors[j]] = tempGScore;
                    fScore[neighbors[j]] = tempFScore;
                    if (openSet.indexOf(neighbors[j]) === -1) {
                        openSet.enqueue(neighbors[j], fScore[neighbors[j]]);
                    } else {
                        openSet.update(neighbors[j], fScore[neighbors[j]]);
                    }
                }
            }
        }

        return Pathing.getPath(cameFrom, distanceToGoal.dequeue(), start);
    };

    Pathing.getPath = function (cameFrom, cur, start) {
        if (cameFrom === null || cameFrom === undefined || cur === null || cur === undefined || start === null || start === undefined) {
            Logger.LogError("Error in Pathing.GetPath()");
            Logger.LogError("cameFrom: " + cameFrom);
            Logger.LogError("cur: " + cur);
            Logger.LogError("start: " + start);
            return;
        }

        var returnArray = Array();
        while (cur !== start) {
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
var Mage = (function (_super) {
    __extends(Mage, _super);
    function Mage() {
        _super.apply(this, arguments);
    }
    return Mage;
})(Unit);
var ClientGameRunner = (function () {
    function ClientGameRunner(id, enemyId, gameId, mapId) {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.UPDATE_FPS = 10;
        this.FPS = 60;
        this.actions = new Array();
        this.history = new Array();
        this.myId = id;
        this.gameId = gameId;
        this.peer = new Peer(id, { key: "vgs0u19dlxhqto6r" });

        if (!this.peer) {
            Logger.LogError("peer = " + this.peer);
            this.end("peer = " + this.peer);
        }

        var playerNumber = 2;
        this.myGame = new Game(false, id, enemyId, gameId, mapId);

        this.drawer = new Drawer(playerNumber, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), document.getElementById("menuCanvas"), this);

        var that = this;

        $(document).mousedown(function (e) {
            if (e.which === 1) {
                $(this).data("mousedown", true);
                var coords = that.drawer.screenCoordsToMapCoords(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
                that.setSelection(coords);
                that.myGame.unselectAll();
            } else if (e.which === 3) {
                var units = Game.getUnits();
                for (var u = 0; u < units.length; u++) {
                    if (units[u].selected) {
                        var tar = that.drawer.screenCoordsToMapLoc(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
                        var a = new Action(tar, Game.getUnits()[u].id, that.shifted);
                        that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
                        console.log('action!');
                    }
                }
            }
        });

        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });

        $(document).mouseup(function (e) {
            var selectionLoc = that.drawer.mapCoordsToMapLoc(new Coords(that.selection.x, that.selection.y));
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
            $(this).data("mousedown", false);
        });

        $(document).mousemove(function (e) {
            that.mouseX = e.clientX;
            that.mouseY = e.clientY;
            if ($(this).data("mousedown")) {
                var coords = that.drawer.screenCoordsToMapCoords(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
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
            Logger.LogError("error connecting!: " + err);
            that.end("error connecting!: " + err);
        });

        this.peer.on("open", function () {
            Logger.LogInfo("peer is open");

            Logger.LogInfo("im waiting for a connection");
            that.peer.on("connection", function (conn) {
                that.conn = conn;
                Logger.LogInfo("client " + conn);
                that.conn.on("open", function () {
                    that.run();
                    that.peer.disconnect();
                });
                that.conn.on("close", function () {
                    Logger.LogInfo("connection closed!");
                    that.end("Enemy Quit");
                });
                that.conn.on("data", function (data) {
                    that.receivedData(data);
                });
            });
        });
    }
    ClientGameRunner.prototype.run = function () {
        this.myGame.setup();
        this.drawer.drawTerrain();

        var oldTime = new Date().getTime();
        var diffTime = 0;
        var newTime = 0;

        var that = this;
        setInterval(function () {
            that.drawer.interpolate();
            that.drawer.drawUnits(Game.getUnits());
            that.drawSelect();
            that.drawer.drawLowerMenu();
            that.drawer.moveViewPort(that.mouseX, that.mouseY);
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        this.execute();
    };

    ClientGameRunner.prototype.execute = function () {
        this.myGame.update();

        if (this.myGame.isOver()) {
            this.end("Game is Over!");
        }

        var actionsToSend = this.actions;
        this.actions = new Array();

        var currentSimTick = this.myGame.getSimTick();

        var gameHash = this.myGame.getHash();

        this.conn.send({ actions: { "client": actionsToSend }, simTick: currentSimTick, gameHash: gameHash });
    };

    ClientGameRunner.prototype.drawSelect = function () {
        if ($(document).data("mousedown")) {
            this.drawer.drawSelect(this.selection);
        }
    };

    ClientGameRunner.prototype.setSelection = function (coords) {
        this.selection = new SelectionObject(coords.x, coords.y);
    };

    ClientGameRunner.prototype.updateSelection = function (selection, eX, eY) {
        selection.x = Math.min(selection.sX, eX);
        selection.y = Math.min(selection.sY, eY);
        selection.w = Math.abs(selection.sX - eX);
        selection.h = Math.abs(selection.sY - eY);
        return selection;
    };

    ClientGameRunner.prototype.end = function (message) {
        this.sendGameReportToServer();
        window.location.href = "/lobby";
    };

    ClientGameRunner.prototype.sendGameReportToServer = function () {
        var that = this;
        $.ajax({
            url: "/gameEnd",
            type: "POST",
            data: {
                gameId: that.gameId,
                reporter: that.myId,
                winner: that.myGame.winner,
                actions: JSON.stringify(that.history),
                gameHash: that.myGame.getHash()
            },
            success: function (data, textStatus, jqXHR) {
                Logger.LogInfo("SUCCESS sending game report");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                Logger.LogError("Error sending game report");
            }
        });
    };

    ClientGameRunner.prototype.receivedData = function (data) {
        var actions = data.actions;

        var gameHash = this.myGame.getHash();

        if (gameHash != data.gameHash) {
            Logger.LogError("The host's game hash has diverged from mine at simTick " + data.simTick + " " + this.myGame.getSimTick() + ": h/" + data.gameHash + " c/" + gameHash);
        }

        this.history.push(actions);
        this.simTickIsOver();
    };

    ClientGameRunner.prototype.simTickIsOver = function () {
        var tick = this.myGame.getSimTick();
        this.myGame.applyActions(this.history[tick]);
        var that = this;
        setTimeout(function () {
            that.execute();
        }, 1000 / that.UPDATE_FPS);
    };
    return ClientGameRunner;
})();
var HostGameRunner = (function () {
    function HostGameRunner(id, enemyId, gameId, mapId) {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.UPDATE_FPS = 10;
        this.FPS = 60;
        this.actions = new Array();
        this.history = new Array();
        this.myId = id;
        this.gameId = gameId;
        this.peer = new Peer(id, { key: "vgs0u19dlxhqto6r" });

        if (!this.peer) {
            Logger.LogError("peer = " + this.peer);
            this.end("peer = " + this.peer);
        }

        this.myGame = new Game(true, id, enemyId, gameId, mapId);
        var playerNumber = 1;

        this.drawer = new Drawer(playerNumber, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), document.getElementById("menuCanvas"), this);

        var that = this;

        $(document).mousedown(function (e) {
            if (e.which === 1) {
                $(this).data("mousedown", true);
                var coords = that.drawer.screenCoordsToMapCoords(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
                that.setSelection(coords);
                that.myGame.unselectAll();
            } else if (e.which === 3) {
                var units = Game.getUnits();
                for (var u = 0; u < units.length; u++) {
                    if (units[u].selected) {
                        var tar = that.drawer.screenCoordsToMapLoc(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
                        var a = new Action(tar, Game.getUnits()[u].id, that.shifted);
                        that.actions.push({ target: a.getTarget(), unit: a.getUnit() });
                    }
                }
            }
        });

        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });

        $(document).mouseup(function (e) {
            var selectionLoc = that.drawer.mapCoordsToMapLoc(new Coords(that.selection.x, that.selection.y));
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
            $(this).data("mousedown", false);
        });

        $(document).mousemove(function (e) {
            that.mouseX = e.clientX;
            that.mouseY = e.clientY;
            if ($(this).data("mousedown")) {
                var coords = that.drawer.screenCoordsToMapCoords(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
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
            Logger.LogError("error connecting!: " + err);
            that.end("error connecting!: " + err);
        });

        this.peer.on("open", function () {
            Logger.LogInfo("peer is open");

            Logger.LogInfo("im initiating a connection");
            that.conn = that.peer.connect(enemyId, { reliable: true });
            that.conn.on("open", function () {
                that.run();
                that.peer.disconnect();
            });
            that.conn.on("close", function () {
                Logger.LogInfo("connection closed!");
                that.end("Enemy Quit");
            });
            that.conn.on("data", function (data) {
                that.receivedData(data);
            });
        });
    }
    HostGameRunner.prototype.run = function () {
        this.myGame.setup();
        this.drawer.drawTerrain();

        var oldTime = new Date().getTime();
        var diffTime = 0;
        var newTime = 0;

        var that = this;
        setInterval(function () {
            that.drawer.interpolate();
            that.drawer.drawUnits(Game.getUnits());
            that.drawSelect();
            that.drawer.drawLowerMenu();
            that.drawer.moveViewPort(that.mouseX, that.mouseY);
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        this.execute();
    };

    HostGameRunner.prototype.execute = function () {
        this.myGame.update();

        if (this.myGame.isOver()) {
            this.end("Game is Over!");
        }

        var currentSimTick = this.myGame.getSimTick();

        var gameHash = this.myGame.getHash();
    };

    HostGameRunner.prototype.drawSelect = function () {
        if ($(document).data("mousedown")) {
            this.drawer.drawSelect(this.selection);
        }
    };

    HostGameRunner.prototype.setSelection = function (coords) {
        this.selection = new SelectionObject(coords.x, coords.y);
    };

    HostGameRunner.prototype.updateSelection = function (selection, eX, eY) {
        selection.x = Math.min(selection.sX, eX);
        selection.y = Math.min(selection.sY, eY);
        selection.w = Math.abs(selection.sX - eX);
        selection.h = Math.abs(selection.sY - eY);
        return selection;
    };

    HostGameRunner.prototype.end = function (message) {
        this.sendGameReportToServer();
        window.location.href = "/lobby";
    };

    HostGameRunner.prototype.sendGameReportToServer = function () {
        var that = this;
        $.ajax({
            url: "/gameEnd",
            type: "POST",
            data: {
                gameId: that.gameId,
                reporter: that.myId,
                winner: that.myGame.winner,
                actions: JSON.stringify(that.history),
                gameHash: that.myGame.getHash()
            },
            success: function (data, textStatus, jqXHR) {
                Logger.LogInfo("SUCCESS sending game report");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                Logger.LogError("Error sending game report");
            }
        });
    };

    HostGameRunner.prototype.receivedData = function (data) {
        var actions = data.actions;
        var myActions = this.actions;
        this.actions = new Array();
        actions['host'] = myActions;
        var currentSimTick = this.myGame.getSimTick();
        var gameHash = this.myGame.getHash();

        this.conn.send({ actions: actions, simTick: currentSimTick, gameHash: gameHash });
        this.history.push(actions);
        if (gameHash != data.gameHash) {
            Logger.LogError("The client's game hash has diverged from mine at simTick " + currentSimTick + " " + data.simTick + ": h/" + gameHash + " c/" + data.gameHash);
        }

        this.simTickIsOver();
    };

    HostGameRunner.prototype.simTickIsOver = function () {
        var tick = this.myGame.getSimTick();
        this.myGame.applyActions(this.history[tick]);
        var that = this;
        setTimeout(function () {
            that.execute();
        }, 1000 / that.UPDATE_FPS);
    };
    return HostGameRunner;
})();
var LocalGameRunner = (function () {
    function LocalGameRunner(mapId) {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.actions = new Array();
        this.updateFPS = 10;
        this.FPS = 60;
        var id = "Human";
        var enemyId = "Computer";
        var gameId = "LocalGame";

        this.myGame = new Game(true, id, enemyId, gameId, mapId);

        this.drawer = new Drawer(1, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), document.getElementById("menuCanvas"), this);

        this.run();

        var that = this;

        $(document).mousedown(function (e) {
            if (e.which === 1) {
                $(this).data("mousedown", true);
                var coords = that.drawer.screenCoordsToMapCoords(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
                that.setSelection(coords);
                that.myGame.unselectAll();
            } else if (e.which === 3) {
                var units = Game.getUnits();
                for (var u = 0; u < units.length; u++) {
                    if (units[u].selected) {
                        var tar = that.drawer.screenCoordsToMapLoc(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
                        var a = new Action(tar, Game.getUnits()[u].id, that.shifted);
                        that.actions.push({ target: a.getTarget(), unit: a.getUnit(), shift: a.getShifted() });
                    }
                }
            }
        });

        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });

        $(document).mouseup(function (e) {
            var selectionLoc = that.drawer.mapCoordsToMapLoc(new Coords(that.selection.x, that.selection.y));
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
            $(this).data("mousedown", false);
        });

        $(document).mousemove(function (e) {
            that.mouseX = e.clientX;
            that.mouseY = e.clientY;
            if ($(this).data("mousedown")) {
                var coords = that.drawer.screenCoordsToMapCoords(that.drawer.getMousePos(document.getElementById("selectionCanvas"), e));
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
            that.drawer.drawLowerMenu();
            that.drawer.moveViewPort(that.mouseX, that.mouseY);
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

            that.myGame.applyActions({ 'player': that.actions });
            that.actions = new Array();

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            var realFPS = Math.round(1000 / diffTime);
            that.drawer.REAL_FPS = realFPS;
            fpsOut.innerHTML = realFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps<br>heap usage: " + Math.round(((window.performance.memory.usedJSHeapSize / window.performance.memory.totalJSHeapSize) * 100)) + "%";
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
    return LocalGameRunner;
})();
var ReplayGameRunner = (function () {
    function ReplayGameRunner(actions, mapId) {
        this.DEBUG = false;
        this.STATEDEBUG = false;
        this.DRAWGRID = false;
        this.actions = new Array();
        this.FPS = 60;
        this.updateFPS = 10;
        this.actions = actions;

        var id = "test";

        this.myGame = new Game(true, id, "enemyId", "gameId", mapId);

        this.drawer = new Drawer(1, document.getElementById("terrainCanvas"), document.getElementById("unitCanvas"), document.getElementById("fogCanvas"), document.getElementById("selectionCanvas"), document.getElementById("menuCanvas"), this);

        this.run();

        var that = this;
        $(window).resize(function () {
            that.drawer.updateDimensions($(window).width(), $(window).height());
        });

        $(document).mousemove(function (e) {
            that.mouseX = e.clientX;
            that.mouseY = e.clientY;
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
            that.drawer.drawLowerMenu();
            that.drawer.moveViewPort(that.mouseX, that.mouseY);
            diffTime = newTime - oldTime;
            oldTime = newTime;
            newTime = new Date().getTime();
        }, 1000 / this.FPS);

        var fpsOut = document.getElementById("fps");

        var timerId = setInterval(function () {
            if (that.myGame.isOver()) {
                clearInterval(timerId);
                that.end("Game is over!");
                return;
            }

            var currentSimTick = that.myGame.getSimTick();
            that.myGame.update();

            that.myGame.applyActions(that.actions[currentSimTick]);

            diffTime2 = newTime2 - oldTime2;
            oldTime2 = newTime2;
            newTime2 = new Date().getTime();
            var realFPS = Math.round(1000 / diffTime);
            that.drawer.REAL_FPS = realFPS;
            fpsOut.innerHTML = realFPS + " drawing fps " + Math.round(1000 / diffTime2) + " updating fps<br>heap usage: " + Math.round(((window.performance.memory.usedJSHeapSize / window.performance.memory.totalJSHeapSize) * 100)) + "%";
        }, 1000 / (that.updateFPS));
    };

    ReplayGameRunner.prototype.end = function (message) {
        window.location.href = "/gameReports";
    };
    return ReplayGameRunner;
})();
