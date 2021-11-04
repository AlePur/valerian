import { ParsedLine, CompiledRegion } from "../header";
import BaseCompiler from "./base";
import DefscriptCompiler from "../defscript"
import CssParser from "../preprocessors/css";

export default class CssCompiler extends BaseCompiler {
  blockIsOpen: boolean;
  scope: Array<string[]>;
  stringOnlyBlock: boolean;
  previousScope: string;

  constructor(pparser: DefscriptCompiler) {
    super();
    this.parser = new CssParser(pparser);
    this.baseIndent = 1;
    this.stringOnlyBlock = false;
    this.previousScope = "_RES";
    this.scope = [];
    this.blockIsOpen = false;
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

  public finish(): CompiledRegion | string {
    this.error = null;

    const result = this.parser.finish();

    if (this.blockIsOpen) {
      this.compiled.push("\t".repeat(1 + this.baseIndent)+"}");
    }

    if (this.error) {
      return this.error;
    }

    return {
      lines: this.compiled
    }
  }

  protected closeBlock(name: string): string {
    return "}";
  }

  protected compileLine(obj: ParsedLine): null | string {
    //console.log(this.scope, this.stringOnlyBlock, this.blockIsOpen)
    let tmp = "";
    const closeScope = (): void => {
      this.stringOnlyBlock = false;
      tmp += "\t".repeat(1 + this.baseIndent);
      tmp += this.closeBlock(obj.key);
      this.compiled.push(tmp);
      tmp = "";
    }
    const openScope = (s: string): void => {
      tmp += "\t".repeat(1 + this.baseIndent);
      tmp += this.openBlock(s);
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
      if (this.blockIsOpen == false) {
        openScope(strScope);
        this.blockIsOpen = true;
      }
      tmp += "\t".repeat(2 + this.baseIndent);
      tmp += lastKey;
      tmp += ": ";
      tmp += obj.key;
      tmp += ";";
      this.stringOnlyBlock = true;
    } else {
      if (obj.scopeClose) {
        this.scope.pop();
      } else {
        const checkIfId = (_key: string): string => {
          if (_key[0] === _key[0].toUpperCase() && _key[0] !== _key[0].toLowerCase()) {
            return "#";
          }
          return ""; 
        }
        
        let keyArray = (obj.key).split(".");
        if (obj.key[0] == ".") {
          keyArray.shift();
          keyArray[0] = "." + keyArray[0];
        }
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
              if (this.blockIsOpen) {
                closeScope();
              }
              // since you pushed new scope -1
              openScope(strScope);
            } else {
              openScope("html");
            }
          } else {
            if (this.stringOnlyBlock == true) {
              return "Nesting css keywords is not allowed"
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
          //this.ignoreNext = true;
          this.blockIsOpen = true;
        } else {
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