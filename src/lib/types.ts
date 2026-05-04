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
  area?: string;
  lat?: number;
  lng?: number;
  images: string[];
  bedrooms: number;
  areaSqm?: number;
  floor?: number;
  amenities: string[];
  availableFrom?: string; // ISO date
  owner: Owner;
  createdAt: number;
}

