import { declareImport } from "./index"
import { CompileError } from "./header"
import { Module } from "./template"
import * as path from "path"
import { existsSync } from "fs";
import { type } from "os";
import Compiler from "./compiler";

export interface CompiledDefscript {
  [key: string]: [string | number, number]
}

export default class DefscriptCompiler {
  compiled: CompiledDefscript;
  indentLevel: number;
  error: null | string;
  parent: Compiler;
  importIndex: number;
  lineNumber: number;

  constructor(compiler: Compiler) {
    this.indentLevel = 0;
    this.compiled = {};
    this.parent = compiler;
    this.importIndex = 0;
    this.error = null;
    this.lineNumber = 0;
  }

  public registerImport(): string {
    return this.parent.numericName + "__i" + (this.importIndex++).toString();
  }
 
  public getAbsolutePath(filename: string): string {
    if (filename.indexOf(".vlr") == -1) {
      filename += ".vlr"
    }
    return path.join(this.parent.directory, filename);
  }

  public finish(): void {
    this.parent.templateModule.endRegion();
  }

  public registerHook(value: string): string {
    return this.parent.templateModule.registerHook(value);
  }

  public getString (str: string):  { str?: string | number, err: null | string, type?: number } | -1 {
    let symbol = str[0];
    if (symbol == "{") {
      if (str[str.length - 1] != "}") {
        return { err: "Unexpected end of line, expected a closing bracket" }
      }
      let name = str.slice(1, str.length - 1);
      const p = name.indexOf("(");
      if (p != -1) {
        name = name.slice(0, p)
      }
      let variable = this.resolveVariable(name);
      if (variable === undefined) {
        return { err: "Accessing undefined variable" };
      }
      if (variable[1] == 0) {
        return { err: "To bind a static variable use &" + name };
      }
      return { str: variable[1] == 2 ? variable[0] : str, err: null, type: variable[1] }
    }
    if (symbol == "&") {
      let variable = this.resolveVariable(str.slice(1));
      if (variable === undefined) {
        return { err: "Accessing undefined variable" };
      }
      const value = variable[0].toString();
      if (variable[1] == 1) {
        return { err: "To bind a dynamic variable use {" + str.slice(1) + "}" };
      } else if (variable[1] == 2) {
        return { err: "To bind a function use {" + str.slice(1) + "}" };
      }
      return { str: value, err: null, type: 0 }
    }
    if (symbol == "'" || symbol == "\"") {
      if (str[str.length - 1] != symbol) {
        return { err: "Unexpected end of line, missing last quote" }
      }
      return { str: str.slice(1, str.length - 1), err: null, type: 0 }
    }
    return -1;
  }

  public resolveVariable(name: string): [string | number, number] | undefined {
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
        if (action == "declare") {
          const value = undefined;
          this.compiled[arg] = [value, 1];
          this.parent.templateModule.addVariable(arg, value, 1);
          this.parent.declaredVariables.push(arg);
        } else if (action == "import") {
          const str = this.getString(arg);
          if (str != -1) {
            if (str.err) {
              return str.err;
            } else {
              if (str.type == 2) {
                return "Passing a function as a parameter is not permitted";
              }
              arg = str.str.toString();
            }
          }  
          const importPath = this.getAbsolutePath(arg);
          if (!existsSync(importPath)) {
            return "File does not exist (" + importPath + ")";
          }
          const _import = await declareImport(importPath);
          if (_import !== true) {
            return _import;
          }
        }
      } else {
        if (line.trim() != "") {
          let dynamic: boolean = false;
          let ppair = line.split(" ");
          if (ppair[0] == "function") {
            if (ppair.length != 2) {
              return "Syntax error, function keyword takes one parameter";
            }
            this.compiled[ppair[1]] = [this.parent.numericName, 2];
            this.parent.templateModule.addVariable(ppair[1], this.parent.numericName, 2);
            return this.error;
          }
          let pair = line.split("=");
          let key = pair[0].trim();
          let splitKey = key.split(" ");
          if (splitKey[0] == "dynamic") {
            if (splitKey.length != 2) {
              return "Expected a variable name when declaring a dynamic variable";
            }
            key = splitKey[1];
            dynamic = true;
          }
          if (pair.length != 2 || key == '') {
            this.error = "Syntax error"
          } else {
            const str = pair[1].trim();
            let value = this.getString(str);
            if (value == -1) {
              if (parseInt(str).toString() == str) {
                value = { str: parseInt(str), err: null, type: 0 };
              } else {
                return "Non-numeric value passed, use quotes to pass a string"
              }
            } else if (value.err !== null) {
              return value.err;
            }
            if (value.type != 0) {
              return "Dynamic variables and functions cannot be copied"
            }
            if (this.compiled[key] !== undefined) {
              return "Variable redefinition not permitted"
            }
            const type = (dynamic === true ? 1 : 0);
            this.compiled[key] = [value.str, type];
            this.parent.templateModule.addVariable(key, value.str, type);
          }
        }
      }
    }

    return this.error;
  }
}