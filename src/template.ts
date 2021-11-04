import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
const template: string[] = readFileSync(path.join(__dirname, "valerian_template.js")).toString().split("\n");
const injectIndex: number = 3;
const stylesheet: Buffer = readFileSync(path.join(__dirname, "valerian.css"));

export class Module {
  parent: TemplateManager;
  name: string;
  hooked: boolean;
  str: string;

  constructor(parent: TemplateManager, name: string) {
    this.name = name;
    this.str = "";
    this.hooked = false;
    this.parent = parent;
  }

  public registerHook(variable: string, shared: boolean): string {
    this.hooked = true;
    const _class = "-update-" + this.parent.hookCount.toString();
    this.str += '["' + _class + '", "' + variable + '", ' + shared + '],';
    this.parent.hookCount++;
    return _class;
  }

  public addVariable(key: string, value: string | number, type: number): void {
    const parsedValue = (typeof value === "string" ? ' "' + value + '"' : ' ' + value);
    this.str += '["' + key + '",' + parsedValue + ', ' + type + '],';
  }

  public endRegion(): void {
    if (!this.str || this.str == "") {
      this.str = "[],";
    }
    this.str = this.str.slice(0, this.str.length - 1);
    this.str += "], hooks: [";
  }

  public finish(): void {
    if (!this.hooked) {
      this.str += "[],";
    }
    this.str = '\t\t\t"' + this.name + '"' + ': { variables: [' + this.str;
    this.str = this.str.slice(0, this.str.length - 1);
    this.str += "] },";

    for (let i = 0; i < this.parent.compiled.length; i++) {
      if (this.str == this.parent.compiled[i]) return;
    }
    this.parent.compiled.push(this.str);
  }
}

class TemplateManager {
  compiled: string[];
  hookCount: number;

  constructor() {
    this.compiled = [];
    this.hookCount = 0;
  }

  public allocateModule(name: string) {
    return new Module(this, name);
  }

  public write(): void {
    // remove comma
    if (this.compiled.length) {
      const tmp = this.compiled[this.compiled.length - 1];
      this.compiled[this.compiled.length - 1] = tmp.slice(0, tmp.length - 1)
      this.compiled = template.splice(0, injectIndex).concat(this.compiled, template);
    } else {
      this.compiled = template;
    }
    writeFileSync(path.join("./dist", "valerian", "valerian.js"), this.compiled.join("\n"));
    writeFileSync(path.join("./dist", "valerian", "valerian.css"), stylesheet);
  }
}

export default new TemplateManager();

//"main.val":{variables: [["red", "red"]]}