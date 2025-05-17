import axios from 'axios';
import { Club, ClubEvent } from './types';
import { Logger } from './logger';
import config from './config';

const logger = new Logger('Strava');
const { baseUrl } = config.strava;

/**
 * Cache of club IDs to club names to avoid repeated lookups
 */
const clubNameCache: Record<number, string> = {};

export async function getClubs(accessToken: string): Promise<Club[]> {
  try {
    logger.info(`Requesting clubs from ${baseUrl}/athlete/clubs...`);
    const response = await axios.get(`${baseUrl}/athlete/clubs`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    const clubs = response.data;
    logger.info(`Received ${clubs.length} clubs from Strava API`);
    
    // Cache club names
    clubs.forEach((club: Club) => {
      clubNameCache[club.id] = club.name;
    });
    
    return clubs;
  } catch (error) {
    logger.error('Error getting clubs:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      logger.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      logger.error('This could be due to invalid credentials, expired token, or rate limiting');
    }
    
    throw error;
  }
}

export async function getClubEvents(accessToken: string, clubId: number): Promise<ClubEvent[]> {
  const MAX_RETRIES = 3;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      logger.info(`Requesting events from ${baseUrl}/clubs/${clubId}/group_events...`);
      const response = await axios.get(`${baseUrl}/clubs/${clubId}/group_events`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const events = response.data;
      logger.info(`Received ${events.length} events for club ${clubId}`);
      
      // Add club name to each event
      const clubName = clubNameCache[clubId];
      if (clubName) {
        events.forEach((event: ClubEvent) => {
          event.club_name = clubName;
        });
      }
      
      // Log some details about the events if there are any
      if (events.length > 0) {
        logger.debug(`First event: "${events[0].title}" on ${new Date(events[0].upcoming_occurrences[0]).toLocaleDateString()}`);
      }
      
      return events;
    } catch (error) {
      retries++;
      
      if (retries === MAX_RETRIES) {
        // Only log a brief error message on final retry
        logger.error(`Failed to get events for club ${clubId} after ${MAX_RETRIES} attempts`);
        
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status === 404) {
            logger.info(`Club ${clubId} might not have any upcoming events`);
          } else if (error.response) {
            logger.error(`API Error: ${error.response.status}`);
          }
        }
      } else {
        // Log minimal info for retries
        logger.info(`Retry ${retries}/${MAX_RETRIES} for club ${clubId}...`);
        // Add a small delay between retries (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, retries * 1000));
      }
      
      if (retries === MAX_RETRIES) {
        // Return empty array instead of failing entirely
        logger.info(`Continuing without events from club ${clubId}`);
        return [];
      }
    }
  }
  
  return []; // This should never be reached but TypeScript needs it
} 