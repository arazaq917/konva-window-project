import React, { useEffect, useState } from "react";
import Konva from "konva";
import Button from "../Buttons/Button";
import "./designer.css";

const Designer = (props) => {
  const [stage, setStage] = useState();

  useEffect(() => {
    stageContainer();
  }, []);
  const func=()=>{
    props.addShape(10)
  }
  const stageContainer = () => {
    let stage = new Konva.Stage({
      container: "container",
      width: 800,
      height: 500,
      backgroundColor: "green",
    });
    setStage(stage);
  };
  const addShape = () => {
    console.log("clicked");
    let layer = new Konva.Layer();
    let group = new Konva.Group({
      draggable: true,
    });
    let rect1 = new Konva.Rect({
      x: 20,
      y: 20,
      width: 200,
      height: 300,
      fill: "grey",
      stroke: "brown",
      strokeWidth: 1,
    });
    group.add(rect1);

    let verticalLine = new Konva.Line({
      points: [10, 20, 10, 320],
      stroke: "green",
      strokeWidth: 12,
    });

    group.add(verticalLine);

    let horizontalLine = new Konva.Line({
      points: [20, 340, 220, 340],
      stroke: "green",
      strokeWidth: 2,
    });
    group.add(horizontalLine);

    layer.add(group);
    stage.add(layer);
    layer.draw();
  };
  return (
    <>
      <div id="container"></div>
      <Button onClick={func}>BTN</Button>
    </>
  );
};

export default Designer;
