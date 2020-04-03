import React from "react";
import { get_rank_index as getRankIndex } from "../../../shared/util";

interface RankIconProps {
  style?: React.CSSProperties;
  rank: string;
  tier: number;
  step?: number;
  percentile: number;
  leaderboardPlace: number;
  format: "constructed" | "limited";
}

export default function RankIcon(props: RankIconProps): JSX.Element {
  const { rank, tier, step, percentile, leaderboardPlace, format } = props;
  const rankIndex = getRankIndex(rank, tier);

  const style = { ...{ width: "48px", height: "48px" }, ...props.style };

  const rankStyle = {
    backgroundPosition: rankIndex * -48 + "px 0px"
  };

  const rankClass =
    !format || format == "constructed" ? "constructed_rank" : "limited_rank";

  const mythicRankTitle =
    rank +
    (leaderboardPlace == 0 ? ` ${percentile}%` : ` #${leaderboardPlace}`);
  const rankTitle = rank == "Mythic" ? mythicRankTitle : rank + " " + tier;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        title={rankTitle}
        className={rankClass}
        style={{ ...rankStyle, ...style }}
      ></div>
      {step !== undefined ? (
        <div className="rank-bullets">
          {[0, 0, 0, 0, 0, 0].fill(1, 0, step).map((v, i) => {
            return (
              <div
                key={"rank-bullet-" + i}
                className={"rank-bullet-" + (v ? "light" : "dark")}
              />
            );
          })}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
