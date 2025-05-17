document.addEventListener('DOMContentLoaded', () => {
  const eventsContainer = document.getElementById('events-container');
  const fileSelect = document.getElementById('file-select');
  const searchInput = document.getElementById('search');
  const showAllDaysCheckbox = document.getElementById('show-all-days');
  
  let allEvents = [];
  
  // Function to scan the output directory and list available JSON files
  async function scanOutputDirectory() {
    try {
      const response = await fetch('/api/list-files');
      const files = await response.json();
      
      // Clear dropdown
      fileSelect.innerHTML = '';
      
      if (files.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No files found';
        fileSelect.appendChild(option);
      } else {
        files.forEach(file => {
          const option = document.createElement('option');
          option.value = file;
          option.textContent = file;
          fileSelect.appendChild(option);
        });
        
        // Load the first file by default
        loadEventFile(files[0]);
      }
    } catch (error) {
      console.error('Error loading file list:', error);
      eventsContainer.innerHTML = `
        <div class="no-events">
          <p>Error loading file list. Please make sure the server is running.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }
  
  // Function to load an event file
  async function loadEventFile(filename) {
    if (!filename) return;
    
    try {
      eventsContainer.innerHTML = `
        <div class="loading">
          <p>Loading events...</p>
          <div class="spinner"></div>
        </div>
      `;
      
      const response = await fetch(`/api/events/${filename}`);
      allEvents = await response.json();
      
      // Display events
      displayEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      eventsContainer.innerHTML = `
        <div class="no-events">
          <p>Error loading events. Please try again.</p>
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }
  
  // Function to display events
  function displayEvents(events, searchTerm = '') {
    // Group events by day
    const eventsByDay = groupEventsByDay(events);
    
    // Get array of days sorted chronologically
    const sortedDays = Object.keys(eventsByDay).sort();
    
    if (sortedDays.length === 0) {
      eventsContainer.innerHTML = `
        <div class="no-events">
          <p>No events found.</p>
        </div>
      `;
      return;
    }
    
    // Clear the container
    eventsContainer.innerHTML = '';
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Display each day's events
    sortedDays.forEach(day => {
      // Skip past days if "Show all days" is not checked
      if (!showAllDaysCheckbox.checked && day < today) {
        return;
      }
      
      // Filter events by search term
      const filteredEvents = eventsByDay[day].filter(event => {
        if (!searchTerm) return true;
        
        // Search in title, club name, and distance
        return (
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.club_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.distance?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      
      // Skip days with no events after filtering
      if (filteredEvents.length === 0) {
        return;
      }
      
      // Format the day header
      const dayDate = new Date(day + 'T00:00:00');
      const formattedDay = formatDate(dayDate);
      
      // Create a day section
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.textContent = formattedDay;
      eventsContainer.appendChild(dayHeader);
      
      // Add each event for this day
      filteredEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsContainer.appendChild(eventCard);
      });
    });
    
    // Show no results message if everything was filtered out
    if (eventsContainer.children.length === 0) {
      eventsContainer.innerHTML = `
        <div class="no-events">
          <p>No events found matching "${searchTerm}".</p>
        </div>
      `;
    }
  }
  
  // Function to group events by day
  function groupEventsByDay(events) {
    return events.reduce((acc, event) => {
      // Extract the date part (YYYY-MM-DD) from the start_date
      const dateKey = event.start_date.split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(event);
      return acc;
    }, {});
  }
  
  // Function to create an event card
  function createEventCard(event) {
    const eventCard = document.createElement('div');
    eventCard.className = 'event-card';
    
    // Format the time from the start time (HH:MM)
    const time = event.start_time;
    
    // Create HTML for the event card
    eventCard.innerHTML = `
      <div class="event-title">${event.title}</div>
      <div class="event-info">
        <div class="event-info-item">
          <i class="far fa-clock"></i> ${time}
        </div>
        <div class="event-info-item">
          <i class="fas fa-road"></i> ${event.distance}
        </div>
        <div class="event-info-item">
          <i class="fas fa-users"></i> ${event.club_name}
        </div>
        ${event.elevation_gain ? `
          <div class="event-info-item">
            <i class="fas fa-mountain"></i> ${event.elevation_gain}m
          </div>
        ` : ''}
        ${event.address ? `
          <div class="event-info-item">
            <i class="fas fa-map-marker-alt"></i> ${event.address}
          </div>
        ` : ''}
      </div>
      <a href="${event.link}" target="_blank" class="event-link">
        View on Strava <i class="fas fa-external-link-alt"></i>
      </a>
    `;
    
    return eventCard;
  }
  
  // Helper function to format a date
  function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Event listeners
  fileSelect.addEventListener('change', () => {
    loadEventFile(fileSelect.value);
  });
  
  searchInput.addEventListener('input', () => {
    displayEvents(allEvents, searchInput.value);
  });
  
  showAllDaysCheckbox.addEventListener('change', () => {
    displayEvents(allEvents, searchInput.value);
  });
  
  // Initial load
  scanOutputDirectory();
}); 