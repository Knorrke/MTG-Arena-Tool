import styled from "styled-components";
import { getRankIndex16 } from "../../../shared/utils/getRankIndex";
import { SymbolBase } from "./SymbolBase";
import indexCss from "../../index.css";

const RankSymbolBase = styled(SymbolBase).attrs<RankSymbolProps>((props) => ({
  className: `${props.className ?? ""} ${indexCss.rarityFilter} ${
    indexCss.ranks16
  }`,
  title: props.rank,
  style: {
    ...props.style,
    marginRight: "2px",
    height: "16px",
    width: "16px",
    backgroundSize: "initial",
    backgroundPosition: getRankIndex16(props.rank) * -16 + "px 0px",
  },
}))``;
interface RankSymbolProps {
  rank: string;
}

export const RankSymbol = styled(RankSymbolBase)<RankSymbolProps>``;
