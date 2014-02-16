var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../scripts/unit.ts" />
var Mage = (function (_super) {
    __extends(Mage, _super);
    function Mage(id, loc, player) {
        _super.call(this, id, loc, player);
        this.w = 30;
        this.h = 30;
        this.imageX = 0;
        this.imageY = 0;
        this.imageW = 32;
        this.imageH = 32;
        this.attackMax = 35;
        this.attackMin = 10;
        this.totalHealth = 80;
        this.health = this.totalHealth;
        this.attackSpeed = 45;
    }
    return Mage;
})(Unit);
