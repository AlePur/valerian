import { ParsedLine } from "../header";
import BaseCompiler from "./base";
import CssParser from "../parsers/css";

export default class CssCompiler extends BaseCompiler {
  ignoreNext: boolean;
  storedKey: string | null;

  constructor() {
    super();
    this.storedKey = "";
    this.parser = new CssParser();
    this.baseIndent = 1;
    this.ignoreNext = false;
  }
  
  protected openBlock(name: string): string {
    return name;
  }

  private completePreviousBlock(): string | null {
    // weird check
    if (this.compiled.length < 1) {
      return "Syntax error";
    }
    this.compiled[this.compiled.length - 1] += " {";
    return null;
  }

  protected closeBlock(name: string): string {
    return "}";
  }

  protected compileLine(obj: ParsedLine): null | string {
    let tmp = "";
    let storedKey = null;
    if (this.scope.length != 0) {
      let t = this.scope[this.scope.length - 1].split(" ");
      storedKey = t[t.length - 1];
    }
    if (obj.rawString) {
      if (storedKey == null) {
        return "Unexpected string"
      }
      this.error = this.completePreviousBlock();
      if (this.error) return this.error;
      tmp += "\t".repeat(obj.indentLevel + this.baseIndent);
      tmp += storedKey;
      tmp += ": ";
      tmp += obj.key;
      tmp += ";";
    } else {
      if (obj.scopeClose) {
        this.scope.pop();
        if (!this.ignoreNext) {
          tmp += "\t".repeat(obj.indentLevel + this.baseIndent);
          tmp += this.closeBlock(obj.key);
        } else {
          this.ignoreNext = false;
        }
      } else {
        /*if (this.storedKey == null) {
          return "Nesting css keywords is not allowed"
        }*/
        const checkIfId = (_key: string): string => {
          if (_key[0] === _key[0].toUpperCase()) {
            return "#";
          }
          return "";
        }

        const keyArray = (obj.key).split(".");
        let key = "";
        tmp += "\t".repeat(obj.indentLevel + this.baseIndent);
        let nextStoredKey: string = "";
        for (let i = 0; i < keyArray.length; i++) {
          if (i == keyArray.length - 1) {
            nextStoredKey = " " + checkIfId(keyArray[i]) + keyArray[i];
            break;
          }
          key += checkIfId(keyArray[i]);
          key += keyArray[i] + " ";
        }
        // remove whitespace
        key = key.slice(0, key.length - 1);
        if (storedKey !== null) {
          key += storedKey;
        }
        this.scope.push(key + nextStoredKey)
        if (obj.value !== null) {
          tmp += key;
          tmp += ": ";
          tmp += obj.value;
          tmp += ";";
          this.ignoreNext = true;
        } else {
          tmp += this.openBlock(key);
        }
        console.log(this.scope)
      }
    }
    this.compiled.push(tmp);
    return null;
  }
}