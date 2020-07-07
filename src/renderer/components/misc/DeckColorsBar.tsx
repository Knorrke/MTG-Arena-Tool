import React, { useCallback } from "react";
import Deck from "../../../shared/deck";
import getDeckColorsAmmount from "./getDeckColorsAmmount";

interface DeckColorsBarProps {
  deck: Deck;
}

export default function DeckColorsBar(props: DeckColorsBarProps): JSX.Element {
  const { deck } = props;
  const colors = getDeckColorsAmmount(deck) as any;

  const drawColor = useCallback(
    (key: string, val: number | undefined) => {
      if (key !== "c" && key !== "total" && val && val > 0) {
        return (
          <div
            key={key}
            style={{
              backgroundColor: `var(--color-${key})`,
              width: `${(100 / colors.total) * val}%`,
              height: `100%`,
            }}
          />
        );
      } else {
        return <></>;
      }
    },
    [colors]
  );
  return (
    <div style={{ height: "4px", display: "flex", width: "100%" }}>
      {Object.keys(colors).map((k) => drawColor(k, colors[k]))}
    </div>
  );
}
