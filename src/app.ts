import { getAccessToken } from './auth';
import { getClubs } from './strava';
import { filterBerlinEvents, formatEvents, saveEventsToFile } from './utils';
import { Logger } from './logger';
import { EventService } from './services/eventService';
import config from './config';
import clubConfig from './clubConfig';
import axios, { AxiosError } from 'axios';
import { Club } from './types';
import path from 'path';

export class App {
  private logger = new Logger('App');
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService(config.app.concurrency);
    this.logger.info('Strava Club Rides Scraper initialized');
  }

  /**
   * Filter clubs based on the club configuration
   */
  private filterClubs(clubs: Club[]): Club[] {
    if (clubConfig.useWhitelist) {
      // Whitelist mode - only include clubs in the includeList
      const filteredClubs = clubs.filter(club => 
        clubConfig.includeList.includes(club.name)
      );
      this.logger.info(`Filtered down to ${filteredClubs.length} whitelisted clubs`);
      return filteredClubs;
    } else {
      // Blacklist mode - exclude clubs in the excludeList
      const filteredClubs = clubs.filter(club => 
        !clubConfig.excludeList.includes(club.name)
      );
      this.logger.info(`Filtered out ${clubs.length - filteredClubs.length} blacklisted clubs`);
      return filteredClubs;
    }
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
      
      // Filter clubs based on configuration
      const clubs = this.filterClubs(allClubs);
      
      // Log the selected clubs
      this.logger.info(`Working with ${clubs.length} selected clubs:`);
      clubs.forEach(club => {
        this.logger.info(`- ${club.name} (ID: ${club.id}, Members: ${club.member_count})`);
      });
      
      // Fetch events in parallel from all clubs
      this.logger.info('\nFetching events from selected clubs in parallel...');
      const allEvents = await this.eventService.fetchClubEvents(accessToken, clubs);
      this.logger.info(`Total events fetched: ${allEvents.length}`);
      
      // Filter events in Berlin
      this.logger.info(`\nFiltering events in Berlin for the next ${config.app.daysAhead} days...`);
      const berlinEvents = filterBerlinEvents(allEvents);
      this.logger.info(`Found ${berlinEvents.length} events in Berlin in the next ${config.app.daysAhead} days`);
      
      if (berlinEvents.length === 0) {
        this.logger.info(`No events found in Berlin for the next ${config.app.daysAhead} days.`);
      } else {
        // Format and display events
        this.logger.info('\nFormatting events by date...');
        const formattedEvents = formatEvents(berlinEvents);
        this.logger.info('\n=== BERLIN RIDES FOR THE NEXT WEEK ===');
        console.log(formattedEvents);
        
        // Save events to file
        const today = new Date();
        const fileName = `berlin-events-${today.toISOString().split('T')[0]}.json`;
        const filePath = path.join('output', fileName);
        this.logger.info(`\nSaving events to file: ${filePath}`);
        saveEventsToFile(berlinEvents, filePath);
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