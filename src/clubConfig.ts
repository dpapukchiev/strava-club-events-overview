export interface ClubConfig {
  // If true, only include clubs in the includeList. If false, exclude clubs in the excludeList.
  useWhitelist: boolean;
  // List of club names to include when useWhitelist is true
  includeList: string[];
  // List of club names to exclude when useWhitelist is false
  excludeList: string[];
}

// Default configuration
const clubConfig: ClubConfig = {
  useWhitelist: true,
  includeList: [
    '8bar Community',
    'Rapha Berlin',
    'Standert Bicycles',
    'CYKEL BUTIK',
    'Trek Bicycle Berlin',
    'Ryzon - Performance Apparel'
  ],
  excludeList: []
};

export default clubConfig; 