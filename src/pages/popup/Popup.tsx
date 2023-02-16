import React from "react";
import "@pages/popup/Popup.css";
import logo from "@assets/img/logo.svg";
// import logo from "@assets/img/logo.svg";
const Popup = () => {
  return (
    <div className="App">
      <header className="App-header">
        <div className="App-top">
          <img className="logo" src={logo}></img>
          <div className="username">Munchkin</div>
          <div className="location">NY, NY</div>
        </div>
        <img
          src="https://images.wallpaperscraft.com/image/single/cat_kitten_glance_177552_1600x900.jpg"
          className="App-logo"
          alt="logo"
        />
        <p>See your match in {30} seconds!</p>
        <button>Skip</button>
        <button>Reveal</button>
      </header>
    </div>
  );
};

export default Popup;
