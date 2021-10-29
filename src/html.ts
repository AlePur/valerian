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
  expectingBlock: boolean;
  ignoreLine: boolean;

  constructor() {
    this.openTags = [];
    this.indentLevel = -1;
    this.expectingBlock = false;
    this.ignoreLine = false;
  }

  private tag(name: string, kwargs: HtmlKwargs = {}): string {
    let values = "";
    for (const [key, value] of Object.entries(kwargs)) {
      if (!value) continue;
      values += ` ${key}="${value}"`;
    }
    return "<" + name + values + ">";
  }

  private closeTag(name: string): string {
    return "</" + name + ">";
  }

  finish(): ParsedHtml {
    let error = null;
    let parsed = [];
    const len = this.openTags.length;

    for(let i = 0; i < len; i++) {
      const ind = this.openTags.length - 1;
      if (this.openTags[ind] == "_reserved") {
        error = "Unexpected end of file: expected a paranthesis";
        break;
      } else if (this.openTags[ind] == "__reserved") {
        this.openTags.splice(ind, 1)[0];
      } else {
        let oldtag = this.openTags.splice(ind, 1)[0];
        parsed[i] = this.closeTag(oldtag);
      }
    }

    parsed = parsed.filter(x => x !== undefined);

    return {
      lines: parsed,
      scopeClose: true,
      error
    };
  }

  parse(line: string, indent: number): ParsedHtml {
    let parsed = [];
    let error = null;
    //let scopeclose = false;
    let parselength = 0;
    //console.log(this.openTags)

    if (indent > (this.indentLevel + 1)) {
      error = "Unexpected indent block"
    }
    if (indent <= this.indentLevel && this.expectingBlock) {
      error = "Expected an indented block"
    }
    this.expectingBlock = false;
    if (indent <= this.indentLevel) {
      let i = 0;
      let z = 1;
      for(i = 0; i <= ((this.indentLevel) - (indent + Number(this.ignoreLine))); i++) {
        const ind = (this.openTags.length - z);
        if (ind < 0) break;
        if (this.openTags[ind] == "_reserved") {
          console.log(i)
          z++;
        } else if (this.openTags[ind] == "__reserved") {
          this.openTags.splice(ind, 1);
        } else if (this.openTags[ind] !== undefined) {
          let oldtag = this.openTags.splice(ind, 1)[0];
          parsed[i] = this.closeTag(oldtag);
        } else {
          error = "Indentation error"
          break;
        }
      }
      parsed = parsed.filter(x => x !== undefined);
      //parselength = i;
      parselength = parsed.length;
    }
    this.indentLevel = indent;
    this.ignoreLine = false;

    const rawstr = getString(line)

    if (!error) {
      if (line[0] == " " || line[0] == "\t") {
        error = "Unexpected whitespace"
      } else if (line[0] == "(") {
        let id = line.slice(1);
        parsed[parselength] = this.tag("div", { id });
        this.openTags.push("_reserved");
      } else if (line[0] == ")") {
        this.ignoreLine = true;
        parsed[parselength] = this.closeTag("div");
        let check = 0;
        for (let i = (this.openTags.length - 1); i >= 0; i--) {
          if (this.openTags[i] == "_reserved") {
            this.openTags.splice(i, 1);
            check = 1;
            break;
          }
        }
        if (check == 0) {
          error = "Expected a paranthesis"
        }
      } else if (typeof rawstr === 'string') {
        parsed[parselength] = rawstr;
        this.openTags.push("__reserved");
      } else {
        error = (() => {
          let delimiter = line.indexOf(":");
          if (delimiter == -1) {
            this.openTags.push("__reserved");
            parsed[parselength] = this.tag(line);
            return null;
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
          } else {
            this.expectingBlock = true;
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
    }
    return {
      lines: parsed,
      scopeClose: this.ignoreLine,
      error
    };
  }
}