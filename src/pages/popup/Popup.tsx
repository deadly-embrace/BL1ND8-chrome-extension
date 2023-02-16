import React, { useState, useEffect, useMemo, useRef } from "react";
import "@pages/popup/Popup.css";
import logo from "@assets/img/logo.svg";
import SkipButton from "@pages/popup/SkipButton.js";
import RevealButton from "@pages/popup/RevealButton.js";
import { MantineProvider, Text } from "@mantine/core";
import { Progress } from "@mantine/core";
import Timer from "@pages/popup/Timer.js";

const source1 = {
  name: 'Bebop',
  location: 'NY, NY',
  source: "https://images.wallpaperscraft.com/image/single/cat_kitten_glance_177552_1600x900.jpg"
};

const source2 = {
  name: 'Munchkin',
  location: 'LV, NV',
  source: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Welchcorgipembroke.JPG/1200px-Welchcorgipembroke.JPG"
};
const sourceQueue = [source1, source2];

const getSource = () => {
  return sourceQueue.shift();
};

const Popup = () => {
  const [time, setTime] = useState(0);
  const [stream, changeStream] = useState({});
  // // const [timer, setTimer] = useState({ time: 0 });
  useEffect(() => {
    new Timer(30, setTime);
    changeStream(getSource());
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
            <div className="username">{stream.name}</div>
            <img className="logo" src={logo}></img>
            <div className="location">{stream.location}</div>
          </div>
          <img
            className="App-video"
            src = {stream.source}
            alt="logo"
          />
          <div>See your match in {30} seconds!</div>
          <Progress className="App-progress" color="pink" radius="xl" size="xl" value={time * (100 / 30)} />
          <button id="reveal-button" className="App-buttons-off">Reveal</button>
          <button onClick={() => changeStream(getSource())} id="skip-button" className="App-buttons-off">Skip</button>
        </header>
      </div>
    </MantineProvider>
  );
};

export default Popup;
