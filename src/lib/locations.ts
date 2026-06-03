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

export const LOCATION_NAMES_KM: Record<string, string> = {
  // Provinces / Cities
  "Phnom Penh": "ភ្នំពេញ",
  "Preah Sihanouk": "ព្រះសីហនុ",
  "Kampong Cham": "កំពង់ចាម",
  "Siem Reap": "សៀមរាប",
  "Battambang": "បាត់ដំបង",
  "Kandal": "កណ្ដាល",
  "Banteay Meanchey": "បន្ទាយមានជ័យ",
  "Kampong Chhnang": "កំពង់ឆ្នាំង",
  "Kampong Speu": "កំពង់ស្ពឺ",
  "Kampong Thom": "កំពង់ធំ",
  "Kampot": "កំពត",
  "Kep": "កែប",
  "Koh Kong": "កោះកុង",
  "Kratie": "ក្រចេះ",
  "Mondulkiri": "មណ្ឌលគីរី",
  "Oddar Meanchey": "អូដ្ឌរមានជ័យ",
  "Pailin": "ប៉ៃលិន",
  "Preah Vihear": "ព្រះវិហារ",
  "Prey Veng": "ព្រៃវែង",
  "Pursat": "ពោធិ៍សាត់",
  "Ratanakiri": "រតនគីរី",
  "Stung Treng": "ស្ទឹងត្រែង",
  "Svay Rieng": "ស្វាយរៀង",
  "Takeo": "តាកែវ",
  "Tboung Khmum": "ត្បូងឃ្មុំ",

  // Phnom Penh districts
  "Boeng Keng Kang": "បឹងកេងកង",
  "Chamkar Mon": "ចំការមន",
  "Chbar Ampov": "ច្បារអំពៅ",
  "Chroy Changvar": "ជ្រោយចង្វារ",
  "Dangkao": "ដងកោ",
  "Doun Penh": "ដូនពេញ",
  "Kamboul": "កំបូល",
  "Mean Chey": "មានជ័យ",
  "Por Senchey": "ពោធ៍សែនជ័យ",
  "Prampir Meakkakra": "ប្រាំពីរមករា",
  "Preaek Pnov": "ព្រែកព្នៅ",
  "Russey Keo": "រស្សីកែវ",
  "Sen Sok": "សែនសុខ",
  "Tuol Kouk": "ទួលគោក",

  // Phnom Penh sangkats — Boeng Keng Kang
  "Boeng Keng Kang Muoy": "បឹងកេងកង១",
  "Boeng Keng Kang Pir": "បឹងកេងកង២",
  "Boeng Keng Kang Bei": "បឹងកេងកង៣",
  "Olympic": "អូឡាំពិក",
  "Tumnob Tuek": "ទំនប់ទឹក",
  "Tuol Svay Prey Muoy": "ទួលស្វាយព្រៃ១",
  "Tuol Svay Prey Pir": "ទួលស្វាយព្រៃ២",

  // Chamkar Mon
  "Boeng Trabaek": "បឹងត្របែក",
  "Phsar Daeum Kor": "ផ្សារដើមគរ",
  "Phsar Daeum Thkov": "ផ្សារដើមថ្កូវ",
  "Tonle Bassac": "ទន្លេបាសាក់",
  "Tuol Tom Poung Muoy": "ទួលទំពូង១",
  "Tuol Tom Poung Pir": "ទួលទំពូង២",

  // Chbar Ampov
  "Chbar Ampov Muoy": "ច្បារអំពៅ១",
  "Chbar Ampov Pir": "ច្បារអំពៅ២",
  "Nirouth": "និរោត",
  "Preaek Pra": "ព្រែកព្រ",
  "Preaek Aeng": "ព្រែកអែង",

  // Chroy Changvar sangkats (same name as district)
  "Bak Kaeng": "បាក់កែង",
  "Preaek Lieb": "ព្រែកលៀប",
  "Preaek Tasek": "ព្រែកតាសេក",

  // Dangkao
  "Cheung Aek": "ជើងអែក",
  "Krang Pongro": "ក្រាំងពង្រ",
  "Pong Tuek": "ពងទឹក",
  "Roluos": "រលួស",

  // Doun Penh
  "Chakto Mukh": "ចក្រមុខ",
  "Chey Chumneah": "ជ័យជំនះ",
  "Phsar Chas": "ផ្សារចាស់",
  "Phsar Kandal Muoy": "ផ្សារកណ្ដាល១",
  "Phsar Kandal Pir": "ផ្សារកណ្ដាល២",
  "Phsar Thmei Muoy": "ផ្សារថ្មី១",
  "Phsar Thmei Pir": "ផ្សារថ្មី២",
  "Phsar Thmei Bei": "ផ្សារថ្មី៣",
  "Srah Chak": "ស្រះចក",
  "Voat Phnum": "វត្តភ្នំ",

  // Kamboul
  "Kantaok": "កន្ទោក",
  "Ovlaok": "អូវ្លោក",
  "Phleung Chheh Roteh": "ភ្លើងឆេះរទេះ",

  // Mean Chey
  "Boeng Tumpun": "បឹងទំពុន",
  "Chak Angrae Kraom": "ចាក់អង្រែក្រោម",
  "Chak Angrae Leu": "ចាក់អង្រែលើ",
  "Stueng Mean Chey": "ស្ទឹងមានជ័យ",

  // Por Senchey
  "Choam Chao": "ចោមចៅ",
  "Kakab": "កកាប",
  "Krang Thnong": "ក្រាំងធ្នង់",
  "Phlov Lvea Aem": "ផ្លូវល្វែអែម",
  "Snao": "ស្នោ",
  "Trapeang Krasang": "ត្រពាំងក្រសាំង",

  // Prampir Meakkakra
  "Boeng Prolit": "បឹងប្រ័ល",
  "Mittakpheap": "មិត្តភាព",
  "Monourom": "មនោរម្យ",
  "Ou Ruessei Muoy": "អូររស្សី១",
  "Ou Ruessei Pir": "អូររស្សី២",
  "Ou Ruessei Bei": "អូររស្សី៣",
  "Ou Ruessei Buon": "អូររស្សី៤",
  "Veal Vong": "វាលវង់",

  // Preaek Pnov
  "Kouk Roka": "គោករកា",
  "Ponhea Pon": "បញ្ញាពន",
  "Samraong": "សំរោង",

  // Russey Keo
  "Chrang Chamreh Muoy": "ឈ្រាំងចំរើហ១",
  "Chrang Chamreh Pir": "ឈ្រាំងចំរើហ២",
  "Kilomaetr Lekh Prammuoy": "គីឡូម៉ែត្រលេខប្រាំមួយ",
  "Tuol Sangkae": "ទួលសង្កែ",

  // Sen Sok
  "Khmuonh": "ឃ្មួញ",
  "Phnom Penh Thmei": "ភ្នំពេញថ្មី",
  "Tuek Thla": "ទឹកថ្លា",
  "Ou Baek K'am": "អូបែកក្អម",

  // Tuol Kouk
  "Boeng Kak Muoy": "បឹងកក់១",
  "Boeng Kak Pir": "បឹងកក់២",
  "Boeng Salang": "បឹងសាឡាង",
  "Toek L'ak Muoy": "ទឹកល្អក់១",
  "Toek L'ak Pir": "ទឹកល្អក់២",
  "Toek L'ak Bei": "ទឹកល្អក់៣",

  // Preah Sihanouk districts
  "Sihanoukville": "ក្រុងព្រះសីហនុ",
  "Stueng Hav": "ស្ទឹងហាវ",
  "Prey Nob": "ព្រៃនប",
  "Kampong Seila": "កំពង់សីឡា",

  // Preah Sihanouk sangkats
  "Sangkat Muoy": "សង្កាត់មួយ",
  "Sangkat Pir": "សង្កាត់ពីរ",
  "Sangkat Bei": "សង្កាត់បី",
  "Sangkat Buon": "សង្កាត់បួន",

  // Kampong Cham districts
  "Batheay": "បាធាយ",
  "Cheung Prey": "ជើងព្រៃ",
  "Kang Meas": "កាំងមាស",
  "Koh Sotin": "កោះសូទិន",
  "Prey Chhor": "ព្រៃឈរ",
  "Srey Santhor": "ស្រីសន្ធរ",
  "Stueng Trang": "ស្ទឹងត្រង់",

  // Kampong Cham sangkats
  "Sambour Meas": "សំបូរមាស",
  "Boeng Kok": "បឹងកក់",

  // Siem Reap districts
  "Angkor Thom": "អង្គរធំ",
  "Banteay Srei": "បន្ទាយស្រី",
  "Chi Kraeng": "ជីក្រែង",
  "Kralanh": "ក្រឡាញ់",
  "Prasat Bakong": "ប្រាសាទបាគង",
  "Pouk": "ពោក",
  "Soutr Nikom": "សូត្រនិគម",
  "Srei Snam": "ស្រីស្នាម",
  "Svay Leu": "ស្វាយលើ",
  "Varin": "វ៉ារីន",

  // Siem Reap sangkats
  "Sala Kamraeuk": "សាលាកំរើក",
  "Svay Dangkum": "ស្វាយដង្គំ",
  "Sla Kram": "ស្លក្រាម",
  "Chreav": "ជ្រាវ",
  "Nokor Thum": "នគរធំ",

  // Battambang districts
  "Banan": "បាណន",
  "Bavel": "បាវិល",
  "Ek Phnom": "ឯកភ្នំ",
  "Kamrieng": "កំរៀង",
  "Koas Krala": "គោះក្រឡ",
  "Mong Ruessei": "មង្គលរស្សី",
  "Phnum Proek": "ភ្នំព្រឹក",
  "Rotonak Mondol": "រតនៈមណ្ឌល",
  "Sampov Loun": "សំពៅលូន",
  "Sangkae": "សង្កែ",
  "Thma Koul": "ថ្មគោល",

  // Battambang sangkats
  "Svay Por": "ស្វាយប៉ោ",
  "Ratanak": "រតនៈ",
  "Tuol Ta Ek": "ទួលតា​ឯក",
  "Chamkar Samraong": "ចំការសំរោង",

  // Kandal districts
  "Ta Khmau": "តាខ្មៅ",
  "Kandal Stueng": "កណ្ដាលស្ទឹង",
  "Kien Svay": "គៀនស្វាយ",
  "Khsach Kandal": "ខ្សាច់កណ្ដាល",
  "Koh Thom": "កោះធំ",
  "Leuk Daek": "លើកដែក",
  "Lvea Aem": "ល្វាអែម",
  "Mukh Kampul": "មុខកំពូល",
  "Ponhea Lueu": "បញ្ញាលើ",
  "Sa'ang": "ស្អាង",

  // Banteay Meanchey districts
  "Serei Saophoan": "សិរីសោភ័ណ",
  "Poipet": "ប៉ោយប៉ែត",
  "Mongkol Borei": "មង្គលបូរី",
  "O Chrov": "អូរជ្រូវ",
  "Phnum Srok": "ភ្នំស្រក",
  "Preah Netr Preah": "ព្រះនេត្រព្រះ",
  "Svay Chek": "ស្វាយជេក",
  "Thma Puok": "ថ្មពួក",

  // Kampong Chhnang districts
  "Baribour": "បារីបូរ",
  "Chol Kiri": "ជ្រៃគីរី",
  "Kampong Leaeng": "កំពង់ឡាំង",
  "Kampong Tralach": "កំពង់ត្រឡាច",
  "Rolea Bier": "រលាបៀរ",
  "Sameakki Mean Chey": "សាមគ្គីមានជ័យ",
  "Tuek Phos": "ទឹកផុស",

  // Kampong Speu districts
  "Chbar Mon": "ច្បារមន",
  "Basedth": "បាសែត",
  "Kong Pisei": "គងពិសី",
  "Phnum Sruoch": "ភ្នំស្រូច",
  "Samraong Tong": "សំរោងទង",
  "Thpong": "ថ្ពង",
  "Aoral": "អូរ៉ាល",
  "Borseth": "បូរសែត",

  // Kampong Thom districts
  "Stueng Saen": "ស្ទឹងសែន",
  "Baray": "បារាយណ៍",
  "Kampong Svay": "កំពង់ស្វាយ",
  "Prasat Balangk": "ប្រាសាទបាឡង់",
  "Prasat Sambour": "ប្រាសាទសំបូរ",
  "Sandan": "សណ្ដាន",
  "Santuk": "សន្ទុក",
  "Stoung": "ស្ទោង",

  // Kampot districts
  "Angkor Chey": "អង្គរជ័យ",
  "Banteay Meas": "បន្ទាយមាស",
  "Chhuk": "ឈូក",
  "Chum Kiri": "ជំគីរី",
  "Dang Tong": "ដំទង",
  "Kampong Trach": "កំពង់ត្រាច",
  "Tuek Chhou": "ទឹកឈូ",

  // Kep districts
  "Damnak Chang'aeur": "ដំណាក់ចង្អែរ",

  // Koh Kong districts
  "Khemarak Phoumin": "ខេមរភូមិន្ទ",
  "Botum Sakor": "បូតុំសាគរ",
  "Kiri Sakor": "គីរីស្មរ",
  "Mondol Seima": "មណ្ឌលសីមា",
  "Smach Mean Chey": "ស្មាច់មានជ័យ",
  "Srae Ambel": "ស្រែអំបិល",
  "Thma Bang": "ថ្មបាំង",

  // Kratie districts
  "Chhloung": "ឆ្លូង",
  "Preaek Prasab": "ព្រែកព្រសប",
  "Sambour": "សំបូរ",
  "Snuol": "ស្នួល",

  // Mondulkiri districts
  "Saen Monourom": "សែនមនោរម្យ",
  "Kaev Seima": "កែវស៊ីម៉ា",
  "Kaoh Nheaek": "កោះណ្ហែក",
  "Ou Reang": "អូររាំង",
  "Pech Chreada": "ពេជ្រជ្រាដ",

  // Oddar Meanchey districts
  "Anlong Veaeng": "អន្លង់វែង",
  "Banteay Ampil": "បន្ទាយអំពិល",
  "Chong Kal": "ជោងកាល",
  "Trapeang Prasat": "ត្រពាំងប្រាសាទ",

  // Pailin districts
  "Sala Krau": "សាលាក្រៅ",

  // Preah Vihear districts
  "Tbeng Meanchey": "ត្បែងមានជ័យ",
  "Chey Saen": "ជ័យសែន",
  "Chhaeb": "ឆែប",
  "Kuleaen": "គូឡែន",
  "Rovieng": "រវៀង",
  "Sangkum Thmei": "សង្គមថ្មី",
  "Choam Ksant": "ជោងខ្សាំ",

  // Prey Veng districts
  "Ba Phnum": "បាភ្នំ",
  "Kamchay Mear": "កំចាយមារ",
  "Kampong Trabaek": "កំពង់ត្របែក",
  "Mesang": "មេស្អាង",
  "Peam Chor": "ពាមជរ",
  "Peam Ro": "ពាមរោ",
  "Pea Reang": "ពាររាំង",

  // Pursat districts
  "Bakan": "បាកាន",
  "Kandieng": "កណ្ដៀង",
  "Krakor": "ក្រករ",
  "Phnum Kravanh": "ភ្នំក្រវាញ",
  "Veal Veaeng": "វាលវែង",

  // Ratanakiri districts
  "Banlung": "បានលូង",
  "Andoung Meas": "អណ្ដូងមាស",
  "Ban Lung": "បានលូង",
  "Bar Kaev": "បាក្រប",
  "Koun Mom": "គួនម៉ំ",
  "Lumphat": "លំផត",
  "Ou Chum": "អូរជុំ",
  "Ou Ya Dav": "អូរយ៉ាដាវ",
  "Ta Veaeng": "តាវែង",
  "Veun Sai": "វើនស៊ាយ",

  // Stung Treng districts
  "Sesan": "សេសាន",
  "Siem Bouk": "សៀមបូក",
  "Siem Pang": "សៀមប៉ាង",
  "Thala Barivat": "ថាឡាបរីវ៉ាត",

  // Svay Rieng districts
  "Bavet": "បាវែត",
  "Chantrea": "ចន្ទ្រា",
  "Kampong Rou": "កំពង់រោ",
  "Romeas Haek": "រមាសហែក",
  "Rumduol": "រំដួល",
  "Svay Chrum": "ស្វាយជ្រំ",

  // Takeo districts
  "Doun Kaev": "ដូនកែវ",
  "Angkor Borei": "អង្គរបុរី",
  "Bati": "បាទី",
  "Borei Cholsar": "បូរីជ្រោះ",
  "Kiri Vong": "គីរីវង្ស",
  "Koh Andaet": "កោះអណ្ដែត",
  "Prey Kabbas": "ព្រៃកប្បាស",
  "Tram Kak": "ត្រាំកក",
  "Treang": "ត្រាំង",

  // Tboung Khmum districts
  "Suong": "ស្ទោ",
  "Dambae": "ដំបែ",
  "Krouch Chhmar": "ក្រូចឆ្មារ",
  "Memot": "មេមត",
  "Ou Reang Ov": "អូររាំងអូវ",
  "Ponhea Kraek": "បញ្ញាក្រែក"
};

export function locationDisplayName(key: string, lang: "km" | "en"): string {
  if (lang === "km") return LOCATION_NAMES_KM[key] ?? key;
  return key;
}

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
