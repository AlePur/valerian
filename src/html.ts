export default class Html {
  openTags: string[];
  indentLevel: number;

  constructor() {
    this.openTags = [];
    this.indentLevel = 0;
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
      for(i = 0; i < ((1 + this.indentLevel) - indent); i++) {
        let oldtag = this.openTags.pop();
        parsed[i] = this.closeTag(oldtag);
      }
      parselength = i;
    }
    this.indentLevel = indent;
    let clean = line.slice(0, line.indexOf(":"));
    parsed[parselength] = this.tag(clean);
    this.openTags.push(clean);
    return parsed;
  }
}