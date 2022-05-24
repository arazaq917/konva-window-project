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

  var GUIDELINE_OFFSET = 5;
  var layer = new Konva.Layer();
  // were can we snap our objects?
  function getLineGuideStops(skipShape) {
    var vertical = [0, stage.width() / 2, stage.width()];
    var horizontal = [0, stage.height() / 2, stage.height()];
    layer.find(".fillLine").forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      var box = guideItem.getClientRect();
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
    var box = node.getClientRect();
    var absPos = node.absolutePosition();

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
    var resultV = [];
    var resultH = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        var diff = Math.abs(lineGuide - itemBound.guide);
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
        var diff = Math.abs(lineGuide - itemBound.guide);
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

    var guides = [];

    // find closest snap
    var minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    var minH = resultH.sort((a, b) => a.diff - b.diff)[0];
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

  function haveIntersection(r1, r2) {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }
  layer.on("dragmove", function (e) {
    var target = e.target;
    var targetRect = e.target.getClientRect();
    layer.children.forEach(function (group) {
      // do not check intersection with itself
      if (group === target) {
        return;
      }
      if (haveIntersection(group.getClientRect(), targetRect)) {
        layer.findOne(".fillLine").fill("red");
      } else {
        layer.findOne(".fillLine").fill("lightblue");
      }
    });
    // clear all previous lines on the screen
    layer.find(".guid-line").forEach((l) => l.destroy());

    // find possible snapping lines
    var lineGuideStops = getLineGuideStops(e.target);
    // find snapping points of current object
    var itemBounds = getObjectSnappingEdges(e.target);

    // now find where can we snap current object
    var guides = getGuides(lineGuideStops, itemBounds);

    // do nothing of no snapping
    if (!guides.length) {
      return;
    }

    drawGuides(guides);

    var absPos = e.target.absolutePosition();
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
    var offset = 20;

    var arrowOffset = offset / 2;
    var arrowSize = 5;

    var group = new Konva.Group();
    var lines = new Konva.Shape({
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

    var leftArrow = new Konva.Shape({
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

    var bottomArrow = new Konva.Shape({
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
    var leftLabel = new Konva.Label();

    leftLabel.add(
      new Konva.Tag({
        fill: "white",
        stroke: "grey",
      })
    );
    var leftText = new Konva.Text({
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
    var bottomLabel = new Konva.Label();

    bottomLabel.add(
      new Konva.Tag({
        fill: "white",
        stroke: "grey",
      })
    );
    var bottomText = new Konva.Text({
      text: 250 + "mm",
      padding: 2,
      fill: "black",
    });

    bottomLabel.add(bottomText);
    bottomLabel.position({
      x: frameWidth / 2 - bottomText.width() / 2,
      y: frameHeight + arrowOffset,
    });

    group.add(lines, leftArrow, bottomArrow);

    return group;
  }

  const createFrame = (frameWidth, frameHeight) => {
    var padding = 10;
    var group = new Konva.Group();
    var top = new Konva.Line({
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
      name: "fillLine",
    });

    var left = new Konva.Line({
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
      name: "fillLine",
    });

    var bottom = new Konva.Line({
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
      name: "fillLine",
    });

    var right = new Konva.Line({
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
      name: "fillLine",
    });

    let glass = new Konva.Rect({
      x: padding,
      y: padding,
      width: frameWidth - padding * 2,
      height: frameHeight - padding * 2,
      fill: "lightblue",
    });
    group.add(glass, top, bottom, left, right);

    var MAX_WIDTH = 200;
    // create new transformer
    var tr = new Konva.Transformer({
      boundBoxFunc: function (oldBoundBox, newBoundBox) {
        if (Math.abs(newBoundBox.width) > MAX_WIDTH) {
          return oldBoundBox;
        }

        return newBoundBox;
      },
    });
    layer.add(tr);
    tr.nodes([glass]);
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

    var wr = stage.width() / 250;
    var hr = stage.height() / 400;
    var ratio = Math.min(wr, hr) * 0.8;

    var frameOnScreenWidth = frameWidth * ratio;
    var frameOnScreenHeight = frameHeight * ratio;
    var infoGroup = createInfo(frameOnScreenWidth, frameOnScreenHeight);
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
