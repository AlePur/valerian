import { ParsedLine } from "../header";
import BaseParser from "./base";

export default class CssParser extends BaseParser {

  protected handleLine(line: string): null | string {
    if (line == "") {
      return "Empty lines are not permitted";
    }
    const pair = this.getKeyValuePair(line);
    if (pair == -1) {
      return "Expected a colon"
    }

    if (pair.error !== null) {
      return pair.error;
    }

    this.openBlocks.push(pair.key);
    this.parsed.push(this.openBlock(pair.key, pair.value));
    return null;
  }
}