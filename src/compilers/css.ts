import { ParsedLine } from "../header";
import BaseCompiler from "./base";
import CssParser from "../parsers/css";

export default class CssCompiler extends BaseCompiler {
  ignoreNext: boolean;
  scope: Array<string[]>;
  stringOnlyBlock: boolean;

  constructor() {
    super();
    this.parser = new CssParser();
    this.baseIndent = 1;
    this.stringOnlyBlock = false;
    this.scope = [];
    this.ignoreNext = false;
  }
  
  protected openBlock(name: string): string {
    return name + " {";
  }

  // private completePreviousBlock(): string | null {
  //   // weird check
  //   if (this.compiled.length < 1) {
  //     return "Syntax error";
  //   }
  //   this.compiled[this.compiled.length - 1] += " {";
  //   return null;
  // }

  protected closeBlock(name: string): string {
    return "}";
  }

  protected compileLine(obj: ParsedLine): null | string {
    console.log(this.scope)
    let tmp = "";
    if (obj.rawString) {
      let strScope = ""
      for (let i = 0; i < this.scope.length; i++) {
        strScope += this.scope[i].join(" ") + " ";
      }
      if (!strScope || strScope == "") {
        return "Unexpected string";
      }
      strScope = strScope.slice(0, strScope.length - 1);
      let tmpArray = strScope.split(" ");
      let lastKey = tmpArray.pop();
      strScope = tmpArray.join(" ");
      if (this.stringOnlyBlock == false) {
        tmp += "\t".repeat(obj.indentLevel + this.baseIndent - this.scope.length);
        tmp += this.openBlock(strScope);
        this.compiled.push(tmp);
        tmp = "";
      }
      tmp += "\t".repeat(obj.indentLevel + this.baseIndent);
      tmp += lastKey;
      tmp += ": ";
      tmp += obj.key;
      tmp += ";";
      this.stringOnlyBlock = true;
    } else {
      if (obj.scopeClose) {
        this.stringOnlyBlock = false;
        this.scope.pop();
        if (!this.ignoreNext) {
          tmp += "\t".repeat(obj.indentLevel + this.baseIndent);
          tmp += this.closeBlock(obj.key);
        } else {
          this.ignoreNext = false;
        }
      } else {
        if (this.stringOnlyBlock == true) {
          return "Nesting css keywords is not allowed"
        }
        const checkIfId = (_key: string): string => {
          if (_key[0] === _key[0].toUpperCase()) {
            return "#";
          }
          return "";
        }
        
        const keyArray = (obj.key).split(".");
        let key: string[] = [];
        // let nextStoredKey: string = "";
        for (let i = 0; i < keyArray.length; i++) {
          // if (i == keyArray.length - 1) {
          //   nextStoredKey = " " + checkIfId(keyArray[i]) + keyArray[i];
          //   break;
          // }
          key[i] = checkIfId(keyArray[i]);
          key[i] += keyArray[i];
        }
        let strScope = ""
        for (let i = 0; i < this.scope.length; i++) {
          strScope += this.scope[i].join(" ") + " ";
        }
        strScope = strScope.slice(0, strScope.length - 1);
        this.scope.push(key)
        if (obj.value !== null) {
          if (strScope != "") {
            console.log(strScope)
            // since you pushed new scope -1
            tmp += "\t".repeat(obj.indentLevel + this.baseIndent - (this.scope.length - 1));
            tmp += this.openBlock(strScope);
            this.compiled.push(tmp);
            tmp = "";
          }
          tmp += "\t".repeat(2 + this.baseIndent) //obj.indentLevel + this.baseIndent);
          tmp += key;
          tmp += ": ";
          tmp += obj.value;
          tmp += ";";
          this.ignoreNext = true;
        } else {
          return null;
        }
      }
    }
    this.compiled.push(tmp);
    return null;
  }
}