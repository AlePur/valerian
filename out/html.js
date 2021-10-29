"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Html = /** @class */ (function () {
    function Html() {
        this.openTags = [];
        this.indentLevel = -1;
        this.ignoreLastLine = false;
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
            for (i = 0; i <= ((this.indentLevel) - indent); i++) {
                var oldtag = this.openTags.pop();
                parsed[i] = this.closeTag(oldtag);
            }
            parselength = i;
        }
        this.indentLevel = indent;
        if (line[0] == "(") {
            parsed[parselength] = this.tag("div");
            this.openTags.push("null");
        }
        else if (line[0] == ")") {
            // Already closed
            // parsed[parselength] = this.closeTag("div");
            var oldparsed = parsed;
            oldparsed.pop();
            parsed = oldparsed;
            this.ignoreLastLine = true;
        }
        else {
            var clean = line.slice(0, line.indexOf(":"));
            parsed[parselength] = this.tag(clean);
            this.openTags.push(clean);
        }
        return parsed;
    };
    return Html;
}());
exports.default = Html;
