import inventoryAddDelta from "../inventoryAddDelta";
import globals from "../globals";
import saveEconomyTransaction from "../saveEconomyTransaction";
import LogEntry from "../../types/logDecoder";
import {
  InventoryUpdate,
  InternalEconomyTransaction,
} from "../../types/inventory";
import sha1 from "js-sha1";

interface EntryJson {
  context: string;
  updates: InventoryUpdate[];
}

interface Entry extends LogEntry {
  json: () => EntryJson;
}

// Called for all "Inventory.Updated" labels
export default function InventoryUpdated(entry: Entry): void {
  const transaction = entry.json();
  if (!transaction) return;

  transaction.updates.forEach((update: InventoryUpdate) => {
    // combine sub-context with parent context
    // preserve sub-context object data
    const newDelta: InternalEconomyTransaction = {
      ...update,
      arenaId: globals.store.getState().playerdata.playerName,
      subContext: update.context,
      context: transaction.context + "." + update.context.source,
      id: sha1(JSON.stringify(update) + entry.hash),
      date: globals.logTime.toISOString(),
    };

    // Add delta to our current values
    if (update.delta) {
      inventoryAddDelta(update.delta);
    }
    // Do not modify the context from now on.
    saveEconomyTransaction(newDelta);
  });
}
