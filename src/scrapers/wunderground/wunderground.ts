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
  interactions: [
    {
      type: 'click',
      selector: 'input#wuSearch',
    },
    {
      type: 'type',
      selector: 'input#wuSearch',
      paramName: 'zipcode',
    },
    {
      type: 'wait',
      duration: 1000, // Wait for autocomplete to populate
    },
    {
      type: 'keyPress',
      selector: 'input#wuSearch',
      key: 'ArrowDown', // Move to first autocomplete result
    },
    {
      type: 'keyPress',
      selector: 'input#wuSearch',
      key: 'Enter', // Select the highlighted result
    },
    {
      type: 'waitForNavigation',
    },
  ],
  waitForSelector: 'h1.condition-location',
  waitForTimeout: 2000,
  navigationTimeout: 60000,
  selectors: {
    // Current conditions
    currentTemp: 'div.cur-temp',
    tempUnit: 'div.cur-temp.funits, div.cur-temp.cunits',
    
    // Location
    location: 'h1.condition-location',
  },
  screenshot: false,
  headless: true,
};

// Export all Wunderground configurations
export const wundergroundConfigs: Record<string, ScraperConfig> = {
  'wunderground-home': wundergroundHomeConfig,
  'wunderground-location': wundergroundLocationConfig,
};
