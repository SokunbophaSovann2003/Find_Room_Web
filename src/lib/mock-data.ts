import type { Owner, Room, UserProfile } from "./types";

const OWNERS: Record<string, Owner> = {
  sokha: {
    id: "sokha",
    name: "Sokha Chan",
    phoneNumber: "+855 12 345 678",
    telegramPhone: "+855 12 345 678",
    email: "sokha.chan@example.com",
    facebook: "sokha.chan",
    avatarUrl: "https://i.pravatar.cc/160?img=47",
    memberSince: "2023-06-14",
    listingsCount: 4,
    responseRate: 96
  },
  dara: {
    id: "dara",
    name: "Dara Pich",
    phoneNumber: "+855 17 888 112",
    telegramPhone: "+855 17 888 112",
    wechat: "dara_pich",
    avatarUrl: "https://i.pravatar.cc/160?img=12",
    memberSince: "2022-11-03",
    listingsCount: 7,
    responseRate: 89
  },
  sreypov: {
    id: "sreypov",
    name: "Sreypov Lay",
    phoneNumber: "+855 96 221 009",
    telegramPhone: "+855 96 221 009",
    email: "sreypov.lay@example.com",
    facebook: "sreypov.lay",
    avatarUrl: "https://i.pravatar.cc/160?img=32",
    memberSince: "2024-02-20",
    listingsCount: 2,
    responseRate: 100
  }
};

export const MOCK_ROOMS: Room[] = [
  {
    id: "1",
    title: "Cozy studio near Riverside",
    description:
      "Modern fully-furnished studio just 5 minutes walk to the Riverside. Quiet building, fast Wi-Fi, 24/7 security and covered parking. Perfect for young professionals and digital nomads.",
    price: 250,
    currency: "USD",
    deposit: 500,
    waterPrice: 0.5,
    electricityPrice: 0.25,
    wifiPrice: 10,
    type: "studio",
    address: "St. 110, Daun Penh",
    city: "Phnom Penh",
    district: "Daun Penh",
    lat: 11.5775,
    lng: 104.925,
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 28,
    floor: 3,
    amenities: ["Wi-Fi", "Air conditioning", "Parking", "Security", "Kitchen", "Elevator"],
    isNew: true,
    isFeatured: true,
    availableFrom: "2026-05-01",
    owner: OWNERS.sokha,
    createdAt: Date.now()
  },
  {
    id: "2",
    title: "Bright shared room in BKK1",
    description:
      "Friendly house share in the heart of BKK1. Shared kitchen and lounge, private bedroom, close to cafes and coworking spaces.",
    price: 180,
    currency: "USD",
    deposit: 360,
    waterPrice: 0.4,
    electricityPrice: 0.25,
    type: "shared",
    address: "St. 294, BKK1",
    city: "Phnom Penh",
    district: "Chamkarmon",
    lat: 11.5444,
    lng: 104.9263,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 18,
    floor: 2,
    amenities: ["Wi-Fi", "Shared kitchen", "Laundry", "Security"],
    availableFrom: "2026-05-10",
    owner: OWNERS.dara,
    createdAt: Date.now()
  },
  {
    id: "3",
    title: "Sunny 1-bedroom in Toul Kork",
    description:
      "Bright apartment with a private balcony overlooking the city. Brand-new kitchen, fast fibre internet, elevator building with rooftop pool.",
    price: 320,
    currency: "USD",
    deposit: 640,
    waterPrice: 0.5,
    electricityPrice: 0.25,
    wifiPrice: 15,
    otherFees: [{ label: "Trash collection", amount: "$3 / month" }],
    type: "1-bedroom",
    address: "St. 315, Toul Kork",
    city: "Phnom Penh",
    district: "Toul Kork",
    lat: 11.5793,
    lng: 104.8908,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 42,
    floor: 5,
    amenities: ["Wi-Fi", "Air conditioning", "Elevator", "Parking", "Pool", "Gym"],
    isFeatured: true,
    availableFrom: "2026-06-01",
    owner: OWNERS.sokha,
    createdAt: Date.now()
  },
  {
    id: "4",
    title: "Modern 2-bedroom near AEON Mall",
    description:
      "Spacious family apartment 3 minutes from AEON Mall. Two bedrooms, open-plan living, fully-equipped kitchen and dedicated parking.",
    price: 550,
    currency: "USD",
    deposit: 1100,
    waterPrice: 0.5,
    electricityPrice: 0.25,
    wifiPrice: 20,
    otherFees: [
      { label: "Building maintenance", amount: "$15 / month" },
      { label: "Parking", amount: "Included" }
    ],
    type: "2-bedroom",
    address: "Koh Pich, Diamond Island",
    city: "Phnom Penh",
    district: "Chamkarmon",
    lat: 11.553,
    lng: 104.9389,
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200"
    ],
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 75,
    floor: 8,
    amenities: ["Wi-Fi", "Air conditioning", "Parking", "Pool", "Gym", "Security", "Elevator"],
    isNew: true,
    availableFrom: "2026-05-15",
    owner: OWNERS.dara,
    createdAt: Date.now()
  },
  {
    id: "5",
    title: "Quiet studio in Russian Market",
    description:
      "Affordable, clean studio near Russian Market. Great local food around the corner, close to bus stops, walkable to BKK1.",
    price: 190,
    currency: "USD",
    deposit: 380,
    waterPrice: 0.4,
    electricityPrice: 0.3,
    type: "studio",
    address: "St. 450, Tuol Tumpung",
    city: "Phnom Penh",
    district: "Chamkarmon",
    lat: 11.5367,
    lng: 104.9196,
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 24,
    floor: 1,
    amenities: ["Wi-Fi", "Air conditioning", "Laundry"],
    availableFrom: "2026-05-05",
    owner: OWNERS.sreypov,
    createdAt: Date.now()
  },
  {
    id: "6",
    title: "Rooftop apartment with city view",
    description:
      "Top-floor apartment with floor-to-ceiling windows and sunset views. Modern furniture, smart TV, and a spacious balcony.",
    price: 420,
    currency: "USD",
    deposit: 840,
    waterPrice: 0.5,
    electricityPrice: 0.25,
    wifiPrice: 15,
    type: "1-bedroom",
    address: "St. 63, Boeung Keng Kang",
    city: "Phnom Penh",
    district: "Chamkarmon",
    lat: 11.5542,
    lng: 104.9218,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200"
    ],
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 48,
    floor: 12,
    amenities: ["Wi-Fi", "Air conditioning", "Elevator", "Balcony", "Security"],
    isFeatured: true,
    availableFrom: "2026-06-10",
    owner: OWNERS.sreypov,
    createdAt: Date.now()
  }
];

export function findRoomById(id: string): Room | undefined {
  return MOCK_ROOMS.find((r) => r.id === id);
}

export function similarRooms(room: Room, limit = 3): Room[] {
  return MOCK_ROOMS.filter((r) => r.id !== room.id && r.type === room.type).slice(0, limit);
}

export const CURRENT_USER: UserProfile = {
  uid: "demo-user",
  username: "Sokha Chan",
  phoneNumber: "+855 12 345 678",
  avatarUrl: "https://i.pravatar.cc/160?img=47",
  memberSince: "2023-06-14",
  listingsCount: 4,
  savedCount: 9
};

export function myListings(): Room[] {
  return MOCK_ROOMS.filter((r) => r.owner.id === "sokha");
}
