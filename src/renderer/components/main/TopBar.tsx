import React from "react";
import { ipcSend } from "../../rendererUtil";
import { forceOpenSettings } from "../../tabControl";

import mainCss from "./main.css";
import indexCss from "../../index.css";
import sharedCss from "../../../shared/shared.css";

interface TopBarProps {
  artist: string;
  offline: boolean;
}

function clickMinimize(): void {
  ipcSend("renderer_window_minimize", 1);
}

function clickSettings(): void {
  forceOpenSettings();
}

function clickClose(): void {
  ipcSend("renderer_window_close", 1);
}

export default function TopBar(props: TopBarProps): JSX.Element {
  return (
    <div className={sharedCss.top}>
      <div className={indexCss.flexItem}>
        <div className={sharedCss.topLogo}></div>
        <div className={mainCss.topArtist}>{props.artist}</div>
      </div>
      <div className={indexCss.flexItem}>
        {props.offline ? (
          <div className={mainCss.unlink} title="You are not logged-in."></div>
        ) : (
          <></>
        )}
        <div
          onClick={clickMinimize}
          className={sharedCss.minimize + " " + sharedCss.button}
        ></div>
        <div
          onClick={clickSettings}
          className={sharedCss.settings + " " + sharedCss.button}
        ></div>
        <div
          onClick={clickClose}
          className={sharedCss.close + " " + sharedCss.button}
        ></div>
      </div>
    </div>
  );
}
