import { ParsedLine, HtmlKwargs } from "../header";
import BaseCompiler from "./base";
import DefscriptCompiler from "../defscript"
import { fetchImport } from "../index";
import HtmlParser from "../preprocessors/html";

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

  private checkHook(str: string, dynamic: boolean): string | -1 {
    if (dynamic) {
      return this.defscript.registerHook(str.slice(1, str.length - 1));
    }
    return -1;
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
    let tmp: string = "";
    tmp += "\t".repeat(obj.indentLevel + this.baseIndent);
    if (obj.rawString) {
      const hooked = this.checkHook(obj.key, obj.dynamic);
      if (hooked != -1) {
        tmp += this.openTag("span", { "class": this.defscript.parent.numericName + hooked }, true);
      } else {
        tmp += this.stringBlock(obj.key);
      }
    } else {
      if (obj.key[0] == "@") {
        let name: string = obj.key.slice(1);
        let args: Array<string | number> = [];
        let index = name.indexOf("(");
        if (index != -1) {
          if (name[name.length - 1] != ")") {
            return "Unexpected end of line, expected a closing paranthesis"
          }
          let argstr = name.slice(index + 1, name.length - 1);
          name = name.slice(0, index);
          if (argstr != "") {
            let _args = argstr.split(",");
            for (let i = 0; i < _args.length; i++) {
              const value = _args[i].trim();
              let str = this.defscript.getString(value);
              if (str == -1) {
                if (parseInt(value).toString() != value) {
                  return "Unexpected non-numeric argument, use quotes to pass a string"
                }
                str = { err: null, str: value }
              }
              if (str.err) {
                return str.err;
              }
              args.push(str.str);
            }
          }
        }

        const _import = fetchImport(this.defscript.getAbsolutePath(name));
        const importName = this.defscript.registerImport();
        const addIndent = "\t".repeat((obj.indentLevel - 1) + this.baseIndent);
        if (_import == undefined) {
          return "Accessing undefined import";
        }
        if (_import.declaredVariables.length != args.length) {
          let _a = _import.declaredVariables.length + " argument" + (_import.declaredVariables.length == 1 ? '' : 's');
          return "Expected " + _a + " but got " + args.length;
        }
        let script: string[] = [
          "\t<script>"
        ];
        script = script.concat(this.defscript.parent.valRecall(importName, _import.fileName));
        for (let i = 0; i < args.length; i++) {
          script.push("\t\t" + _import.declaredVariables[i] + args[i].toString());
        }
        script.push("\t</script>")
        for (let i = 0; i < script.length; i++) {
          script[i] = addIndent + script[i];
        }
        this.compiled = this.compiled.concat(script);
        for (let i = 0; i < _import.lines.length; i++) {
          this.compiled.push(addIndent + _import.lines[i].replace(_import.numericName, importName));
        }
        return null;
      }
      if (obj.notAttached) {
        if (obj.data) {
          tmp += this.openTag(obj.key, obj.data, true);
        } else {
          tmp += this.openIndependentBlock(obj.key);
        }
        if (obj.value !== null) {
          return "IMpossible case! Look for yourself"
          // this.compiled.push(tmp);
          // tmp = "";
          // tmp += "\t".repeat(obj.indentLevel + 1 + this.baseIndent);
          // tmp += this.stringBlock(obj.value);
        }
      } else {
        if (obj.scopeClose) {
          tmp += this.closeBlock(obj.key);
        } else {
          if (obj.value !== null) {
            const hooked = this.checkHook(obj.value, obj.dynamic);
            if (hooked != -1) {
              if (obj.data == null) {
                obj.data = {};
              }
              const className = this.defscript.parent.numericName + hooked;
              if (obj.data["class"]) {
                obj.data["class"] += " " + className
              } else {
                obj.data["class"] = className;
              }
            }
            if (obj.data) {
              tmp += this.openTag(obj.key, obj.data);
            } else {
              tmp += this.openBlock(obj.key);
            }
            this.compiled.push(tmp);
            tmp = "";
            tmp += "\t".repeat(obj.indentLevel + 1 + this.baseIndent);
            tmp += this.stringBlock(obj.value);
          } else {
            if (obj.data) {
              tmp += this.openTag(obj.key, obj.data);
            } else {
              tmp += this.openBlock(obj.key);
            }
          }
        }
      }
    }
    this.compiled.push(tmp);
    return null;
  }
}