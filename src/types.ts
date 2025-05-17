export interface Club {
  id: number;
  name: string;
  profile_medium: string;
  description: string;
  city: string;
  state: string;
  country: string;
  member_count: number;
  url: string;
}

export interface ClubEvent {
  id: number;
  title: string;
  description: string;
  club_id: number;
  club_name?: string;
  route_id?: number;
  organizing_athlete: {
    id: number;
    name: string;
  };
  sport_type: string;
  distance?: number;
  elevation_gain?: number;
  terrain_type?: string;
  upcoming_occurrences: string[];
  address?: string;
  routes?: {
    id: number;
    name: string;
    distance: number;
    elevation_gain: number;
  }[];
}

export interface FormattedEvent {
  title: string;
  date: string;
  time: string;
  distance?: string;
  club: string;
  link: string;
} 