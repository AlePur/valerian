import { ParsedLine, HtmlKwargs } from "../header";
import BaseParser from "./base";

export default class HtmlParser extends BaseParser {

  private openHtmlBlock(line: string, kwargs: HtmlKwargs): ParsedLine {
    return this.getParsedLine(line, null, kwargs, false, false, false);
  }

  private fetchId(line: string, args: HtmlKwargs): [string, HtmlKwargs] | string {
    const id = line.split(" ");

    if (id.length > 1) {
      if (id[1][0] !== id[1][0].toUpperCase()) {
        return "Element ids are expected to be in PascalCase"
      }
      if (!args) {
        args = {};
      }
      if (args["id"] !== undefined) {
        return "Element id is defined in multiple places"
      }
      args["id"] = id[1];
      return [id[0], args];
    } else {
      return [line, args]
    }
  }

  private parseElement(line: string, args: HtmlKwargs | null = null): string | -1 {

    const pair = this.getKeyValuePair(line);

    if (pair == -1) {
      const element = this.fetchId(line, args);
      if (typeof element === "string") {
        return element;
      }
      this.parsed.push(this.getParsedLine(element[0], null, element[1], false, false, true));
      this.openBlocks.push("__reserved");
      this.expectingNoBlock = true;
      return -1;
    }

    if (pair.error !== null) {
      return pair.error;
    }

    const element = this.fetchId(pair.key, args);

    if (typeof element === "string") {
      return element;
    }

    this.openBlocks.push(element[0]);
    this.parsed.push(this.getParsedLine(element[0], pair.value, element[1], false, false, false));
    return -1;
  }

  private checkConstants(line: string): string | null | -1 {
    const len = this.parsed.length;

    if (line[0] == "(") {
      // either div or (params) ->
      const p = line.split("->");
      if (p.length > 1) {
        let params = p[0].trim();
        const key = p[1].trim();
        if (params[params.length - 1] != ")") {
          return "Expected a closing paranthesis";
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
          const variableName = x[1].trim();
          const rawstr = this.defscript.getString(variableName);
          if (rawstr == -1) {
            return "Expected a string";
          }
          if (rawstr.err) {
            return rawstr.err;
          }
          if (rawstr.type == 1) {
            return "Unexpected dynamic variable"
          }
          let value = rawstr.str;
          if (rawstr.type == 2) {
            // remove the {}
            const paranth = variableName.indexOf("(");
            value += "." + variableName.slice(1, variableName.length - 1) + (paranth == -1 ? "()" : "");
          }
          pairs[x[0].trim()] = value;
        }

        const rawstr = this.defscript.getString(key);

        if (rawstr !== -1) {
          return "A string takes no parameters";
        }

        return this.parseElement(key, pairs);
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

    const result = this.parseElement(line);
    if (result == -1) {
      return null;
    } else {
      return result;
    }
  }
}