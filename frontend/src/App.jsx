import { useState, useEffect } from "react";
import heroImg from "./assets/hero.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import "./App.css";
import CameraComponent from "./CameraComponent";
import axios from "axios";

const candy_nutrition_facts = {
  Snickers: {
    serving_size_g: 57,
    calories: 280,
    total_fat_g: 14.0,
    saturated_fat_g: 5.0,
    cholesterol_mg: 7,
    sodium_mg: 136,
    total_carbohydrates_g: 35.0,
    dietary_fiber_g: 1.0,
    total_sugars_g: 29.0,
    protein_g: 4.0,
  },
  Skittles: {
    serving_size_g: 61.5,
    calories: 250,
    total_fat_g: 2.5,
    saturated_fat_g: 2.5,
    cholesterol_mg: 0,
    sodium_mg: 10,
    total_carbohydrates_g: 56.0,
    dietary_fiber_g: 0.0,
    total_sugars_g: 45.0,
    protein_g: 0.0,
  },
  Twix: {
    serving_size_g: 57,
    calories: 286,
    total_fat_g: 14.2,
    saturated_fat_g: 10.8,
    cholesterol_mg: 0,
    sodium_mg: 113,
    total_carbohydrates_g: 36.9,
    dietary_fiber_g: 0.6,
    total_sugars_g: 27.5,
    protein_g: 2.8,
  },
};

function App() {
  const [array, setArray] = useState([]);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const fetchAPI = async () => {
    try {
      const response = await axios.get("http://localhost:8082/api/users");
      setArray(response.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  const toggleSpeechEngine = () => {
    if (!ttsEnabled) {
      window.speechSynthesis.cancel();
      const welcomeUtterance = new SpeechSynthesisUtterance(
        "Voice guidance enabled."
      );
      window.speechSynthesis.speak(welcomeUtterance);
      setTtsEnabled(true);
    } else {
      window.speechSynthesis.cancel();
      setTtsEnabled(false);
    }
  };

  const activeCandyName = currentPrediction?.candy;
  const nutrition = candy_nutrition_facts[activeCandyName];

  return (
    <>
      <section
        id="center"
        className="relative h-screen overflow-hidden bg-linear-to-b from-[#1f1522] to-[#9061a5] flex items-center justify-center"
      >
        <div className="absolute bg-white/30 backdrop-blur-md rounded-xl shadow-lg z-40 w-[67%] h-[65%] p-4 grid grid-cols-[60%_40%] gap-4">
          <CameraComponent onPredictionUpdate={setCurrentPrediction} />

          <div className="text-white h-full bg-white/30 backdrop-blur-md p-4 rounded-lg shadow-lg flex flex-col gap-3 overflow-y-auto">
            <div className="flex flex-col gap-2 border-b border-white/20 pb-2">
              <h2 className="text-xl font-bold">Identification Readout</h2>
              <button
                onClick={toggleSpeechEngine}
                className={`w-full py-1 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  ttsEnabled
                    ? " text-white"
                    : " text-white animate-pulse"
                }`}
              >
                {ttsEnabled
                  ? "Voice Guide Active"
                  : "Click to Enable Voice Guide"}
              </button>
            </div>

            {currentPrediction ? (
              <div className="flex flex-col gap-1 text-sm">
                <p className="text-base">
                  <span className="font-semibold text-purple-200">Item:</span>{" "}
                  {currentPrediction.candy}
                </p>
                <p>
                  <span className="font-semibold text-purple-200">
                    Confidence:
                  </span>{" "}
                  ({(currentPrediction.confidence * 100).toFixed(1)}%)
                </p>
                <p className="border-b border-white/10 pb-2">
                  <span className="font-semibold text-purple-200">Status:</span>{" "}
                  {currentPrediction.is_candy
                    ? "Candy Detected"
                    : "Unknown Target"}
                </p>

                {nutrition ? (
                  <div className="mt-2 bg-black/20 p-2 rounded-md flex flex-col gap-1 text-xs">
                    <p className="font-bold border-b border-white/20 pb-1 text-center text-purple-200 uppercase tracking-wide">
                      Nutrition Profile
                    </p>
                    <p>
                      <span className="text-white/70">Serving Size:</span>{" "}
                      <span className="font-mono float-right">
                        {nutrition.serving_size_g}g
                      </span>
                    </p>
                    <p>
                      <span className="text-white/70">Calories:</span>{" "}
                      <span className="font-mono float-right font-bold text-yellow-300">
                        {nutrition.calories}
                      </span>
                    </p>
                    <p>
                      <span className="text-white/70">Total Fat:</span>{" "}
                      <span className="font-mono float-right">
                        {nutrition.total_fat_g}g
                      </span>
                    </p>
                    <p>
                      <span className="text-white/70">Saturated Fat:</span>{" "}
                      <span className="font-mono float-right">
                        {nutrition.saturated_fat_g}g
                      </span>
                    </p>
                    <p>
                      <span className="text-white/70">Sodium:</span>{" "}
                      <span className="font-mono float-right">
                        {nutrition.sodium_mg}mg
                      </span>
                    </p>
                    <p>
                      <span className="text-white/70">Total Carbs:</span>{" "}
                      <span className="font-mono float-right">
                        {nutrition.total_carbohydrates_g}g
                      </span>
                    </p>
                    <p>
                      <span className="text-white/70">Total Sugars:</span>{" "}
                      <span className="font-mono float-right text-red-300">
                        {nutrition.total_sugars_g}g
                      </span>
                    </p>
                    <p>
                      <span className="text-white/70">Protein:</span>{" "}
                      <span className="font-mono float-right">
                        {nutrition.protein_g}g
                      </span>
                    </p>
                  </div>
                ) : (
                  currentPrediction.is_candy && (
                    <p className="text-white/50 italic text-xs mt-2 text-center">
                      No matching nutrition profile mapped for this item.
                    </p>
                  )
                )}
              </div>
            ) : (
              <p className="text-white/70 italic text-center my-auto">
                Awaiting camera stream initialization...
              </p>
            )}
          </div>
        </div>

        <div className="absolute text-white text-7xl top-0 translate-y-1/2 w-full text-center px-4 font-bold tracking-tight">
          Candy Nutrition Tracker for the Blind
        </div>

        <p className="absolute bottom-4 left-4 text-white/50 z-50">
          {array.map((user, index) => (
            <span key={index} className="mr-2">
              {" "}
              {user}{" "}
            </span>
          ))}
        </p>

        <div className="absolute h-256 w-256 bottom-0 translate-y-1/2 overflow-hidden pointer-events-none">
          <img
            src="moon.png"
            className="absolute h-270 w-256 z-10 left-1/2 -translate-x-1/2"
            alt="Moon graphics background"
          />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-148 w-145 rounded-full bg-transparent shadow-[0_0_40px_rgba(255,255,255,2)]" />
        </div>
      </section>
    </>
  );
}

export default App;
