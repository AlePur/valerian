export default class Html {
  openTags: string[];
  indentLevel: number;
  ignoreLastLine: boolean;

  constructor() {
    this.openTags = [];
    this.indentLevel = -1;
    this.ignoreLastLine = false;
  }

  tag(name: string): string {
    return "<" + name + ">";
  }
  closeTag(name: string): string {
    return "</" + name + ">";
  }

  parse(line: string, indent: number): string[] {
    let parsed = [];
    let parselength = 0;

    if (indent <= this.indentLevel) {
      let i = 0;
      for(i = 0; i <= ((this.indentLevel) - indent); i++) {
        let oldtag = this.openTags.pop();
        parsed[i] = this.closeTag(oldtag);
      }
      parselength = i;
    }
    this.indentLevel = indent;

    if (line[0] == "(") {
      parsed[parselength] = this.tag("div");
      this.openTags.push("null");
    } else if (line[0] == ")") {
      // Already closed
      // parsed[parselength] = this.closeTag("div");
      let oldparsed = parsed;
      oldparsed.pop();
      parsed = oldparsed
      this.ignoreLastLine = true;
    } else {
      let clean = line.slice(0, line.indexOf(":"));
      parsed[parselength] = this.tag(clean);
      this.openTags.push(clean);
    }
    return parsed;
  }
}