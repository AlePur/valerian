import { ParsedLine } from "../header";
import Parser from "./base";

export interface HtmlKwargs {
  id?: string;
}

export default class Html extends Parser {
  
  protected openBlock(name: string): string {
    return "<" + name + ">";
  }

  protected closeBlock(name: string): string {
    return "</" + name + ">";
  }

  
  private openTag(name: string, kwargs: HtmlKwargs = {}): string {
    let values = "";
    for (const [key, value] of Object.entries(kwargs)) {
      if (!value) continue;
      values += ` ${key}="${value}"`;
    }
    return "<" + name + values + ">";
  }

  protected handleLine(line: string): null | string {
    const parselength = this.parsed.length;

    if (line[0] == "(") {
      let id = line.slice(1);
      this.parsed[parselength] = this.openTag("div", { id });
      this.openBlocks.push("_reserved");
    } else if (line[0] == ")") {
      this.ignoreLine = true;
      this.parsed[parselength] = this.closeBlock("div");
      let check = 0;
      for (let i = (this.openBlocks.length - 1); i >= 0; i--) {
        if (this.openBlocks[i] == "_reserved") {
          this.openBlocks.splice(i, 1);
          check = 1;
          break;
        }
      }
      if (check == 0) {
        return "Expected a paranthesis"
      }
    } else {
      return (() => {
        let delimiter = line.indexOf(":");
        if (delimiter == -1) {
          this.openBlocks.push("__reserved");
          this.parsed[parselength] = this.openBlock(line);
          return null;
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
        let obj = clean.split(" ");
        if (obj.length == 1) {
          this.parsed[parselength] = this.openBlock(clean);

        } else {
          let id = obj[1];
          clean = obj[0];
          this.parsed[parselength] = this.openTag(clean, { id });
        }
        if (data) {
          this.parsed[parselength] += "\n" + "\t".repeat(this.indentLevel + 1) + data;
        }
        this.openBlocks.push(clean);
        return null;
      })()
    }
  }
}