import React, { useEffect, useState } from "react";
import Konva from "konva";
import Header from "./components/header/Header";
import Menu from "./components/SideBar/Menu";
import "./App.css";

function App() {
  const [stage, setStage] = useState();
  useEffect(() => {
    stageContainer();
  }, []);

  let frameHeight = 200;
  let frameWidth = 150;

  let GUIDELINE_OFFSET = 5;
  let layer = new Konva.Layer();
  // were can we snap our objects?
  function getLineGuideStops(skipShape) {
    let vertical = [0, stage.width() / 2, stage.width()];
    let horizontal = [0, stage.height() / 2, stage.height()];
    layer.find(".fillLine").forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      let box = guideItem.getClientRect();
      console.log("guideItem", box);

      // and we can snap to all edges of shapes
      vertical.push([box.x, box.x + box.width, box.x + box.width / 2]);
      horizontal.push([box.y, box.y + box.height, box.y + box.height / 2]);
    });
    return {
      vertical: vertical.flat(),
      horizontal: horizontal.flat(),
    };
  }
  function getObjectSnappingEdges(node) {
    let box = node.getClientRect();
    let absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: "start",
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: "end",
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: "start",
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snap: "center",
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: "end",
        },
      ],
    };
  }

  // find all snapping possibilities
  function getGuides(lineGuideStops, itemBounds) {
    let resultV = [];
    let resultH = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        let diff = Math.abs(lineGuide - itemBound.guide);
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        let diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    let guides = [];

    // find closest snap
    let minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    let minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: "V",
        snap: minV.snap,
      });
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: "H",
        snap: minH.snap,
      });
    }
    return guides;
  }

  function drawGuides(guides) {
    guides.forEach((lg) => {
      if (lg.orientation === "H") {
        let line = new Konva.Line({
          points: [-6000, 0, 6000, 0],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guid-line",
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: 0,
          y: lg.lineGuide,
        });
      } else if (lg.orientation === "V") {
        let line = new Konva.Line({
          points: [0, -6000, 0, 6000],
          stroke: "rgb(0, 161, 255)",
          strokeWidth: 1,
          name: "guid-line",
          dash: [4, 6],
        });
        layer.add(line);
        line.absolutePosition({
          x: lg.lineGuide,
          y: 0,
        });
      }
    });
  }
  // layer.on('dragmove', function (e) {

  // });

  // function haveIntersection(r1, r2) {
  //   return !(
  //     r2.x > r1.x + r1.width ||
  //     r2.x + r2.width < r1.x ||
  //     r2.y > r1.y + r1.height ||
  //     r2.y + r2.height < r1.y
  //   );
  // }
  layer.on("dragmove", function (e) {
    // let target = e.target;
    // let targetRect = e.target.getClientRect();
    // layer.children.forEach(function (group) {
    //   // do not check intersection with itself
    //   if (group === target) {
    //     return;
    //   }
    //   if (haveIntersection(group.getClientRect(), targetRect)) {
    //     layer.findOne(".fillLine").fill("red");
    //   } else {
    //     layer.findOne(".fillLine").fill("lightblue");
    //   }
    // });
    // clear all previous lines on the screen
    layer.find(".guid-line").forEach((l) => l.destroy());

    // find possible snapping lines
    let lineGuideStops = getLineGuideStops(e.target);
    // find snapping points of current object
    let itemBounds = getObjectSnappingEdges(e.target);

    // now find where can we snap current object
    let guides = getGuides(lineGuideStops, itemBounds);

    // do nothing of no snapping
    if (!guides.length) {
      return;
    }

    drawGuides(guides);

    let absPos = e.target.absolutePosition();
    // now force object position
    guides.forEach((lg) => {
      switch (lg.snap) {
        case "start": {
          switch (lg.orientation) {
            case "V": {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case "H": {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
            default: {
              break;
            }
          }
          break;
        }
        case "center": {
          switch (lg.orientation) {
            case "V": {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case "H": {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
            default: {
              break;
            }
          }
          break;
        }
        case "end": {
          switch (lg.orientation) {
            case "V": {
              absPos.x = lg.lineGuide + lg.offset;
              break;
            }
            case "H": {
              absPos.y = lg.lineGuide + lg.offset;
              break;
            }
            default: {
              break;
            }
          }
          break;
        }
        default: {
          break;
        }
      }
    });
    e.target.absolutePosition(absPos);
  });

  layer.on("dragend", function (e) {
    // console.log("me call ho rha hon");
    layer.find(".guid-line").forEach((l) => l.destroy());
  });

  function createInfo(frameWidth, frameHeight) {
    let offset = 20;

    let arrowOffset = offset / 2;
    let arrowSize = 5;

    let group = new Konva.Group();
    let lines = new Konva.Shape({
      sceneFunc: function (ctx) {
        ctx.fillStyle = "grey";
        ctx.lineWidth = 0.5;
        ctx.moveTo(0, 0);
        ctx.lineTo(-offset, 0);

        ctx.moveTo(0, frameHeight);
        ctx.lineTo(-offset, frameHeight);

        ctx.moveTo(0, frameHeight);
        ctx.lineTo(0, frameHeight + offset);

        ctx.moveTo(frameWidth, frameHeight);
        ctx.lineTo(frameWidth, frameHeight + offset);

        ctx.stroke();
      },
    });

    let leftArrow = new Konva.Shape({
      sceneFunc: function (ctx) {
        // top pointer
        ctx.moveTo(-arrowOffset - arrowSize, arrowSize);
        ctx.lineTo(-arrowOffset, 0);
        ctx.lineTo(-arrowOffset + arrowSize, arrowSize);

        // line
        ctx.moveTo(-arrowOffset, 0);
        ctx.lineTo(-arrowOffset, frameHeight);
        console.log("frame height",frameHeight);
        // bottom pointer
        ctx.moveTo(-arrowOffset - arrowSize, frameHeight - arrowSize);
        ctx.lineTo(-arrowOffset, frameHeight);
        ctx.lineTo(-arrowOffset + arrowSize, frameHeight - arrowSize);

        ctx.strokeShape(this);
      },
      stroke: "grey",
      strokeWidth: 0.5,
    });

    let bottomArrow = new Konva.Shape({
      sceneFunc: function (ctx) {
        // top pointer
        ctx.translate(0, frameHeight + arrowOffset);
        ctx.moveTo(arrowSize, -arrowSize);
        ctx.lineTo(0, 0);
        ctx.lineTo(arrowSize, arrowSize);

        // line
        ctx.moveTo(0, 0);
        ctx.lineTo(frameWidth, 0);

        // bottom pointer
        ctx.moveTo(frameWidth - arrowSize, -arrowSize);
        ctx.lineTo(frameWidth, 0);
        ctx.lineTo(frameWidth - arrowSize, arrowSize);

        ctx.strokeShape(this);
      },
      stroke: "grey",
      strokeWidth: 0.5,
    });

    // left text
    let leftLabel = new Konva.Label();

    leftLabel.add(
      new Konva.Tag({
        fill: "white",
        stroke: "grey",
      })
    );
    let leftText = new Konva.Text({
      text: 400 + "mm",
      padding: 2,
      fill: "black",
    });

    leftLabel.add(leftText);
    leftLabel.position({
      x: -arrowOffset - leftText.width(),
      y: frameHeight / 2 - leftText.height() / 2,
    });
    // bottom text
    let bottomLabel = new Konva.Label();

    bottomLabel.add(
      new Konva.Tag({
        fill: "white",
        stroke: "grey",
      })
    );
    let bottomText = new Konva.Text({
      text: 250 + "mm",
      padding: 2,
      fill: "black",
    });

    bottomLabel.add(bottomText);
    bottomLabel.position({
      x: frameWidth / 2 - bottomText.width() / 2,
      y: frameHeight + arrowOffset,
    });

    // group.add(lines, leftArrow, bottomArrow);
    console.log("done")
    return group;
  }

  const createFrame = (frameWidth, frameHeight) => {
    let padding = 10;
    let group = new Konva.Group({
      resizeable:true,
      name: "fillLine",
      draggable:true
    });
    let top = new Konva.Line({
      points: [
        0,
        0,
        frameWidth,
        0,
        frameWidth - padding,
        padding,
        padding,
        padding,
      ],
      fill: "white",
    });

    let left = new Konva.Line({
      points: [
        0,
        0,
        padding,
        padding,
        padding,
        frameHeight - padding,
        0,
        frameHeight,
      ],
      fill: "white",
    });

    let bottom = new Konva.Line({
      points: [
        0,
        frameHeight,
        padding,
        frameHeight - padding,
        frameWidth - padding,
        frameHeight - padding,
        frameWidth,
        frameHeight,
      ],
      fill: "white",
    });

    let right = new Konva.Line({
      points: [
        frameWidth,
        0,
        frameWidth,
        frameHeight,
        frameWidth - padding,
        frameHeight - padding,
        frameWidth - padding,
        padding,
      ],
      fill: "white",
    });

    let glass = new Konva.Rect({
      x: padding,
      y: padding,
      width: frameWidth - padding * 2,
      height: frameHeight - padding * 2,
      fill: "lightblue",
    });
    group.add(glass, top, bottom, left, right);

    let MAX_WIDTH = 200;
    // create new transformer
    let tr = new Konva.Transformer({
      boundBoxFunc: function (oldBoundBox, newBoundBox) {
        if (Math.abs(newBoundBox.width) > MAX_WIDTH) {
          return oldBoundBox;
        }

        return newBoundBox;
      },
    });
    layer.add(tr);
    // tr.nodes([glass]);
    group.find("Line").forEach((line) => {
      line.closed(true);
      line.stroke("black");
      line.strokeWidth(1);
    });

    return group;
  };

  const stageContainer = () => {
    let stage = new Konva.Stage({
      container: "container",
      width: 780,
      height: 454,
    });
    setStage(stage);
  };
  const addShape = () => {
    let group = new Konva.Group({
      draggable: true,
    });
    let frameline = createFrame(frameWidth, frameHeight);

    let wr = stage.width() / 250;
    let hr = stage.height() / 400;
    let ratio = Math.min(wr, hr) * 0.8;

    let frameOnScreenWidth = frameWidth * ratio;
    let frameOnScreenHeight = frameHeight * ratio;
    let infoGroup = createInfo(frameOnScreenWidth, frameOnScreenHeight);
    group.add(infoGroup);
    group.add(frameline);
    layer.add(group);
    stage.add(layer);
    layer.draw();
  };
  window.stage = stage;
  return (
    <div className="app">
      <Header />
      <Menu addShape={addShape} />
      <div className="container-div">
        <div id="container"></div>
      </div>
    </div>
  );
}

export default App;
