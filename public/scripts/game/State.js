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
    return State;
})();
