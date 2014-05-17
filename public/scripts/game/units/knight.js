var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../unit.ts" />
var Knight = (function (_super) {
    __extends(Knight, _super);
    function Knight() {
        _super.apply(this, arguments);
        this.w = 30;
        this.h = 30;
        this.imageX = 0;
        this.imageY = 512;
        this.imageW = 64;
        this.imageH = 64;
        this.attackMax = 10;
        this.attackMin = 5;
        this.totalHealth = 100;
        this.health = this.totalHealth;
        this.attackSpeed = 10;
        this.src = '/images/knight.png';
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
