const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");
const weatherSection = document.getElementById("weatherSection");

searchBtn.addEventListener("click", function () {
    const city = cityInput.value.trim();
    if (city == "") {
        showError("Please enter a city name")
        return;
    }
    searchCity(city);
});

cityInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        searchBtn.click();
    }
});


async function searchCity(city) {
    showLoading();
    try {
        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoURL);
        if (!geoResponse.ok) {
            throw new Error("Unable to search location.")
        }
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(" City not found. please check the city name.");
        }
        const location = geoData.results[0];
        await getWeather(
            location.latitude,
            location.longitude,
            location.name,
            location.country
        );
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
};

async function getWeather(
    latitude,
    longitude,
    city,
    country
) {
    const weatherURL =
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
        `&forecast_days=7` +
        `&timezone=auto`;
    const response = await fetch(weatherURL);
    if (!response.ok) {
        throw new Error(
            "Unable to get weather data."
        );
    }
    const data = await response.json();
    displayCurrentWeather(
        data,
        city,
        country
    );
    displayHourlyWeather(data);
    displayDailyWeather(data);
}

function displayCurrentWeather(
    data,
    city,
    country
) {
    const current = data.current;
    document.getElementById("cityName").textContent =
        city;
    document.getElementById("countryName").textContent =
        country;
    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m) + "°";
    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature);
    document.getElementById("humidity").textContent =
        current.relative_humidity_2m;
    document.getElementById("windSpeed").textContent =
        Math.round(current.wind_speed_10m);
    document.getElementById("detailHumidity").textContent =
        current.relative_humidity_2m;
    document.getElementById("detailWind").textContent =
        Math.round(current.wind_speed_10m);
    document.getElementById("detailFeels").textContent =
        Math.round(current.apparent_temperature);
    document.getElementById("detailPressure").textContent =
        Math.round(current.surface_pressure);
    const weatherInfo =
        getWeatherInfo(current.weather_code);
    document.getElementById("currentIcon").textContent =
        weatherInfo.icon;
    document.getElementById("weatherDescription").textContent =
        weatherInfo.description;
    document.getElementById("sunrise").textContent =
        formatTime(data.daily.sunrise[0]);
    document.getElementById("sunset").textContent =
        formatTime(data.daily.sunset[0]);
    document.getElementById("currentDate").textContent =
        formatDate(current.time);
    weatherSection.classList.remove("d-none");
}

function displayHourlyWeather(data) {
    const hourlyContainer =
        document.getElementById("hourlyForecast");
    hourlyContainer.innerHTML = "";
    const times = data.hourly.time;
    const temperatures =
        data.hourly.temperature_2m;
    const weatherCodes =
        data.hourly.weather_code;
    const currentHour =
        data.current.time.slice(0, 13);
    let startIndex =
        times.findIndex(function (time) {
            return time.slice(0, 13) === currentHour;
        });
    if (startIndex === -1) {
        startIndex = 0;
    }
    for (
        let i = startIndex;
        i < startIndex + 12 && i < times.length;
        i++
    ) {
        const weatherInfo =
            getWeatherInfo(weatherCodes[i]);
        const hour =
            formatHour(times[i]);
        const temperature =
            Math.round(temperatures[i]);
        const card = document.createElement("div");
        card.className = "hour-card";
        card.innerHTML = `
            <small class="text-secondary">
                ${hour}
            </small>
            <div class="hour-icon">
                ${weatherInfo.icon}
            </div>
            <h5 class="fw-bold mb-1">
                ${temperature}°C
            </h5>
            <small class="text-secondary">
                ${weatherInfo.short}
            </small>
        `;
        hourlyContainer.appendChild(card);
    }
}

function displayDailyWeather(data) {
    const container =
        document.getElementById("dailyForecast");
    container.innerHTML = "";
    const dates =
        data.daily.time;
    const maxTemps =
        data.daily.temperature_2m_max;
    const minTemps =
        data.daily.temperature_2m_min;
    const weatherCodes =
        data.daily.weather_code;
    for (let i = 0; i < dates.length; i++) {
        const weatherInfo =
            getWeatherInfo(weatherCodes[i]);
        const dayName =
            getDayName(dates[i]);
        const max =
            Math.round(maxTemps[i]);
        const min =
            Math.round(minTemps[i]);
        const card =
            document.createElement("div");
        card.className =
            "forecast-card";
        card.innerHTML = `
            <div class="row align-items-center">
                <div class="col-4">
                    <strong>
                        ${i === 0 ? "Today" : dayName}
                    </strong>
                </div>
                <div class="col-2 text-center">
                    <span class="forecast-icon">
                        ${weatherInfo.icon}
                    </span>
                </div>
                <div class="col-3 text-center">
                    <small class="text-secondary">
                        ${weatherInfo.short}
                    </small>
                </div>
                <div class="col-3 text-end">
                    <strong>
                        ${max}°
                    </strong>
                    <span class="text-secondary">
                        / ${min}°
                    </span>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}

function getWeatherInfo(code) {
    const weather = {
        0: {
            icon: "☀️",
            description: "Clear Sky",
            short: "Clear"
        },
        1: {
            icon: "🌤️",
            description: "Mainly Clear",
            short: "Clear"
        },
        2: {
            icon: "⛅",
            description: "Partly Cloudy",
            short: "Cloudy"
        },
        3: {
            icon: "☁️",
            description: "Overcast",
            short: "Cloudy"
        },
        45: {
            icon: "🌫️",
            description: "Fog",
            short: "Fog"
        },
        48: {
            icon: "🌫️",
            description: "Depositing Rime Fog",
            short: "Fog"
        },
        51: {
            icon: "🌦️",
            description: "Light Drizzle",
            short: "Drizzle"
        },
        53: {
            icon: "🌦️",
            description: "Moderate Drizzle",
            short: "Drizzle"
        },
        55: {
            icon: "🌧️",
            description: "Heavy Drizzle",
            short: "Drizzle"
        },
        61: {
            icon: "🌧️",
            description: "Light Rain",
            short: "Rain"
        },
        63: {
            icon: "🌧️",
            description: "Moderate Rain",
            short: "Rain"
        },
        65: {
            icon: "🌧️",
            description: "Heavy Rain",
            short: "Rain"
        },
        71: {
            icon: "🌨️",
            description: "Light Snow",
            short: "Snow"
        },
        73: {
            icon: "🌨️",
            description: "Moderate Snow",
            short: "Snow"
        },
        75: {
            icon: "❄️",
            description: "Heavy Snow",
            short: "Snow"
        },
        80: {
            icon: "🌦️",
            description: "Light Rain Showers",
            short: "Showers"
        },
        81: {
            icon: "🌦️",
            description: "Moderate Rain Showers",
            short: "Showers"
        },
        82: {
            icon: "🌧️",
            description: "Violent Rain Showers",
            short: "Showers"
        },
        95: {
            icon: "⛈️",
            description: "Thunderstorm",
            short: "Storm"
        },
        96: {
            icon: "⛈️",
            description: "Thunderstorm With Hail",
            short: "Storm"
        },
        99: {
            icon: "⛈️",
            description: "Heavy Thunderstorm With Hail",
            short: "Storm"
        }
    };
    return weather[code] || {
        icon: "🌡️",
        description: "Unknown",
        short: "Unknown"
    };
}
function formatDate(dateString) {
    const date =
        new Date(dateString);
    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    );
}

function formatTime(dateString) {
    const date =
        new Date(dateString);
    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function formatHour(dateString) {
    const date =
        new Date(dateString);
    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric"
        }
    );
}

function getDayName(dateString) {
    const date =
        new Date(dateString + "T12:00:00");
    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long"
        }
    );
}

function showLoading() {
    loading.classList.remove("d-none");
    errorBox.classList.add("d-none");
}

function hideLoading() {
    loading.classList.add("d-none");
}

function showError(message) {
    errorMessage.textContent =
        message;
    errorBox.classList.remove("d-none");
    weatherSection.classList.add("d-none");
    hideLoading();
}

locationBtn.addEventListener(
    "click",
    function () {
        if (!navigator.geolocation) {
            showError(
                "Geolocation is not supported by your browser."
            );
            return;
        }
        showLoading();
        navigator.geolocation.getCurrentPosition(
            async function (position) {
                try {
                    const latitude =
                        position.coords.latitude;
                    const longitude =
                        position.coords.longitude;
                    const weatherURL =
                        `https://api.open-meteo.com/v1/forecast?` +
                        `latitude=${latitude}` +
                        `&longitude=${longitude}` +
                        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure` +
                        `&hourly=temperature_2m,weather_code` +
                        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
                        `&forecast_days=7` +
                        `&timezone=auto`;
                    const response =
                        await fetch(weatherURL);
                    const data =
                        await response.json();
                    displayCurrentWeather(
                        data,
                        "Your Location",
                        "Current Location"
                    );
                    displayHourlyWeather(data);
                    displayDailyWeather(data);
                } catch (error) {
                    showError(
                        "Unable to get weather for your location."
                    );
                } finally {
                    hideLoading();
                }
            },
            function () {
                showError(
                    "Location permission was denied."
                );
            }
        );
    }
);

searchCity("Lahore");
