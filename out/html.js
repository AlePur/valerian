"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Html = /** @class */ (function () {
    function Html() {
        this.openTags = [];
        this.indentLevel = 0;
    }
    Html.prototype.tag = function (name) {
        return "<" + name + ">";
    };
    Html.prototype.closeTag = function (name) {
        return "</" + name + ">";
    };
    Html.prototype.parse = function (line, indent) {
        var parsed = [];
        var parselength = 0;
        if (indent <= this.indentLevel) {
            var i = 0;
            for (i = 0; i < ((1 + this.indentLevel) - indent); i++) {
                var oldtag = this.openTags.pop();
                parsed[i] = this.closeTag(oldtag);
            }
            parselength = i;
        }
        this.indentLevel = indent;
        var clean = line.slice(0, line.indexOf(":"));
        parsed[parselength] = this.tag(clean);
        this.openTags.push(clean);
        return parsed;
    };
    return Html;
}());
exports.default = Html;
