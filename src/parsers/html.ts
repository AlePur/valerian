import { ParsedLine, HtmlKwargs } from "../header";
import BaseParser from "./base";

export default class HtmlParser extends BaseParser {

  private openHtmlBlock(line: string, kwargs: HtmlKwargs): ParsedLine {
    return this.getParsedLine(line, null, kwargs, false, false, false);
  }

  private checkConstants(line: string): string | null | -1 {
    const len = this.parsed.length;

    if (line[0] == "(") {
      // either div or (params) ->
      const p = line.split("->");
      if (p.length > 1) {
        let params = p[0].trim();
        const key = p[1].trim();
        if (params[0] != "(" && params[params.length - 1] != ")") {
          return "Expected paranthesis around element parameters";
        }
        // get rid of paranthesis
        params = params.slice(1, params.length - 1);
        const blocks = params.split(",");
        let pairs: HtmlKwargs = {}
        for (let i = 0; i < blocks.length; i++) {
          let x = blocks[i].split("=")
          if (x.length != 2) {
            return "Error parsing element parameters";
          }
          pairs[x[0].trim()] = x[1].trim();
        }

        const rawstr = this.getString(key);

        if (rawstr !== -1) {
          return "A string takes no parameters";
        }

        const pair = this.getKeyValuePair(key);

        if (pair == -1) {
          this.parsed.push(this.getParsedLine(key, null, pairs, false, false, true));
          this.openBlocks.push("__reserved");
          this.expectingNoBlock = true;
          return -1;
        }

        if (pair.error !== null) {
          return pair.error;
        }

        const id = pair.key.split(" ");

        if (id.length > 1) {
          this.openBlocks.push(id[0]);
          if (id[1][0] !== id[1][0].toUpperCase()) {
            return "Element ids are expected to be in PascalCase"
          }
          pairs["id"] = id[1];
          this.parsed.push(this.getParsedLine(id[0], pair.value, pairs, false, false, false));
        } else {
          this.openBlocks.push(pair.key);
          this.parsed.push(this.getParsedLine(id[0], pair.value, pairs, false, false, false));
        }
        return -1;
      } else {
        let id = line.slice(1);
        if (id != "") {
          if (id[0] !== id[0].toUpperCase()) {
            return "Element ids are expected to be in PascalCase"
          }
          this.parsed.push(this.openHtmlBlock("div", { id }));
        } else {
          this.parsed.push(this.openBlock("div", null));
        }
        this.openBlocks.push("_reserved");
        return -1;
      }
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

  protected handleLine(line: string): null | string {
    const constants = this.checkConstants(line);
    if (constants == -1) {
      return null;
    }
    if (typeof constants === 'string') {
      return constants;
    }

    const pair = this.getKeyValuePair(line);
    if (pair == -1) {
      //not really a string, you will see
      this.parsed.push(this.getParsedLine(line, null, null, false, false, true));
      this.openBlocks.push("__reserved");
      this.expectingNoBlock = true;
      return null;
    }

    if (pair.error !== null) {
      return pair.error;
    }

    const id = pair.key.split(" ");

    if (id.length > 1) {
      this.openBlocks.push(id[0]);
      if (id[1][0] !== id[1][0].toUpperCase()) {
        return "Element ids are expected to be in PascalCase"
      }
      this.parsed.push(this.getParsedLine(id[0], pair.value, { id: id[1] }, false, false, false));
    } else {
      this.openBlocks.push(pair.key);
      this.parsed.push(this.openBlock(pair.key, pair.value));
    }

    return null;
  }
}