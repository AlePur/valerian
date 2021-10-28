"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var header_1 = require("./header");
var compile_1 = require("./compile");
var console_1 = require("./console");
var fs_1 = require("fs");
var readline = require("readline");
var path = require("path");
var renderError = function (comerror, filename, console) {
    var err = (console ? console_1.default.FgBlack + console_1.default.BgRed : '') + "Failed:" + (console ? console_1.default.Reset : '');
    err += "\n\t" + (console ? console_1.default.FgRed : '') + comerror.message + (console ? console_1.default.Reset : '') + "\n";
    err += "\t" + comerror.line + " --> " + comerror.trace;
    err += "\n\t" + "~".repeat(4 + comerror.line.toString().length) + "\n";
    err += (console ? console_1.default.Underscore : '') + "\nOn line " + comerror.line + " in " + filename + (console ? console_1.default.Reset : '');
    err += "\nCompilation failed.";
    return err;
};
var compiledWithErrors = function (t) {
    return t.message !== undefined;
};
var logVerbose = function () {
    var str = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        str[_i] = arguments[_i];
    }
    console.log.apply(console, str);
};
console.log((function () {
    var arg = process.argv.slice(2);
    if (!arg[0]) {
        return header_1.usage;
    }
    try {
        (0, fs_1.mkdirSync)("./dist");
    }
    catch (e) {
        if (e.code != ("EEXIST")) {
            return "Failed creating output directory: " + e.message;
        }
    }
    if (!(0, fs_1.lstatSync)(arg[0]).isDirectory()) {
        var filename_1 = arg[0];
        var compiled_1 = "";
        var comp_1 = new compile_1.default();
        logVerbose("Compiling", filename_1, "...");
        var readInterface_1 = readline.createInterface({
            input: (0, fs_1.createReadStream)(filename_1)
        });
        readInterface_1.on('line', function (line) {
            var nline = comp_1.compile(line);
            if (!compiledWithErrors(nline)) {
                compiled_1 += nline;
            }
            else {
                console.log(renderError(nline, filename_1, true));
                compiled_1 = header_1.errorHtml.replace("$ERR", renderError(nline, filename_1, false));
                readInterface_1.close();
                process.exit();
            }
        }).on('close', function () {
            (0, fs_1.writeFileSync)(path.join("./dist", path.basename(filename_1, '.vlr')) + ".html", compiled_1);
        });
    }
    return "Successfully compiled all files.";
})());
