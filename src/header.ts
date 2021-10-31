import HtmlParser from "./parsers/html";
import CssParser from "./parsers/css";
import BaseParser from "./parsers/base";

export const usage = `node index.js <.vlr file or folder>`;
export const compiledWithErrors = (t: string | CompileError): t is CompileError => { 
  return (t as CompileError).message !== undefined;
};
export const errorHtml = `<html>
  <head>
    <title>
      Compilation error
    </title>
  </head>
  <body>
    <pre>
$ERR
    </pre>
  </body>
</html>`;
export type ParserType = BaseParser | CssParser | HtmlParser;
export interface HtmlKwargs {
  id?: string;
}
export interface CompileError {
  message: string;
  trace: string;
  line: number;
}
export interface CompiledLine {
  line: string;
  error: null | string;
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