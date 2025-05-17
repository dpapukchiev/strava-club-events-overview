import { Club, ClubEvent } from '../types';
import { getClubEvents } from '../strava';
import { Logger } from '../logger';

const logger = new Logger('EventService');

export class EventService {
  private concurrency: number;

  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
    logger.info(`Initialized event service with concurrency: ${concurrency}`);
  }

  /**
   * Process clubs in batches respecting concurrency
   */
  private async processBatch(accessToken: string, batch: Club[]): Promise<ClubEvent[]> {
    const promises = batch.map(async (club) => {
      logger.info(`Processing club: ${club.name} (ID: ${club.id})`);
      try {
        const events = await getClubEvents(accessToken, club.id);
        logger.info(`Retrieved ${events.length} events from ${club.name}`);
        return events;
      } catch (error) {
        logger.error(`Failed to fetch events for club: ${club.name}`, error);
        return [] as ClubEvent[];
      }
    });
    
    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * Fetch events from multiple clubs with parallel processing
   */
  async fetchClubEvents(accessToken: string, clubs: Club[]): Promise<ClubEvent[]> {
    logger.info(`Fetching events from ${clubs.length} clubs with concurrency ${this.concurrency}`);
    
    const allEvents: ClubEvent[] = [];
    
    // Process clubs in batches according to concurrency
    for (let i = 0; i < clubs.length; i += this.concurrency) {
      const batch = clubs.slice(i, i + this.concurrency);
      logger.info(`Processing batch of ${batch.length} clubs (${i+1} to ${Math.min(i+batch.length, clubs.length)} of ${clubs.length})`);
      
      const batchEvents = await this.processBatch(accessToken, batch);
      allEvents.push(...batchEvents);
    }
    
    logger.info(`Completed fetching events from all clubs`);
    return allEvents;
  }
} 