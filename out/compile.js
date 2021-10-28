"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var html_1 = require("./html");
var throwError = function (message, trace, line) {
    return {
        message: message,
        trace: trace,
        line: line
    };
};
var assert = function (a, b) {
    return 0;
    return throwError("33", "dsdsd", 6566);
};
var Compiler = /** @class */ (function () {
    function Compiler() {
        this.lineNumber = 1;
        this.indentLevel = 0;
        this.indent = "";
        this.htmlParser = new html_1.default();
        this.region = "html";
    }
    Compiler.prototype.compile = function (line) {
        var nline = "";
        if (line[0] == " " || line[0] == "\t") {
            if (!this.indent) {
                var regex = /[^ \t]/g;
                this.indent = line.slice(0, line.search(regex));
                this.indentLevel = 1;
                line = line.slice(line.search(regex));
            }
            else {
                var len = this.indent.length;
                var i = 0;
                for (i = 0; true; i++) {
                    if (line.slice(0 + (i * len), len * (i + 1)) != this.indent)
                        break;
                }
                this.indentLevel = i;
                line = line.slice(this.indentLevel * len);
            }
            /*if (this.lineNumber == 0) {
              return throwError("Unexpected indent block.", line, this.lineNumber);
            }*/
        }
        else {
            this.indentLevel = 0;
        }
        switch (this.region) {
            case "html":
                var parsed = this.htmlParser.parse(line, this.indentLevel);
                console.log(parsed);
                for (var i = 0; i < parsed.length; i++) {
                    nline += "\t".repeat(this.indentLevel + (parsed.length - (i)));
                    nline += parsed[i];
                    nline += "\n";
                }
                break;
            default:
                return throwError("Unexpected exception", line, this.lineNumber);
        }
        this.lineNumber++;
        return nline;
    };
    return Compiler;
}());
exports.default = Compiler;
