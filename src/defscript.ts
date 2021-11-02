import { declareImport } from "./index"
import { CompileError } from "./header"
import { Module } from "./template"
import * as path from "path"
import { existsSync } from "fs";

export interface CompiledDefscript {
  [key: string]: string
}

export default class DefscriptCompiler {
  compiled: CompiledDefscript;
  indentLevel: number;
  directory: string;
  error: null | string;
  module: Module;
  lineNumber: number;

  constructor(dir: string, module: Module) {
    this.indentLevel = 0;
    this.compiled = {};
    this.module = module;
    this.directory = dir;
    this.error = null;
    this.lineNumber = 0;
  }

  public getAbsolutePath(filename: string): string {
    if (filename.indexOf(".vlr") == -1) {
      filename += ".vlr"
    }
    return path.join(this.directory, filename);
  }

  public finish(): void {
    this.module.endRegion();
  }

  public registerHook(value: string): string {
    return this.module.registerHook(value);
  }

  public getString (str: string):  { str?: string, err: null | string } | -1 {
    let symbol = str[0];
    if (symbol == "{") {
      if (str[str.length - 1] != "}") {
        return { err: "Unexpected end of line, expected a closing bracket" }
      }
      //preparing to hook
      return { str: str, err: null }
    }
    if (symbol == "&") {
      let variable = this.resolveVariable(str.slice(1));
      if (variable === undefined) {
        return { err: "Accessing undefined variable" };
      }
      return { str: variable.toString(), err: null }
    }
    if (symbol == "'" || symbol == "\"") {
      if (str[str.length - 1] != symbol) {
        return { err: "Unexpected end of line, missing last quote" }
      }
      return { str: str.slice(1, str.length - 1), err: null }
    }
    return -1;
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
          return "No arguments provided";
        }
        let arg = pair[1].trim();
        let action = pair[0].trim().slice(1);
        if (action == "import") {
          const str = this.getString(arg);
          if (str != -1) {
            if (str.err) {
              return str.err;
            } else {
              arg = str.str;
            }
          }  
          const importPath = this.getAbsolutePath(arg);
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
            let value = this.getString(pair[1].trim());
            if (value == -1) {
              return "Expected a string";
            } else if (value.err !== null) {
              return value.err;
            }
            if (this.compiled[key] !== undefined) {
              return "Variable redefinition not permitted"
            }
            this.compiled[key] = value.str;
            this.module.addVariable(key, value.str);
          }
        }
      }
    }

    return this.error;
  }
}