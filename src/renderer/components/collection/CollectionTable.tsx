import React, { useMemo, useCallback } from "react";
import { Column, IdType, Row, Filters } from "react-table";
import db from "../../../shared/database";
import PagingControls from "../tables/PagingControls";
import TableHeaders from "../tables/TableHeaders";
import { BaseTableProps } from "../tables/types";
import { useBaseReactTable } from "../tables/useBaseReactTable";
import CollectionTableControls, {
  collectionModes,
} from "./CollectionTableControls";
import { setFilterFn } from "./filters";
import { CardTileRow } from "./rows";
import { getCollectionStats } from "./collectionStats";
import {
  CardsData,
  CollectionTableControlsProps,
  CollectionTableProps,
} from "./types";
import { useSelector, useDispatch } from "react-redux";
import { AppState } from "../../../shared/redux/stores/rendererStore";

import indexCss from "../../index.css";
import tablesCss from "../tables/tables.css";
import sharedCss from "../../../shared/shared.css";
import SetsView from "./SetsView";
import { reduxAction } from "../../../shared/redux/sharedRedux";
import getFiltersFromQuery from "./collectionQuery";
import { IPC_ALL, IPC_RENDERER } from "../../../shared/constants";

export default function CollectionTable({
  data,
  contextMenuCallback,
  modeCallback,
  tableStateCallback,
  cachedState,
  cachedTableMode,
  exportCallback,
}: CollectionTableProps): JSX.Element {
  const [tableMode, setTableMode] = React.useState(cachedTableMode);
  const cardSize = useSelector((state: AppState) => state.settings.cards_size);
  const collectionMode = useSelector(
    (state: AppState) => state.settings.collectionMode
  );
  const sortedSetCodes = useMemo(() => db.sortedSetCodes, []);
  React.useEffect(() => modeCallback(tableMode), [tableMode, modeCallback]);
  const dispatcher = useDispatch();

  const customFilterTypes = {
    set: setFilterFn,
  };

  // Memoize the sort functions only once
  const setSortType = React.useCallback(
    (
      rowA: Row<CardsData>,
      rowB: Row<CardsData>,
      columnId: IdType<CardsData>
    ): 0 | 1 | -1 => {
      const indexDiff =
        sortedSetCodes.indexOf(rowA.values[columnId]) -
        sortedSetCodes.indexOf(rowB.values[columnId]);
      return indexDiff < 0 ? -1 : indexDiff > 0 ? 1 : 0;
    },
    [sortedSetCodes]
  );

  const raritySortType = React.useCallback(
    (
      rowA: Row<CardsData>,
      rowB: Row<CardsData>,
      columnId: IdType<CardsData>
    ): 0 | 1 | -1 => {
      const orderedRarity = [
        "token",
        "land",
        "common",
        "uncommon",
        "rare",
        "mythic",
      ];
      const indexDiff =
        orderedRarity.indexOf(rowA.values[columnId]) -
        orderedRarity.indexOf(rowB.values[columnId]);
      return indexDiff < 0 ? -1 : indexDiff > 0 ? 1 : 0;
    },
    []
  );

  const columns: Column<CardsData>[] = useMemo(
    () => [
      { id: "grpId", accessor: "id" },
      { accessor: "id" },
      { accessor: "dfc" },
      { accessor: "dfcId" },
      {
        Header: "Name",
        accessor: "name",
        disableFilters: true,
        filter: "text",
        defaultVisible: true,
      },
      {
        accessor: "colors",
        disableFilters: true,
        filter: "colorBits",
      },
      {
        accessor: "format",
        filter: "format",
      },
      {
        accessor: "banned",
        filter: "inArray",
      },
      {
        accessor: "suspended",
        filter: "inArray",
      },
      {
        Header: "Craftable",
        accessor: "craftable",
        disableFilters: true,
        filter: "inbool",
        mayToggle: true,
        defaultVisible: false,
      },
      {
        Header: "Colors",
        disableFilters: true,
        accessor: "colorSortVal",
        filter: "colors",
        mayToggle: true,
        defaultVisible: true,
      },
      {
        Header: "CMC",
        accessor: "cmc",
        disableFilters: true,
        filter: "minmax",
        mayToggle: true,
        defaultVisible: true,
      },
      {
        Header: "Type",
        accessor: "type",
        disableFilters: true,
        filter: "text",
        mayToggle: true,
      },
      {
        Header: "Set",
        accessor: "set",
        disableFilters: true,
        filter: "array",
        sortType: setSortType,
        sortInverted: true,
        sortDescFirst: true,
        mayToggle: true,
        defaultVisible: true,
      },
      {
        Header: "Rarity",
        disableFilters: true,
        accessor: "rarity",
        filter: "rarity",
        sortType: raritySortType,
        sortDescFirst: true,
        mayToggle: true,
        defaultVisible: true,
      },
      {
        Header: "Owned",
        accessor: "owned",
        disableFilters: true,
        filter: "minmax",
        mayToggle: true,
        defaultVisible: true,
      },
      {
        Header: "Acquired",
        accessor: "acquired",
        disableFilters: true,
        filter: "minmax",
        mayToggle: true,
      },
      {
        Header: "Wanted",
        accessor: "wanted",
        disableFilters: true,
        filter: "minmax",
        mayToggle: true,
      },
      {
        Header: "Artist",
        accessor: "artist",
        disableFilters: true,
        filter: "text",
        mayToggle: true,
      },
      {
        Header: "Boosters",
        accessor: "boosters",
        disableFilters: true,
        filter: "inbool",
        mayToggle: true,
        defaultVisible: false,
      },
      { accessor: "images" },
      { accessor: "reprints" },
    ],
    [raritySortType, setSortType]
  );
  const tableProps: BaseTableProps<CardsData> = {
    cachedState,
    columns,
    customFilterTypes,
    data,
    globalFilter: undefined,
    setTableMode,
    tableMode,
    tableStateCallback,
  };
  const {
    table,
    gridTemplateColumns,
    headersProps,
    pagingProps,
    tableControlsProps,
  } = useBaseReactTable(tableProps);
  const {
    getTableBodyProps,
    page,
    prepareRow,
    rows,
    setGlobalFilter,
    setAllFilters,
  } = table;

  const stats = useMemo(() => {
    const cardIds = rows.map((row) => row.values.id);
    return getCollectionStats(cardIds);
  }, [rows]);

  const setQuery = useCallback(
    (query: string) => {
      reduxAction(
        dispatcher,
        { type: "SET_SETTINGS", arg: { collectionQuery: query } },
        IPC_ALL ^ IPC_RENDERER
      );
      let filters: Filters<CardsData> = [];
      if (query !== "") {
        filters = getFiltersFromQuery(query || "");
      }
      console.log(filters);
      setGlobalFilter(undefined);
      setAllFilters(filters);
    },
    [dispatcher, setGlobalFilter, setAllFilters]
  );

  const collectionTableControlsProps: CollectionTableControlsProps = {
    exportCallback,
    rows,
    setQuery,
    ...tableControlsProps,
  };

  return (
    <>
      <div className={indexCss.wrapperColumn}>
        <div className={tablesCss.reactTableWrap}>
          <CollectionTableControls {...collectionTableControlsProps} />
          {collectionMode === collectionModes[1] ? (
            <div className={sharedCss.medScroll}>
              <SetsView setQuery={setQuery} stats={stats} />
            </div>
          ) : (
            <>
              <div className={sharedCss.medScroll}>
                <TableHeaders
                  {...headersProps}
                  filtersVisible={{}}
                  style={{ overflowX: "auto", overflowY: "hidden" }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fit, minmax(${
                      100 + cardSize * 15 + 12
                    }px, 1fr))`,
                  }}
                  className={tablesCss.reactTableBodyNoAdjust}
                  {...getTableBodyProps()}
                >
                  {page.map((row, index) => {
                    prepareRow(row);
                    return (
                      <CardTileRow
                        key={row.original.id}
                        row={row}
                        index={index}
                        contextMenuCallback={contextMenuCallback}
                        gridTemplateColumns={gridTemplateColumns}
                      />
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: "10px" }}>
                <PagingControls {...pagingProps} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
