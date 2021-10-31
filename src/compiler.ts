import { CompileError, CompiledRegion, ParsedLine, ParsedList, compiledWithErrors } from "./header";
import CssCompiler from "./compilers/css";
import HtmlCompiler from "./compilers/html";

type Region = "html" | "css" | "js";

const throwError = (message: string, trace: string, line: number): CompileError => {
  return {
    message,
    trace,
    line
  }
}

/*const assert = (a: number, b: number) => {
  return 0;
  return throwError("33", "dsdsd", 6566);
}*/

export default class Compiler {
  indent: string;
  indentLevel: number;
  lineNumber: number;
  baseIndent: number;
  htmlParser: HtmlCompiler;
  cssParser: CssCompiler;
  region: Region;

  constructor() {
    this.lineNumber = 1;
    this.indentLevel = 0;
    this.indent = "";
    this.baseIndent = 0;
    this.htmlParser = new HtmlCompiler();
    this.cssParser = new CssCompiler();
    this.region = "js";
  }

  private switchRegion(region: Region, line: string): CompiledRegion | CompileError {
    let nline: CompiledRegion | CompileError | -1 = { lines: [] };
    if (this.indentLevel != 0) {
      return throwError("Style and script tags are not allowed in the scope of another language", line, this.lineNumber);
    }
    if (this.region != "js") {
      nline = this.parseLine("finish");
    }
    if (nline === -1) {
      return throwError("Unexpected end of line", line, this.lineNumber);
    }

    this.region = region;
    /*if (!compiledWithErrors(nline)) {
      nline += this.parseLine("parse", line);
    }*/
    if (!compiledWithErrors(nline)) {
      if (region == "css") {
        this.baseIndent = 1;
        nline.lines.push("\t<style>");
      } else if (region == "html") {
        this.baseIndent = 0;
      }
    }

    return nline;
  }

  private parseLine(action: string, line: string = ""): CompiledRegion | CompileError | -1 {
    let nline = "";
    let parsed: CompiledRegion | null | string;
    if (this.region == "html") {
      parsed = ((action == "parse") ? this.htmlParser.compile(line, this.indentLevel, this.lineNumber) : this.htmlParser.finish());
    } else if (this.region == "css") {
      parsed = ((action == "parse") ? this.cssParser.compile(line, this.indentLevel, this.lineNumber) : this.cssParser.finish());
    } else {
      return throwError("Unexpected exception", line, this.lineNumber);
    }

    //let parsed = this.htmlParser[action](line, this.indentLevel);
    if (typeof parsed === "string") {
      return throwError(parsed, line, this.lineNumber);
    }
    if (parsed === null) {
      return -1;
    }
    return parsed;
  }

  public endOfFile(): CompiledRegion | CompileError {
    let nline: CompiledRegion | CompileError | -1; 
    this.indentLevel = 0;
    nline = this.parseLine("finish");
    if (nline === -1) {
      return throwError("Unexpected end of line", "_EOF_RESERVED", this.lineNumber);
    }
    if (!compiledWithErrors(nline)) {
      if (this.region == "css") {
        nline.lines.push("\t</style>");
      } else if (this.region == "js") {
        nline.lines.push("\t</script>");
      }
    }

    return nline;
  }

  public compile(line: string): CompiledRegion | CompileError | -1 {
    let nline: CompiledRegion | CompileError | -1;
    if (line[0] == " " || line[0] == "\t") {
      if (!this.indent) {
        const regex = /[^ \t]/g;
        this.indent = line.slice(0, line.search(regex));
        this.indentLevel = 1;
        line = line.slice(line.search(regex));
      } else {
        let len = this.indent.length;
        let i = 0;
        for (i = 0; true; i++) {
          if (line.slice(0 + (i*len), len*(i + 1)) != this.indent) break;
        }
        if (i > this.indentLevel + 1) {
          return throwError("Unexpected block indent", line, this.lineNumber);
        }
        this.indentLevel = i;
        line = line.slice(this.indentLevel*len)
      }
      if (this.lineNumber == 0) {
        return throwError("Unexpected block indent", line, this.lineNumber);
      }
    } else {
      this.indentLevel = 0;
    } 

    line = line.trimEnd();

    if (line[0] != "#") {
      if (line == "html:") {
        nline = this.switchRegion("html", line);
      } else if (line == "style:") {
        nline = this.switchRegion("css", line);
      } else {
        nline = this.parseLine("parse", line);
      }
    }

    this.lineNumber++;
    return nline;
  }
}