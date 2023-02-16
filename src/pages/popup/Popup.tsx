import React from "react";
import "@pages/popup/Popup.css";
import logo from "@assets/img/logo.svg";
import SkipButton from "@pages/popup/SkipButton.js";

const Popup = () => {
  return (
    <div className="App">
      <header className="App-header">
        <div className="App-top">
          <div className="username">Munchkin</div>
          <img className="logo" src={logo}></img>
          <div className="location">NY, NY</div>
        </div>
        {/* <img
          className="App-video"
          src="https://images.wallpaperscraft.com/image/single/cat_kitten_glance_177552_1600x900.jpg"
          alt="logo"
        /> */}
        <div>See your match in {30} seconds!</div>
        <button>Skip</button>
        <button>Reveal</button>
      </header>
    </div>
  );
};

export default Popup;
