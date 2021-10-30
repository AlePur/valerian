import { ParsedLine } from "../header";
import Parser from "./base";

export default class Css extends Parser {

  constructor() {
    super();
    this.baseIndent = 1;
  }
  
  protected openBlock(name: string): string {
    return "" + name + " {";
  }

  protected closeBlock(name: string): string {
    this.ignoreLine = true;
    return "}";
  }

  protected handleLine(line: string): null | string {
    const parselength = this.parsed.length;

    return (() => {
      let delimiter = line.indexOf(":");
      if (delimiter == -1) {
        return "Expected a colon";
      }
      let data = line.slice(delimiter+1).trim();
      if (data) {
        let str = this.getString(data);
        if (str == -1) {
          return "Expected a string";
        } else if (str == -2) {
          return "Unexpected end of line";
        } else {
          data = str;
        }
      } else {
        this.expectingBlock = true;
      }
      let clean = line.slice(0, delimiter);
      let obj = clean.split(".");
      if (data) {
        if (obj.length == 1) {
          this.parsed[parselength] = clean + ": ";
        } else {
          this.parsed[parselength] = this.openBlock(obj.join(" ") + ": ");
        }
        this.parsed[parselength] += data + ";";
        this.openBlocks.push("__reserved");
      } else {
        if (obj.length == 1) {
          this.parsed[parselength] = this.openBlock(clean);
        } else {
          this.parsed[parselength] = this.openBlock(obj.join(" "));
          /*for (let i = 1; i < obj.length; i++) {
            this.parsed[parselength] += "\n" + "\t".repeat(this.indentLevel + i) + this.openBlock(obj[i]);
          }*/
        }
        this.openBlocks.push(clean);
      }
      return null;
    })()
  }
}