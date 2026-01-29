
import { User, Role, City } from './types';

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
        logo: '', // Base64 CRC Logo
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