import { usage, CompileError, errorHtml, compiledWithErrors, CompiledFile } from "./header";
import TemplateManager from "./template";
import Compiler from "./compiler";
import Color from "./console";
import { lstatSync, existsSync, createReadStream, writeFileSync, mkdirSync, readdirSync, rmSync } from "fs";
import * as readline from "readline";
import * as path from "path";

const renderError = (comerror: CompileError, console: boolean): string => {
  let err = (console ? Color.FgBlack + Color.BgRed : '') + "Failed:" + (console ? Color.Reset : '');
  err += "\n\t" + (console ? Color.FgRed : '') + comerror.message + ":" + (console ? Color.Reset : '') + "\n";
  err += "\t" + comerror.line + " --> " + comerror.trace;
  err += "\n\t" + "~".repeat(4 + comerror.line.toString().length) + "\n";
  err += (console ? Color.Underscore : '') + "\nOn line " + comerror.line + " in " + comerror.sourceFile + (console ? Color.Reset : '');
  err += "\nCompilation failed."
  return err;
};

interface Imports {
  [key: string]: CompiledFile
}

const imports: Imports = {};
const beingCompiled: string[] = [];
let compileIndex = 0;

const logVerbose = (...str: string[]): void => {
  console.log(...str);
};

export const fetchImport = (filename: string): CompiledFile | undefined => {
  return imports[filename];
}

export const declareImport = async (filename: string): Promise<true | CompileError> => {
  if (imports[filename] !== undefined) {
    return true;
  }
  for (let i = 0; i < beingCompiled.length; i++) {
    //FIXME: this will cause errors in the future
    if (filename == beingCompiled[i]) {
      return true;
    }
  }
  beingCompiled.push(filename);
  const _import = await compileValerian(filename, true);
  if (!compiledWithErrors(_import)) {
    imports[filename] = _import;
    for (let i = 0; i < beingCompiled.length; i++) {
      if (filename == beingCompiled[i]) {
        beingCompiled.splice(i, 1);
      }
    }
    return true;
  } else {
    return _import;
  }
}

export const compileValerian = (filename: string, module: boolean): Promise<CompiledFile | CompileError> => {
  return new Promise(async (resolve) => {
    let compiled: string[] = [];
    let declaredVariables: string[] = [];
    let numericName: string = "__v" + compileIndex.toString();
    compileIndex++;

    if (!module) {
      compiled[0] = "<html>";
      compiled[1] = '\t<script src="./valerian.js"></script>';
    } else {
      numericName += "__RESERVED__VALERIAN__IMPORT:TEMPLATE_IMPORT";
    }

    const comp = new Compiler(path.dirname(filename), filename, numericName, module);
    logVerbose(module ? "Import: compiling" : "Compiling", filename, "...");

    const readInterface = readline.createInterface({
      input: createReadStream(filename)
    });

    for await (const line of readInterface) {
      const nline = await comp.compile(line);
      if (!compiledWithErrors(nline)) {
        //ON REGION CHANGE
        if (nline !== -1) {
          compiled = compiled.concat(nline.lines);
        }
      } else {
        resolve(nline);
        return;
      }
    }

    const nline = comp.endOfFile();
    // returns [CompiledRegion, string[]]
    if (!compiledWithErrors(nline)) {
      compiled = compiled.concat(nline[0].lines);
      declaredVariables = nline[1];
      if (!module) {
        compiled.push("</html>");
      }
    } else {
      resolve(nline);
      return;
    }

    resolve({
      lines: compiled,
      declaredVariables,
      fileName: filename,
      numericName
    });

    /*readInterface.on('line', async (line) => {
      const nline = await comp.compile(line);
      console.log(nline)
      if (!compiledWithErrors(nline)) {
        //ON REGION CHANGE
        if (nline !== -1) {
          compiled = compiled.concat(nline.lines);
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
          compiled = compiled.concat(nline.lines);
          if (!module) {
            compiled.push("</html>");
          }
        } else {
          console.log(renderError(nline, filename, true));
          let err = new errorHtml(renderError(nline, filename, false));
          compiled = err.html;
          process.exit();
        }
      }

      resolve(compiled);
    });*/
  });
}

const compileFile = async (filename: string) => {
  const compiled = await compileValerian(filename, false);
  if (compiledWithErrors(compiled)) {
    console.log(renderError(compiled, true));
    let err = new errorHtml(renderError(compiled, false));
    writeFileSync(path.join("./dist", "valerian", path.basename(filename, '.vlr')) + ".html", err.html.join("\n"));
    process.exit();
    return;
  }
  writeFileSync(path.join("./dist", "valerian", path.basename(filename, '.vlr')) + ".html", compiled.lines.join("\n"));
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
  const vPath = path.join("./dist", "valerian")
  try {
    rmSync(vPath, { recursive: true, force: true });
  } catch(e) {
    if (e.code != ("ENOENT")) {
      return "Failed creating output directory: " + e.message;
    }
  }
  mkdirSync(vPath);
  let promiseList = [];

  if (!existsSync(arg[0])) {
    console.log("Error: no such file: "+arg[0]);
    return;
  }

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
      const fullPath = path.join(arg[0], file);
      if (file.slice(file.length - 4) == ".vlr") {
        promiseList.push(compileFile(fullPath));
      } else {
        logVerbose("Omitting file", fullPath, "...")
      }
    });
  }
  Promise.all(promiseList).then((values) => {
    TemplateManager.write();
    console.log("Successfully compiled all files.");
  });
})()