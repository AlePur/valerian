import { CompileError, CompiledRegion, ParsedLine, ParsedList, compiledWithErrors } from "./header";
import CssCompiler from "./parsers/css";
import HtmlCompiler from "./parsers/html";
import JsCompiler from "./parsers/js";
import TemplateManager, { Module } from "./template"
import DefscriptCompiler from "./defscript";

type Region = "html" | "css" | "js" | "pre";

/*const assert = (a: number, b: number) => {
  return 0;
  return this.throwError("33", "dsdsd", 6566);
}*/

export default class Compiler {
  indent: string;
  indentLevel: number;
  lineNumber: number;
  baseIndent: number;
  scriptHasBeen: boolean;
  filename: string;
  htmlParser: HtmlCompiler;
  jsParser: JsCompiler;
  templateModule: Module;
  cssParser: CssCompiler;
  numericName: string;
  preParser: DefscriptCompiler;
  region: Region;

  constructor(directory: string, name: string, numericName) {
    this.lineNumber = 1;
    this.indentLevel = 0;
    this.numericName = numericName;
    this.scriptHasBeen = false;
    this.indent = "";
    this.baseIndent = 0;
    this.templateModule = TemplateManager.allocateModule(name);
    this.preParser = new DefscriptCompiler(directory, this.templateModule, this.numericName);
    this.filename = name;
    this.region = "pre";
  }

  private endScript(): string[] {
    return [
      "\t\t});",
      "\t</script>"
    ];
  }

  private startScript(): string[] {
    return [
      "\t<script>", 
      '\t\tconst ' + this.numericName + ' = Valerian.recall("' + this.filename + '");',
      '\t\t' + this.numericName + '.extend((local) => {'
    ];
  }

  private throwError(message: string, trace: string, line: number): CompileError {
    return {
      message,
      trace,
      line,
      sourceFile: this.filename
    }
  }

  private switchRegion(region: Region, line: string): CompiledRegion | CompileError {
    let nline: CompiledRegion | CompileError | -1 = { lines: [] };
    if (this.indentLevel != 0) {
      return this.throwError("Style and script tags are not allowed in the scope of another language", line, this.lineNumber);
    }
    if (this.region != "pre") {
      nline = this.parseLine("finish");
    } else {
      this.preParser.finish();
    }
    if (nline === -1) {
      return this.throwError("Unexpected end of line", line, this.lineNumber);
    }

    if (!compiledWithErrors(nline)) {
      if (this.region == "css") {
        nline.lines.push("\t</style>");
      } else if (this.region == "js") {
        nline.lines = nline.lines.concat(this.endScript());
      }

      this.region = region;

      if (region == "css") {
        this.baseIndent = 1;
        nline.lines.push("\t<style>");
        this.cssParser = new CssCompiler(this.preParser);
      } else if (region == "html") {
        this.baseIndent = 0;
        this.htmlParser = new HtmlCompiler(this.preParser);
      } else if (region == "js") {
        this.jsParser = new JsCompiler();
        nline.lines = nline.lines.concat(this.startScript());
      }
    }

    return nline;
  }

  private async parseAsync(line: string): Promise<CompileError | -1> {
    let err = await this.preParser.parse(line, this.indentLevel, this.lineNumber);
    if (typeof err === "string") {
      return this.throwError(err, line, this.lineNumber);
    }
    if (err === null) {
      return -1;
    }
    if (compiledWithErrors(err)) {
      return err;
    }
    return -1;
  }

  private parseLine(action: string, line: string = ""): CompiledRegion | CompileError | -1 {
    //let nline = "";
    let err: string | null = null;
    let parsed: CompiledRegion | null | string = null;
    if (this.region == "html") {
      parsed = ((action == "parse") ? this.htmlParser.compile(line, this.indentLevel, this.lineNumber) : this.htmlParser.finish());
    } else if (this.region == "css") {
      parsed = ((action == "parse") ? this.cssParser.compile(line, this.indentLevel, this.lineNumber) : this.cssParser.finish());
    } else if (this.region == "js") {
      parsed = ((action == "parse") ? this.jsParser.compile(line, this.indentLevel, this.lineNumber) : this.jsParser.finish());
    } else {
      return this.throwError("Unexpected exception", line, this.lineNumber);
    }

    //let parsed = this.htmlParser[action](line, this.indentLevel);
    if (typeof parsed === "string") {
      return this.throwError(parsed, line, this.lineNumber);
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
      return this.throwError("Unexpected end of line", "_EOF_RESERVED", this.lineNumber);
    }
    if (!compiledWithErrors(nline)) {
      if (this.region == "css") {
        nline.lines.push("\t</style>");
      } else if (this.region == "js") {
        nline.lines = nline.lines.concat(this.endScript());
      }
      if (!this.scriptHasBeen) {
        nline.lines = nline.lines.concat(this.startScript(), this.endScript());
      }
    }

    this.templateModule.finish();

    return nline;
  }

  public async compile(line: string): Promise<CompiledRegion | CompileError | -1> {
    let nline: CompiledRegion | CompileError | -1 = -1;
    if ((line[0] == " " || line[0] == "\t") && this.region != "js") {
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
          return this.throwError("Unexpected block indent", line, this.lineNumber);
        }
        this.indentLevel = i;
        line = line.slice(this.indentLevel*len)
      }
      if (this.lineNumber == 0) {
        return this.throwError("Unexpected block indent", line, this.lineNumber);
      }
    } else {
      this.indentLevel = 0;
    } 

    line = line.trimEnd();

    if (line[0] != "#" || this.region == "js") {
      if (line == "html:") {
        nline = this.switchRegion("html", line);
      } else if (line == "style:") {
        nline = this.switchRegion("css", line);
      } else if (line == "script:") {
        if (this.scriptHasBeen) {
          return this.throwError("Duplicate script tag not permitted", line, this.lineNumber);
        }
        this.scriptHasBeen = true;
        nline = this.switchRegion("js", line);
      } else {
        if (this.region == "pre") {
          nline = await this.parseAsync(line);
        } else {
          nline = this.parseLine("parse", line);
        }
      }
    }

    this.lineNumber++;
    return nline;
  }
}