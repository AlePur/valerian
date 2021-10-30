import { CompileError, ParsedLine, compiledWithErrors } from "./header";
import Css from "./parsers/css";
import Html from "./parsers/html";
//import Parser from "./parsers/base";

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
  htmlParser: Html;
  cssParser: Css;
  region: Region;

  constructor() {
    this.lineNumber = 1;
    this.indentLevel = 0;
    this.indent = "";
    this.baseIndent = 0;
    this.htmlParser = new Html();
    this.cssParser = new Css();
    this.region = "js";
  }

  private switchRegion(region: Region, line: string): string | CompileError {
    let nline: string | CompileError = "";
    if (this.indentLevel != 0) {
      return throwError("Style and script tags are not allowed in the scope of another language", line, this.lineNumber);
    }
    if (this.region != "js") {
      nline = this.parseLine("finish");
    }
    this.region = region;
    /*if (!compiledWithErrors(nline)) {
      nline += this.parseLine("parse", line);
    }*/
    if (!compiledWithErrors(nline)) {
      if (region == "css") {
        this.baseIndent = 1;
        nline += "\t<style>\n";
      } else if (region == "html") {
        this.baseIndent = 0;
      }
    }
    return nline;
  }

  private parseLine(action: string, line: string = ""): string | CompileError {
    let nline = "";
    let parsed: ParsedLine;
    if (this.region == "html") {
      parsed = ((action == "parse") ? this.htmlParser.parse(line, this.indentLevel) : this.htmlParser.finish());
    } else if (this.region == "css") {
      parsed = ((action == "parse") ? this.cssParser.parse(line, this.indentLevel) : this.cssParser.finish());
    } else {
      return throwError("Unexpected exception", line, this.lineNumber);
    }
    //let parsed = this.htmlParser[action](line, this.indentLevel);
    console.log(parsed)
    if (parsed.error) {
      return throwError(parsed.error, line, this.lineNumber);
    }
    let lines = parsed.lines;
    if (lines.length == 1) {
      nline += "\t".repeat(this.indentLevel + this.baseIndent);
      nline += lines[0];
      nline += "\n";
    } else {
      for (let i = 0; i < lines.length; i++) {
        nline += "\t".repeat(Math.max(this.indentLevel + ((lines.length - (action != "finish" ? ((parsed.scopeClose ? 1 : 2) + this.baseIndent) : 0)) - i), this.indentLevel));
        nline += lines[i];
        nline += "\n";
      }
    }
    return nline;
  }

  public endOfFile(): string | CompileError {
    let nline: string | CompileError = ""; 
    this.indentLevel = 0;
    nline = this.parseLine("finish");
    if (!compiledWithErrors(nline)) {
      if (this.region == "css") {
        nline += "\t</style>\n";
      }
    }
    return nline;
  }

  public compile(line: string): string | CompileError {
    let nline: string | CompileError = "";
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
        this.indentLevel = i;
        line = line.slice(this.indentLevel*len)
      }
      if (this.lineNumber == 0) {
        return throwError("Unexpected indent block", line, this.lineNumber);
      }
    } else {
      this.indentLevel = 0;
    } 

    line = line.trim();

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