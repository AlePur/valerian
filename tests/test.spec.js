/* globals describe, test, expect */ 
const exec = require("child_process").exec;
const fs = require("fs");
const path = require("path");

describe("Compile vlr", () => {
  const output = fs.readFileSync(path.join(__dirname, "test.html"));
  test("it should compile test.vlr correctly", async () => {
    await new Promise((resolve, reject) => {
      exec("node out/index.js tests/test.vlr", () => {
        try {
          const generatedOutput = fs.readFileSync("dist/test.html").toString();
          expect(output.toString()).toStrictEqual(generatedOutput);
        } catch(e) {
          reject(e);
        }
        resolve();
      });
    });
  });
});