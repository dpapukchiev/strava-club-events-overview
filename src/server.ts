import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Logger } from './logger';

const logger = new Logger('Server');

// Create a function to start the server
export default function startServer(): void {
  // Create the express app
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, '../public')));

  // API endpoint to list available event JSON files
  app.get('/api/list-files', (req: Request, res: Response) => {
    const outputDir = path.join(__dirname, '../output');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      // Get all JSON files in the output directory
      const files = fs.readdirSync(outputDir)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first
      
      logger.info(`Found ${files.length} JSON files in output directory`);
      res.json(files);
    } catch (error) {
      logger.error('Error reading output directory:', error);
      res.status(500).json({ error: 'Failed to read output directory' });
    }
  });

  // API endpoint to get events from a specific file
  app.get('/api/events/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../output', filename);
    
    try {
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        return res.status(404).json({ error: 'File not found' });
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const events = JSON.parse(fileContent);
      
      logger.info(`Serving ${events.length} events from ${filename}`);
      res.json(events);
    } catch (error) {
      logger.error(`Error reading file ${filename}:`, error);
      res.status(500).json({ error: 'Failed to read event file' });
    }
  });

  // Serve the index.html for all other routes (SPA support)
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Start the server
  app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
    logger.info(`Open your browser and navigate to http://localhost:${PORT} to view events`);
  });
} 