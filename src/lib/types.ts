export type RoomType = "studio" | "1-bedroom" | "2-bedroom" | "shared" | "apartment";

export interface Owner {
  id: string;
  name: string;
  phoneNumber: string;
  telegramPhone?: string;
  email?: string;
  wechat?: string;
  facebook?: string;
  avatarUrl?: string;
  memberSince: string; // ISO date
  listingsCount: number;
  responseRate: number; // 0-100
}

export interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: "USD" | "KHR";
  deposit?: number;
  waterPrice?: number;
  electricityPrice?: number;
  wifiPrice?: number;
  otherFees?: { label: string; amount: string }[];
  type: RoomType;
  address: string;
  city: string;
  district?: string;
  lat?: number;
  lng?: number;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  areaSqm?: number;
  floor?: number;
  amenities: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  availableFrom?: string; // ISO date
  owner: Owner;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  phoneNumber: string;
  avatarUrl?: string;
  memberSince: string;
  listingsCount: number;
  savedCount: number;
}
