import { ArenaV3Deck } from "../../types/Deck";
import LogEntry from "../../types/logDecoder";
import InDeckGetDeckLists from "./InDeckGetDeckLists";

interface Entry extends LogEntry {
  json: () => ArenaV3Deck[];
}

export default function InDeckGetDeckListsV3(entry: Entry): void {
  const json = entry.json();
  if (!json) return;
  InDeckGetDeckLists(entry, json);
}
