export const usage = `node index.js <.vlr file or folder>`;
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
export interface CompileError {
  message: string;
  trace: string;
  line: number;
}
export interface ParsedLine {
  lines: string[];
  scopeClose: true | false;
  error: null | string;
}