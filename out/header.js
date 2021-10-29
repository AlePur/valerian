"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHtml = exports.usage = void 0;
exports.usage = `node index.js <.vlr file or folder>`;
exports.errorHtml = `<html>
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
