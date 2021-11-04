import HtmlParser from "./preprocessors/html";
import CssParser from "./preprocessors/css";
import BaseParser from "./preprocessors/base";

export const usage = `node index.js <.vlr file or folder>`;
export const compiledWithErrors = (t: CompiledRegion | CompileError | -1 | -2 | string[] | [CompiledRegion, string[]]): t is CompileError => { 
  return (t as CompileError).message !== undefined;
};
export class errorHtml { 
  html: string[];

  constructor(err) {
    this.html = (`<html>
    <head>
      <title>
        Compilation error
      </title>
    </head>
    <body>
      <pre id="CompileError">
${err}
      </pre>
    </body>
  </html>`).split("\n");
  }
}
export type ParserType = BaseParser | CssParser | HtmlParser;
export interface HtmlKwargs {
  id?: string;
  class?: string;
}
export interface CompileError {
  message: string;
  trace: string;
  line: number;
  sourceFile: string;
}
export interface CompiledFile {
  declaredVariables: string[];
  lines: string[];
  fileName: string;
  numericName: string;
}
export interface CompiledRegion {
  lines: string[];
}
export interface ParsedLine {
  key: string;
  value: string | null;
  data: HtmlKwargs | null;
  notAttached: boolean;
  sourceIndex: number;
  valueType: number;
  rawString: boolean;
  scopeClose: boolean;
  indentLevel: number;
}
export interface ParsedList {
  lines: ParsedLine[];
  error: null | string;
}