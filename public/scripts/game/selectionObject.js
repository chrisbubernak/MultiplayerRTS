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
