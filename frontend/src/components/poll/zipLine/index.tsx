import React, {useState, Dispatch, SetStateAction} from "react";

import "./styles.scss";



export interface ZipLineProps {
  startTime: Date,
  endTime: Date
}

export const ZipLine = (props: ZipLineProps): JSX.Element => {
  const [fill, setFill]: [number, Dispatch<SetStateAction<number>>] =
    useState(
      ((new Date).getTime() - props.startTime.getTime()) /
      (props.endTime.getTime() - props.startTime.getTime() - 1000)
    );

  if (fill < 1) {
    const nextDate: Date = new Date();
    nextDate.setTime(nextDate.getTime() + 1000);
    nextDate.setMilliseconds(0);
    const nextFill: number =
      (nextDate.getTime() - props.startTime.getTime()) /
      (props.endTime.getTime() - props.startTime.getTime() - 1000);

    setTimeout(
      (): void => setFill(nextFill),
      nextDate.getTime() - (new Date()).getTime()
    );
  }

  return (
    <div
      className = "zipLine"
      style = {{"width": `${Math.round(fill * 100)}%`}}
    >
    </div>
  );
}
