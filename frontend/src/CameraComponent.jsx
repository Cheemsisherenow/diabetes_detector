import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const CameraComponent = ({ onPredictionUpdate }) => {
  const webcamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const lastSpokenLabelRef = useRef(null);
  const lastSpokenTimeRef = useRef(0);
  const detectionStartTimeRef = useRef(0);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  const captureAndPredict = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      try {
        const response = await fetch("http://localhost:8082/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageSrc }),
        });

        const data = await response.json();
        if (response.ok) {
          setPrediction(data);
          onPredictionUpdate(data); 

          const currentTime = Date.now();
          if (data.is_candy) {
            if (data.candy === lastSpokenLabelRef.current) {
              const elapsedDetectionTime =
                (currentTime - detectionStartTimeRef.current) / 1000;
              const timeSinceLastSpeech =
                (currentTime - lastSpokenTimeRef.current) / 1000;

              if (elapsedDetectionTime >= 2.0 && timeSinceLastSpeech >= 5.0) {
                const utterance = new SpeechSynthesisUtterance(
                  `Detected ${data.candy}`
                );
                window.speechSynthesis.speak(utterance);
                lastSpokenTimeRef.current = currentTime;
              }
            } else {
              lastSpokenLabelRef.current = data.candy;
              detectionStartTimeRef.current = currentTime;
            }
          } else {
            lastSpokenLabelRef.current = null;
          }
        } else {
          console.error("Server Error:", data.error);
        }
      } catch (err) {
        console.error("Network error connecting to Flask:", err);
      }
    }
  }, [onPredictionUpdate]);

  useEffect(() => {
    let intervalId;
    if (isCameraOn) {
      intervalId = setInterval(() => {
        captureAndPredict();
      }, 500);
    } else {
      setPrediction(null);
      onPredictionUpdate(null);
      lastSpokenLabelRef.current = null;
      window.speechSynthesis.cancel(); 
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCameraOn, captureAndPredict, onPredictionUpdate]);

  return (
    <div className="flex flex-col items-center gap-8">
      {isCameraOn ? (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          mirrored={true}
          className="h-[360px] w-[600px] bg-white/30 backdrop-blur-md shadow-lg p-2 rounded-lg"
        />
      ) : (
        <div className="h-[360px] w-[600px] flex items-center justify-center text-center bg-white/30 backdrop-blur-md shadow-lg rounded-lg">
          <p className="text-white text-center text-2xl">
            Turn on camera to identify candy nutritions
          </p>
        </div>
      )}

      {isCameraOn && prediction && (
        <div className="absolute top-6 left-6 px-4 py-2 rounded-md font-bold text-white shadow-md text-lg bg-black/40 backdrop-blur-sm">
          Pred: {prediction.candy} ({(prediction.confidence * 100).toFixed(1)}%)
        </div>
      )}

      <button
        className="py-2 px-2 rounded-full w-16 h-16 cursor-pointer flex items-center justify-center shadow-lg"
        onClick={() => setIsCameraOn(!isCameraOn)}
        style={{
          backgroundColor: isCameraOn ? "#ff4d4d" : "#4CAF50",
        }}
      >
        <img src="camera.svg" alt="Camera Toggle" className="w-8 h-8 invert" />
      </button>
    </div>
  );
};

export default CameraComponent;
