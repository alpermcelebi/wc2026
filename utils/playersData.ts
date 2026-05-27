import { Player } from '../types/tournament';

export const MOCK_PLAYERS: Player[] = [
  // France
  { id: 'p-mbappe', name: 'Kylian Mbappé', teamCode: 'FRA', position: 'FW' },
  { id: 'p-griezmann', name: 'Antoine Griezmann', teamCode: 'FRA', position: 'FW' },
  { id: 'p-maignan', name: 'Mike Maignan', teamCode: 'FRA', position: 'GK' },
  { id: 'p-zaire-emery', name: 'Warren Zaïre-Emery', teamCode: 'FRA', position: 'MF', isYoung: true },
  { id: 'p-saliba', name: 'William Saliba', teamCode: 'FRA', position: 'DF' },

  // Argentina
  { id: 'p-messi', name: 'Lionel Messi', teamCode: 'ARG', position: 'FW' },
  { id: 'p-martinez-l', name: 'Lautaro Martínez', teamCode: 'ARG', position: 'FW' },
  { id: 'p-martinez-e', name: 'Emiliano Martínez', teamCode: 'ARG', position: 'GK' },
  { id: 'p-garnacho', name: 'Alejandro Garnacho', teamCode: 'ARG', position: 'FW', isYoung: true },
  { id: 'p-fernandez-e', name: 'Enzo Fernández', teamCode: 'ARG', position: 'MF' },

  // Brazil
  { id: 'p-vinicius', name: 'Vinícius Júnior', teamCode: 'BRA', position: 'FW' },
  { id: 'p-rodrygo', name: 'Rodrygo Goes', teamCode: 'BRA', position: 'FW' },
  { id: 'p-alisson', name: 'Alisson Becker', teamCode: 'BRA', position: 'GK' },
  { id: 'p-endrick', name: 'Endrick Felipe', teamCode: 'BRA', position: 'FW', isYoung: true },
  { id: 'p-guimaraes', name: 'Bruno Guimarães', teamCode: 'BRA', position: 'MF' },

  // England
  { id: 'p-kane', name: 'Harry Kane', teamCode: 'ENG', position: 'FW' },
  { id: 'p-bellingham', name: 'Jude Bellingham', teamCode: 'ENG', position: 'MF', isYoung: true },
  { id: 'p-saka', name: 'Bukayo Saka', teamCode: 'ENG', position: 'FW' },
  { id: 'p-mainoo', name: 'Kobbie Mainoo', teamCode: 'ENG', position: 'MF', isYoung: true },
  { id: 'p-pickford', name: 'Jordan Pickford', teamCode: 'ENG', position: 'GK' },

  // Germany
  { id: 'p-musiala', name: 'Jamal Musiala', teamCode: 'GER', position: 'MF', isYoung: true },
  { id: 'p-wirtz', name: 'Florian Wirtz', teamCode: 'GER', position: 'MF', isYoung: true },
  { id: 'p-terstegen', name: 'Marc-André ter Stegen', teamCode: 'GER', position: 'GK' },
  { id: 'p-kimmich', name: 'Joshua Kimmich', teamCode: 'GER', position: 'DF' },
  { id: 'p-pavlovic', name: 'Aleksandar Pavlović', teamCode: 'GER', position: 'MF', isYoung: true },

  // Spain
  { id: 'p-yamal', name: 'Lamine Yamal', teamCode: 'ESP', position: 'FW', isYoung: true },
  { id: 'p-williams', name: 'Nico Williams', teamCode: 'ESP', position: 'FW' },
  { id: 'p-simon', name: 'Unai Simón', teamCode: 'ESP', position: 'GK' },
  { id: 'p-gavi', name: 'Gavi (Pablo Martín)', teamCode: 'ESP', position: 'MF', isYoung: true },
  { id: 'p-rodri', name: 'Rodri (Rodrigo Hernández)', teamCode: 'ESP', position: 'MF' },

  // Portugal
  { id: 'p-ronaldo', name: 'Cristiano Ronaldo', teamCode: 'POR', position: 'FW' },
  { id: 'p-fernandes-b', name: 'Bruno Fernandes', teamCode: 'POR', position: 'MF' },
  { id: 'p-costa', name: 'Diogo Costa', teamCode: 'POR', position: 'GK' },
  { id: 'p-neves', name: 'João Neves', teamCode: 'POR', position: 'MF', isYoung: true },

  // Norway
  { id: 'p-haaland', name: 'Erling Haaland', teamCode: 'I', position: 'FW' },
  { id: 'p-odegaard', name: 'Martin Ødegaard', teamCode: 'I', position: 'MF' },

  // Netherlands
  { id: 'p-vandijk', name: 'Virgil van Dijk', teamCode: 'NED', position: 'DF' },
  { id: 'p-simons-x', name: 'Xavi Simons', teamCode: 'NED', position: 'MF' },
  { id: 'p-verbruggen', name: 'Bart Verbruggen', teamCode: 'NED', position: 'GK' },

  // Belgium
  { id: 'p-debruyne', name: 'Kevin De Bruyne', teamCode: 'BEL', position: 'MF' },
  { id: 'p-lukaku', name: 'Romelu Lukaku', teamCode: 'BEL', position: 'FW' },
  { id: 'p-courtois', name: 'Thibaut Courtois', teamCode: 'BEL', position: 'GK' },

  // Türkiye
  { id: 'p-guler', name: 'Arda Güler', teamCode: 'TUR', position: 'MF', isYoung: true },
  { id: 'p-calhanoglu', name: 'Hakan Çalhanoğlu', teamCode: 'TUR', position: 'MF' },
  { id: 'p-yildiz', name: 'Kenan Yıldız', teamCode: 'TUR', position: 'FW', isYoung: true },
  { id: 'p-cakir', name: 'Uğurcan Çakır', teamCode: 'TUR', position: 'GK' },

  // USA
  { id: 'p-pulisic', name: 'Christian Pulisic', teamCode: 'USA', position: 'FW' },
  { id: 'p-mckennie', name: 'Weston McKennie', teamCode: 'USA', position: 'MF' },
  { id: 'p-turner', name: 'Matt Turner', teamCode: 'USA', position: 'GK' },

  // Canada
  { id: 'p-davies', name: 'Alphonso Davies', teamCode: 'CAN', position: 'DF' },
  { id: 'p-david', name: 'Jonathan David', teamCode: 'CAN', position: 'FW' },

  // Morocco
  { id: 'p-hakimi', name: 'Achraf Hakimi', teamCode: 'MAR', position: 'DF' },
  { id: 'p-bounou', name: 'Yassine Bounou', teamCode: 'MAR', position: 'GK' },

  // Colombia
  { id: 'p-diaz', name: 'Luis Díaz', teamCode: 'COL', position: 'FW' },
  { id: 'p-rodriguez-j', name: 'James Rodríguez', teamCode: 'COL', position: 'MF' },

  // Uruguay
  { id: 'p-valverde', name: 'Federico Valverde', teamCode: 'URU', position: 'MF' },
  { id: 'p-nunez', name: 'Darwin Núñez', teamCode: 'URU', position: 'FW' },

  // South Korea
  { id: 'p-son', name: 'Heung-min Son', teamCode: 'KOR', position: 'FW' },
  { id: 'p-kim', name: 'Min-jae Kim', teamCode: 'KOR', position: 'DF' },

  // Egypt
  { id: 'p-salah', name: 'Mohamed Salah', teamCode: 'EGY', position: 'FW' },

  // Croatia
  { id: 'p-modric', name: 'Luka Modrić', teamCode: 'CRO', position: 'MF' },
  { id: 'p-gvardiol', name: 'Joško Gvardiol', teamCode: 'CRO', position: 'DF' },

  // Senegal
  { id: 'p-mane', name: 'Sadio Mané', teamCode: 'SEN', position: 'FW' },

  // Ecuador
  { id: 'p-hincapie', name: 'Piero Hincapié', teamCode: 'ECU', position: 'DF' },
  { id: 'p-paez', name: 'Kendry Páez', teamCode: 'ECU', position: 'MF', isYoung: true },

  // Sweden
  { id: 'p-isak', name: 'Alexander Isak', teamCode: 'SWE', position: 'FW' },
  { id: 'p-gyokeres', name: 'Viktor Gyökeres', teamCode: 'SWE', position: 'FW' },

  // Special Fallback Write-in Option
  { id: 'other', name: 'Other / Write-in', teamCode: '', position: 'FW' }
];
