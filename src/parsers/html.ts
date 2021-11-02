import { ParsedLine } from "../header";
import BaseCompiler from "./base";
import DefscriptCompiler from "../defscript"
import { fetchImport } from "../index";
import HtmlParser from "../preprocessors/html";

export interface HtmlKwargs {
  id?: string;
}

export default class HtmlCompiler extends BaseCompiler {
  defscript: DefscriptCompiler
  
  constructor(pparser: DefscriptCompiler) {
    super();
    this.parser = new HtmlParser(pparser);
    this.defscript = pparser;
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
    //console.log(obj)
    if (obj.key[0] == "@") {
      const name = obj.key.slice(1);
      const _import = fetchImport(this.defscript.getAbsolutePath(name));
      if (_import == undefined) {
        return "Accessing undefined import";
      }
      for (let i = 0; i < _import.length; i++) {
        this.compiled.push("\t".repeat((obj.indentLevel - 1) + this.baseIndent) + _import[i]);
      }
      return null;
    } 

    let tmp: string = "";
    tmp += "\t".repeat(obj.indentLevel + this.baseIndent);
    if (obj.rawString) {
      tmp += this.stringBlock(obj.key);
    } else {
      if (obj.notAttached) {
        if (obj.data) {
          tmp += this.openTag(obj.key, obj.data, true);
        } else {
          tmp += this.openIndependentBlock(obj.key);
        }
        if (obj.value !== null) {
          this.compiled.push(tmp);
          tmp = "";
          tmp += "\t".repeat(obj.indentLevel + 1 + this.baseIndent);
          tmp += this.stringBlock(obj.value);
        }
      } else {
        if (obj.scopeClose) {
          tmp += this.closeBlock(obj.key);
        } else {
          if (obj.data) {
            tmp += this.openTag(obj.key, obj.data);
          } else {
            tmp += this.openBlock(obj.key);
          }
          if (obj.value !== null) {
            this.compiled.push(tmp);
            tmp = "";
            tmp += "\t".repeat(obj.indentLevel + 1 + this.baseIndent);
            tmp += this.stringBlock(obj.value);
          }
        }
      }
    }
    this.compiled.push(tmp);
    return null;
  }
}