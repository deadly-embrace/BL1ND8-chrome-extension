import React, { useState, useEffect, useMemo, useRef } from "react";
import "@pages/popup/Popup.css";
import logo from "@assets/img/logo.svg";
import SkipButton from "@pages/popup/SkipButton.js";
import RevealButton from "@pages/popup/RevealButton.js";
import { MantineProvider, Text } from "@mantine/core";
import { Progress } from "@mantine/core";
import Timer from "@pages/popup/Timer.js";

const Popup = () => {
  const [time, setTime] = useState(0);
  // // const [timer, setTimer] = useState({ time: 0 });
  useEffect(() => {
    new Timer(30, setTime);
  }, []);

  useMemo(() => {
    if (time >= 30) document.querySelector('#reveal-button').className="App-buttons";
    if (time >= 15) document.querySelector('#skip-button').className="App-buttons";
  }, [time]);

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <div className="App">
        <header className="App-header">
          <div className="App-top">
            <div className="username">Munchkin</div>
            <img className="logo" src={logo}></img>
            <div className="location">NY, NY</div>
          </div>
          <img
            className="App-video"
            src="https://images.wallpaperscraft.com/image/single/cat_kitten_glance_177552_1600x900.jpg"
            alt="logo"
          />
          <div>See your match in {30} seconds!</div>
          <Progress className="App-progress" color="pink" radius="xl" size="xl" value={time * (100 / 30)} />
          <button id="reveal-button" className="App-buttons-off">Reveal</button>
          <button id="skip-button" className="App-buttons-off">Skip</button>
        </header>
      </div>
    </MantineProvider>
  );
};

export default Popup;
