import React from "react";
import "./Menu.css";
import Button from "../Buttons/Button";

const Menu = (props) => {
  const addShape = ()=>{
    props.addShape()
  }
  return (
    <>
      <div className="wd-menu">
        <h3>Menu Bar</h3>
        <div>
          <Button onClick={addShape}>Add 1st Window</Button>
        </div>
      </div>
    </>
  );
};

export default Menu;
