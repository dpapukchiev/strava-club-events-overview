import axios from 'axios';
import { Logger } from './logger';
import config from './config';

const logger = new Logger('Auth');

const { clientId, clientSecret, refreshToken } = config.strava;

export async function getAccessToken(): Promise<string> {
  try {
    logger.info('Attempting to get access token from refresh token...');
    
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing required environment variables. Please check your .env file.');
    }
    
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    logger.info('Successfully obtained new access token');
    return response.data.access_token;
  } catch (error) {
    logger.error('Error getting access token:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    throw error;
  }
} 