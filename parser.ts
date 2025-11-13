import { dirname as getDirname, join as joinPath, basename as getBasename } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import process from "node:process";
import console from "node:console";

import { type IPoint, type ILevel } from "./def.ts";

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

  const levels: ILevel[] = [];
  parseLevels(levels, content);

  const inputBasename: string = getBasename(inputFilename, ".txt");
  const outputPath   : string = joinPath(__dirname, inputBasename + ".ts");
  const outputContent: string = stringifyLevels(levels, inputBasename);
  writeFileSync(outputPath, outputContent, { encoding: "utf8" });
}

function parseLevels(levels: ILevel[], content: string): void {
  let pos = 0;
  while (isGoodChar(content, pos)) {
    const level: ILevel = {
      id   : 0,
      hero : {s: 0, e: 0} as IPoint,
      boxes: [] as IPoint[],
      map  : [] as string[],
    };

    pos = parseLevel(level, content, pos);
    level.map = normalizeLevelMap(level.map);

    levels.push(level);
  }
}

function parseLevel(level: ILevel, content: string, pos: number): number {
  pos = parseComment(level, content, pos);

  while (isGoodChar(content, pos)) {
    pos = parseMapLine(level, content, pos);
  }

  return eatEOL(content, pos);
}

function parseComment(level: ILevel, content: string, pos: number): number {
  const ch: string = content[pos];
  if (ch !== ";") throw new Error(`Expecting ';' at pos ${pos}`);
  const zeroCharCode: number = "0".charCodeAt(0);
  const nineCharCode: number = "9".charCodeAt(0);

  for (; isGoodChar(content, pos); pos++) {
    const charCode: number = content[pos].charCodeAt(0);
    if (charCode >= zeroCharCode && charCode <= nineCharCode) {
      const digit: number = charCode - zeroCharCode;
      level.id = 10 * level.id + digit;
    }
  }

  return eatEOL(content, pos);
}

function parseMapLine(level: ILevel, content: string, pos: number): number {
  let ch: string = content[pos];
  if (ch !== " " && ch !== "#") throw new Error(`Expecting ' ' or '#' at pos: ${pos}`);

  const chars: string[] = [];
  const south: number   = level.map.length;
  for (let east = 0; isGoodChar(content, pos); east++, pos++) {
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

function normalizeLevelMap(gameMap: string[]): string[] {
  let mapWidth = 0;
  for (const line of gameMap) {
    if (line.length > mapWidth) {
      mapWidth = line.length;
    }
  }

  const flagMap: boolean[][] = new Array(gameMap.length);
  for (let i = 0; i < gameMap.length; i++) {
    flagMap[i] = new Array(mapWidth).fill(true);
  }

  let isChanged;
  do {
    isChanged = false;
    for (let i = 0; i < gameMap.length; i++) {
      for (let j = 0; j < mapWidth; j++) {
        if (!flagMap[i][j]) continue;

        // If out of map line
        if (j >= gameMap[i].length) {
          flagMap[i][j] = false;
          isChanged = true;
          continue;
        }

        if (gameMap[i][j] !== " ") continue;

        // If first or last line
        if (i === 0 || i === gameMap.length - 1) {
          flagMap[i][j] = false;
          isChanged = true;
          continue;
        }

        // If first or last char in line
        if (j === 0 || j === mapWidth - 1) {
          flagMap[i][j] = false;
          isChanged = true;
          continue;
        }

        // Is touching empty cell
        if (
          !flagMap[i-1][j-1] || !flagMap[i-1][j] || !flagMap[i-1][j+1] ||
          !flagMap[i  ][j-1] ||                     !flagMap[i  ][j+1] ||
          !flagMap[i+1][j-1] || !flagMap[i+1][j] || !flagMap[i+1][j+1]
        ) {
          flagMap[i][j] = false;
          isChanged = true;
          continue;
        }
      }
    }
  } while (isChanged);

  const outMap: string[] = [];
  for (let i = 0; i < gameMap.length; i++) {
    const line: string[] = new Array(mapWidth);
    for (let j = 0; j < mapWidth; j++) {
      line[j] = flagMap[i][j] ? gameMap[i][j] : "_";
    }
    outMap[i] = line.join("");
  }

  return outMap;
}

function stringifyLevels(levels: ILevel[], inputBasename: string): string {
  return "" +
    'import { type ILevel } from "./def.ts";\n' +
    "\n" +
    `export const ${toCamelCase(inputBasename)}: ILevel[] = [{\n` +
    levels.map((level: ILevel): string => "" +
    `    id   : ${level.id},\n` +
    `    hero : {s: ${level.hero.s}, e: ${level.hero.e}},\n` +
    `    boxes: [${level.boxes.map((b: IPoint): string => `{s: ${b.s}, e: ${b.e}}`).join(", ")}],\n` +
    "    map  : [\n" +
           level.map.map((line: string): string => `      "${line}",`).join("\n") + "\n" +
    "  ]").join("}, {\n") + "},\n" +
    "];\n";
}

function toCamelCase(text :string): string {
  const out: string[] = [];

  for (let i = 0, convert = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "-" || ch === "_") {
      convert = 1;
    } else {
      out.push(convert === 1 ? ch.toUpperCase() : ch);
      convert = 0;
    }
  }

  return out.join("");
}
