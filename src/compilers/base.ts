import { ParsedList, ParsedLine, CompiledLine, ParserType } from "../header";
import BaseParser from "../parsers/base";

export default class BaseCompiler {
  error: null | string;
  compiled: string;
  parser: ParserType;
  baseIndent: number;
  //line: string;

  constructor() {
    this.error = null;
    //this.line = "__INIT";
    this.compiled = "";
    this.parser = new BaseParser();
    this.baseIndent = 0;
  }

  protected openBlock(name: string): string {
    return "+" + name;
  }

  protected closeBlock(name: string): string {
    return "-" + name;
  }

  protected stringBlock(name: string): string {
    return name;
  }

  protected compileLine(obj: ParsedLine): null | string {
    this.compiled += "\t".repeat(obj.indentLevel + this.baseIndent);
    if (obj.rawString) {
      this.compiled += this.stringBlock(obj.key);
    } else {
      if (obj.scopeClose) {
        this.compiled += this.closeBlock(obj.key);
      } else {
        this.compiled += this.openBlock(obj.key);
        if (obj.value !== null) {
          this.compiled += "\n";
          this.compiled += "\t".repeat(obj.indentLevel + 1 + this.baseIndent);
          this.compiled += this.stringBlock(obj.value);
        }
      }
    }
    this.compiled += "\n";
    return null;
  }

  protected handleParsed(list: ParsedList): CompiledLine {
    if (list.error) {
      return {
        line: "",
        error: list.error
      };
    }

    //console.log(list);

    for (let i = 0; i < list.lines.length; i++) {
      const obj = list.lines[i];
      if (obj.indentLevel < 1) {
        this.error = "Indent error";
      }

      if (!this.error) {
        this.error = this.compileLine(obj);
      } else {
        break;
      }
    }

    return {
      line: this.compiled,
      error: this.error
    };
  }

  public finish(): CompiledLine {
    this.compiled = "";
    this.error = null;

    const result = this.parser.finish();

    return this.handleParsed(result);
  }

  public compile(line: string, indent: number, lineNumber: number): CompiledLine {
    this.compiled = "";
    this.error = null;
    //this.line = line;

    const result = this.parser.parse(line, indent, lineNumber);

    return this.handleParsed(result);
  }
}