import { getAccessToken } from './auth';
import { getClubs } from './strava';
import { filterEventsByCity, formatEvents, saveEventsToFile } from './utils';
import { Logger } from './logger';
import { EventService } from './services/eventService';
import config from './config';
import axios, { AxiosError } from 'axios';
import path from 'path';
import { ClubSelector } from './clubSelector';

export class App {
  private logger = new Logger('App');
  private eventService: EventService;
  private clubSelector: ClubSelector;

  constructor() {
    this.eventService = new EventService(config.app.concurrency);
    this.clubSelector = new ClubSelector();
    this.logger.info('Strava Club Rides Scraper initialized');
  }

  public async run(): Promise<void> {
    try {
      this.logger.info('Starting Strava Club Rides Scraper...');
      
      // Authentication
      this.logger.info('Authenticating with Strava API...');
      const accessToken = await getAccessToken();
      this.logger.info('Successfully authenticated with Strava API');
      
      // Get club data
      this.logger.info('Fetching clubs you are a member of...');
      const allClubs = await getClubs(accessToken);
      this.logger.info(`Found ${allClubs.length} clubs total`);
      
      // Interactive club selection
      const clubs = await this.clubSelector.selectClubs(allClubs);
      
      // Log the selected clubs
      this.logger.info(`Working with ${clubs.length} selected clubs:`);
      clubs.forEach(club => {
        this.logger.info(`- ${club.name} (ID: ${club.id}, Members: ${club.member_count})`);
      });
      
      // Fetch events in parallel from all clubs
      this.logger.info('\nFetching events from selected clubs in parallel...');
      const allEvents = await this.eventService.fetchClubEvents(accessToken, clubs);
      this.logger.info(`Total events fetched: ${allEvents.length}`);
      
      // Filter events by city
      this.logger.info(`\nFiltering events in ${config.app.filterCity} for the next ${config.app.daysAhead} days...`);
      const cityEvents = filterEventsByCity(allEvents);
      this.logger.info(`Found ${cityEvents.length} events in ${config.app.filterCity} in the next ${config.app.daysAhead} days`);
      
      if (cityEvents.length === 0) {
        this.logger.info(`No events found in ${config.app.filterCity} for the next ${config.app.daysAhead} days.`);
      } else {
        // Format and display events
        this.logger.info('\nFormatting events by date...');
        const formattedEvents = formatEvents(cityEvents);
        this.logger.info(`\n=== ${config.app.filterCity.toUpperCase()} RIDES FOR THE NEXT WEEK ===`);
        console.log(formattedEvents);
        
        // Save events to file
        const today = new Date();
        const fileName = `${config.app.filterCity}-events-${today.toISOString().split('T')[0]}.json`;
        const filePath = path.join('output', fileName);
        this.logger.info(`\nSaving events to file: ${filePath}`);
        saveEventsToFile(cityEvents, filePath);
      }
      
      // Save all events regardless of location
      const today = new Date();
      const allEventsFileName = `all-events-${today.toISOString().split('T')[0]}.json`;
      const allEventsFilePath = path.join('output', allEventsFileName);
      this.logger.info(`\nSaving all events to file: ${allEventsFilePath}`);
      saveEventsToFile(allEvents, allEventsFilePath);
      
      this.logger.info('Strava Club Rides Scraper completed successfully');
    } catch (error: unknown) {
      this.logger.error('Error running Strava Club Rides Scraper:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          this.logger.error('API Error Details:');
          this.logger.error(`Status: ${axiosError.response.status}`);
        }
      }
      
      this.logger.info('\nTroubleshooting tips:');
      this.logger.info('1. Check that your .env file contains the correct Strava API credentials');
      this.logger.info('2. Ensure your refresh token is valid and not expired');
      this.logger.info('3. Verify that you have permission to access club events');
    }
  }
} 