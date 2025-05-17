import { App } from './app';
import { Logger } from './logger';
import * as path from 'path';
import * as fs from 'fs';

const logger = new Logger('Main');

async function main() {
  try {
    // Check if we're running in server mode
    const args = process.argv.slice(2);
    const isServerMode = args.includes('--server') || args.includes('-s');
    
    if (isServerMode) {
      logger.info('Starting in server mode...');
      
      // Create the output directory if it doesn't exist
      const outputDir = path.join(__dirname, '../output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Import and start the server
      // We use dynamic import to avoid loading the server module if not needed
      const { default: startServer } = await import('./server');
      startServer();
    } else {
      logger.info('Starting in scraper mode...');
      
      // Run the Strava scraper
      const app = new App();
      await app.run();
    }
  } catch (error) {
    logger.error('Error in main function:', error);
    process.exit(1);
  }
}

main(); 