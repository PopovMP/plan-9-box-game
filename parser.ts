import { dirname as getDirname, join as joinPath } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import process from "node:process";
import console from "node:console";

import { type IPoint, type IGame } from "./game-engine.ts";

if (process.argv.length < 3) {
  console.log("Too few arguments!");
  console.log("Usage: node parser.ts input.txt");
  process.exit(1);
}

// Local paths
const __filename: string = fileURLToPath(import.meta.url);
const __dirname : string = getDirname(__filename);

main(process.argv[2]);

function main(inputFilename: string): void {
  const inputPath: string = joinPath(__dirname, inputFilename);
  const content  : string = readFileSync(inputPath, { encoding: "utf8" });

  const levels: IGame[] = [];
  parseLevels(levels, content);

  const outputPath   : string = joinPath(__dirname, inputFilename.replace(".txt", ".ts"));
  const outputContent: string = stringifyLevels(levels);
  writeFileSync(outputPath, outputContent, { encoding: "utf8" });
}

function parseLevels(levels: IGame[], content: string): void {
  let pos = 0;
  while (isGoodChar(content, pos)) {
    const level: IGame = {
      id   : 0,
      hero : {s: 0, e: 0} as IPoint,
      boxes: [] as IPoint[],
      map  : [] as string[],
    };

    pos = parseLevel(level, content, pos);

    levels.push(level);
  }
}

function parseLevel(level: IGame, content: string, pos: number): number {
  pos = parseComment(level, content, pos);

  while (isGoodChar(content, pos)) {
    pos = parseMapLine(level, content, pos);
  }

  return eatEOL(content, pos);
}

function parseComment(level: IGame, content: string, pos: number): number {
  let ch: string = content[pos];
  if (ch !== ";") throw new Error(`Expecting ';' at pos ${pos}`);
  const zeroCharCode: number = "0".charCodeAt(0);
  const nineCharCode: number = "9".charCodeAt(0);

  while (isGoodChar(content, pos)) {
    ch = content[pos];
    const charCode: number = ch.charCodeAt(0);
    if (charCode >= zeroCharCode && charCode <= nineCharCode) {
      const digit: number = charCode - zeroCharCode;
      level.id = 10 * level.id + digit;
    }
    pos++;
  }

  return eatEOL(content, pos);
}

function parseMapLine(level: IGame, content: string, pos: number): number {
  let ch: string = content[pos];
  if (ch !== " " && ch !== "#") throw new Error(`Expecting ' ' or '#' at pos: ${pos}`);

  const chars: string[] = [];
  for (let south = level.map.length, east = 0; isGoodChar(content, pos); east++, pos++, ch = content[pos]) {
    switch (ch) {
      case "@":
        level.hero = {s: south, e: east};
        chars.push(" ");
        break;
      case "+":
        level.hero = {s: south, e: east};
        chars.push(".");
        break;
      case "$":
        level.boxes.push({s: south, e: east});
        chars.push(" ");
        break;
      case "*":
        level.boxes.push({s: south, e: east});
        chars.push(".");
        break;
      case " ":
      case "#":
      case ".":
        chars.push(ch);
        break;
      default:
        throw new Error(`Unexpected char: '${ch}' at pos: ${pos}`);
    }
  }
  level.map.push(chars.join(""));

  return eatEOL(content, pos);
}

function isGoodChar(content: string, pos: number): boolean {
  return pos < content.length  &&
         content[pos] !== "\r" &&
         content[pos] !== "\n";
}

function eatEOL(content: string, pos: number): number {
  if (pos >= content.length) return pos;
  if (content[pos] === "\r") pos++;
  if (content[pos] === "\n") pos++;

  return pos;
}

function stringifyLevels(levels: IGame[]): string {
  return "" +
    'import { type IGame } from "./game-engine.ts";\n' +
    "\n" +
    "export const levels: IGame[] = [{\n" +
    levels.map((level: IGame): string => "" +
    `    id   : ${level.id},\n` +
    `    hero : {s: ${level.hero.s}, e: ${level.hero.e}},\n` +
    `    boxes: [${level.boxes.map((b: IPoint): string => `{s: ${b.s}, e: ${b.e}}`).join(", ")}],\n` +
    "    map  : [\n" +
           level.map.map((line: string): string => `      "${line}",`).join("\n") + "\n" +
    "  ]").join("}, {\n") + "},\n" +
    "];\n";
}
