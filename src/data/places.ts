export type District = 'social' | 'entertainment' | 'gaming' | 'food-insurance' | 'technology'

export interface Place {
  id: string
  name: string
  url: string
  district: District | 'plaza'
  neonColor: string
}

export const DISTRICT_INFO: Record<District, { label: string; centerAngle: number; color: string }> = {
  social: { label: '1. Social & Communication', centerAngle: 36, color: '#ff00ff' },
  entertainment: { label: '2. Entertainment & Media', centerAngle: 108, color: '#00ffff' },
  gaming: { label: '3. Gaming & Interactive', centerAngle: 180, color: '#ff0080' },
  'food-insurance': { label: '4. Food & Insurance', centerAngle: 252, color: '#00ff80' },
  technology: { label: '5. Technology & Online Services', centerAngle: 324, color: '#8000ff' },
}

export const places: Place[] = [
  // Plaza center
  { id: 'google', name: 'Google', url: 'https://google.com', district: 'plaza', neonColor: '#4285f4' },

  // Social & Communication (36°) - 7 places
  { id: 'facebook', name: 'Facebook', url: 'https://facebook.com', district: 'social', neonColor: '#1877f2' },
  { id: 'instagram', name: 'Instagram', url: 'https://instagram.com', district: 'social', neonColor: '#e4405f' },
  { id: 'twitter', name: 'Twitter', url: 'https://twitter.com', district: 'social', neonColor: '#1da1f2' },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com', district: 'social', neonColor: '#0a66c2' },
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://whatsapp.com', district: 'social', neonColor: '#25d366' },
  { id: 'discord', name: 'Discord', url: 'https://discord.com', district: 'social', neonColor: '#5865f2' },
  { id: 'snapchat', name: 'Snapchat', url: 'https://snapchat.com', district: 'social', neonColor: '#fffc00' },

  // Entertainment & Media (108°) - 7 places
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', district: 'entertainment', neonColor: '#ff0000' },
  { id: 'netflix', name: 'Netflix', url: 'https://netflix.com', district: 'entertainment', neonColor: '#e50914' },
  { id: 'spotify', name: 'Spotify', url: 'https://spotify.com', district: 'entertainment', neonColor: '#1db954' },
  { id: 'twitch', name: 'Twitch', url: 'https://twitch.tv', district: 'entertainment', neonColor: '#9146ff' },
  { id: 'tiktok', name: 'TikTok', url: 'https://tiktok.com', district: 'entertainment', neonColor: '#00f2ea' },
  { id: 'hulu', name: 'Hulu', url: 'https://hulu.com', district: 'entertainment', neonColor: '#1ce783' },
  { id: 'soundcloud', name: 'SoundCloud', url: 'https://soundcloud.com', district: 'entertainment', neonColor: '#ff5500' },

  // Gaming & Interactive (180°) - 7 places
  { id: 'steam', name: 'Steam', url: 'https://store.steampowered.com', district: 'gaming', neonColor: '#1b2838' },
  { id: 'epicgames', name: 'Epic Games', url: 'https://epicgames.com', district: 'gaming', neonColor: '#0078f2' },
  { id: 'roblox', name: 'Roblox', url: 'https://roblox.com', district: 'gaming', neonColor: '#e2231a' },
  { id: 'minecraft', name: 'Minecraft', url: 'https://minecraft.net', district: 'gaming', neonColor: '#62b47a' },
  { id: 'playstation', name: 'PlayStation', url: 'https://playstation.com', district: 'gaming', neonColor: '#003791' },
  { id: 'xbox', name: 'Xbox', url: 'https://xbox.com', district: 'gaming', neonColor: '#107c10' },
  { id: 'nintendo', name: 'Nintendo', url: 'https://nintendo.com', district: 'gaming', neonColor: '#e60012' },

  // Food & Insurance (252°) - 7 places
  { id: 'ubereats', name: 'Uber Eats', url: 'https://ubereats.com', district: 'food-insurance', neonColor: '#06c167' },
  { id: 'doordash', name: 'DoorDash', url: 'https://doordash.com', district: 'food-insurance', neonColor: '#ff3008' },
  { id: 'grubhub', name: 'Grubhub', url: 'https://grubhub.com', district: 'food-insurance', neonColor: '#f63440' },
  { id: 'statefarm', name: 'State Farm', url: 'https://statefarm.com', district: 'food-insurance', neonColor: '#ff0000' },
  { id: 'geico', name: 'Geico', url: 'https://geico.com', district: 'food-insurance', neonColor: '#0b6b35' },
  { id: 'progressive', name: 'Progressive', url: 'https://progressive.com', district: 'food-insurance', neonColor: '#0033a0' },
  { id: 'allstate', name: 'Allstate', url: 'https://allstate.com', district: 'food-insurance', neonColor: '#0033a1' },

  // Technology & Online Services (324°) - 6 places
  { id: 'amazon', name: 'Amazon', url: 'https://amazon.com', district: 'technology', neonColor: '#ff9900' },
  { id: 'microsoft', name: 'Microsoft', url: 'https://microsoft.com', district: 'technology', neonColor: '#00a4ef' },
  { id: 'apple', name: 'Apple', url: 'https://apple.com', district: 'technology', neonColor: '#a2aaad' },
  { id: 'github', name: 'GitHub', url: 'https://github.com', district: 'technology', neonColor: '#6e5494' },
  { id: 'dropbox', name: 'Dropbox', url: 'https://dropbox.com', district: 'technology', neonColor: '#0061ff' },
  { id: 'zoom', name: 'Zoom', url: 'https://zoom.us', district: 'technology', neonColor: '#2d8cff' },
]

export function getPlacesByDistrict(district: District | 'plaza'): Place[] {
  return places.filter(p => p.district === district)
}
