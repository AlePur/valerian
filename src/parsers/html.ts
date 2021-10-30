import { ParsedLine } from "../header";
import BaseParser from "./base";

export interface HtmlKwargs {
  id?: string;
}

export default class HtmlParser extends BaseParser {

  private openHtmlBlock(line: string, kwargs: HtmlKwargs): ParsedLine {
    return this.getParsedLine(line, null, false, false);
  }

  protected checkConstants(line: string): string | null | -1 {
    const len = this.parsed.length;

    if (line[0] == "(") {
      let id = line.slice(1);
      this.parsed.push(this.openHtmlBlock("div", { id }));
      this.openBlocks.push("_reserved");
      return -1;
    } else if (line[0] == ")") {
      this.ignoreLine = true;
      this.parsed[len] = this.closeBlock("div", this.indentLevel);
      let check = 0;
      for (let i = (this.openBlocks.length - 1); i >= 0; i--) {
        if (this.openBlocks[i] == "_reserved") {
          this.openBlocks.splice(i, 1);
          check = 1;
          break;
        }
      }
      if (check == 0) {
        return "Unexpected paranthesis"
      }
      return -1;
    }
    return null;
  }
}