import { ScraperConfig } from '../../types/scraper';

// Configuration for Wunderground homepage weather data
export const wundergroundHomeConfig: ScraperConfig = {
  url: 'https://www.wunderground.com/',
  waitForSelector: '[data-testid="CurrentConditions"]',
  waitForTimeout: 3000,
  navigationTimeout: 60000,
  selectors: {
    // Current conditions
    currentTemp: '[data-testid="TemperatureValue"]',
    condition: '[data-testid="wxPhrase"]',
    feelsLike: '[data-testid="FeelsLikeSection"] [data-testid="TemperatureValue"]',
    
    // Additional current conditions
    windSpeed: '[data-testid="Wind"] [data-testid="WindSpeed"]',
    windDirection: '[data-testid="Wind"] [data-testid="WindDirection"]',
    humidity: '[data-testid="PercentageValue"]',
    dewPoint: '[data-testid="DewPoint"] [data-testid="TemperatureValue"]',
    pressure: '[data-testid="PressureValue"]',
    visibility: '[data-testid="VisibilitySection"] span',
    uvIndex: '[data-testid="UVIndexValue"]',
    
    // Location
    location: '[data-testid="PresentationName"]',
    
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
