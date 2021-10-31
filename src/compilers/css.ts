import { ParsedLine, CompiledLine } from "../header";
import BaseCompiler from "./base";
import CssParser from "../parsers/css";

export default class CssCompiler extends BaseCompiler {
  ignoreNext: boolean;
  storedKey: string | null;

  constructor() {
    super();
    this.storedKey = null;
    this.parser = new CssParser();
    this.baseIndent = 1;
    this.ignoreNext = false;
  }
  
  protected openBlock(name: string): string {
    return name;
  }

  private completePreviousBlock(): string {
    
  }

  protected closeBlock(name: string): string {
    return "}";
  }

  protected compileLine(obj: ParsedLine): null | string {
    if (obj.rawString) {
      if (this.storedKey == null) {
        return "Unexpected string"
      }
      this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
      this.compiled += this.storedKey;
      this.compiled += ": ";
      this.compiled += obj.key;
      this.compiled += ";";
      this.storedKey = null;
      this.compiled += "\n";
    } else {
      if (obj.scopeClose) {
        if (this.storedKey != null) {
          //return "Empty blocks are not allowed"
        }
        this.scope.pop();
        if (!this.ignoreNext) {
          this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
          this.compiled += this.closeBlock(obj.key);
          this.compiled += "\n";
        } else {
          this.ignoreNext = false;
        }
      } else {
        if (this.storedKey == null) {
          //return "Nesting css keywords is not allowed"
        }
        const checkIfId = (_key: string): string => {
          if (_key[0] === _key[0].toUpperCase()) {
            return "#";
          }
          return "";
        }

        const keyArray = (obj.key).split(".");
        let nextStoredKey = "";
        let key = "";
        this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
        for (let i = 0; i < keyArray.length; i++) {
          if (i == keyArray.length - 1) {
            nextStoredKey = checkIfId(keyArray[i]) + keyArray[i];
            break;
          }
          key += checkIfId(keyArray[i]);
          key += keyArray[i] + " ";
        }
        // remove whitespace
        key = key.slice(0, key.length - 1);
        if (this.storedKey !== null) {
          key += this.storedKey;
        }
        this.scope.push(key)
        if (obj.value !== null) {
          this.compiled += key;
          this.compiled += ": ";
          this.compiled += obj.value;
          this.compiled += ";";
          this.ignoreNext = true;
        } else {
          this.compiled += this.openBlock(key);
          this.storedKey = nextStoredKey;
        }
        console.log(this.scope)
        this.compiled += "\n";
      }
    }
    return null;
  }
}