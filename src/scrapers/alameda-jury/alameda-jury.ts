import { ScraperConfig } from '../../types/scraper';

// Configuration for Alameda County Jury Duty reporting
export const alamedaJuryConfig: ScraperConfig = {
  url: 'https://www.alameda.courts.ca.gov/general-information/jury-service/jury-duty-reporting',
  waitForSelector: '.jcc-body__main-text',
  waitForTimeout: 3000,
  navigationTimeout: 60000,
  selectors: {
    // Page title
    pageTitle: 'h1',
    
    // Week date range (e.g. "January 05, 2026, through January 09, 2026")
    weekDates: '.jcc-body__main-text > p:nth-of-type(1) strong',
    
    // All group notices (blockquotes contain group numbers, dates, times, locations)
    groupNotices: '.jcc-body__main-text .blockquote--box',
    
    // Section heading for groups already called
    calledGroupsHeading: '.jcc-body__main-text h2',
    
    // All instruction paragraphs
    instructions: '.jcc-body__main-text > p',
    
    // Court locations in sidebar
    courtLocations: '.jcc-body__aside-text ul li a',
    
    // Travel/parking info
    travelInfo: '.jcc-body__aside-text p',
  },
  screenshot: false,
  headless: true,
};

// Export as object for aggregation in index
export const alamedaJuryConfigs: Record<string, ScraperConfig> = {
  'alameda-jury-reporting': alamedaJuryConfig,
};
