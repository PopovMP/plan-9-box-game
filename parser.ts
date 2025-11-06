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

const inputFilename: string = process.argv[2];
const inputPath    : string = joinPath(__dirname, inputFilename);
const content      : string = readFileSync(inputPath, { encoding: "utf8" });

const levels: IGame[] = [];
parseLevels();

const outputContent: string = stringifyLevels();
const outputPath   : string = joinPath(__dirname, inputFilename.replace(".txt", ".ts"));
writeFileSync(outputPath, outputContent, { encoding: "utf8" });

function parseLevels(): void {
  let pos = 0;
  while (isGoodChar(pos)) {
    const res: {level: IGame, pos: number} = parseLevel(pos);
    levels.push(res.level);
    pos = eatEOL(res.pos);
  }
}

function parseLevel(pos: number): {level: IGame, pos: number} {
  const level: IGame = {
    id   : 0,
    hero : {s: 0, e: 0} as IPoint,
    boxes: [] as IPoint[],
    map  : [] as string[],
  };

  pos = parseComment(level, pos);
  while (isGoodChar(pos)) {
    pos = parseMapLine(level, pos);
  }

  return { level, pos };
}

function parseComment(level: IGame, pos: number): number {
  let ch: string = content[pos];
  if (ch !== ";") throw new Error(`Expecting ";" at pos ${pos}`);
  const zeroCharCode = "0".charCodeAt(0);
  const nineCharCode = "9".charCodeAt(0);

  // ; #107
  while (isGoodChar(pos)) {
    ch = content[pos];
    const charCode = ch.charCodeAt(0);
    if (charCode >= zeroCharCode && charCode <= nineCharCode) {
      const digit: number = charCode - zeroCharCode;
      level.id = 10 * level.id + digit;
    }
    pos++;
  }

  return eatEOL(pos);
}

function parseMapLine(level: IGame, pos: number): number {
  let ch: string = content[pos];
  if (ch === ";") throw new Error(`Not expecting ";" at pos ${pos}`);

  const chars = [];
  const south = level.map.length;
  let east = 0;
  while (isGoodChar(pos)) {
    ch = content[pos];

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
      default:
        chars.push(content[pos]);
        break;
    }

    east++;
    pos++;
  }
  level.map.push(chars.join(""));

  return eatEOL(pos);
}

function isGoodChar(pos: number): boolean {
  return pos < content.length  &&
         content[pos] !== "\r" &&
         content[pos] !== "\n";
}

function eatEOL(pos: number): number {
  if (pos >= content.length) return pos;
  if (content[pos] === "\r") pos++;
  if (content[pos] === "\n") pos++;

  return pos;
}

function stringifyLevels(): string {
  return 'import { type IGame } from "./game-engine.ts";\n\nexport const levels: IGame[] = [{\n' +
    levels.map((level: IGame): string => "" +
      `    id   : ${level.id},\n` +
      `    hero : {s: ${level.hero.s}, e: ${level.hero.e}},\n` +
      `    boxes: [${level.boxes.map((b: IPoint): string => `{s: ${b.s}, e: ${b.e}}`).join(", ")}],\n` +
      "    map  : [\n" +
        level.map.map((line: string): string => `      "${line}",`).join("\n") +
    "\n  ]").join("}, {\n") +
    "},\n];\n";
}
