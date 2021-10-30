import { ParsedLine } from "../header";
import BaseCompiler from "./base";
import HtmlParser from "../parsers/html";

export interface HtmlKwargs {
  id?: string;
}

export default class HtmlCompiler extends BaseCompiler {
  
  constructor() {
    super();
    this.parser = new HtmlParser();
  }

  protected openBlock(name: string): string {
    return "<" + name + ">";
  }

  protected closeBlock(name: string): string {
    return "</" + name + ">";
  }
  
  private openTag(name: string, kwargs: HtmlKwargs = {}): string {
    let values = "";
    for (const [key, value] of Object.entries(kwargs)) {
      if (!value) continue;
      values += ` ${key}="${value}"`;
    }
    return "<" + name + values + ">";
  }
}