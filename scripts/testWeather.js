#!/usr/bin/env bun
const axios = require("axios");

// API configuration
const LAT = 59.437; // Latitude for Tallinn, Estonia
const LON = 24.7535; // Longitude for Tallinn, Estonia
const URL = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${"AIzaSyDQ5QQyp8GAxYD8gg31dXUXOi24A8TjcwA"}&location.latitude=${LAT}&location.longitude=${LON}`;

// Test function for Google Weather API
async function testGoogleWeatherAPI() {
  try {
    // Send GET request with a 10-second timeout
    const response = await axios.get(URL, { timeout: 10000 });

    // Check if the response status is 200 (OK)
    if (response.status !== 200) {
      console.log(
        `❌ Test Failed: Status ${response.status} - ${response.statusText}`,
      );
      return;
    }

    const data = response.data;

    // Check if forecastDays is present and is an array with at least one element
    if (
      !data.forecastDays ||
      !Array.isArray(data.forecastDays) ||
      data.forecastDays.length === 0
    ) {
      console.log("❌ Test Failed: forecastDays is missing or empty");
      return;
    }

    const todayForecast = data.forecastDays[0];

    // Check if required fields are present based on the actual API structure
    const hasDate = todayForecast.displayDate;
    const hasTemperature =
      todayForecast.maxTemperature || todayForecast.minTemperature;
    const hasDaytimeCondition = todayForecast.daytimeForecast?.weatherCondition;
    const hasNighttimeCondition =
      todayForecast.nighttimeForecast?.weatherCondition;

    if (
      !hasDate ||
      !hasTemperature ||
      (!hasDaytimeCondition && !hasNighttimeCondition)
    ) {
      console.log("❌ Test Failed: Missing required weather data fields");
      return;
    }

    // Log success and display today's weather data
    console.log("✅ Test Passed: Google Weather API is working correctly");
    console.log(`\nToday's Weather in Tallinn, EE:`);

    // Display date
    const date = todayForecast.displayDate;
    console.log(
      `Date: ${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`,
    );

    // Display temperature range
    if (todayForecast.maxTemperature && todayForecast.minTemperature) {
      console.log(
        `Temperature: High ${todayForecast.maxTemperature.degrees}°${todayForecast.maxTemperature.unit === "CELSIUS" ? "C" : "F"}, Low ${todayForecast.minTemperature.degrees}°${todayForecast.minTemperature.unit === "CELSIUS" ? "C" : "F"}`,
      );
    }

    // Display feels like temperature
    if (
      todayForecast.feelsLikeMaxTemperature &&
      todayForecast.feelsLikeMinTemperature
    ) {
      console.log(
        `Feels like: High ${todayForecast.feelsLikeMaxTemperature.degrees}°${todayForecast.feelsLikeMaxTemperature.unit === "CELSIUS" ? "C" : "F"}, Low ${todayForecast.feelsLikeMinTemperature.degrees}°${todayForecast.feelsLikeMinTemperature.unit === "CELSIUS" ? "C" : "F"}`,
      );
    }

    // Display daytime weather condition
    if (todayForecast.daytimeForecast?.weatherCondition) {
      const daytimeCondition = todayForecast.daytimeForecast.weatherCondition;
      console.log(
        `Daytime: ${daytimeCondition.description.text} (${daytimeCondition.type})`,
      );

      // Additional daytime details
      const daytime = todayForecast.daytimeForecast;
      if (daytime.precipitation?.probability) {
        console.log(
          `  Rain chance: ${daytime.precipitation.probability.percent}%`,
        );
      }
      if (daytime.relativeHumidity) {
        console.log(`  Humidity: ${daytime.relativeHumidity}%`);
      }
      if (daytime.wind?.speed) {
        console.log(
          `  Wind: ${daytime.wind.speed.value} ${daytime.wind.speed.unit === "KILOMETERS_PER_HOUR" ? "km/h" : "mph"} ${daytime.wind.direction.cardinal}`,
        );
      }
    }

    // Display nighttime weather condition
    if (todayForecast.nighttimeForecast?.weatherCondition) {
      const nighttimeCondition =
        todayForecast.nighttimeForecast.weatherCondition;
      console.log(
        `Nighttime: ${nighttimeCondition.description.text} (${nighttimeCondition.type})`,
      );

      // Additional nighttime details
      const nighttime = todayForecast.nighttimeForecast;
      if (nighttime.precipitation?.probability) {
        console.log(
          `  Rain chance: ${nighttime.precipitation.probability.percent}%`,
        );
      }
      if (nighttime.relativeHumidity) {
        console.log(`  Humidity: ${nighttime.relativeHumidity}%`);
      }
      if (nighttime.wind?.speed) {
        console.log(
          `  Wind: ${nighttime.wind.speed.value} ${nighttime.wind.speed.unit === "KILOMETERS_PER_HOUR" ? "km/h" : "mph"} ${nighttime.wind.direction.cardinal}`,
        );
      }
    }

    // Display sun events
    if (todayForecast.sunEvents) {
      const sunrise = new Date(
        todayForecast.sunEvents.sunriseTime,
      ).toLocaleTimeString("en-US", {
        timeZone: "Europe/Tallinn",
        hour: "2-digit",
        minute: "2-digit",
      });
      const sunset = new Date(
        todayForecast.sunEvents.sunsetTime,
      ).toLocaleTimeString("en-US", {
        timeZone: "Europe/Tallinn",
        hour: "2-digit",
        minute: "2-digit",
      });
      console.log(`Sun: Sunrise ${sunrise}, Sunset ${sunset}`);
    }

    // Display moon phase
    if (todayForecast.moonEvents?.moonPhase) {
      const moonPhase = todayForecast.moonEvents.moonPhase
        .replace(/_/g, " ")
        .toLowerCase();
      console.log(
        `Moon: ${moonPhase.charAt(0).toUpperCase() + moonPhase.slice(1)}`,
      );
    }
  } catch (error) {
    // Handle errors
    if (error.response) {
      console.log(
        `❌ Test Failed: ${error.response.status} - ${error.response.data.error?.message || error.message}`,
      );

      if (error.response.status === 401) {
        console.log("⚠️  Invalid API key. Please verify your API_KEY.");
      } else if (error.response.status === 404) {
        console.log("⚠️  Invalid endpoint. Check the API endpoint URL.");
      } else if (error.response.status === 403) {
        console.log(
          "⚠️  API key not authorized. Ensure the key is enabled for the Weather API in Google Cloud Console.",
        );
      } else if (error.response.status === 400) {
        console.log("⚠️  Bad request. Check your request parameters.");
      }
    } else if (error.request) {
      console.log("❌ Test Failed: No response received");
      console.log("Request timeout or network error");
    } else {
      console.log(`❌ Test Failed: ${error.message}`);
    }
  }
}

// Run the test
testGoogleWeatherAPI();
