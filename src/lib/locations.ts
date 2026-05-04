export type LocationTree = Record<string, Record<string, string[]>>;

export const LOCATIONS: LocationTree = {
  "Phnom Penh": {
    "Boeng Keng Kang": [
      "Boeng Keng Kang Muoy",
      "Boeng Keng Kang Pir",
      "Boeng Keng Kang Bei",
      "Olympic",
      "Tumnob Tuek",
      "Tuol Svay Prey Muoy",
      "Tuol Svay Prey Pir"
    ],
    "Chamkar Mon": [
      "Boeng Trabaek",
      "Phsar Daeum Kor",
      "Phsar Daeum Thkov",
      "Tonle Bassac",
      "Tuol Tom Poung Muoy",
      "Tuol Tom Poung Pir"
    ],
    "Chbar Ampov": [
      "Chbar Ampov Muoy",
      "Chbar Ampov Pir",
      "Nirouth",
      "Preaek Pra",
      "Preaek Aeng"
    ],
    "Chroy Changvar": ["Chroy Changvar", "Bak Kaeng", "Preaek Lieb", "Preaek Tasek"],
    Dangkao: ["Cheung Aek", "Dangkao", "Krang Pongro", "Pong Tuek", "Roluos"],
    "Doun Penh": [
      "Chakto Mukh",
      "Chey Chumneah",
      "Phsar Chas",
      "Phsar Kandal Muoy",
      "Phsar Kandal Pir",
      "Phsar Thmei Muoy",
      "Phsar Thmei Pir",
      "Phsar Thmei Bei",
      "Srah Chak",
      "Voat Phnum"
    ],
    Kamboul: ["Kamboul", "Kantaok", "Ovlaok", "Phleung Chheh Roteh"],
    "Mean Chey": [
      "Boeng Tumpun",
      "Chak Angrae Kraom",
      "Chak Angrae Leu",
      "Stueng Mean Chey"
    ],
    "Por Senchey": [
      "Choam Chao",
      "Kakab",
      "Krang Thnong",
      "Phlov Lvea Aem",
      "Snao",
      "Trapeang Krasang"
    ],
    "Prampir Meakkakra": [
      "Boeng Prolit",
      "Mittakpheap",
      "Monourom",
      "Ou Ruessei Muoy",
      "Ou Ruessei Pir",
      "Ou Ruessei Bei",
      "Ou Ruessei Buon",
      "Veal Vong"
    ],
    "Preaek Pnov": ["Kouk Roka", "Ponhea Pon", "Preaek Pnov", "Samraong"],
    "Russey Keo": [
      "Chrang Chamreh Muoy",
      "Chrang Chamreh Pir",
      "Kilomaetr Lekh Prammuoy",
      "Russey Keo",
      "Tuol Sangkae"
    ],
    "Sen Sok": ["Khmuonh", "Phnom Penh Thmei", "Tuek Thla", "Ou Baek K'am"],
    "Tuol Kouk": [
      "Boeng Kak Muoy",
      "Boeng Kak Pir",
      "Boeng Salang",
      "Phsar Daeum Kor",
      "Toek L'ak Muoy",
      "Toek L'ak Pir",
      "Toek L'ak Bei"
    ]
  },
  "Preah Sihanouk": {
    Sihanoukville: ["Sangkat Pir", "Sangkat Bei", "Sangkat Buon", "Sangkat Muoy"],
    "Stueng Hav": [],
    "Prey Nob": [],
    "Kampong Seila": []
  },
  "Kampong Cham": {
    "Kampong Cham": ["Veal Vong", "Sambour Meas", "Boeng Kok"],
    "Batheay": [],
    "Cheung Prey": [],
    "Kang Meas": [],
    "Koh Sotin": [],
    "Prey Chhor": [],
    "Srey Santhor": [],
    "Stueng Trang": []
  },
  "Siem Reap": {
    "Siem Reap": ["Sala Kamraeuk", "Svay Dangkum", "Sla Kram", "Chreav", "Nokor Thum"],
    "Angkor Thom": [],
    "Banteay Srei": [],
    "Chi Kraeng": [],
    "Kralanh": [],
    "Prasat Bakong": [],
    "Pouk": [],
    "Soutr Nikom": [],
    "Srei Snam": [],
    "Svay Leu": [],
    Varin: []
  },
  Battambang: {
    Battambang: ["Svay Por", "Ratanak", "Tuol Ta Ek", "Chamkar Samraong"],
    "Banan": [],
    "Bavel": [],
    "Ek Phnom": [],
    "Kamrieng": [],
    "Koas Krala": [],
    "Mong Ruessei": [],
    "Phnum Proek": [],
    "Rotonak Mondol": [],
    "Sampov Loun": [],
    "Sangkae": [],
    "Thma Koul": []
  },
  Kandal: {
    "Ta Khmau": [],
    "Kandal Stueng": [],
    "Kien Svay": [],
    "Khsach Kandal": [],
    "Koh Thom": [],
    "Leuk Daek": [],
    "Lvea Aem": [],
    "Mukh Kampul": [],
    "Ponhea Lueu": [],
    "Sa'ang": []
  },
  "Banteay Meanchey": {
    "Serei Saophoan": [],
    Poipet: [],
    "Mongkol Borei": [],
    "O Chrov": [],
    "Phnum Srok": [],
    "Preah Netr Preah": [],
    "Svay Chek": [],
    "Thma Puok": []
  },
  "Kampong Chhnang": {
    "Kampong Chhnang": [],
    Baribour: [],
    "Chol Kiri": [],
    "Kampong Leaeng": [],
    "Kampong Tralach": [],
    "Rolea Bier": [],
    "Sameakki Mean Chey": [],
    "Tuek Phos": []
  },
  "Kampong Speu": {
    "Chbar Mon": [],
    Basedth: [],
    "Kong Pisei": [],
    "Phnum Sruoch": [],
    "Samraong Tong": [],
    Thpong: [],
    "Aoral": [],
    Borseth: []
  },
  "Kampong Thom": {
    "Stueng Saen": [],
    Baray: [],
    "Kampong Svay": [],
    "Prasat Balangk": [],
    "Prasat Sambour": [],
    "Sandan": [],
    Santuk: [],
    "Stoung": []
  },
  Kampot: {
    Kampot: [],
    "Angkor Chey": [],
    "Banteay Meas": [],
    Chhuk: [],
    "Chum Kiri": [],
    "Dang Tong": [],
    "Kampong Trach": [],
    "Tuek Chhou": []
  },
  Kep: {
    Kep: [],
    "Damnak Chang'aeur": []
  },
  "Koh Kong": {
    "Khemarak Phoumin": [],
    "Botum Sakor": [],
    "Kiri Sakor": [],
    "Koh Kong": [],
    "Mondol Seima": [],
    "Smach Mean Chey": [],
    "Srae Ambel": [],
    "Thma Bang": []
  },
  Kratie: {
    Kratie: [],
    "Chhloung": [],
    "Preaek Prasab": [],
    Sambour: [],
    "Snuol": []
  },
  Mondulkiri: {
    "Saen Monourom": [],
    "Kaev Seima": [],
    "Kaoh Nheaek": [],
    "Ou Reang": [],
    "Pech Chreada": []
  },
  "Oddar Meanchey": {
    Samraong: [],
    "Anlong Veaeng": [],
    "Banteay Ampil": [],
    "Chong Kal": [],
    "Trapeang Prasat": []
  },
  Pailin: {
    Pailin: [],
    "Sala Krau": []
  },
  "Preah Vihear": {
    "Tbeng Meanchey": [],
    "Chey Saen": [],
    "Chhaeb": [],
    "Kuleaen": [],
    "Rovieng": [],
    "Sangkum Thmei": [],
    "Choam Ksant": []
  },
  "Prey Veng": {
    "Prey Veng": [],
    "Ba Phnum": [],
    "Kamchay Mear": [],
    "Kampong Trabaek": [],
    "Mesang": [],
    "Peam Chor": [],
    "Peam Ro": [],
    "Pea Reang": []
  },
  Pursat: {
    Pursat: [],
    Bakan: [],
    "Kandieng": [],
    Krakor: [],
    "Phnum Kravanh": [],
    "Veal Veaeng": []
  },
  Ratanakiri: {
    Banlung: [],
    "Andoung Meas": [],
    "Ban Lung": [],
    "Bar Kaev": [],
    "Koun Mom": [],
    Lumphat: [],
    "Ou Chum": [],
    "Ou Ya Dav": [],
    "Ta Veaeng": [],
    "Veun Sai": []
  },
  "Stung Treng": {
    "Stung Treng": [],
    Sesan: [],
    "Siem Bouk": [],
    "Siem Pang": [],
    "Thala Barivat": []
  },
  "Svay Rieng": {
    "Svay Rieng": [],
    Bavet: [],
    "Chantrea": [],
    "Kampong Rou": [],
    "Romeas Haek": [],
    "Rumduol": [],
    "Svay Chrum": []
  },
  Takeo: {
    "Doun Kaev": [],
    "Angkor Borei": [],
    "Bati": [],
    "Borei Cholsar": [],
    "Kiri Vong": [],
    "Koh Andaet": [],
    "Prey Kabbas": [],
    "Samraong": [],
    "Tram Kak": [],
    "Treang": []
  },
  "Tboung Khmum": {
    "Suong": [],
    "Dambae": [],
    "Krouch Chhmar": [],
    "Memot": [],
    "Ou Reang Ov": [],
    "Ponhea Kraek": [],
    "Tboung Khmum": []
  }
};

export const PROVINCES = Object.keys(LOCATIONS);
export const districtsOf = (province: string) =>
  province ? Object.keys(LOCATIONS[province] ?? {}) : [];
export const areasOf = (province: string, district: string) =>
  province && district ? LOCATIONS[province]?.[district] ?? [] : [];

const PROVINCE_COORDS: Record<string, { center: [number, number]; zoom: number }> = {
  "Phnom Penh": { center: [11.5564, 104.9282], zoom: 12 },
  "Preah Sihanouk": { center: [10.6276, 103.5223], zoom: 11 },
  "Kampong Cham": { center: [12.0, 105.4533], zoom: 11 },
  "Siem Reap": { center: [13.3633, 103.8564], zoom: 11 },
  Battambang: { center: [13.0957, 103.2022], zoom: 11 },
  Kandal: { center: [11.4625, 105.0 ], zoom: 11 },
  "Banteay Meanchey": { center: [13.7, 103.0], zoom: 10 },
  "Kampong Chhnang": { center: [12.25, 104.67], zoom: 10 },
  "Kampong Speu": { center: [11.45, 104.52], zoom: 10 },
  "Kampong Thom": { center: [12.71, 104.89], zoom: 10 },
  Kampot: { center: [10.62, 104.18], zoom: 11 },
  Kep: { center: [10.48, 104.32], zoom: 12 },
  "Koh Kong": { center: [11.62, 102.98], zoom: 9 },
  Kratie: { center: [12.48, 106.02], zoom: 10 },
  Mondulkiri: { center: [12.78, 107.10], zoom: 9 },
  "Oddar Meanchey": { center: [14.18, 103.50], zoom: 10 },
  Pailin: { center: [12.85, 102.61], zoom: 11 },
  "Preah Vihear": { center: [13.81, 104.97], zoom: 10 },
  "Prey Veng": { center: [11.49, 105.33], zoom: 10 },
  Pursat: { center: [12.53, 103.92], zoom: 10 },
  Ratanakiri: { center: [13.74, 106.99], zoom: 9 },
  "Stung Treng": { center: [13.53, 105.97], zoom: 10 },
  "Svay Rieng": { center: [11.08, 105.80], zoom: 11 },
  Takeo: { center: [10.99, 104.78], zoom: 10 },
  "Tboung Khmum": { center: [11.95, 105.85], zoom: 10 }
};

const DISTRICT_COORDS: Record<string, { center: [number, number]; zoom: number }> = {
  "Phnom Penh|Boeng Keng Kang": { center: [11.5435, 104.9263], zoom: 14 },
  "Phnom Penh|Chamkar Mon": { center: [11.5460, 104.9213], zoom: 14 },
  "Phnom Penh|Doun Penh": { center: [11.5713, 104.9275], zoom: 14 },
  "Phnom Penh|Tuol Kouk": { center: [11.5751, 104.9050], zoom: 14 },
  "Phnom Penh|Sen Sok": { center: [11.5950, 104.8884], zoom: 13 },
  "Phnom Penh|Mean Chey": { center: [11.5256, 104.9176], zoom: 13 },
  "Phnom Penh|Russey Keo": { center: [11.6042, 104.9151], zoom: 13 },
  "Phnom Penh|Por Senchey": { center: [11.5413, 104.8569], zoom: 13 },
  "Phnom Penh|Chroy Changvar": { center: [11.5917, 104.9354], zoom: 13 },
  "Phnom Penh|Chbar Ampov": { center: [11.5333, 104.9528], zoom: 13 },
  "Phnom Penh|Dangkao": { center: [11.4886, 104.8800], zoom: 12 },
  "Phnom Penh|Kamboul": { center: [11.5114, 104.7969], zoom: 12 },
  "Phnom Penh|Preaek Pnov": { center: [11.6394, 104.9011], zoom: 12 },
  "Phnom Penh|Prampir Meakkakra": { center: [11.5613, 104.9132], zoom: 14 }
};

export function getLocationFocus(loc: {
  province?: string;
  district?: string;
}): { center: [number, number]; zoom: number } | null {
  if (loc.province && loc.district) {
    const key = `${loc.province}|${loc.district}`;
    if (DISTRICT_COORDS[key]) return DISTRICT_COORDS[key];
  }
  if (loc.province && PROVINCE_COORDS[loc.province]) return PROVINCE_COORDS[loc.province];
  return null;
}
