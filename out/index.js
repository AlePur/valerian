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
    err += "\n\t" + (console ? console_1.default.FgRed : '') + comerror.message + ":" + (console ? console_1.default.Reset : '') + "\n";
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
var compileFile = function (filename) {
    var compiled = "";
    var comp = new compile_1.default();
    logVerbose("Compiling", filename, "...");
    var readInterface = readline.createInterface({
        input: (0, fs_1.createReadStream)(filename)
    });
    readInterface.on('line', function (line) {
        var nline = comp.compile(line);
        if (!compiledWithErrors(nline)) {
            compiled += nline;
        }
        else {
            console.log(renderError(nline, filename, true));
            compiled = header_1.errorHtml.replace("$ERR", renderError(nline, filename, false));
            readInterface.close();
            process.exit();
        }
    }).on('close', function () {
        (0, fs_1.writeFileSync)(path.join("./dist", path.basename(filename, '.vlr')) + ".html", compiled);
    });
};
(function () {
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
    var promiseList = [];
    if (!(0, fs_1.lstatSync)(arg[0]).isDirectory()) {
        promiseList[0] = compileFile(arg[0]);
    }
    else {
        var files = (0, fs_1.readdirSync)(arg[0]);
        files.forEach(function (file) {
            promiseList.push(compileFile(path.join(arg[0], file)));
        });
    }
    Promise.all(promiseList).then(function (values) {
        console.log("Successfully compiled all files.");
    });
})();
