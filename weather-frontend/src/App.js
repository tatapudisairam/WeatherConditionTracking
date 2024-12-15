import React, { useState } from "react";
import './App.css';

const App = () => {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [todayPrediction, setTodayPrediction] = useState("");

  const API_KEY = "968ad833ef4f018483413a2257fcd48a";
  const backend_url = "https://web-production-19c1.up.railway.app/predict";

  const kelvinToCelsius = (kelvin) => (kelvin - 273.15).toFixed(2);
  const mpsToKph = (mps) => (mps * 3.6).toFixed(2);
  const hpaToKpa = (hpa) => (hpa / 10).toFixed(2);

  const createWeatherCard = (weatherItem, index) => {
    return (
      <div className="card" key={index}>
        <h3>{weatherItem.dt_txt.split(" ")[0]}</h3>
        <img
          src={`https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png`}
          alt="weather-icon"
        />
        <div className="card-info">
          <h4>Temp: {kelvinToCelsius(weatherItem.main.temp)} °C</h4>
          <h4>Wind: {mpsToKph(weatherItem.wind.speed)} kph</h4>
          <h4>Humidity: {weatherItem.main.humidity}%</h4>
          <h4>Pressure: {hpaToKpa(weatherItem.main.pressure)} kPa</h4>
          {predictions[index] && (
            <h4 style={{ color: 'green', backgroundColor:'yellow', display: 'inline' }}>Predicted Condition: {predictions[index]}</h4>
          )}
        </div>
      </div>
    );
  };

  const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
      .then((res) => res.json())
      .then((data) => {
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter((forecast) => {
          const forecastDate = new Date(forecast.dt_txt).getDate();
          if (!uniqueForecastDays.includes(forecastDate)) {
            uniqueForecastDays.push(forecastDate);
            return true;
          }
          return false;
        });

        setWeatherData({
          cityName,
          weather: fiveDaysForecast[0],
        });

        setForecastData(fiveDaysForecast.slice(1));

        getPredictionForToday(fiveDaysForecast[0]);

        getPredictionsForAllDays(fiveDaysForecast.slice(1));
      })
      .catch(() => {
        alert("An error occurred while fetching the weather forecast!");
      });
  };

  const getPredictionForToday = (weather) => {
    const predictionData = {
      Temp_C: kelvinToCelsius(weather.main.temp),
      Rel_Hum: weather.main.humidity,
      Wind_Speed_km_h: mpsToKph(weather.wind.speed),
      Press_kPa: hpaToKpa(weather.main.pressure),
    };

    fetch(backend_url, { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(predictionData),
    })
      .then((res) => res.json())
      .then((data) => setTodayPrediction(data.prediction))
      .catch((error) => console.error("Error fetching prediction for today:", error));
  };

  const getPredictionsForAllDays = (forecastData) => {
    const predictionPromises = forecastData.map((weather) => {
      return getPrediction(weather);
    });

    Promise.all(predictionPromises).then((results) => {
      setPredictions(results);
    });
  };

  const getPrediction = (weather) => {
    const predictionData = {
      Temp_C: kelvinToCelsius(weather.main.temp),
      Rel_Hum: weather.main.humidity,
      Wind_Speed_km_h: mpsToKph(weather.wind.speed),
      Press_kPa: hpaToKpa(weather.main.pressure),
    };

    return fetch(backend_url, { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(predictionData),
    })
      .then((res) => res.json())
      .then((data) => data.prediction)
      .catch((error) => console.error("Error fetching prediction:", error));
  };

  const getCityCoordinates = () => {
    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;

    fetch(GEOCODING_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!data.length) return alert("No coordinates found for " + city);
        const { lat, lon } = data[0];
        getWeatherDetails(city, lat, lon);
      })
      .catch(() => {
        alert("An error occurred while fetching the coordinates!");
      });
  };

  const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
        fetch(REVERSE_GEOCODING_URL)
          .then((res) => res.json())
          .then((data) => {
            const { name } = data[0];
            getWeatherDetails(name, latitude, longitude);
          })
          .catch(() => {
            alert("An error occurred while fetching the city!");
          });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert(
            "Geolocation request denied. Please reset location permission to grant access again."
          );
        }
      }
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      getCityCoordinates();
    }
  };

  return (
    <div className="App">
      <h1>Weather Conditions and Forecasts Across Cities</h1>
      <div className="main-content">
        <div className="left-section">
          {weatherData && (
            <div className="current-weather">
              <h2>{weatherData.cityName}</h2>
              <div className="current-info">
                <div className="info-left">
                  <h4>Temperature: {kelvinToCelsius(weatherData.weather.main.temp)} °C</h4>
                  <h4>Wind: {mpsToKph(weatherData.weather.wind.speed)} kph</h4>
                  <h4>Humidity: {weatherData.weather.main.humidity}%</h4>
                  <h4>Pressure: {hpaToKpa(weatherData.weather.main.pressure)} kPa</h4>
                  {todayPrediction && <h4 style={{ color: 'green', background:'yellow', display:'inline' }}>Predicted Condition: {todayPrediction}</h4>}
                </div>
                <div className="info-right">
                  <img
                    src={`https://openweathermap.org/img/wn/${weatherData.weather.weather[0].icon}@4x.png`}
                    alt="weather-icon"
                  />
                </div>
              </div>
            </div>
          )}

          {forecastData && (
            <div className="forecast-section">
              <h2>5-Day Forecast</h2>
              <div className="forecast-cards">
                {forecastData.map((weatherItem, index) => createWeatherCard(weatherItem, index))}
              </div>
            </div>
          )}
        </div>

        <div className="right-section">
          <div className="weather-input">
            <div className="input-container">
              <input
                type="text"
                placeholder="E.g. Tokyo, Berlin, Helsinki"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button onClick={getCityCoordinates}>Search</button>
            </div>
            <div className="or-separator">or</div>
            <button className="location-btn" onClick={getUserCoordinates}>
              Use Current Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
