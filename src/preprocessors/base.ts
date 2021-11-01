import { ParsedLine, ParsedList, HtmlKwargs } from "../header";
import { Defscript } from "../defscript"

export const getString = (str: string):  { str?: string, err: null | string } | -1  => {
  let symbol = str[0];
  if (symbol == "&") {
    let variable = Defscript.resolveVariable(str.slice(1));
    if (variable === undefined) {
      return { err: "Accessing undefined variable" };
    }
    return { str: variable.toString(), err: null }
  }
  if (symbol == "'" || symbol == "\"") {
    if (str[str.length - 1] != symbol) {
      return { err: "Unexpected end of line, missing last quote" }
    }
    return { str: str.slice(1, str.length - 1), err: null }
  }
  return -1;
}

interface KeyValuePair {
  key: string;
  value: null | string;
  error: null | string;
}

export default class BaseParser {
  openBlocks: string[];
  indentLevel: number;
  expectingBlock: boolean;
  expectingNoBlock: boolean;
  ignoreLine: boolean;
  error: null | string;
  parsed: ParsedLine[];
  lineNumber: number;

  constructor() {
    this.indentLevel = 1;
    this.openBlocks = [];
    this.expectingNoBlock = false;
    this.expectingBlock = false;
    this.ignoreLine = false;
    this.error = null;
    this.parsed = [];
    this.lineNumber = 0;
  }

  protected getParsedLine(key: string, value: string | null, data: HtmlKwargs | null, raw: boolean, close: boolean, notAttached: boolean, indent: number = this.indentLevel): ParsedLine {
    return {
      key,
      value,
      data,
      notAttached: notAttached,
      sourceIndex: this.lineNumber,
      indentLevel: indent,
      rawString: raw,
      scopeClose: close
    }
  }

  private throwError(err: string): KeyValuePair {
    return {
      key: "",
      value: null,
      error: err
    }
  }

  protected getKeyValuePair(str: string): KeyValuePair | -1 {
    let delimiter = str.indexOf(":");
    if (delimiter == -1) {
      return -1;
    }
    let data = str.slice(delimiter+1).trim();
    if (data) {
      if (data[0] !== "") {
        let str = this.getString(data);
        if (str == -1) {
          return this.throwError("Expected a string");
        } else if (str.err !== null) {
          return this.throwError(str.err);
        } else {
          data = str.str;
        }
      }
    } else {
      this.expectingBlock = true;
    }
    let clean = str.slice(0, delimiter);
    return {
      key: clean,
      value: data != "" ? data : null,
      error: null
    }
  }

  protected openBlock(line: string, value: string): ParsedLine {
    return this.getParsedLine(line, value, null, false, false, false);
  }

  protected closeBlock(line: string, indent: number): ParsedLine {
    return this.getParsedLine(line, null, null, false, true, false, indent);
  }

  protected handleFinish(): null | string {
    const len = this.openBlocks.length;
    for(let i = 0; i < len; i++) {
      const ind = this.openBlocks.length - 1;
      if (this.openBlocks[ind] == "_reserved") {
        return "Unexpected end of file: expected a paranthesis";
      } else if (this.openBlocks[ind] == "__reserved") {
        this.openBlocks.splice(ind, 1)[0];
      } else {
        let oldtag = this.openBlocks.splice(ind, 1)[0];
        this.parsed[i] = this.closeBlock(oldtag, (len - i));
      }
    }
    this.parsed = this.parsed.filter(x => x !== undefined);
    return null;
  }

  protected handleLineEnd(indent: number): null | string {
    const len = this.openBlocks.length;
    let i = 0;
    const c = Number(this.ignoreLine);
    let z = 1;
    for(i = 0; i <= ((this.indentLevel) - (indent + c)); i++) {
      const ind = (this.openBlocks.length - z);
      if (ind < 0) break;
      if (this.openBlocks[ind] == "_reserved") {
        z++;
      } else if (this.openBlocks[ind] == "__reserved") {
        this.openBlocks.splice(ind, 1);
      } else if (this.openBlocks[ind] !== undefined) {
        let oldtag = this.openBlocks.splice(ind, 1)[0];
        this.parsed[i] = this.closeBlock(oldtag, (this.indentLevel - (i + c)));
      } else {
        return "Indentation error"
      }
    }
    this.parsed = this.parsed.filter(x => x !== undefined);
    return null;
  }

  protected pushString(str: string): void {
    this.parsed.push(this.getParsedLine(str, null, null, true, false, false));
    this.openBlocks.push("__reserved");
  }

  public getString = getString;

  protected handleLine(line: string): null | string {
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

    this.openBlocks.push(pair.key);
    this.parsed.push(this.openBlock(pair.key, pair.value));
    return null;
  }

  public finish(): ParsedList {
    this.parsed = [];
    this.error = null;

    this.error = this.handleFinish();

    return {
      lines: this.parsed,
      error: this.error
    };
  }

  public parse(line: string, indent: number, lineNumber: number): ParsedList {
    this.lineNumber = lineNumber;
    this.parsed = [];
    this.error = null;
    //console.log(this.openBlocks)

    if (indent <= this.indentLevel && this.expectingBlock) {
      this.error = "Expected a block indent"
    } else if (indent > this.indentLevel && this.expectingNoBlock) {
      this.error = "Unexpected block indent"
    }
    this.expectingBlock = false;
    this.expectingNoBlock = false;

    if (!this.error) {
      if (indent <= this.indentLevel) {
        this.error = this.handleLineEnd(indent);
      }
      this.indentLevel = indent;
      this.ignoreLine = false;

      if (!this.error) {
        const rawstr = this.getString(line);

        if (line[0] == " " || line[0] == "\t") {
          this.error = "Unexpected whitespace, possible cause is mixed tabs and spaces"
        } else {
          if (rawstr != -1) {
            if (rawstr.err) {
              this.error = rawstr.err;
            } else {
              this.pushString(rawstr.str);
              this.expectingNoBlock = true;
              this.error = null;
            }
          } else {
            this.error = this.handleLine(line);
          }
        }
      }
    }

    return {
      lines: this.parsed,
      error: this.error
    };
  }
}