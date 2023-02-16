import React, { useState, useEffect, useMemo, useRef } from "react";
import 'react-loading-skeleton/dist/skeleton.css'
import "@pages/popup/Popup.css";
import logo from "@assets/img/logo.svg";
import SkipButton from "@pages/popup/SkipButton.js";
import RevealButton from "@pages/popup/RevealButton.js";
import { MantineProvider, Text } from "@mantine/core";
import { Progress } from "@mantine/core";
import Timer from "@pages/popup/Timer.js";
import Skeleton from 'react-loading-skeleton';

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

const makeHearts = () => {
  let delay = 0;
  return new Array(20).fill(0).map(() => {
    const tilt = Math.random() * 360;
    delay += 100;
    return (
      <div className="heart" style={{'transform': `rotate(${tilt}deg`, 'animationDelay': `${delay}ms`, 'opacity': '0.05'}}></div>
    );
  });
};

const Popup = () => {
  const [timer, setTimer] = useState({ time: 0, id: 0 });
  const [stream, changeStream] = useState({
    name: null,
    location: null,
    source: null,
  });
  const [reset, resetComponent] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [canReveal, setCanReveal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    timer.time = 0;
    clearInterval(timer.id);
    changeStream(getSource());
    new Timer(30, setTimer);
    document.querySelector('#reveal-button').className="App-buttons-off"
    document.querySelector('#skip-button').className="App-buttons-off"
    setCanSkip(false);
    setCanReveal(false);
    setIsRevealed(false);
  }, [reset]);

  useMemo(() => {
    if (timer.time >= 30) {
      document.querySelector('#reveal-button').className="App-buttons"
      setCanReveal(true);
    };
    if (timer.time >= 15) {
      document.querySelector('#skip-button').className="App-buttons";
      setCanSkip(true);
    }
  }, [timer.time]);

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <div className="App">
        <header className="App-header">
          <div className="App-top">
            <div className="username">"{stream.name}"</div>
            <img className="logo" src={logo}></img>
            <div className="location">{stream.location}</div>
          </div>
          {isRevealed && makeHearts()}
          {!isRevealed && <div className="glass"></div>}
          <img
            className="App-video"
            src = {stream?.source}
            alt="logo"
          />
          {isRevealed && <div>Is it love at first sight?</div> || (!canReveal && <div>See your match in {timer.time >= 0 ? 30 - timer.time : 0} seconds!</div> || <div>Reveal your match! Is love truly blind?</div>)}
          <Progress className="App-progress" color="pink" radius="xl" size="xl" value={timer.time * (100 / 30)} />
          <button onClick={() => {if (canReveal) {
            setIsRevealed(true);
            document.querySelector('#reveal-button').className = "App-buttons-off";
          }
          }
          } id="reveal-button" className="App-buttons-off">Reveal</button>
          <button onClick={() => canSkip && resetComponent(!reset)} id="skip-button" className="App-buttons-off">Skip</button>
        </header>
      </div>
    </MantineProvider>
  );
};

export default Popup;
