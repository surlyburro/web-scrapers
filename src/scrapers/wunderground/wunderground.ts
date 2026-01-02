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

// Export all Wunderground configurations
export const wundergroundConfigs: Record<string, ScraperConfig> = {
  'wunderground-home': wundergroundHomeConfig,
};
