export type PropertyType =
  | "room"
  | "house"
  | "apartment"
  | "condo"
  | "flat"
  | "villa";

export type PricePeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface Owner {
  id: string;
  name: string;
  // A host can publish multiple ways to be reached. First entry is the
  // primary contact (used for the bottom-bar "Contact" CTA fallback).
  phoneNumbers: string[];
  telegramPhones?: string[];
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
  pricePeriod?: PricePeriod;
  currency: "USD" | "KHR";
  deposit?: number;
  waterPrice?: number;
  electricityPrice?: number;
  wifiPrice?: number;
  otherFees?: { label: string; amount: string }[];
  type: PropertyType;
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
  isOccupied?: boolean;
  owner: Owner;
  createdAt: number;
}

