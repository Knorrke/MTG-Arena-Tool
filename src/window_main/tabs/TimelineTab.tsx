import React, {
  useEffect,
  SetStateAction,
  useRef,
  useCallback,
  useState,
  useMemo
} from "react";
import format from "date-fns/format";
import { get_rank_index as getRankIndex } from "../../shared/util";
import { SeasonalRankData } from "../../types/Season";
import DeckList from "../components/misc/DeckList";
import Deck from "../../shared/deck";
import ReactSelect from "../../shared/ReactSelect";
import ManaCost from "../components/misc/ManaCost";
import ResultDetails from "../components/misc/ResultDetails";
import RankIcon from "../components/misc/RankIcon";
import store, { AppState } from "../../shared-redux/stores/rendererStore";
import {
  getSeasonal,
  seasonalExists,
  matchExists,
  getMatch
} from "../../shared-store";
import { useSelector } from "react-redux";

function sortByTimestamp(a: SeasonalRankData, b: SeasonalRankData): number {
  return a.timestamp - b.timestamp;
}

/**
 * Get the ranks conversion to a Y coordinate
 * @param rank Rank name (string)
 * @param tier Level (number)
 * @param steps (number)
 */
function getRankY(rank: string, tier: number, steps: number): number {
  let value = 0;
  switch (rank) {
    case "Bronze":
      value = 0;
      break;
    case "Silver":
      value = 4 * 6;
      break;
    case "Gold":
      value = 4 * 6 * 2;
      break;
    case "Platinum":
      value = 4 * 6 * 3;
      break;
    case "Diamond":
      value = 4 * 6 * 4;
      break;
    case "Master":
      value = 4 * 6 * 5;
      break;
    case "Mythic":
      value = 4 * 6 * 6;
      break;
    }

  return value + 6 * (4 - tier) + steps;
}

const RANK_HEIGHTS = [0, 24, 48, 72, 96, 120];

/**
 * Get the data for this season and add fields to the data for timeline processing
 * @param type season type ("constructed" or "limited")
 * @param seasonOrdinal Season number/id (optional)
 */
function getSeasonData(
  type = "constructed",
  seasonOrdinal?: number
): SeasonalRankData[] {
  const rank = store.getState().playerdata.rank;
  const seasonal = store.getState().seasonal.seasonal;
  if (!seasonOrdinal)
    seasonOrdinal = rank[type as "constructed" | "limited"].seasonOrdinal;

  let seasonalData: string[] | undefined = seasonal[`${type}_${seasonOrdinal}`];
  if (!seasonalData) return [];

  seasonalData = seasonalData.filter((v, i) => seasonalData?.indexOf(v) === i);

  function morphData(data: SeasonalRankData): SeasonalRankData {
    data.oldRankNumeric = getRankY(data.oldClass, data.oldLevel, data.oldStep);
    data.newRankNumeric = getRankY(data.newClass, data.newLevel, data.newStep);
    data.date = new Date(data.timestamp * 1000);
    //console.log(data);
    return data;
  }

  return seasonalData
    .filter((id: string) => seasonalExists(id))
    .map((id: string) => getSeasonal(id) as SeasonalRankData)
    .map((data: SeasonalRankData) => morphData(data))
    .sort(sortByTimestamp);
}

interface TimelinePartProps extends SeasonalRankData {
  index: number;
  width: number;
  height: number;
  hover: string;
  setHover: React.Dispatch<SetStateAction<string>>;
  setPartHover: React.Dispatch<SetStateAction<number>>;
  lastMatchId: string;
}

/**
 * Component for a line/stroke of the timeline
 * @param props
 */
function TimeLinePart(props: TimelinePartProps): JSX.Element {
  const {
    index,
    width,
    height,
    hover,
    setHover,
    setPartHover,
    lastMatchId
  } = props;

  const deckId = matchExists(lastMatchId)
    ? getMatch(lastMatchId)?.playerDeck.id
    : "";

  const mouseIn = useCallback(() => {
    setHover(lastMatchId || "");
    setPartHover(index);
  }, [lastMatchId, index, setPartHover, setHover]);

  const newPointHeight = props.newRankNumeric
    ? height - props.newRankNumeric * 2
    : height;
  const oldwPointHeight = props.oldRankNumeric
    ? height - props.oldRankNumeric * 2
    : height;
  const rectPoints = `0 ${oldwPointHeight} ${width} ${newPointHeight} ${width} ${height} 0 ${height}`;
  const linePoints = `0 ${oldwPointHeight} ${width} ${newPointHeight}`;

  const style = {
    // Get a color that is the modulus of the hex ID
    fill: `hsl(${parseInt(deckId || "", 16) % 360}, 64%, 63%)`
  };

  return (
    <div
      style={style}
      className={"timeline-line" + (hover == deckId ? " hover" : "")}
      onMouseEnter={mouseIn}
    >
      <svg width={width} height={height} version="1.1">
        {RANK_HEIGHTS.map((h: number) => {
          const hpos = height - h * 2;
          return (
            <polyline
              key={"poly-" + h}
              points={`0 ${hpos} ${width} ${hpos}`}
              stroke="var(--color-light)"
              strokeWidth="0.25"
            />
          );
        })}
        <polygon points={rectPoints} strokeWidth="0" />
        <polyline points={linePoints} strokeWidth="1" />
      </svg>
      {props.oldClass !== props.newClass ? (
        <TimelineRankBullet
          width={width}
          height={props.newRankNumeric ? props.newRankNumeric * 2 + 48 : 0}
          rankClass={props.newClass}
          rankLevel={props.newLevel}
        />
      ) : (
        <></>
      )}
    </div>
  );
}

interface RankBulletProps {
  width: number;
  height: number;
  rankClass: string;
  rankLevel: number;
}

/**
 * Component for a Rank "bullet" icon in the timeline
 * @param props
 */
function TimelineRankBullet(props: RankBulletProps): JSX.Element {
  const { width, height, rankClass, rankLevel } = props;

  const divStyle = {
    backgroundPosition: getRankIndex(rankClass, rankLevel) * -48 + "px 0px",
    //marginLeft: "-11px",
    top: `${300 - height}px`,
    left: `${(width - 48) / 2}px`,
    zIndex: -10
  };

  const divTitle = rankClass + " " + rankLevel;
  return (
    <div
      style={divStyle}
      title={divTitle}
      className="timeline-rank top_constructed_rank"
    ></div>
  );
}

/**
 * Main component for the Timeline tab
 * @param props
 */
export default function TimelineTab(): JSX.Element {
  const boxRef = useRef<HTMLDivElement>(null);
  const rank = useSelector((state: AppState) => state.playerdata.rank);
  const [hoverMatchId, setHoverMatchId] = useState("");
  const [hoverPart, setHoverPart] = useState(0);
  const [dimensions, setDimensions] = useState({
    height: 300,
    width: window.innerWidth - 108
  });
  const [seasonType, setSeasonType] = useState<"constructed" | "limited">(
    "constructed"
  );

  // Notice we can see old seasons too adding the seasonOrdinal
  const data: SeasonalRankData[] = useMemo(() => getSeasonData(seasonType), [
    seasonType
  ]);

  const handleSetSeasonType = useCallback((type: string): void => {
    setSeasonType(type as "constructed" | "limited");
    setHoverPart(-1);
  }, []);

  const handleResize = useCallback((): void => {
    if (boxRef && boxRef.current) {
      setDimensions({
        height: boxRef.current.offsetHeight,
        width: boxRef.current.offsetWidth
      });
    }
  }, [boxRef]);

  useEffect(() => {
    // We might want to add a delay here to avoid re-rendering too many times per second while resizing
    window.addEventListener("resize", handleResize);
    return (): void => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    setTimeout(handleResize, 100);
  }, [handleResize]);

  const hoverMatch = useMemo(() => getMatch(hoverMatchId), [hoverMatchId]);
  const hoverDecklist = hoverMatch ? hoverMatch.playerDeck : undefined;

  const drawingSeason = rank[seasonType].seasonOrdinal;
  const drawingSeasonDate = new Date();

  const hoverPartX = (dimensions.width / data.length) * (hoverPart + 1) - 4;

  const match = getMatch(data[hoverPart]?.lastMatchId);
  const hData = data[hoverPart];

  const won = match ? match.player.win > match.opponent.win : false;

  return (
    <div className="ux_item">
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div className="timeline-title">
          <div>
            Season {drawingSeason} -{" "}
            {format(drawingSeasonDate as Date, "MMMM yyyy")}
          </div>
          <ReactSelect
            options={["constructed", "limited"]}
            current={seasonType}
            callback={handleSetSeasonType}
          />
        </div>
        <div style={{ display: "flex" }}>
          <div className="timeline-box-labels">
            <div className="timeline-label">#1</div>
            <div className="timeline-label">Mythic</div>
            <div className="timeline-label">Diamond</div>
            <div className="timeline-label">Platinum</div>
            <div className="timeline-label">Gold</div>
            <div className="timeline-label">Silver</div>
            <div className="timeline-label">Bronze</div>
          </div>
          <div className="timeline-box" ref={boxRef}>
            {data.map((value: SeasonalRankData, index: number) => {
              //console.log("From: ", value.oldClass, value.oldLevel, "step", value.oldStep, value.oldRankNumeric);
              //console.log("To:   ", value.newClass, value.newLevel, "step", value.newStep, value.newRankNumeric);
              return (
                <TimeLinePart
                  height={dimensions.height}
                  width={dimensions.width / data.length}
                  index={index}
                  key={index}
                  hover={hoverMatchId}
                  setHover={setHoverMatchId}
                  setPartHover={setHoverPart}
                  {...value}
                />
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <div className="timeline-box-labels" />
          <div className="timeline-bottom-box">
            {hoverPart > -1 ? (
              <>
                <div
                  className="timeline-pos"
                  style={{ marginLeft: hoverPartX + "px" }}
                />
                <div
                  style={{
                    whiteSpace: "nowrap",
                    marginLeft: hoverPartX + "px"
                  }}
                >
                  {data[hoverPart]
                    ? format(
                        new Date(data[hoverPart].timestamp),
                        "EEE do, HH:mm"
                      )
                    : ""}
                </div>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div
          style={{
            margin: "0 28px",
            display: "flex"
          }}
        >
          <div
            className="card_lists_list"
            style={{ margin: "0", width: "50%" }}
          >
            {hoverMatch && hoverDecklist ? (
              <>
                <div className="decklist-name">{hoverDecklist.name}</div>
                <div className="decklist-colors">
                  <ManaCost
                    class="mana_s20"
                    colors={hoverDecklist.colors || []}
                  />
                </div>
                <DeckList deck={new Deck(hoverDecklist)} />
              </>
            ) : (
              <></>
            )}
          </div>
          <div
            style={{
              margin: "0 auto",
              color: "var(--color-light)"
            }}
          >
            {match ? (
              <div
                style={{
                  color: "var(--color-light)",
                  margin: "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <div>vs. {match.opponent.name}</div>
                <RankIcon
                  format={seasonType}
                  rank={match.opponent.rank}
                  tier={match.opponent.tier}
                  leaderboardPlace={match.opponent.leaderboardPlace || 0}
                  percentile={match.opponent.percentile || 0}
                />
                <div
                  style={{
                    lineHeight: "32px",
                    fontFamily: "var(--main-font-name-it}",
                    fontSize: "18px"
                  }}
                  className={won ? "green" : "red"}
                >
                  {won ? "Win" : "Loss"}
                </div>
                <ResultDetails match={match} />
                <div style={{ display: "flex", alignItems: "center" }}>
                  <RankIcon
                    format={seasonType}
                    rank={hData.oldClass}
                    tier={hData.oldLevel}
                    step={hData.oldStep}
                    leaderboardPlace={0}
                    percentile={0}
                  />
                  <div className="rank-to-right" />
                  <RankIcon
                    format={seasonType}
                    rank={hData.newClass}
                    tier={hData.newLevel}
                    step={hData.newStep}
                    leaderboardPlace={0}
                    percentile={0}
                  />
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
