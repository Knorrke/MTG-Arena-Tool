import React from "react";
import { FilterValue } from "react-table";
import getReadableEvent from "../../../shared/utils/getReadableEvent";
import { MATCHES_TABLE_MODES } from "../../../shared/constants";
import ReactSelect from "../../../shared/ReactSelect";
import DateFilter from "../../DateFilter";
import { MediumTextButton } from "../misc/MediumTextButton";
import { SmallTextButton } from "../misc/SmallTextButton";
import ColumnToggles from "../tables/ColumnToggles";
import { GlobalFilter } from "../tables/filters";
import PagingControls from "../tables/PagingControls";
import { MatchesTableControlsProps } from "./types";

import indexCss from "../../index.css";
import tableCss from "../tables/tables.css";
import deckTableCss from "../decks/deckTable.css";

const defaultFilters = (): { id: string; value: FilterValue }[] => [
  { id: "archivedCol", value: "hideArchived" },
];

export default function MatchesTableControls(
  props: MatchesTableControlsProps
): JSX.Element {
  const {
    aggFilters,
    events,
    globalFilter,
    pagingProps,
    preGlobalFilteredRows,
    setAggFiltersCallback,
    setAllFilters,
    setFiltersVisible,
    setGlobalFilter,
    setTableMode,
    setTogglesVisible,
    tableMode,
    toggleableColumns,
    toggleHideColumn,
    toggleSortBy,
    togglesVisible,
  } = props;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        color: "var(--color-text)",
        paddingBottom: "4px",
      }}
    >
      <div className={tableCss.reactTableToggles}>
        <div className={indexCss.flexItem}>
          <DateFilter
            prefixId={deckTableCss.decksTop}
            current={aggFilters.date}
            callback={(date): void =>
              setAggFiltersCallback({ ...aggFilters, date })
            }
          />
          <ReactSelect
            options={events}
            current={aggFilters.eventId ?? ""}
            callback={(eventId): void =>
              setAggFiltersCallback({ ...aggFilters, eventId })
            }
            optionFormatter={getReadableEvent}
            style={{ marginBottom: "auto" }}
          />
        </div>
        <div className={indexCss.flexItem}>
          <SmallTextButton
            onClick={(): void => {
              setAllFilters(defaultFilters);
              setFiltersVisible({});
              toggleSortBy("timestamp", true, false);
              for (const column of toggleableColumns) {
                toggleHideColumn(column.id, !column.defaultVisible);
              }
            }}
          >
            Reset
          </SmallTextButton>
          <MediumTextButton
            onClick={(): void => setTogglesVisible(!togglesVisible)}
            className={indexCss.buttonSimple}
          >
            {togglesVisible ? "Hide" : "Show"} Column Toggles
          </MediumTextButton>
        </div>
      </div>
      <ColumnToggles
        toggleableColumns={toggleableColumns}
        togglesVisible={togglesVisible}
      />
      <div className={tableCss.react_table_search_cont}>
        <ReactSelect
          key={tableMode}
          current={tableMode}
          options={MATCHES_TABLE_MODES}
          callback={setTableMode}
          className={"matches_table_mode"}
        />
        <GlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          countLabel={"matches"}
        />
        {globalFilter && (
          <div
            style={{ marginRight: 0, minWidth: "24px" }}
            className={"button close"}
            onClick={(e): void => {
              e.stopPropagation();
              setGlobalFilter(undefined);
            }}
            title={"clear column filter"}
          />
        )}
        <PagingControls align={"flex-end"} {...pagingProps} />
      </div>
    </div>
  );
}
