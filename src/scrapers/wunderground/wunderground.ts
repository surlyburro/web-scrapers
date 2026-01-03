import { ScraperConfig } from '../../types/scraper';

// Configuration for Wunderground homepage weather data
export const wundergroundHomeConfig: ScraperConfig = {
  url: 'https://www.wunderground.com/',
  waitForSelector: '[data-testid="CurrentConditions"]',
  waitForTimeout: 3000,
  navigationTimeout: 60000,
  selectors: {
    // Current conditions
    currentTemp: 'div.cur-temp',
    tempUnit: 'div.cur-temp.funits, div.cur-temp.cunits', // Detect F or C
    
    // Location
    location: 'h1.condition-location',
    
    // Forecast data (array of forecast cards)
    forecastDays: '[data-testid="DailyForecast"] [data-testid="DaypartDetails"]',
    forecastTemps: '[data-testid="DailyForecast"] [data-testid="TemperatureValue"]',
    
    // Hourly forecast
    hourlyForecast: '[data-testid="HourlyForecast"] [data-testid="HourlyForecastCard"]',
    
    // Air quality (if available)
    airQuality: '[data-testid="AirQualityModule"] [data-testid="AirQualityIndex"]',
  },
  screenshot: false,
  headless: true,
};

// Configuration for Wunderground location-specific pages
export const wundergroundLocationConfig: ScraperConfig = {
  url: 'https://www.wunderground.com/',
  urlParams: ['zipcode'],
  // Pass through the zipcode parameter to the response data
  passThrough: ['zipcode'],
  interactions: [
    {
      type: 'click',
      selector: 'input#wuSearch',
    },
    {
      type: 'wait',
      duration: 300, // Wait for input to be fully focused
    },
    {
      type: 'type',
      selector: 'input#wuSearch',
      paramName: 'zipcode',
    },
    {
      type: 'debugLog',
      selector: 'input#wuSearch',
      message: 'Verify typed zipcode in input field',
    },
    {
      type: 'wait',
      duration: 1500, // Wait for autocomplete to populate
    },
    {
      type: 'debugLog',
      selector: 'ul.ui-autocomplete li',
      message: 'Autocomplete dropdown options',
    },
    {
      type: 'keyPress',
      selector: 'input#wuSearch',
      key: 'Enter', // Press Enter to search for exact zipcode
    },
    {
      type: 'waitForNavigation',
    },
  ],
  waitForSelector: '.conditions-circle .current-temp',
  waitForTimeout: 2000,
  navigationTimeout: 60000,
  selectors: {
    // Current conditions - location page uses different structure
    // Use more specific selectors to avoid matching multiple temperatures on page
    currentTemp: '.conditions-circle .current-temp span.wu-value.wu-value-to',
    tempUnit: '.conditions-circle .current-temp span.wu-unit-temperature span.wu-label', // Contains °F or °C
    
    // Location details
    location: 'h1 span', // "Oakland, California" - h1 may or may not have city-header class
    // Note: latitude and longitude are embedded in page JSON data (requires custom extraction)
    // For now, elevation is extracted from the visible subheading
    elevation: '.city-header .subheading strong', // Elevation in feet
  },
  screenshot: false,
  headless: true,
};

// Export all Wunderground configurations
export const wundergroundConfigs: Record<string, ScraperConfig> = {
  'wunderground-home': wundergroundHomeConfig,
  'wunderground-location': wundergroundLocationConfig,
};
