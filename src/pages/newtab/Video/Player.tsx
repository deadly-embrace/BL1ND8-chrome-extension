import { useContext } from "react";
import SocketContext from "./Context";

const Player = () => {
  const {
    name,
    callAccepted,
    userVideo,
    dateVideo,
    callEnded,
    stream,
    call,
    engageCall,
  } = useContext(SocketContext);
  return (
    <div>
      <div>
        {stream && (
          // background
          <div>
            {/* framing */}
            <div>
              <p>a:s:l</p>
              <video playsInline muted ref={userVideo} autoPlay className="" />
            </div>
          </div>
        )}
        {callAccepted && !callEnded && (
          // background
          <div>
            {/* framing */}
            <div>
              <p>a:s:l</p>
              <video playsInline ref={dateVideo} autoPlay className="" />
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div>
        <div>
          {callAccepted && !callEnded ? (
            <button onClick={leaveCall} className="">
              SKIP
            </button>
          ) : (
            <div>
              {/* this button needs to be incorporated into the randomization of a date
            (used to be an input fx
              onChange={(e) => setIdToCall(e.target.value)}
            */}
              <button onClick={() => callDate(idToCall)}>blind date</button>
            </div>
          )}
        </div>
        <div>
          {call.isReceivingCall && !callAccepted && (
            <div>
              <button className="" onClick={engageCall}>
                engage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Player;
