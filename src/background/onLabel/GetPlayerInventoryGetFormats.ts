import LogEntry from "../../types/logDecoder";
import { Format } from "../../types/Metadata";
import { reduxAction } from "../../shared/redux/sharedRedux";
import globals from "../globals";
import { IPC_RENDERER } from "../../shared/constants";

interface Entry extends LogEntry {
  json: () => Format[];
}

export default function GetPlayerInventoryGetFormats(entry: Entry): void {
  const json = entry.json();
  if (!json || json.length == 0) return;

  const formats: Record<string, Format> = {};
  json.forEach((format) => {
    formats[format.name] = format;
  });

  reduxAction(
    globals.store.dispatch,
    { type: "SET_FORMATS", arg: formats },
    IPC_RENDERER
  );
}
