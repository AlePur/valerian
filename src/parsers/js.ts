import { ParsedList, ParsedLine, CompiledRegion, ParserType, CompileError } from "../header";

export default class JsCompiler {
  compiled: string[];
  baseIndent: number;
  //line: string;

  constructor() {
    //this.line = "__INIT";
    this.compiled = [];
    this.baseIndent = 1;
  }

  public finish(): CompiledRegion {
    return {
      lines: this.compiled
    }
  }

  public compile(line: string, indent: number, lineNumber: number): string | null {
    
    this.compiled.push("\t" + line);

    return null;
  }
}