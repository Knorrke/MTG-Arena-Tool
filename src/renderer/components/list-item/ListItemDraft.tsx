import React from "react";
import {
  ListItem,
  Column,
  HoverTile,
  FlexTop,
  FlexBottom,
  ArchiveButton,
} from "./ListItem";

import ShareButton from "../misc/ShareButton";
import db from "../../../shared/database";

import getReadableEvent from "../../../shared/utils/getReadableEvent";
import { DEFAULT_TILE } from "../../../shared/constants";
import { toggleArchived } from "../../rendererUtil";
import { InternalDraftv2 } from "../../../types/draft";
import css from "./ListItem.css";
import { CardPoolRares } from "./ListItemEvent";

interface ListItemDraftProps {
  draft: InternalDraftv2;
  openDraftCallback: (id: string) => void;
}

export default function ListItemDraft({
  draft,
  openDraftCallback,
}: ListItemDraftProps): JSX.Element {
  const parentId = draft.id || "";

  const onRowClick = (): void => {
    openDraftCallback(parentId);
  };

  const [hover, setHover] = React.useState(false);
  const mouseEnter = React.useCallback(() => {
    setHover(true);
  }, []);
  const mouseLeave = React.useCallback(() => {
    setHover(false);
  }, []);

  const draftSetName =
    Object.keys(db.sets).filter(
      (name) => db.sets[name].arenacode == draft.draftSet
    )[0] || "";
  const draftSet = db.sets[draftSetName];

  return (
    <ListItem
      click={onRowClick}
      mouseEnter={mouseEnter}
      mouseLeave={mouseLeave}
    >
      <HoverTile hover={hover} grpId={draftSet?.tile || DEFAULT_TILE} />

      <Column class={css.listItemLeft}>
        <FlexTop>
          <div className={css.listDeckName}>
            {draftSetName + " Draft" || ""}
          </div>
        </FlexTop>
        <FlexBottom>
          <div className={css.listDeckNameIt}>
            {getReadableEvent(draft.eventId)}
          </div>
        </FlexBottom>
      </Column>

      <div
        style={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
        className={css.listItemCenter}
      >
        {draft.pickedCards ? (
          <CardPoolRares pool={[...draft.pickedCards]} />
        ) : (
          []
        )}
      </div>

      <Column class={css.listEventPhase}>
        <FlexTop>See Replay</FlexTop>
        <FlexBottom>
          <div className={css.listMatchTime}>
            {draft.date ? (
              <relative-time datetime={new Date(draft.date || 0).toISOString()}>
                {draft.date?.toString() ?? ""}
              </relative-time>
            ) : (
              "-"
            )}
          </div>
        </FlexBottom>
      </Column>

      <Column style={{ display: "flex" }}>
        <ShareButton type="draft" data={draft} />
      </Column>

      <ArchiveButton
        archiveCallback={toggleArchived}
        dataId={draft.id || ""}
        hover={hover}
        isArchived={draft.archived || false}
      />
    </ListItem>
  );
}
