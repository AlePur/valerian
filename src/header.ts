import HtmlParser from "./preprocessors/html";
import CssParser from "./preprocessors/css";
import BaseParser from "./preprocessors/base";

export const usage = `node index.js <.val file or folder> [--verbose]`;
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
      <style>
        #ErrorWrap {
          display: flex;
        }
        #CompileError {
          background-color: #f004;
          padding: 20px 40px;
          border: solid #f009 3px;
          border-radius: 5px;
          font-size: 20px;
        }
      </style>
    </head>
    <body>
      <div id="ErrorWrap">
        <div id="CompileError">
          <pre>${err}</pre>
        </div>
      </div>
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