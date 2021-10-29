import { usage, CompileError, errorHtml } from "./header";
import Compiler from "./compile";
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

const compiledWithErrors = (t: string | CompileError): t is CompileError => { 
  return (t as CompileError).message !== undefined;
};

const logVerbose = (...str: string[]): void => {
  console.log(...str);
};

const compileFile = (filename: string) => {
  let compiled = "";
  const comp = new Compiler();
  logVerbose("Compiling", filename, "...");

  const readInterface = readline.createInterface({
    input: createReadStream(filename)
  });

  readInterface.on('line', (line) => {
    const nline = comp.compile(line);
    if (!compiledWithErrors(nline)) {
      compiled += nline;
    } else {
      console.log(renderError(nline, filename, true));
      compiled = errorHtml.replace("$ERR", renderError(nline, filename, false));
      readInterface.close();
      process.exit();
    }
  }).on('close', () => {
    writeFileSync(path.join("./dist", path.basename(filename, '.vlr')) + ".html", compiled);
  });
}


((): string => {
  const arg: string[] = process.argv.slice(2);
  if (!arg[0]) {
    return usage;
  }
  try {
    mkdirSync("./dist");
  } catch(e) {
    if (e.code != ("EEXIST")) {
      return "Failed creating output directory: " + e.message;
    }
  }
  let promiseList = [];
  if (!lstatSync(arg[0]).isDirectory()) {
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