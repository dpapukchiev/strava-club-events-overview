# Strava Club Rides Scraper

This application polls Strava for rides from clubs you are a member of, filters them by city, and provides a formatted output of events for the next 7 days. The application uses parallel processing for improved performance.

## Features

- Fetches club events in parallel using a queue system for better performance
- Configurable concurrency level for API requests
- Structured logging system for better debugging
- Clean architecture with separation of concerns
- Web interface for viewing events in a user-friendly format

## UI Preview
![image](https://github.com/user-attachments/assets/c3a24a18-b219-4e89-b001-a2630a48e103)

## Project Structure

```
strava-scraper/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── app.ts                   # Main application class
│   ├── auth.ts                  # Strava authentication handling
│   ├── strava.ts                # Strava API client
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils.ts                 # Utility functions for filtering and formatting
│   ├── logger.ts                # Centralized logging functionality
│   ├── config.ts                # Application configuration
│   ├── server.ts                # Web server for the event viewer
│   └── services/
│       └── eventService.ts      # Event processing with parallel execution
├── public/                      # Web interface files
│   ├── index.html               # Main HTML page
│   ├── styles.css               # CSS styles
│   └── app.js                   # JavaScript for the web interface
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
└── .env                         # Environment variables (create this file yourself)
```

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Strava API application**
   - Go to https://www.strava.com/settings/api
   - Create an application to get your Client ID and Client Secret

3. **Get a refresh token using the OAuth flow**
   - Replace YOUR_CLIENT_ID in the URL below and visit it in your browser:
     ```
     https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=read,activity:read
     ```
   - After authorizing, you'll be redirected to a URL like:
     ```
     http://localhost/?state=&code=AUTHORIZATION_CODE&scope=read,activity:read
     ```
   - Extract the AUTHORIZATION_CODE from the URL
   - Exchange this code for tokens using curl or Postman:
     ```
     curl -X POST https://www.strava.com/oauth/token \
       -d client_id=YOUR_CLIENT_ID \
       -d client_secret=YOUR_CLIENT_SECRET \
       -d code=AUTHORIZATION_CODE \
       -d grant_type=authorization_code
     ```

4. **Create a `.env` file in the project root with your credentials**
   ```
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   STRAVA_REFRESH_TOKEN=your_refresh_token
   
   # Optional settings
   CONCURRENCY=3          # Number of parallel requests (default: 3)
   DAYS_AHEAD=7           # Number of days to look ahead (default: 7)
   DEBUG=false            # Enable debug logging (default: false)
   FILTER_CITY=berlin     # City to filter events by (default: berlin)
   ```

## Building and Running

1. **Build the project**
   ```
   npm run build
   ```

2. **Run the application**
   ```
   npm start
   ```

## Development

To run the project in development mode with automatic reloading:
```
npm run dev
```

Other available scripts:
```
npm run watch      # Watch for changes and rebuild automatically
npm run clean      # Remove the dist folder
npm run rebuild    # Clean and rebuild the project
```

## Web Interface

The application includes a web interface to view the scraped events in a user-friendly format:

1. **First, run the scraper to collect events**:
   ```
   npm start
   ```

2. **Then, start the web server**:
   ```
   npm run serve
   ```
   
   Alternatively, you can run:
   ```
   npm start -- --server
   ```
   to start the server directly.

3. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

The web interface provides the following features:
- View events sorted by day
- Filter events using the search box
- Toggle between showing all events or only future events
- Select different event files if multiple scrapes have been performed
- Click on event links to navigate to the Strava event page

## Output Format

The application will display rides in the configured city for the next 7 days in this format:

```
===== Wednesday, October 25, 2023 =====

Morning Ride
Time: 08:30
Distance: 40.2 km
Club: Club #12345
Link: https://www.strava.com/clubs/12345/group_events/789012

Evening Ride
Time: 18:00
Distance: 25.5 km
Club: Club #67890
Link: https://www.strava.com/clubs/67890/group_events/345678

===== Thursday, October 26, 2023 =====

...
``` 
