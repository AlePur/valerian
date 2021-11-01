import { ParsedLine } from "../header";
import BaseCompiler from "./base";
import CssParser from "../parsers/css";

export default class CssCompiler extends BaseCompiler {
  ignoreNext: boolean;
  scope: Array<string[]>;
  stringOnlyBlock: boolean;
  previousScope: string;

  constructor() {
    super();
    this.parser = new CssParser();
    this.baseIndent = 1;
    this.stringOnlyBlock = false;
    this.previousScope = "_RES";
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
    let tmp = "";
    const closeScope = (): void => {
      tmp += "\t".repeat(1 + this.baseIndent);
      tmp += this.closeBlock(obj.key);
      this.compiled.push(tmp);
      tmp = "";
    }

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
      tmp += "\t".repeat(2 + this.baseIndent);
      tmp += lastKey;
      tmp += ": ";
      tmp += obj.key;
      tmp += ";";
      this.stringOnlyBlock = true;
      this.ignoreNext = true;
    } else {
      if (obj.scopeClose) {
        this.stringOnlyBlock = false;
        this.scope.pop();
        if (!this.ignoreNext) {
          closeScope();
          this.ignoreNext = true;
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
        if (key.length > 1) {
          for (let i = 0; i < key.length - 1; i++) {
            strScope += key[i] + " ";
          }
        }

        strScope = strScope.slice(0, strScope.length - 1);

        let familiarScope: boolean = false;
        if (this.previousScope == strScope) {
          familiarScope = true;
        }
        this.previousScope = strScope;
        this.scope.push(key);

        if (obj.value !== null) {
          if (familiarScope == false) {
            if (strScope != "") {
              if (this.ignoreNext == false) {
                closeScope();
              }
              // since you pushed new scope -1
              tmp += "\t".repeat(obj.indentLevel + this.baseIndent - (this.scope.length - 1));
              tmp += this.openBlock(strScope);
              this.compiled.push(tmp);
              tmp = "";
            }
          }
          tmp += "\t".repeat(2 + this.baseIndent) //obj.indentLevel + this.baseIndent);
          if (key.length > 1) {
            tmp += key[key.length - 1];
          } else {
            tmp += key[0];
          }
          tmp += ": ";
          tmp += obj.value;
          tmp += ";";
          this.ignoreNext = true;
        } else {
          this.ignoreNext = false;
          return null;
        }
      }
    }
    if (tmp != "") {
      this.compiled.push(tmp);
    }
    return null;
  }
}