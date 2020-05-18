/* eslint-disable @typescript-eslint/no-use-before-define, @typescript-eslint/camelcase */
import { app, ipcRenderer as ipc, remote } from "electron";
import path from "path";
import {
  IPC_BACKGROUND,
  IPC_RENDERER,
  CARD_RARITIES,
} from "../shared/constants";
import { WinLossGate } from "../types/event";
import store from "../shared/redux/stores/rendererStore";
import { MissingWildcards, CardCounts } from "./components/decks/types";
import Deck from "../shared/deck";
import db from "../shared/database";

import sharedCss from "../shared/shared.css";

export const actionLogDir = path.join(
  (app || remote.app).getPath("userData"),
  "actionlogs"
);

export function ipcSend(
  method: string,
  arg?: unknown,
  to = IPC_BACKGROUND
): void {
  ipc.send("ipc_switch", method, IPC_RENDERER, arg, to);
}

export function toggleArchived(id: string | number): void {
  ipcSend("toggle_archived", id);
}

export function getTagColor(tag?: string): string {
  return (
    (tag ? store.getState().playerdata.tagsColors[tag] : undefined) ?? "#FAE5D2"
  );
}

export function formatPercent(
  value: number,
  config = { maximumSignificantDigits: 2 }
): string {
  return value.toLocaleString([], {
    style: "percent",
    ...config,
  });
}

export function formatWinrateInterval(lower: number, upper: number): string {
  return `${formatPercent(lower)} to ${formatPercent(upper)} with 95% confidence
(estimated actual winrate bounds, assuming a normal distribution)`;
}

export function formatNumber(value: number, config = {}): string {
  return value.toLocaleString([], {
    style: "decimal",
    ...config,
  });
}

export function getWinrateClass(wr: number, bright = true): string {
  if (wr > 0.65) return bright ? sharedCss.blueBright : sharedCss.blue;
  if (wr > 0.55) return bright ? sharedCss.greenBright : sharedCss.green;
  if (wr < 0.45) return bright ? sharedCss.orangeBright : sharedCss.orange;
  if (wr < 0.35) return bright ? sharedCss.redBright : sharedCss.red;
  return bright ? sharedCss.whiteBright : sharedCss.white;
}

export function getEventWinLossClass(
  wlGate: Partial<WinLossGate>,
  bright = true
): string {
  if (wlGate === undefined)
    return bright ? sharedCss.whiteBright : sharedCss.white;
  if (wlGate.MaxWins === wlGate.CurrentWins)
    return bright ? sharedCss.blueBright : sharedCss.blue;
  if (wlGate.CurrentWins !== undefined && wlGate.CurrentLosses !== undefined) {
    if (wlGate.CurrentWins > wlGate.CurrentLosses)
      return bright ? sharedCss.greenBright : sharedCss.green;
    if (wlGate.CurrentWins * 2 > wlGate.CurrentLosses)
      return bright ? sharedCss.orangeBright : sharedCss.orange;
  }
  return bright ? sharedCss.redBright : sharedCss.red;
}

interface Winrate {
  wins: number;
  losses: number;
  colors?: number[] | undefined;
}

export function compareWinrates(a: Winrate, b: Winrate): -1 | 0 | 1 {
  const _a = a.wins / a.losses;
  const _b = b.wins / b.losses;

  if (_a < _b) return 1;
  if (_a > _b) return -1;

  return compareColorWinrates(a, b);
}

export function compareColorWinrates(winA: Winrate, winB: Winrate): -1 | 0 | 1 {
  const a = winA.colors ?? [];
  const b = winB.colors ?? [];

  if (a.length < b.length) return -1;
  if (a.length > b.length) return 1;

  const sa = a.reduce(function (_a: number, _b: number) {
    return _a + _b;
  }, 0);
  const sb = b.reduce(function (_a: number, _b: number) {
    return _a + _b;
  }, 0);
  if (sa < sb) return -1;
  if (sa > sb) return 1;

  return 0;
}

export function getBoosterCountEstimate(
  neededWildcards: MissingWildcards
): number {
  let boosterCost = 0;
  const boosterEstimates = {
    common: 3.36,
    uncommon: 2.6,
    rare: 5.72,
    mythic: 13.24,
  };

  const playerEconomy = store.getState().playerdata.economy;

  const ownedWildcards = {
    common: playerEconomy.wcCommon,
    uncommon: playerEconomy.wcUncommon,
    rare: playerEconomy.wcRare,
    mythic: playerEconomy.wcMythic,
  };

  CARD_RARITIES.map((rarity) => {
    if (rarity !== "land") {
      const needed = neededWildcards[rarity] || 0;
      const owned = ownedWildcards[rarity] || 0;
      const missing = Math.max(0, needed - owned);
      boosterCost = Math.max(boosterCost, boosterEstimates[rarity] * missing);
    }
  });

  return Math.round(boosterCost);
}

export function getWildcardsMissing(
  deck: Deck,
  grpid: number,
  isSideboard?: boolean
): number {
  let mainQuantity = 0;
  const cards = store.getState().playerdata.cards;
  const mainMatches = deck
    .getMainboard()
    .get()
    .filter((card) => card.id == grpid);
  if (mainMatches.length) {
    mainQuantity = mainMatches[0].quantity;
  }

  let sideboardQuantity = 0;
  const sideboardMatches = deck
    .getSideboard()
    .get()
    .filter((card) => card.id == grpid);
  if (sideboardMatches.length) {
    sideboardQuantity = sideboardMatches[0].quantity;
  }

  let needed = mainQuantity;
  if (isSideboard) {
    needed = sideboardQuantity;
  }
  // cap at 4 copies to handle petitioners, rat colony, etc
  needed = Math.min(4, needed);

  const card = db.card(grpid);
  let arr = [];
  if (!card?.reprints) arr = [grpid];
  else arr.push(grpid);

  let have = 0;
  arr.forEach((id) => {
    const n = cards.cards[id];
    if (n !== undefined) {
      have += n;
    }
  });

  let copiesLeft = have;
  if (isSideboard) {
    copiesLeft = Math.max(0, copiesLeft - mainQuantity);

    const infiniteCards = [67306, 69172]; // petitioners, rat colony, etc
    if (have >= 4 && infiniteCards.indexOf(grpid) >= 0) {
      copiesLeft = 4;
    }
  }

  return Math.max(0, needed - copiesLeft);
}

export function getCardsMissingCount(deck: Deck, grpid: number): number {
  const mainMissing = getWildcardsMissing(deck, grpid, false);
  const sideboardMissing = getWildcardsMissing(deck, grpid, true);
  return mainMissing + sideboardMissing;
}

export function get_deck_missing(deck: Deck): MissingWildcards {
  const missing = { rare: 0, common: 0, uncommon: 0, mythic: 0 };
  const alreadySeenIds = new Set(); // prevents double counting cards across main/sideboard
  const entireDeck = [
    ...deck.getMainboard().get(),
    ...deck.getSideboard().get(),
  ];

  entireDeck.forEach((card) => {
    const grpid = card.id;
    // process each card at most once
    if (alreadySeenIds.has(grpid)) {
      return;
    }
    const rarity = db.card(grpid)?.rarity;
    if (rarity && rarity !== "land") {
      missing[rarity] += getCardsMissingCount(deck, grpid);
      alreadySeenIds.add(grpid); // remember this card
    }
  });

  return missing;
}

export function getMissingCardCounts(deck: Deck): CardCounts {
  const missingCards: CardCounts = {};
  const allCardIds = new Set(
    [...deck.getMainboard().get(), ...deck.getSideboard().get()].map(
      (card) => card.id
    )
  );
  allCardIds.forEach((grpid) => {
    const missing = getCardsMissingCount(deck, grpid);
    if (missing > 0) {
      missingCards[grpid] = missing;
    }
  });
  return missingCards;
}
