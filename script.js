//  Replace with your OpenWeatherMap API Key
const API_KEY = "e66d5eaf0e183dd964d38f35cf15e602"; // <-- Put your API key here

//  Select DOM Elements
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const currentLocationBtn = document.getElementById("current-location-btn");
const currentWeatherDiv = document.getElementById("current-weather");
const forecastDiv = document.getElementById("forecast");
const errorMessage = document.getElementById("error-message");
const recentDropdown = document.getElementById("recent-dropdown");
const recentCitiesList = document.getElementById("recentCitiesList");

//  Event Listeners
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city === "") {
        showError("Please enter a city name!");
        return;
    }
    fetchWeatherData(city);
});

currentLocationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            () => {
                showError("Location access denied!");
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

//  Fetch Current Weather by City
async function getCurrentWeather(city) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("City not found");
    return await response.json();
}

//  Fetch 5-Day Forecast by City
async function getForecast(city) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("Forecast not available");
    return await response.json();
}

// Fetch Weather by Latitude & Longitude
async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error("Location weather not found");
        const data = await response.json();
        const city = data.name;
        fetchWeatherData(city);
    } catch (error) {
        showError(error.message);
    }
}

// Fetch Weather (Current + Forecast)
async function fetchWeatherData(city) {
    try {
        showError(""); // Clear old errors
        const currentData = await getCurrentWeather(city);
        const forecastData = await getForecast(city);

        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        saveRecentCity(city);
    } catch (error) {
        showError(error.message);
    }
}

//  Display Current Weather
function displayCurrentWeather(data) {
    const { name, main, wind, weather } = data;
    currentWeatherDiv.innerHTML = `
        <h3 class="text-primary">${name}</h3>
        <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}">
        <p><strong>Temperature:</strong> ${main.temp} °C</p>
        <p><strong>Humidity:</strong> ${main.humidity}%</p>
        <p><strong>Wind Speed:</strong> ${wind.speed} m/s</p>
        <p><strong>Condition:</strong> ${weather[0].description}</p>
    `;
}

//  Display 5-Day Forecast
function displayForecast(data) {
    forecastDiv.innerHTML = "";
    const dailyData = {};

    data.list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyData[date]) {
            dailyData[date] = item;
        }
    });

    Object.keys(dailyData).slice(0, 5).forEach((date) => {
        const item = dailyData[date];
        forecastDiv.innerHTML += `
            <div class="card col-md-2 col-sm-4 p-2">
                <h6>${date}</h6>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
                <p><strong>${item.main.temp} °C</strong></p>
                <p>💧 ${item.main.humidity}%</p>
                <p>💨 ${item.wind.speed} m/s</p>
            </div>
        `;
    });
}

//  Save Recent Cities in localStorage
function saveRecentCity(city) {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    if (!cities.includes(city)) {
        cities.unshift(city);
        if (cities.length > 5) cities.pop(); // Keep only 5 cities
        localStorage.setItem("recentCities", JSON.stringify(cities));
    }
    updateRecentDropdown();
}

//  Update Dropdown with Recent Cities
function updateRecentDropdown() {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    recentCitiesList.innerHTML = "";
    if (cities.length === 0) {
        recentDropdown.classList.add("d-none");
        return;
    }
    recentDropdown.classList.remove("d-none");
    cities.forEach((city) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item";
        a.textContent = city;
        a.href = "#";
        a.addEventListener("click", () => fetchWeatherData(city));
        li.appendChild(a);
        recentCitiesList.appendChild(li);
    });
}

//  Show Error Message
function showError(message) {
    if (!message) {
        errorMessage.classList.add("d-none");
        return;
    }
    errorMessage.textContent = message;
    errorMessage.classList.remove("d-none");
}

//  Initialize on Page Load (Loads Bangalore by Default)
document.addEventListener("DOMContentLoaded", () => {
    updateRecentDropdown();
    fetchWeatherData("Bangalore");
});
