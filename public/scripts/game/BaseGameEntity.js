/// <reference path="Utilities.ts" />
/// <reference path="game.ts" />
var BaseGameEntity = (function () {
    function BaseGameEntity() {
        this.id = BaseGameEntity.NextValidId;
        BaseGameEntity.NextValidId++;
    }
    BaseGameEntity.prototype.Update = function () {
        alert('update not implemented!!!');
    };
    BaseGameEntity.NextValidId = 0;
    return BaseGameEntity;
})();
