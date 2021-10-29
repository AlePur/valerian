"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getString = function (str) {
    var symbol = str[0];
    if (symbol == "'" || symbol == "\"") {
        if (str[str.length - 1] != symbol) {
            return -2;
        }
        return str.slice(1, str.length - 1);
    }
    return -1;
};
var Html = /** @class */ (function () {
    function Html() {
        this.openTags = [];
        this.indentLevel = -1;
        this.expectingBlock = false;
        this.ignoreLastLine = false;
    }
    Html.prototype.tag = function (name, kwargs) {
        if (kwargs === void 0) { kwargs = {}; }
        var values = "";
        for (var _i = 0, _a = Object.entries(kwargs); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (!value)
                continue;
            values += " " + key + "=\"" + value + "\"";
        }
        return "<" + name + values + ">";
    };
    Html.prototype.closeTag = function (name) {
        return "</" + name + ">";
    };
    Html.prototype.parse = function (line, indent) {
        var _this = this;
        var parsed = [];
        var error = null;
        var parselength = 0;
        if (indent > (this.indentLevel + 1)) {
            error = "Unexpected indent block";
        }
        if (indent <= this.indentLevel && this.expectingBlock) {
            error = "Expected an indented block";
        }
        if ((indent <= this.indentLevel && this.ignoreLastLine == false) || (indent < this.indentLevel && this.ignoreLastLine)) {
            var i = 0;
            for (i = 0; i <= ((this.indentLevel) - indent); i++) {
                var oldtag = this.openTags.pop();
                parsed[i] = this.closeTag(oldtag);
            }
            parselength = i;
        }
        this.ignoreLastLine = false;
        this.indentLevel = indent;
        if (line[0] == "(") {
            var id = line.slice(1);
            parsed[parselength] = this.tag("div", { id: id });
            this.openTags.push("div");
        }
        else if (line[0] == ")") {
            // Already closed
            // parsed[parselength] = this.closeTag("div");
            this.ignoreLastLine = true;
        }
        else {
            error = (function () {
                var delimiter = line.indexOf(":");
                if (delimiter == -1) {
                    //return "Syntax not allowed, expected a colon"
                }
                var data = line.slice(delimiter + 1).trim();
                if (data) {
                    var str = getString(data);
                    if (str == -1) {
                        return "Expected a string";
                    }
                    else if (str == -2) {
                        return "Unexpected end of line";
                    }
                    else {
                        data = str;
                    }
                }
                var clean = line.slice(0, delimiter);
                parsed[parselength] = _this.tag(clean);
                if (data) {
                    parsed[parselength] += "\n" + "\t".repeat(indent + 1) + data;
                }
                _this.openTags.push(clean);
                return null;
            })();
        }
        return {
            lines: parsed,
            scopeClose: this.ignoreLastLine,
            error: error
        };
    };
    return Html;
}());
exports.default = Html;
