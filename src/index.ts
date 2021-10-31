import { usage, CompileError, errorHtml, compiledWithErrors } from "./header";
import Compiler from "./compiler";
import Color from "./console";
import { lstatSync, readFileSync, createReadStream, writeFileSync, mkdirSync, readdirSync } from "fs";
import * as readline from "readline";
import * as path from "path";

const renderError = (comerror: CompileError, filename: string, console: boolean): string => {
  let err = (console ? Color.FgBlack + Color.BgRed : '') + "Failed:" + (console ? Color.Reset : '');
  err += "\n\t" + (console ? Color.FgRed : '') + comerror.message + ":" + (console ? Color.Reset : '') + "\n";
  err += "\t" + comerror.line + " --> " + comerror.trace;
  err += "\n\t" + "~".repeat(4 + comerror.line.toString().length) + "\n";
  err += (console ? Color.Underscore : '') + "\nOn line " + comerror.line + " in " + filename + (console ? Color.Reset : '');
  err += "\nCompilation failed."
  return err;
};

const logVerbose = (...str: string[]): void => {
  console.log(...str);
};

const compileFile = (filename: string): Promise<void> => {
  return new Promise((resolve) => {
    let alreadyfailed: boolean = false;
    let compiled: string[] = [ "<html>\n" ];
    const comp = new Compiler();
    logVerbose("Compiling", filename, "...");

    const readInterface = readline.createInterface({
      input: createReadStream(filename)
    });

    readInterface.on('line', (line) => {
      const nline = comp.compile(line);
      if (!compiledWithErrors(nline)) {
        if (nline !== -1) {
          compiled.concat(nline.lines);
        }
      } else {
        console.log(renderError(nline, filename, true));
        let err = new errorHtml(renderError(nline, filename, false));
        compiled = err.html;
        alreadyfailed = true;
        readInterface.close();
        process.exit();
      }
    }).on('close', () => {
      if (!alreadyfailed) {
        const nline = comp.endOfFile();
        if (!compiledWithErrors(nline)) {
          compiled.concat(nline.lines);
          compiled.concat("</html>");
        } else {
          console.log(renderError(nline, filename, true));
          let err = new errorHtml(renderError(nline, filename, false));
          compiled = err.html;
          process.exit();
        }
      }

      writeFileSync(path.join("./dist", path.basename(filename, '.vlr')) + ".html", compiled);
      resolve();
    });
  });
}


(() => {
  const arg: string[] = process.argv.slice(2);
  if (!arg[0]) {
    return console.log(usage);
  }
  try {
    mkdirSync("./dist");
  } catch(e) {
    if (e.code != ("EEXIST")) {
      return "Failed creating output directory: " + e.message;
    }
  }
  let promiseList = [];
  let lstat;
  try {
    lstat = lstatSync(arg[0])
  } catch(e) {
    return console.log(Color.BgRed + Color.FgBlack, e.message, Color.Reset)
  }
  if (!lstat.isDirectory()) {
    promiseList[0] = compileFile(arg[0]);
  } else {
    const files = readdirSync(arg[0]);
    files.forEach((file) => {
      promiseList.push(compileFile(path.join(arg[0], file)));
    });
  }
  Promise.all(promiseList).then((values) => {
    console.log("Successfully compiled all files.");
  });
})()