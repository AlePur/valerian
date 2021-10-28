export const usage = `node index.js (fr file)/(src folder)`;
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