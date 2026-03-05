// src/app/core/config/api.config.ts
export const API_CONFIG = {
  FILTREX: {
    LIVE_DATA: '/api/filtrexdata/live',
    PRODUCTION_SUMMARY_SHIFT: '/api/filtrexdata/production-summary/shift',
    REPORT_BY_DATE_RANGE: '/api/filtrexdata/daterange'
    
  }
} as const;
