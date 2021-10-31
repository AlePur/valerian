import { ParsedLine, CompiledLine } from "../header";
import BaseCompiler from "./base";
import CssParser from "../parsers/css";

export default class CssCompiler extends BaseCompiler {
  ignoreNext: boolean;

  constructor() {
    super();
    this.parser = new CssParser();
    this.baseIndent = 1;
    this.ignoreNext = false;
  }
  
  protected openBlock(name: string): string {
    return name + " {";
  }

  protected closeBlock(name: string): string {
    return "}";
  }

  protected compileLine(obj: ParsedLine): null | string {
    if (obj.rawString) {
      this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
      this.compiled += this.stringBlock(obj.key);
      this.compiled += "\n";
    } else {
      if (obj.scopeClose) {
        if (!this.ignoreNext) {
          this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
          this.compiled += this.closeBlock(obj.key);
          this.compiled += "\n";
        } else {
          this.ignoreNext = false;
        }
      } else {
        const keyArray = (obj.key).split(".");
        let key = "";
        this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
        for (let i = 0; i < keyArray.length; i++) {
          if (keyArray[i][0] === keyArray[i][0].toUpperCase()) {
            key += "#";
          }
          key += keyArray[i] + " ";
        }
        // remove whitespace
        key = key.slice(0, key.length - 1);
        if (obj.value !== null) {
          this.compiled += key;
          this.compiled += ": ";
          this.compiled += obj.value;
          this.compiled += ";";
          this.ignoreNext = true;
        } else {
          this.compiled += this.openBlock(key);
        }
        this.compiled += "\n";
      }
    }
    return null;
  }
}