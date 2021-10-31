import { ParsedLine } from "../header";
import BaseCompiler from "./base";
import HtmlParser from "../parsers/html";

export interface HtmlKwargs {
  id?: string;
}

export default class HtmlCompiler extends BaseCompiler {
  
  constructor() {
    super();
    this.parser = new HtmlParser();
  }

  protected openBlock(name: string): string {
    return "<" + name + ">";
  }

  protected closeBlock(name: string): string {
    return "</" + name + ">";
  }

  protected openIndependentBlock(name: string): string {
    return "<" + name + " />";
  }
  
  private openTag(name: string, kwargs: HtmlKwargs, closing: boolean = false): string {
    let values = "";
    for (const [key, value] of Object.entries(kwargs)) {
      if (!value) continue;
      values += ` ${key}="${value}"`;
    }
    return "<" + name + values + (closing ? ' /' : '') + ">";
  }

  protected compileLine(obj: ParsedLine): null | string {
    this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
    if (obj.rawString) {
      this.compiled += this.stringBlock(obj.key);
    } else {
      if (obj.notAttached) {
        if (obj.data) {
          this.compiled += this.openTag(obj.key, obj.data, true);
        } else {
          this.compiled += this.openIndependentBlock(obj.key);
        }
        if (obj.value !== null) {
          this.compiled += "\n";
          this.compiled += "\t".repeat(obj.indentLevel + 1 + this.baseIndent);
          this.compiled += this.stringBlock(obj.value);
        }
      } else {
        if (obj.scopeClose) {
          this.compiled += this.closeBlock(obj.key);
        } else {
          if (obj.data) {
            this.compiled += this.openTag(obj.key, obj.data);
          } else {
            this.compiled += this.openBlock(obj.key);
          }
          if (obj.value !== null) {
            this.compiled += "\n";
            this.compiled += "\t".repeat(obj.indentLevel + 1 + this.baseIndent);
            this.compiled += this.stringBlock(obj.value);
          }
        }
      }
    }
    this.compiled += "\n";
    return null;
  }
}