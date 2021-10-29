import { ParsedHtml } from "./header";

const getString = (str: string): string | -1 | -2 => {
  let symbol = str[0];
  if (symbol == "'" || symbol == "\"") {
    if (str[str.length - 1] != symbol) {
      return -2;
    }
    return str.slice(1, str.length - 1)
  }
  return -1;
}

export interface HtmlKwargs {
  id?: string;
}

export default class Html {
  openTags: string[];
  indentLevel: number;
  ignoreLastLine: boolean;
  expectingBlock: boolean;

  constructor() {
    this.openTags = [];
    this.indentLevel = -1;
    this.expectingBlock = false;
    this.ignoreLastLine = false;
  }

  tag(name: string, kwargs: HtmlKwargs = {}): string {
    let values = "";
    for (const [key, value] of Object.entries(kwargs)) {
      if (!value) continue;
      values += ` ${key}="${value}"`;
    }
    return "<" + name + values + ">";
  }
  closeTag(name: string): string {
    return "</" + name + ">";
  }

  parse(line: string, indent: number): ParsedHtml {
    let parsed = [];
    let error = null;
    let parselength = 0;

    if (indent > (this.indentLevel + 1)) {
      error = "Unexpected indent block"
    }
    if (indent <= this.indentLevel && this.expectingBlock) {
      error = "Expected an indented block"
    }
    if ((indent <= this.indentLevel && this.ignoreLastLine == false) || (indent < this.indentLevel && this.ignoreLastLine)) {
      let i = 0;
      for(i = 0; i <= ((this.indentLevel) - indent); i++) {
        let oldtag = this.openTags.pop();
        parsed[i] = this.closeTag(oldtag);
      }
      parselength = i;
    }
    this.ignoreLastLine = false;
    this.indentLevel = indent;

    const rawstr = getString(line)

    if (line[0] == "(") {
      let id = line.slice(1);
      parsed[parselength] = this.tag("div", { id });
      this.openTags.push("div");
    } else if (line[0] == ")") {
      // Already closed
      // parsed[parselength] = this.closeTag("div");
      this.ignoreLastLine = true;
    } else if (rawstr != -1 && rawstr != -2) {
      parsed[parselength] = rawstr;
      this.ignoreLastLine = true;
      this.openTags.push("");
    } else {
      error = (() => {
        let delimiter = line.indexOf(":");
        if (delimiter == -1) {
          //return "Syntax not allowed, expected a colon"
        }
        let data = line.slice(delimiter+1).trim();
        if (data) {
          let str = getString(data);
          if (str == -1) {
            return "Expected a string";
          } else if (str == -2) {
            return "Unexpected end of line";
          } else {
            data = str;
          }
        }
        let clean = line.slice(0, delimiter);
        parsed[parselength] = this.tag(clean);
        if (data) {
          parsed[parselength] += "\n" + "\t".repeat(indent + 1) + data;
        }
        this.openTags.push(clean);
        return null;
      })()
    }
    return {
      lines: parsed,
      scopeClose: this.ignoreLastLine,
      error
    };
  }
}