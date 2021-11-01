import { getString } from "./preprocessors/base"
import { declareImport } from "./index"
import { CompileError } from "./header"
import * as path from "path"
import { existsSync } from "fs";

export interface CompiledDefscript {
  [key: string]: string
}

class DefscriptCompiler {
  compiled: CompiledDefscript;
  indentLevel: number;
  directory: string;
  error: null | string;
  lineNumber: number;

  constructor() {
    this.indentLevel = 0;
    this.compiled = {};
    this.error = null;
    this.lineNumber = 0;
  }

  public setDirectory(dir: string) {
    this.directory = dir;
  }

  public resolveVariable(name: string): string | number | undefined {
    return this.compiled[name];
  }

  public async parse(line: string, indent: number, lineNumber: number): Promise<string | null | CompileError> {
    this.lineNumber = lineNumber;
    this.error = null;
    //console.log(this.openBlocks)

    if (!this.error) {
      //this.indentLevel = indent;

      if (line[0] == " " || line[0] == "\t") {
        this.error = "Unexpected whitespace, possible cause is mixed tabs and spaces"
      } else if (line[0] == "@") {
        const pair = line.split(" ")
        if (pair.length != 2) {
          return this.error = "No arguments provided";
        }
        let arg = pair[1].trim();
        let action = pair[0].trim().slice(1);
        if (action == "import") {
          if (arg.indexOf(".vlr") == -1) {
            arg += ".vlr"
          }
          const importPath = path.join(this.directory, arg);
          if (!existsSync(importPath)) {
            return "File does not exist";
          }
          const _import = await declareImport(importPath);
          if (_import !== true) {
            return _import;
          }
        }
      } else {
        if (line.trim() != "") {
          let pair = line.split("=");
          let key = pair[0].trim();
          if (pair.length != 2 || key == '') {
            this.error = "Syntax error"
          } else {
            let value = getString(pair[1].trim());
            if (value == -1) {
              return this.error = "Expected a string";
            } else if (value.err !== null) {
              return this.error = value.err;
            }
            if (this.compiled[key] !== undefined) {
              return this.error = "Variable redefinition not permitted"
            }
            this.compiled[key] = value.str;
          }
        }
      }
    }

    return this.error;
  }
}

export const Defscript = new DefscriptCompiler();