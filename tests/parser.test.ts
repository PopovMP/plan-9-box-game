import { describe, it } from "node:test";
import { strictEqual } from "assert";
import { levels } from "../easy-levels.ts";

describe("parser level 1", () => {
  /*
      ; #1
      #####
      #   ####
      #   #  #
      ##    .#
      ### ###.#
      # $ # #.#
      # $$# ###
      #@  #
      #####
  */
  const level = levels[0];
  it ("parses level id", () => {
    strictEqual(level.id, 1);
  })

  it ("parses hero position", () => {
    strictEqual(level.hero.s, 7);
    strictEqual(level.hero.e, 1);
  });

  it ("parses boxes", () => {
    strictEqual(level.boxes.length, 3);
    const box0 = level.boxes[0];
    strictEqual(box0.s, 5);
    strictEqual(box0.e, 2);
  });
});

describe("parser level 23", () => {
  /*
      ; #23
      #######
      #  #@ #
      # $$$ #
      #  $  #
      # $$$ #
      #..#..#
      #..$..#
      #######
  */
  const level = levels[22];
  it ("parses level id", () => {
    strictEqual(level.id, 23);
  })

  it ("parses hero position", () => {
    strictEqual(level.hero.s, 1);
    strictEqual(level.hero.e, 4);
  });

  it ("parses boxes", () => {
    strictEqual(level.boxes.length, 8);
    const box0 = level.boxes[0];
    strictEqual(box0.s, 2);
    strictEqual(box0.e, 2);
  });

});

describe("parser level 29", () => {
  /*
      ; #29
      #######
      #     ##
      # $  $ #
      ## # #@#
        #.# $ #
      ###..$ ##
      #  ..# #
      # #.*# ###
      #  #.$$$ #
      ##   # # #
      ###     #
        #######
  */
  const level = levels[28];
  it ("parses level id", () => {
    strictEqual(level.id, 29);
  })

  it ("parses hero position", () => {
    strictEqual(level.hero.s, 3);
    strictEqual(level.hero.e, 7);
  });

  it ("parses boxes", () => {
    strictEqual(level.boxes.length, 8);
    const box0 = level.boxes[4];
    strictEqual(box0.s, 7);
    strictEqual(box0.e, 4);
  });

});
