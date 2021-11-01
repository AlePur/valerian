import HtmlParser from "./preprocessors/html";
import CssParser from "./preprocessors/css";
import BaseParser from "./preprocessors/base";

export const usage = `node index.js <.vlr file or folder>`;
export const compiledWithErrors = (t: CompiledRegion | CompileError | -1 | string[]): t is CompileError => { 
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
      <pre>
${err}
      </pre>
    </body>
  </html>`).split("\n");
  }
}
export type ParserType = BaseParser | CssParser | HtmlParser;
export interface HtmlKwargs {
  id?: string;
}
export interface CompileError {
  message: string;
  trace: string;
  line: number;
  sourceFile: string;
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
  rawString: boolean;
  scopeClose: boolean;
  indentLevel: number;
}
export interface ParsedList {
  lines: ParsedLine[];
  error: null | string;
}