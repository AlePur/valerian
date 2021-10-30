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
        const key = (obj.key).replace(/\./g, ' ');
        this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
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