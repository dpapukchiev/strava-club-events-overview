import { addDays, format, parseISO } from 'date-fns';
import { ClubEvent, FormattedEvent } from './types';
import { Logger } from './logger';
import config from './config';
import fs from 'fs';
import path from 'path';

const logger = new Logger('Utils');
const { daysAhead } = config.app;

export function filterBerlinEvents(events: ClubEvent[]): ClubEvent[] {
  logger.info(`Filtering ${events.length} events for Berlin location and dates within next ${daysAhead} days`);
  
  const today = new Date();
  const endDate = addDays(today, daysAhead);
  logger.info(`Date range: ${format(today, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
  
  const filteredEvents = events.filter(event => {
    // Check if the event has any upcoming occurrences in the next X days
    if (!event.upcoming_occurrences || event.upcoming_occurrences.length === 0) {
      return false;
    }
    
    // Check if the event is in Berlin based on description or address
    const description = event.description?.toLowerCase() || '';
    const address = event.address?.toLowerCase() || '';
    const isBerlinEvent = description.includes('berlin') || address.includes('berlin');
    
    if (!isBerlinEvent) {
      return false;
    }
    
    // Check if event is within the next X days
    const hasUpcomingOccurrence = event.upcoming_occurrences.some(occurrence => {
      const occurrenceDate = parseISO(occurrence);
      return occurrenceDate >= today && occurrenceDate <= endDate;
    });
    
    return hasUpcomingOccurrence;
  });
  
  logger.info(`Found ${filteredEvents.length} events in Berlin within the next ${daysAhead} days`);
  
  // Log some basic info about the filtered events
  if (filteredEvents.length > 0) {
    logger.info('Berlin events found:');
    filteredEvents.forEach(event => {
      logger.debug(`- ${event.title} (Club ID: ${event.club_id})`);
      logger.debug(`  Distance: ${event.distance ? `${(event.distance / 1000).toFixed(1)} km` : 'Not specified'}`);
      logger.debug(`  First occurrence: ${format(parseISO(event.upcoming_occurrences[0]), 'yyyy-MM-dd HH:mm')}`);
    });
  }
  
  return filteredEvents;
}

export function formatEvents(events: ClubEvent[]): string {
  logger.info(`Formatting ${events.length} events for display`);
  
  // Group events by day
  const eventsByDay = events.reduce((acc, event) => {
    event.upcoming_occurrences.forEach(occurrence => {
      try {
        const occurrenceDate = parseISO(occurrence);
        const dateKey = format(occurrenceDate, 'yyyy-MM-dd');
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        
        const formattedEvent: FormattedEvent = {
          title: event.title,
          date: format(occurrenceDate, 'EEEE, MMMM d, yyyy HH:mm'),
          time: format(occurrenceDate, 'HH:mm'),
          distance: event.distance ? `${(event.distance / 1000).toFixed(1)} km` : 'Distance not specified',
          club: `${event.club_name || `Club #${event.club_id}`}`,
          link: `https://www.strava.com/clubs/${event.club_id}/group_events/${event.id}`
        };
        
        acc[dateKey].push(formattedEvent);
      } catch (error) {
        logger.error(`Error formatting date for event "${event.title}" (ID: ${event.id}):`, error);
        logger.error(`Problematic occurrence date: ${occurrence}`);
      }
    });
    
    return acc;
  }, {} as Record<string, FormattedEvent[]>);
  
  // Sort days chronologically
  const sortedDays = Object.keys(eventsByDay).sort();
  logger.info(`Events grouped into ${sortedDays.length} days`);
  
  // Format the output
  let output = '';
  
  sortedDays.forEach(day => {
    try {
      const dayDate = parseISO(day);
      const formattedDay = format(dayDate, 'EEEE, MMMM d, yyyy');
      logger.debug(`Formatting ${eventsByDay[day].length} events for ${formattedDay}`);
      
      output += `\n===== ${formattedDay} =====\n\n`;
      
      eventsByDay[day].forEach(event => {
        output += `${event.title}\n`;
        output += `Time: ${event.time}\n`;
        output += `Distance: ${event.distance}\n`;
        output += `Club: ${event.club}\n`;
        output += `Link: ${event.link}\n\n`;
      });
    } catch (error) {
      logger.error(`Error formatting day ${day}:`, error);
    }
  });
  
  return output;
}

/**
 * Save events to a file with ISO sortable dates
 */
export function saveEventsToFile(events: ClubEvent[], filePath: string): boolean {
  try {
    logger.info(`Saving ${events.length} events to file: ${filePath}`);
    
    // Create directory if it doesn't exist
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Format events with ISO sortable dates
    const formattedEvents = events.flatMap(event => {
      return event.upcoming_occurrences.map(occurrence => {
        const occurrenceDate = parseISO(occurrence);
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          start_date: occurrence, // ISO date
          end_date: format(addDays(occurrenceDate, 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"), // Estimate end date as 1 day later
          start_time: format(occurrenceDate, 'HH:mm'),
          club_id: event.club_id,
          club_name: event.club_name || `Club #${event.club_id}`,
          distance: event.distance ? `${(event.distance / 1000).toFixed(1)} km` : 'Distance not specified',
          elevation_gain: event.elevation_gain,
          address: event.address,
          link: `https://www.strava.com/clubs/${event.club_id}/group_events/${event.id}`
        };
      });
    });
    
    // Sort by start date
    formattedEvents.sort((a, b) => a.start_date.localeCompare(b.start_date));
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(formattedEvents, null, 2));
    logger.info(`Successfully saved ${formattedEvents.length} event occurrences to ${filePath}`);
    
    return true;
  } catch (error) {
    logger.error(`Error saving events to file: ${filePath}`, error);
    return false;
  }
} 