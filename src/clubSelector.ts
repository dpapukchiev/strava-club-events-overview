import inquirer from 'inquirer';
import { Club } from './types';
import { Logger } from './logger';
import fs from 'fs';
import path from 'path';

const logger = new Logger('ClubSelector');

// Define the club configuration interface
interface ClubConfig {
  useWhitelist: boolean;
  includeList: string[];
  excludeList: string[];
}

/**
 * Interactive CLI for selecting clubs
 */
export class ClubSelector {
  private configFilePath: string;
  private clubConfig: ClubConfig = {
    useWhitelist: true,
    includeList: [],
    excludeList: []
  };

  constructor() {
    // Path to the JSON config file - this now properly handles both dev and production modes
    this.configFilePath = path.join(process.cwd(), 'src', 'clubConfig.json');
    this.loadConfig();
  }

  /**
   * Load the club configuration from the JSON file
   */
  private loadConfig(): void {
    try {
      // Read and parse the JSON file
      const configContent = fs.readFileSync(this.configFilePath, 'utf8');
      this.clubConfig = JSON.parse(configContent);
      logger.debug('Loaded club configuration from file');
    } catch (error) {
      logger.error('Error loading club configuration:', error);
      // Keep using the default configuration set in the property initialization
    }
  }

  /**
   * Shows an interactive prompt to select clubs
   */
  public async selectClubs(clubs: Club[]): Promise<Club[]> {
    // Ask whether to use existing configuration or select clubs interactively
    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'How would you like to filter clubs?',
        choices: [
          { name: 'Use existing configuration', value: 'config' },
          { name: 'Select clubs interactively', value: 'interactive' },
          { name: 'Show all clubs (no filtering)', value: 'all' }
        ]
      }
    ]);

    if (mode === 'config') {
      return this.filterClubsUsingConfig(clubs);
    } else if (mode === 'all') {
      logger.info('Using all available clubs');
      return clubs;
    } else {
      return this.selectClubsInteractively(clubs);
    }
  }

  /**
   * Filter clubs based on the club configuration file
   */
  private filterClubsUsingConfig(clubs: Club[]): Club[] {
    if (this.clubConfig.useWhitelist) {
      const filteredClubs = clubs.filter(club => 
        this.clubConfig.includeList.includes(club.name)
      );
      logger.info(`Using ${filteredClubs.length} clubs from configuration whitelist`);
      return filteredClubs;
    } else {
      const filteredClubs = clubs.filter(club => 
        !this.clubConfig.excludeList.includes(club.name)
      );
      logger.info(`Excluded ${clubs.length - filteredClubs.length} clubs based on configuration blacklist`);
      return filteredClubs;
    }
  }

  /**
   * Interactive selection of clubs
   */
  private async selectClubsInteractively(clubs: Club[]): Promise<Club[]> {
    // Sort clubs by name for easier selection
    const sortedClubs = [...clubs].sort((a, b) => a.name.localeCompare(b.name));
    
    // Prepare checkboxes with default selections based on current config
    const choices = sortedClubs.map(club => ({
      name: `${club.name} (${club.member_count} members)`,
      value: club.id,
      checked: this.clubConfig.includeList.includes(club.name)
    }));

    const { selectedClubIds, saveSelection } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedClubIds',
        message: 'Select clubs to include:',
        choices,
        pageSize: 20
      },
      {
        type: 'confirm',
        name: 'saveSelection',
        message: 'Save this selection for future runs?',
        default: false
      }
    ]);

    // Filter clubs based on selection
    const selectedClubs = clubs.filter(club => selectedClubIds.includes(club.id));
    
    if (saveSelection) {
      await this.saveClubSelection(selectedClubs);
    }

    logger.info(`Selected ${selectedClubs.length} clubs interactively`);
    return selectedClubs;
  }

  /**
   * Save the selected clubs to the configuration file
   */
  private async saveClubSelection(selectedClubs: Club[]): Promise<void> {
    try {
      // Update club config
      const updatedConfig = {
        ...this.clubConfig,
        useWhitelist: true,
        includeList: selectedClubs.map(club => club.name),
      };

      // Save to JSON file
      fs.writeFileSync(
        this.configFilePath, 
        JSON.stringify(updatedConfig, null, 2)
      );
      
      // Update the in-memory config
      this.clubConfig = updatedConfig;
      
      logger.info('Club selection saved to configuration file');
    } catch (error) {
      logger.error('Error saving club selection:', error);
    }
  }
} 