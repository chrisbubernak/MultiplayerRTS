/// <reference path="ICommand.ts" />
/// <reference path="../unit.ts" />
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
