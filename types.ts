
export enum Role {
  SUPER_ADMIN = 'Super Admin',
  STAFF = 'Staff',
  SECTION_LEADER = 'Section Leader',
  TWO_IC = '2IC',
  VOLUNTEER = 'Volunteer',
  NEW_VOLUNTEER = 'New Volunteer'
}

export enum City {
  JHB = 'JHB',
  BFN = 'BFN',
  PTA = 'PTA'
}

export enum Station {
  MONITORS = 'Monitors',
  FOH = 'FOH',
  BROADCAST = 'Broadcast',
  RUNNER = 'Runner',
  KIDS_RUNNER = 'Kids Church Runner',
  MOTHERS_TODDLERS = 'Mothers & Toddlers',
  SHADOWING = 'Shadowing',
  GENERAL = 'General',
  IN_TRAINING = 'In Training'
}

export interface User {
  id: string;
  name: string;
  surname: string;
  gender: 'Male' | 'Female';
  cellphone: string;
  role: Role;
  city: City;
  ethnicity: string;
  email: string;
  suburb: string;
  birthday: string; // yyyy/mm/dd
  isCrcMember: 'Yes' | 'No';
  zonePastor: string;
  isHomecell: 'Yes' | 'No';
  zone: string;
  shirtSize: string;
  primaryStation: Station;
  startServingDate: string; // yyyy/mm
  adminEnabled: boolean;
  profilePicture?: string; // Base64 encoded image
  building?: 'North' | 'South'; // Specific to BFN
}

export interface Availability {
  userId: string;
  date: string;
  timeSlot: string;
  isAvailable: boolean;
  isAdHoc: boolean;
  eventId?: string;
}

export interface AdHocEvent {
  id: string;
  name: string;
  city: City;
  startDate: string;
  endDate: string;
  sessions: {
    id: string;
    date: string;
    time: string;
    requiredStations: { station: Station; count: number }[];
  }[];
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  type: 'Sunday' | 'Thursday' | 'AdHoc';
  status: 'Present' | 'Absent';
  capturedBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'General' | 'Social';
  city: City | 'All';
  date: string;
  eventDate?: string;
}

export interface Training {
  id: string;
  city: City;
  name: string;
  station: Station;
  startDate: string;
  dueDate: string;
  description: string;
  completions: Record<string, boolean>; // userId -> completed
}

export interface Feedback {
  id: string;
  userId: string;
  authorId: string;
  comment: string;
  date: string;
}

export interface SoundDocument {
  id: string;
  name: string;
  url: string;
  city: City | 'All';
  uploadedBy: string;
}

export interface RosterEntry {
  id: string;
  date: string;
  time: string;
  userId: string;
  station: Station;
  city: City;
  eventId?: string;
  building?: 'North' | 'South';
}
