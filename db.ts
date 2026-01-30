
import { User, Role, City, Station, Availability } from './types';

const DB_KEY = 'CRC_SOUND_DB';

export const initializeDB = () => {
  const existing = localStorage.getItem(DB_KEY);
  if (!existing) {
    const initialData = {
      users: [
        {
          id: 'admin-1',
          name: 'Super',
          surname: 'Admin',
          cellphone: '0721128230',
          role: Role.SUPER_ADMIN,
          city: City.JHB,
          email: 'admin@crc.org.za',
          ethnicity: 'N/A',
          birthday: '1990/01/01',
          isCrcMember: 'Yes',
          zonePastor: 'Ps. John Meyer',
          isHomecell: 'Yes',
          zone: 'Main',
          shirtSize: 'L',
          primaryStation: 'FOH',
          startServingDate: '2020/01',
          adminEnabled: true
        }
      ],
      availability: [],
      adHocEvents: [],
      attendance: [],
      announcements: [
        {
          id: '1',
          title: 'Welcome to CRC Sound!',
          content: 'The new sound department app is now live.',
          type: 'General',
          city: 'All',
          date: new Date().toISOString()
        }
      ],
      training: [],
      feedback: [],
      documents: [],
      roster: [],
      settings: {
        themeColor: '#800000',
        logo: '', 
        spreadsheetId: '',
        dropdowns: {
          ethnicities: ['Black', 'White', 'Coloured', 'Indian', 'Asian', 'Other'],
          roles: [Role.STAFF, Role.SECTION_LEADER, Role.VOLUNTEER, Role.NEW_VOLUNTEER]
        },
        pastors: {
          [City.JHB]: ['Ps. John Meyer', 'Ps. Sarah Smith', 'Ps. David Botha'],
          [City.BFN]: ['Ps. Andre van Niekerk', 'Ps. Petro Schoeman'],
          [City.PTA]: ['Ps. Chris Louw', 'Ps. Mpho Moloi']
        },
        rolePermissions: {
          [Role.SUPER_ADMIN]: ['Dashboard', 'Availability', 'Create Ad Hoc', 'Roster', 'Attendance', 'Training', 'Feedback', 'Reports', 'Volunteers', 'Sound Docs', 'Announcement', 'Settings'],
          [Role.STAFF]: ['Dashboard', 'Availability', 'Create Ad Hoc', 'Roster', 'Attendance', 'Training', 'Feedback', 'Reports', 'Volunteers', 'Sound Docs', 'Announcement'],
          [Role.SECTION_LEADER]: ['Dashboard', 'Availability', 'Create Ad Hoc', 'Roster', 'Attendance', 'Training', 'Feedback', 'Reports', 'Volunteers', 'Sound Docs', 'Announcement'],
          [Role.VOLUNTEER]: ['Dashboard', 'Availability', 'Attendance', 'Training', 'Sound Docs'],
          [Role.NEW_VOLUNTEER]: ['Dashboard', 'Availability', 'Attendance', 'Training', 'Sound Docs'],
          [Role.TWO_IC]: ['Dashboard', 'Availability', 'Attendance', 'Training', 'Volunteers', 'Sound Docs']
        }
      }
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initialData));
  }
};

export const getData = () => {
  return JSON.parse(localStorage.getItem(DB_KEY) || '{}');
};

export const saveData = (data: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

export const getAuthUser = (): User | null => {
  const user = localStorage.getItem('CRC_AUTH_USER');
  return user ? JSON.parse(user) : null;
};

export const loginUser = (user: User) => {
  localStorage.setItem('CRC_AUTH_USER', JSON.stringify(user));
};

export const logoutUser = () => {
  localStorage.removeItem('CRC_AUTH_USER');
};

/**
 * CSV SERVICE FOR GOOGLE SHEETS INTEGRATION
 */
export const CSVService = {
  // Generate a CSV template string for the Users sheet
  generateUsersTemplate: () => {
    const headers = [
      'id', 'name', 'surname', 'gender', 'cellphone', 'role', 'city', 'ethnicity', 
      'email', 'suburb', 'birthday', 'isCrcMember', 'zonePastor', 'isHomecell', 
      'zone', 'shirtSize', 'primaryStation', 'startServingDate', 'adminEnabled'
    ];
    const example = [
      'user_123', 'John', 'Doe', 'Male', '0720001111', 'Volunteer', 'JHB', 'Black',
      'john@example.com', 'Sandton', '1995/10/25', 'Yes', 'Ps. John Meyer', 'Yes',
      'North', 'L', 'FOH', '2023/01', 'FALSE'
    ];
    return [headers.join(','), example.join(',')].join('\n');
  },

  // Generate a CSV template string for Availability
  generateAvailabilityTemplate: (data: Availability[] = []) => {
    const headers = ['userId', 'date', 'timeSlot', 'isAvailable', 'isAdHoc', 'eventId'];
    const rows = data.map(a => [
      a.userId,
      a.date,
      `"${a.timeSlot}"`,
      a.isAvailable ? 'TRUE' : 'FALSE',
      a.isAdHoc ? 'TRUE' : 'FALSE',
      a.eventId || ''
    ].join(','));
    
    // Add an example if data is empty
    if (rows.length === 0) {
      rows.push(['admin-1', '2024-12-01', '"09:30"', 'TRUE', 'FALSE', ''].join(','));
    }

    return [headers.join(','), ...rows].join('\n');
  },

  // Parse CSV string into User objects
  parseUsersCSV: (csv: string): User[] => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      // Handle commas inside quotes for fields like timeSlot
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        let val: any = values[index]?.trim().replace(/^"|"$/g, '');
        if (val === 'TRUE') val = true;
        if (val === 'FALSE') val = false;
        obj[header] = val;
      });
      result.push(obj);
    }
    return result;
  },

  // Parse Availability CSV
  parseAvailabilityCSV: (csv: string): Availability[] => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        let val: any = values[index]?.trim().replace(/^"|"$/g, '');
        if (val === 'TRUE') val = true;
        if (val === 'FALSE') val = false;
        obj[header] = val;
      });
      result.push(obj);
    }
    return result;
  },

  downloadFile: (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
