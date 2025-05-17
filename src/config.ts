import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default {
  strava: {
    clientId: process.env.STRAVA_CLIENT_ID,
    clientSecret: process.env.STRAVA_CLIENT_SECRET,
    refreshToken: process.env.STRAVA_REFRESH_TOKEN,
    baseUrl: 'https://www.strava.com/api/v3',
  },
  app: {
    concurrency: parseInt(process.env.CONCURRENCY || '3', 10),
    debug: process.env.DEBUG === 'true',
    daysAhead: parseInt(process.env.DAYS_AHEAD || '7', 10),
    filterCity: process.env.FILTER_CITY || 'berlin',
  }
}; 