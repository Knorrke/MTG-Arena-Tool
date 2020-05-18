/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-var-requires */
import _ from "lodash";
import nthLastIndexOf from "./nthLastIndexOf";
import * as jsonText from "./jsonText";
import sha1 from "js-sha1";

const LABEL_JSON_PATTERNS = [
  /\[UnityCrossThreadLogger\](?<timestamp>.*): (?:Match to )?(?<playerId>\w*)(?: to Match)?: (?<label>.*)(?:\r\n|\n)/,
  /\[UnityCrossThreadLogger\]Received unhandled GREMessageType: (?<label>.*)(?:\r\n|\n)*/,
];

const LABEL_ARROW_JSON_PATTERN = /\[UnityCrossThreadLogger\](?<arrow>[<=]=[=>]) (?<label>.*?) /;

const ALL_PATTERNS = [...LABEL_JSON_PATTERNS, LABEL_ARROW_JSON_PATTERN];

const maxLinesOfAnyPattern = Math.max(
  ...ALL_PATTERNS.map((regex) => occurrences(regex.source, /\\n/g))
);

const logEntryPattern = new RegExp(
  `(${ALL_PATTERNS.map((re) => re.source.replace(/\(\?<\w*>/g, "(")).join(
    "|"
  )})`,
  "g"
);

function unleakString(s: string): string {
  return (" " + s).substr(1);
}

export default function ArenaLogDecoder(): {
  append: (newtext: string, callback: any) => void;
} {
  let buffer = "";
  let bufferDiscarded = 0;
  return { append };

  function append(newText: string, callback: any): void {
    logEntryPattern.lastIndex = 0;

    buffer = buffer.length ? buffer.concat(newText) : newText;
    let bufferUsed = 0;
    let match;
    while ((match = logEntryPattern.exec(buffer))) {
      const position = bufferDiscarded + match.index;
      const [type, length, entry] = parseLogEntry(
        buffer,
        match[0],
        match.index,
        position
      );
      switch (type) {
        case "invalid":
          bufferUsed = match.index + length;
          break;
        case "partial":
          bufferUsed = match.index;
          break;
        case "full":
          bufferUsed = match.index + length;
          callback({
            ...entry,
            position,
          });
          break;
      }
    }

    if (bufferUsed === 0) {
      const i = nthLastIndexOf(buffer, "\n", maxLinesOfAnyPattern);
      bufferUsed = i === -1 ? 0 : i;
    }

    if (bufferUsed > 0) {
      bufferDiscarded += bufferUsed;
      buffer = unleakString(buffer.substr(bufferUsed));
    }

    unleakRegExp();
  }
}

function parseLogEntry(
  text: string,
  matchText: string,
  position: number,
  absPosition: number
): any[] {
  let rematches: RegExpMatchArray | null;

  if ((rematches = matchText.match(LABEL_ARROW_JSON_PATTERN))) {
    const jsonStart = position + matchText.length;
    if (jsonStart >= text.length) {
      return ["partial"];
    }
    if (!jsonText.starts(text, jsonStart)) {
      return ["invalid", matchText.length];
    }

    const jsonLen = jsonText.length(text, jsonStart);
    if (jsonLen === -1) {
      return ["partial"];
    }

    let textAfterJson = text.substr(jsonStart + jsonLen, 2);
    if (textAfterJson !== "\r\n") {
      textAfterJson = text.substr(jsonStart + jsonLen, 1);
      if (textAfterJson !== "\n") {
        return ["partial"];
      }
    }

    const jsonString = text.substr(jsonStart, jsonLen);
    return [
      "full",
      matchText.length + jsonLen + textAfterJson.length,
      {
        type: "label_arrow_json",
        ..._.mapValues(rematches.groups, unleakString),
        hash: sha1(jsonString + absPosition),
        json: (): void => {
          try {
            // console.log(jsonString, jsonStart, jsonLen);
            const json = JSON.parse(jsonString);
            return (
              json.payload || (json.request && JSON.parse(json.request)) || json
            );
          } catch (e) {
            console.log(e, {
              input: rematches?.input,
              string: jsonString,
            });
          }
        },
      },
    ];
  }

  for (const pattern of LABEL_JSON_PATTERNS) {
    rematches = matchText.match(pattern);
    if (!rematches) continue;

    const jsonStart = position + matchText.length;
    if (jsonStart >= text.length) {
      return ["partial"];
    }
    if (!jsonText.starts(text, jsonStart)) {
      return ["invalid", matchText.length];
    }

    const jsonLen = jsonText.length(text, jsonStart);
    if (jsonLen === -1) {
      return ["partial"];
    }

    let textAfterJson = text.substr(jsonStart + jsonLen, 2);
    if (textAfterJson !== "\r\n") {
      textAfterJson = text.substr(jsonStart + jsonLen, 1);
      if (textAfterJson !== "\n") {
        return ["partial"];
      }
    }

    const jsonString = text.substr(jsonStart, jsonLen);
    return [
      "full",
      matchText.length + jsonLen + textAfterJson.length,
      {
        type: "label_json",
        ..._.mapValues(rematches.groups, unleakString),
        hash: sha1(jsonString + absPosition),
        text: jsonString,
        json: (): void => {
          try {
            // console.log(jsonString, jsonStart, jsonLen);
            const json = JSON.parse(jsonString);
            return (
              json.payload || (json.request && JSON.parse(json.request)) || json
            );
          } catch (e) {
            console.log(e, {
              input: rematches?.input,
              string: jsonString,
            });
          }
        },
      },
    ];
  }

  // we should never get here. instead, we should
  // have returned a 'partial' or 'invalid' result
  throw new Error("Could not parse an entry");
}

function occurrences(text: string, re: RegExp): number {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

// The global RegExp object has a lastMatch property that holds references to
// strings -- even our very large ones. This fn can be called to release those.
function unleakRegExp(): void {
  /\s*/g.exec("");
}
