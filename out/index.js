"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const header_1 = require("./header");
const compile_1 = require("./compile");
const console_1 = require("./console");
const fs_1 = require("fs");
const readline = require("readline");
const path = require("path");
const renderError = (comerror, filename, console) => {
    let err = (console ? console_1.default.FgBlack + console_1.default.BgRed : '') + "Failed:" + (console ? console_1.default.Reset : '');
    err += "\n\t" + (console ? console_1.default.FgRed : '') + comerror.message + ":" + (console ? console_1.default.Reset : '') + "\n";
    err += "\t" + comerror.line + " --> " + comerror.trace;
    err += "\n\t" + "~".repeat(4 + comerror.line.toString().length) + "\n";
    err += (console ? console_1.default.Underscore : '') + "\nOn line " + comerror.line + " in " + filename + (console ? console_1.default.Reset : '');
    err += "\nCompilation failed.";
    return err;
};
const compiledWithErrors = (t) => {
    return t.message !== undefined;
};
const logVerbose = (...str) => {
    console.log(...str);
};
const compileFile = (filename) => {
    return new Promise((resolve) => {
        let alreadyfailed = 0;
        let compiled = "";
        const comp = new compile_1.default();
        logVerbose("Compiling", filename, "...");
        const readInterface = readline.createInterface({
            input: (0, fs_1.createReadStream)(filename)
        });
        readInterface.on('line', (line) => {
            const nline = comp.compile(line);
            if (!compiledWithErrors(nline)) {
                compiled += nline;
            }
            else {
                console.log(renderError(nline, filename, true));
                compiled = header_1.errorHtml.replace("$ERR", renderError(nline, filename, false));
                alreadyfailed = 1;
                readInterface.close();
                process.exit();
            }
        }).on('close', () => {
            if (!alreadyfailed) {
                const nline = comp.endOfFile();
                if (!compiledWithErrors(nline)) {
                    compiled += nline;
                }
                else {
                    console.log(renderError(nline, filename, true));
                    compiled = header_1.errorHtml.replace("$ERR", renderError(nline, filename, false));
                    process.exit();
                }
            }
            (0, fs_1.writeFileSync)(path.join("./dist", path.basename(filename, '.vlr')) + ".html", compiled);
            resolve();
        });
    });
};
(() => {
    const arg = process.argv.slice(2);
    if (!arg[0]) {
        return console.log(header_1.usage);
    }
    try {
        (0, fs_1.mkdirSync)("./dist");
    }
    catch (e) {
        if (e.code != ("EEXIST")) {
            return "Failed creating output directory: " + e.message;
        }
    }
    let promiseList = [];
    let lstat;
    try {
        lstat = (0, fs_1.lstatSync)(arg[0]);
    }
    catch (e) {
        return console.log(console_1.default.BgRed + console_1.default.FgBlack, e.message, console_1.default.Reset);
    }
    if (!lstat.isDirectory()) {
        promiseList[0] = compileFile(arg[0]);
    }
    else {
        const files = (0, fs_1.readdirSync)(arg[0]);
        files.forEach((file) => {
            promiseList.push(compileFile(path.join(arg[0], file)));
        });
    }
    Promise.all(promiseList).then((values) => {
        console.log("Successfully compiled all files.");
    });
})();
