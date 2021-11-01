import getString from "./parsers/base"

export interface CompiledDefscript {
  name: string;
  value: string | null;
}

export default class DefscriptCompiler {
  compiled: CompiledDefscript[];
  indentLevel: number;
  error: null | string;
  lineNumber: number;

  constructor() {
    this.indentLevel = 1;
    this.compiled = []
    this.error = null;
    this.lineNumber = 0;
  }

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
      this.error = "Expected an indented block"
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