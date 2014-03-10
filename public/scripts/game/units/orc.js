var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../scripts/unit.ts" />
var Orc = (function (_super) {
    __extends(Orc, _super);
    function Orc() {
        _super.apply(this, arguments);
        this.w = 30;
        this.h = 30;
        this.imageX = 0;
        this.imageY = 512;
        this.imageW = 64;
        this.imageH = 64;
        this.attackMax = 13;
        this.attackMin = 5;
        this.totalHealth = 120;
        this.health = this.totalHealth;
        this.attackSpeed = 15;
        this.src = '/images/orc.png';
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
