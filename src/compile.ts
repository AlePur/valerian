import { CompileError } from "./header";
import Html from "./html";

const throwError = (message: string, trace: string, line: number): CompileError => {
  return {
    message,
    trace,
    line
  }
}

const assert = (a: number, b: number) => {
  return 0;
  return throwError("33", "dsdsd", 6566);
}

export default class Compiler {
  indent: string;
  indentLevel: number;
  lineNumber: number;
  htmlParser: Html;
  region: "html" | "css" | "js";

  constructor() {
    this.lineNumber = 1;
    this.indentLevel = 0;
    this.indent = "";
    this.htmlParser = new Html();
    this.region = "html";
  }

  compile(line: string): string | CompileError {
    let nline = "";
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
      /*if (this.lineNumber == 0) {
        return throwError("Unexpected indent block.", line, this.lineNumber);
      }*/
    } else {
      this.indentLevel = 0;
    } 

    switch(this.region) {
      case "html":
        let parsed = this.htmlParser.parse(line, this.indentLevel);
        if (parsed.length == 1) {
          nline += "\t".repeat(this.indentLevel);
          nline += parsed[0];
          nline += "\n";
        } else {
          for (let i = 0; i < parsed.length; i++) {
            nline += "\t".repeat(Math.max(this.indentLevel + ((parsed.length - 2) - i), this.indentLevel));
            nline += parsed[i];
            nline += "\n";
          }
        }
        break;
      default:
        return throwError("Unexpected exception", line, this.lineNumber);
    }
    this.lineNumber++;
    return nline;
  }
}