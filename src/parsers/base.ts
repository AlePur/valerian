import { ParsedLine } from "../header";

export default class Parser {
  openBlocks: string[];
  indentLevel: number;
  expectingBlock: boolean;
  ignoreLine: boolean;
  error: null | string;
  parsed: string[];

  constructor() {
    this.openBlocks = [];
    this.indentLevel = -1;
    this.expectingBlock = false;
    this.ignoreLine = false;
    this.error = null;
    this.parsed = [];
  }

  protected getString(str: string): string | -1 | -2 {
    let symbol = str[0];
    if (symbol == "'" || symbol == "\"") {
      if (str[str.length - 1] != symbol) {
        return -2;
      }
      return str.slice(1, str.length - 1)
    }
    return -1;
  }

  protected openBlock(name: string): string {
    return "+" + name;
  }

  protected closeBlock(name: string): string {
    return "-" + name;
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
        this.parsed[i] = this.closeBlock(oldtag);
      }
    }
    this.parsed = this.parsed.filter(x => x !== undefined);
  }

  protected handleLineEnd(indent: number): null | string {
    let i = 0;
    let z = 1;
    for(i = 0; i <= ((this.indentLevel) - (indent + Number(this.ignoreLine))); i++) {
      const ind = (this.openBlocks.length - z);
      if (ind < 0) break;
      if (this.openBlocks[ind] == "_reserved") {
        z++;
      } else if (this.openBlocks[ind] == "__reserved") {
        this.openBlocks.splice(ind, 1);
      } else if (this.openBlocks[ind] !== undefined) {
        let oldtag = this.openBlocks.splice(ind, 1)[0];
        this.parsed[i] = this.closeBlock(oldtag);
      } else {
        return "Indentation error"
      }
    }
    this.parsed = this.parsed.filter(x => x !== undefined);
  }

  protected handleLine(line: string): null | string {
    const parselength = this.parsed.length;

    this.parsed[parselength] = this.openBlock(line)
    this.openBlocks.push(line);
    return null;
  }

  public finish(): ParsedLine {
    this.parsed = [];
    this.error = null;

    this.error = this.handleFinish();

    return {
      lines: this.parsed,
      scopeClose: true,
      error: this.error
    };
  }

  public parse(line: string, indent: number): ParsedLine {
    this.parsed = [];
    this.error = null;
    //console.log(this.openBlocks)

    if (indent > (this.indentLevel + 1)) {
      this.error = "Unexpected indent block"
    }
    if (indent <= this.indentLevel && this.expectingBlock) {
      this.error = "Expected an indented block"
    }
    this.expectingBlock = false;

    if (indent <= this.indentLevel) {
      this.error = this.handleLineEnd(indent);
    }
    this.indentLevel = indent;
    this.ignoreLine = false;

    if (!this.error) {
      const parselength = this.parsed.length;
      const rawstr = this.getString(line);

      if (line[0] == " " || line[0] == "\t") {
        this.error = "Unexpected whitespace"
      } else if (typeof rawstr === 'string') {
        this.parsed[parselength] = rawstr;
        this.openBlocks.push("__reserved");
      } else {
        this.error = this.handleLine(line);
      }
    }

    return {
      lines: this.parsed,
      scopeClose: this.ignoreLine,
      error: this.error
    };
  }
}