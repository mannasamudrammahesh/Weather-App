# Weather App Project

![Weather App Demo](<div style="display: flex; justify-content: center;">
  <img width="521" height="888" alt="Weather App Demo" src="https://github.com/user-attachments/assets/338d6db2-3403-473c-8419-aea39e712b4c">
</div>)

## Overview

This is a weather app project built using HTML, CSS, and JavaScript, with full responsiveness across devices. The app allows users to search for a city (or use geolocation) and retrieves real-time weather data, including temperature, humidity, wind speed, current conditions, and a 6-day forecast. It features dynamic 3D weather animations (e.g., rain, snow, clouds, mist, sunny, clear night) powered by Three.js, enhancing the visual experience. The background dynamically updates to show an image of a famous landmark or scenic view related to the searched city.

The project demonstrates intermediate web development concepts, including API integration, 3D rendering, and asynchronous data handling.

## Features

-Search input for city name or automatic detection via geolocation

-Real-time weather data, including temperature, humidity, wind speed, and conditions

-6-day weather forecast with icons and max temperatures

-Dynamic 3D animations for various weather conditions (rain, snow, cloudy, mist, sunny/day clear, night clear)

-Background images of famous landmarks or views specific to the searched city

-Preloader with bouncing ball animation for smooth loading

-Error handling for invalid city searches

## How to Use

1.Clone the repository to your local machine.

2.Open the index.html file in your web browser.

3.Allow geolocation access for automatic location-based weather (defaults to London if denied).

4.Enter a city name in the search box and click "Search" (or press Enter) to fetch weather data and update animations/background.

5.Note: API keys for WeatherAPI and Unsplash are hardcoded in app.js. For production use, replace them with your own keys to avoid rate limits.

## Technologies Used
 
-HTML

-CSS

-JavaScript

-Three.js (for 3D weather animations)

## APIs Used

- [Weather API](https://www.weatherapi.com/) for weather data retrieval.
- [Unsplash API](https://unsplash.com/developers) for dynamic city images.




