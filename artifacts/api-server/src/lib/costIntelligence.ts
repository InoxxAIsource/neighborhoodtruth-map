/**
 * City-aware cost intelligence data and logic
 * Uses crowd-sourced cost level + city baselines to estimate local prices
 */

interface CityData {
  name: string;
  currency: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  // Base prices at "$$" level
  coffee: [number, number];
  lunch: [number, number];
  dinner: [number, number];
  groceries: [number, number];
  rent1br: [number, number];
  transportLocal: [number, number];
  transportModes: TransportMode[];
}

interface TransportMode {
  mode: string;
  emoji: string;
  baseCostPerKm: number;
  baseCostFixed: number;
  speedKmh: number;
}

const CITY_DATA: CityData[] = [
  {
    name: "New York", currency: "$",
    latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7,
    coffee: [4, 7], lunch: [15, 30], dinner: [40, 90], groceries: [120, 200], rent1br: [2800, 4500],
    transportLocal: [3, 6],
    transportModes: [
      { mode: "Subway", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 2.9, speedKmh: 25 },
      { mode: "Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 2.9, speedKmh: 15 },
      { mode: "Taxi/Uber", emoji: "🚕", baseCostPerKm: 2.1, baseCostFixed: 3.5, speedKmh: 22 },
    ],
  },
  {
    name: "San Francisco", currency: "$",
    latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3,
    coffee: [5, 8], lunch: [18, 35], dinner: [45, 100], groceries: [130, 220], rent1br: [3000, 5000],
    transportLocal: [3, 7],
    transportModes: [
      { mode: "BART/Muni", emoji: "🚇", baseCostPerKm: 0.22, baseCostFixed: 2.5, speedKmh: 25 },
      { mode: "Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 2.5, speedKmh: 14 },
      { mode: "Uber/Lyft", emoji: "🚕", baseCostPerKm: 2.3, baseCostFixed: 3.5, speedKmh: 20 },
    ],
  },
  {
    name: "Los Angeles", currency: "$",
    latMin: 33.7, latMax: 34.4, lngMin: -118.7, lngMax: -118.0,
    coffee: [4, 7], lunch: [14, 28], dinner: [35, 80], groceries: [115, 190], rent1br: [2200, 3800],
    transportLocal: [2, 5],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 1.75, speedKmh: 28 },
      { mode: "Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 1.75, speedKmh: 14 },
      { mode: "Uber/Lyft", emoji: "🚕", baseCostPerKm: 1.9, baseCostFixed: 3, speedKmh: 22 },
    ],
  },
  {
    name: "London", currency: "£",
    latMin: 51.3, latMax: 51.7, lngMin: -0.3, lngMax: 0.1,
    coffee: [3, 5], lunch: [10, 20], dinner: [30, 70], groceries: [70, 130], rent1br: [1800, 3200],
    transportLocal: [2, 5],
    transportModes: [
      { mode: "Tube", emoji: "🚇", baseCostPerKm: 0.35, baseCostFixed: 2.8, speedKmh: 32 },
      { mode: "Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 1.75, speedKmh: 12 },
      { mode: "Black Cab/Uber", emoji: "🚕", baseCostPerKm: 2.8, baseCostFixed: 4, speedKmh: 20 },
    ],
  },
  {
    name: "Tokyo", currency: "¥",
    latMin: 35.5, latMax: 35.8, lngMin: 139.5, lngMax: 139.9,
    coffee: [400, 700], lunch: [800, 1500], dinner: [2500, 6000], groceries: [6000, 10000], rent1br: [80000, 150000],
    transportLocal: [200, 500],
    transportModes: [
      { mode: "Metro/JR", emoji: "🚇", baseCostPerKm: 18, baseCostFixed: 140, speedKmh: 35 },
      { mode: "Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 210, speedKmh: 18 },
      { mode: "Taxi", emoji: "🚕", baseCostPerKm: 80, baseCostFixed: 500, speedKmh: 25 },
    ],
  },
  {
    name: "Seoul", currency: "₩",
    latMin: 37.4, latMax: 37.7, lngMin: 126.8, lngMax: 127.3,
    coffee: [3500, 6000], lunch: [8000, 15000], dinner: [20000, 50000], groceries: [50000, 90000], rent1br: [700000, 1500000],
    transportLocal: [1200, 2500],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 40, baseCostFixed: 1250, speedKmh: 35 },
      { mode: "Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 1200, speedKmh: 20 },
      { mode: "Taxi/Kakao", emoji: "🚕", baseCostPerKm: 800, baseCostFixed: 4800, speedKmh: 28 },
    ],
  },
  {
    name: "Amsterdam", currency: "€",
    latMin: 52.3, latMax: 52.5, lngMin: 4.7, lngMax: 5.1,
    coffee: [3, 5], lunch: [12, 22], dinner: [30, 65], groceries: [80, 140], rent1br: [1600, 2800],
    transportLocal: [2, 4],
    transportModes: [
      { mode: "Tram/Metro", emoji: "🚇", baseCostPerKm: 0.18, baseCostFixed: 1.8, speedKmh: 20 },
      { mode: "Bicycle", emoji: "🚲", baseCostPerKm: 0, baseCostFixed: 0, speedKmh: 15 },
      { mode: "Taxi/Uber", emoji: "🚕", baseCostPerKm: 2.2, baseCostFixed: 3.5, speedKmh: 22 },
    ],
  },
  {
    name: "Mexico City", currency: "MX$",
    latMin: 19.2, latMax: 19.6, lngMin: -99.4, lngMax: -98.9,
    coffee: [50, 100], lunch: [80, 180], dinner: [250, 600], groceries: [700, 1300], rent1br: [12000, 25000],
    transportLocal: [6, 15],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 5, speedKmh: 30 },
      { mode: "Microbús/Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 8, speedKmh: 16 },
      { mode: "Uber/Didi", emoji: "🚕", baseCostPerKm: 8, baseCostFixed: 30, speedKmh: 22 },
    ],
  },
  {
    name: "Buenos Aires", currency: "AR$",
    latMin: -34.8, latMax: -34.4, lngMin: -58.7, lngMax: -58.2,
    coffee: [1500, 3000], lunch: [3000, 7000], dinner: [8000, 20000], groceries: [20000, 40000], rent1br: [300000, 600000],
    transportLocal: [300, 600],
    transportModes: [
      { mode: "Subte", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 70, speedKmh: 28 },
      { mode: "Colectivo", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 70, speedKmh: 15 },
      { mode: "Taxi/Cabify", emoji: "🚕", baseCostPerKm: 180, baseCostFixed: 500, speedKmh: 22 },
    ],
  },
  {
    name: "Toronto", currency: "CA$",
    latMin: 43.5, latMax: 43.9, lngMin: -79.7, lngMax: -79.1,
    coffee: [4, 7], lunch: [14, 25], dinner: [35, 75], groceries: [100, 180], rent1br: [2000, 3500],
    transportLocal: [3, 6],
    transportModes: [
      { mode: "TTC Subway", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 3.3, speedKmh: 30 },
      { mode: "Bus/Streetcar", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 3.3, speedKmh: 14 },
      { mode: "Uber/Lyft", emoji: "🚕", baseCostPerKm: 1.8, baseCostFixed: 3.5, speedKmh: 22 },
    ],
  },
  {
    name: "Hong Kong", currency: "HK$",
    latMin: 22.1, latMax: 22.6, lngMin: 113.9, lngMax: 114.5,
    coffee: [30, 55], lunch: [60, 130], dinner: [200, 500], groceries: [600, 1100], rent1br: [15000, 30000],
    transportLocal: [10, 25],
    transportModes: [
      { mode: "MTR", emoji: "🚇", baseCostPerKm: 0.8, baseCostFixed: 4.5, speedKmh: 40 },
      { mode: "Bus/Minibus", emoji: "🚌", baseCostPerKm: 0.5, baseCostFixed: 3.5, speedKmh: 18 },
      { mode: "Taxi", emoji: "🚕", baseCostPerKm: 9.5, baseCostFixed: 27, speedKmh: 25 },
    ],
  },
  {
    name: "Bali", currency: "IDR",
    latMin: -8.9, latMax: -8.3, lngMin: 115.0, lngMax: 115.5,
    coffee: [30000, 60000], lunch: [25000, 80000], dinner: [100000, 300000], groceries: [200000, 450000], rent1br: [4000000, 12000000],
    transportLocal: [20000, 50000],
    transportModes: [
      { mode: "Scooter rental", emoji: "🛵", baseCostPerKm: 0, baseCostFixed: 60000, speedKmh: 30 },
      { mode: "Ojek (moto)", emoji: "🏍️", baseCostPerKm: 3000, baseCostFixed: 10000, speedKmh: 30 },
      { mode: "Taxi/Grab", emoji: "🚕", baseCostPerKm: 4000, baseCostFixed: 20000, speedKmh: 25 },
    ],
  },
  {
    name: "Cape Town", currency: "R",
    latMin: -34.2, latMax: -33.7, lngMin: 18.3, lngMax: 18.7,
    coffee: [40, 80], lunch: [100, 200], dinner: [300, 700], groceries: [700, 1300], rent1br: [12000, 25000],
    transportLocal: [20, 50],
    transportModes: [
      { mode: "MyCiTi Bus", emoji: "🚌", baseCostPerKm: 1.5, baseCostFixed: 7, speedKmh: 20 },
      { mode: "Minibus taxi", emoji: "🚐", baseCostPerKm: 0.8, baseCostFixed: 10, speedKmh: 22 },
      { mode: "Uber/Bolt", emoji: "🚕", baseCostPerKm: 12, baseCostFixed: 25, speedKmh: 28 },
    ],
  },
  {
    name: "Rome", currency: "€",
    latMin: 41.7, latMax: 42.1, lngMin: 12.3, lngMax: 12.7,
    coffee: [1.5, 3], lunch: [10, 20], dinner: [25, 60], groceries: [70, 130], rent1br: [1000, 2200],
    transportLocal: [1, 3],
    transportModes: [
      { mode: "Metro/Bus", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 1.5, speedKmh: 18 },
      { mode: "Tram", emoji: "🚊", baseCostPerKm: 0, baseCostFixed: 1.5, speedKmh: 15 },
      { mode: "Taxi/Uber", emoji: "🚕", baseCostPerKm: 1.5, baseCostFixed: 3.5, speedKmh: 22 },
    ],
  },
  {
    name: "Istanbul", currency: "₺",
    latMin: 40.8, latMax: 41.3, lngMin: 28.6, lngMax: 29.5,
    coffee: [50, 120], lunch: [100, 250], dinner: [350, 800], groceries: [800, 1600], rent1br: [15000, 35000],
    transportLocal: [25, 60],
    transportModes: [
      { mode: "Metro/Metrobus", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 25, speedKmh: 30 },
      { mode: "Bus/Minibus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 25, speedKmh: 18 },
      { mode: "Taksi/Uber", emoji: "🚕", baseCostPerKm: 25, baseCostFixed: 50, speedKmh: 22 },
    ],
  },
  {
    name: "Cairo", currency: "EGP",
    latMin: 29.9, latMax: 30.2, lngMin: 31.1, lngMax: 31.5,
    coffee: [40, 100], lunch: [60, 150], dinner: [250, 700], groceries: [500, 1000], rent1br: [8000, 20000],
    transportLocal: [15, 40],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 10, speedKmh: 35 },
      { mode: "Bus/Microbus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 5, speedKmh: 18 },
      { mode: "Uber/Careem", emoji: "🚕", baseCostPerKm: 10, baseCostFixed: 20, speedKmh: 22 },
    ],
  },
  {
    name: "Tehran", currency: "IRR",
    latMin: 35.5, latMax: 36.0, lngMin: 51.0, lngMax: 51.7,
    coffee: [80000, 200000], lunch: [200000, 500000], dinner: [700000, 2000000], groceries: [1500000, 3000000], rent1br: [25000000, 60000000],
    transportLocal: [50000, 100000],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 50000, speedKmh: 35 },
      { mode: "Bus/BRT", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 30000, speedKmh: 18 },
      { mode: "Snapp/Tapsi", emoji: "🚕", baseCostPerKm: 50000, baseCostFixed: 100000, speedKmh: 25 },
    ],
  },
  {
    name: "Tel Aviv", currency: "₪",
    latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.05,
    coffee: [12, 20], lunch: [40, 80], dinner: [100, 220], groceries: [300, 550], rent1br: [5500, 10000],
    transportLocal: [6, 12],
    transportModes: [
      { mode: "Bus (Egged/Dan)", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 5.5, speedKmh: 18 },
      { mode: "Light Rail", emoji: "🚊", baseCostPerKm: 0.3, baseCostFixed: 4, speedKmh: 22 },
      { mode: "Taxi/Gett", emoji: "🚕", baseCostPerKm: 4, baseCostFixed: 12, speedKmh: 25 },
    ],
  },
  {
    name: "Jerusalem", currency: "₪",
    latMin: 31.6, latMax: 31.9, lngMin: 35.1, lngMax: 35.4,
    coffee: [10, 18], lunch: [35, 70], dinner: [80, 180], groceries: [250, 480], rent1br: [4500, 8000],
    transportLocal: [5, 12],
    transportModes: [
      { mode: "Bus (Egged)", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 5.5, speedKmh: 18 },
      { mode: "Light Rail", emoji: "🚊", baseCostPerKm: 0, baseCostFixed: 4.5, speedKmh: 20 },
      { mode: "Taxi", emoji: "🚕", baseCostPerKm: 4, baseCostFixed: 15, speedKmh: 22 },
    ],
  },
  {
    name: "Karachi", currency: "PKR",
    latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.4,
    coffee: [300, 700], lunch: [400, 1000], dinner: [1500, 4000], groceries: [3000, 7000], rent1br: [40000, 100000],
    transportLocal: [50, 150],
    transportModes: [
      { mode: "Bus/BRT", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 50, speedKmh: 18 },
      { mode: "Rickshaw", emoji: "🛺", baseCostPerKm: 30, baseCostFixed: 100, speedKmh: 20 },
      { mode: "Uber/InDriver", emoji: "🚕", baseCostPerKm: 50, baseCostFixed: 100, speedKmh: 25 },
    ],
  },
  {
    name: "Lahore", currency: "PKR",
    latMin: 31.3, latMax: 31.7, lngMin: 74.1, lngMax: 74.5,
    coffee: [300, 600], lunch: [350, 900], dinner: [1200, 3500], groceries: [2500, 6000], rent1br: [35000, 90000],
    transportLocal: [50, 130],
    transportModes: [
      { mode: "Metro Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 30, speedKmh: 25 },
      { mode: "Rickshaw", emoji: "🛺", baseCostPerKm: 25, baseCostFixed: 80, speedKmh: 18 },
      { mode: "Uber/Careem", emoji: "🚕", baseCostPerKm: 40, baseCostFixed: 80, speedKmh: 25 },
    ],
  },
  // Indian cities
  {
    name: "Mumbai", currency: "₹",
    latMin: 18.7, latMax: 19.4, lngMin: 72.4, lngMax: 73.3,
    coffee: [80, 200], lunch: [150, 400], dinner: [600, 2000], groceries: [2000, 4000], rent1br: [35000, 80000],
    transportLocal: [30, 80],
    transportModes: [
      { mode: "Local Train", emoji: "🚂", baseCostPerKm: 0.5, baseCostFixed: 10, speedKmh: 40 },
      { mode: "Metro/Bus", emoji: "🚇", baseCostPerKm: 0, baseCostFixed: 40, speedKmh: 25 },
      { mode: "Ola/Uber", emoji: "🚕", baseCostPerKm: 14, baseCostFixed: 50, speedKmh: 22 },
    ],
  },
  {
    name: "Delhi", currency: "₹",
    latMin: 28.3, latMax: 29.1, lngMin: 76.7, lngMax: 77.5,
    coffee: [60, 180], lunch: [120, 350], dinner: [500, 1800], groceries: [1800, 3500], rent1br: [25000, 65000],
    transportLocal: [20, 70],
    transportModes: [
      { mode: "Delhi Metro", emoji: "🚇", baseCostPerKm: 3, baseCostFixed: 10, speedKmh: 40 },
      { mode: "DTC Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 15, speedKmh: 18 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 12, baseCostFixed: 30, speedKmh: 22 },
    ],
  },
  {
    name: "Bangalore", currency: "₹",
    latMin: 12.5, latMax: 13.4, lngMin: 77.2, lngMax: 78.0,
    coffee: [70, 190], lunch: [130, 370], dinner: [550, 1800], groceries: [1900, 3800], rent1br: [25000, 60000],
    transportLocal: [20, 65],
    transportModes: [
      { mode: "Namma Metro", emoji: "🚇", baseCostPerKm: 2.5, baseCostFixed: 10, speedKmh: 38 },
      { mode: "BMTC Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 10, speedKmh: 16 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 13, baseCostFixed: 35, speedKmh: 20 },
    ],
  },
  {
    name: "Hyderabad", currency: "₹",
    latMin: 16.9, latMax: 17.8, lngMin: 78.0, lngMax: 78.9,
    coffee: [60, 160], lunch: [100, 300], dinner: [450, 1500], groceries: [1700, 3200], rent1br: [18000, 50000],
    transportLocal: [15, 55],
    transportModes: [
      { mode: "Metro (HMRL)", emoji: "🚇", baseCostPerKm: 2.5, baseCostFixed: 10, speedKmh: 38 },
      { mode: "TSRTC Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 12, speedKmh: 18 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 12, baseCostFixed: 30, speedKmh: 22 },
    ],
  },
  {
    name: "Chennai", currency: "₹",
    latMin: 12.6, latMax: 13.5, lngMin: 79.8, lngMax: 80.8,
    coffee: [60, 160], lunch: [100, 280], dinner: [400, 1400], groceries: [1600, 3000], rent1br: [18000, 45000],
    transportLocal: [15, 50],
    transportModes: [
      { mode: "Chennai Metro", emoji: "🚇", baseCostPerKm: 2, baseCostFixed: 10, speedKmh: 38 },
      { mode: "MTC Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 10, speedKmh: 16 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 12, baseCostFixed: 25, speedKmh: 20 },
    ],
  },
  {
    name: "Kolkata", currency: "₹",
    latMin: 22.1, latMax: 22.9, lngMin: 88.0, lngMax: 88.8,
    coffee: [50, 130], lunch: [80, 250], dinner: [300, 1200], groceries: [1400, 2800], rent1br: [12000, 35000],
    transportLocal: [10, 40],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 1.5, baseCostFixed: 5, speedKmh: 30 },
      { mode: "Bus/Tram", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 8, speedKmh: 14 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 10, baseCostFixed: 20, speedKmh: 20 },
    ],
  },
  {
    name: "Pune", currency: "₹",
    latMin: 18.0, latMax: 18.9, lngMin: 73.4, lngMax: 74.3,
    coffee: [70, 170], lunch: [120, 320], dinner: [450, 1500], groceries: [1700, 3200], rent1br: [18000, 50000],
    transportLocal: [15, 50],
    transportModes: [
      { mode: "PMPML Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 12, speedKmh: 18 },
      { mode: "Auto rickshaw", emoji: "🛺", baseCostPerKm: 12, baseCostFixed: 25, speedKmh: 22 },
      { mode: "Ola/Uber", emoji: "🚕", baseCostPerKm: 12, baseCostFixed: 35, speedKmh: 22 },
    ],
  },
  {
    name: "Ahmedabad", currency: "₹",
    latMin: 22.5, latMax: 23.3, lngMin: 72.3, lngMax: 73.2,
    coffee: [50, 130], lunch: [90, 250], dinner: [350, 1200], groceries: [1400, 2700], rent1br: [12000, 35000],
    transportLocal: [10, 40],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 2, baseCostFixed: 10, speedKmh: 35 },
      { mode: "AMTS/BRTS", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 10, speedKmh: 20 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 10, baseCostFixed: 20, speedKmh: 22 },
    ],
  },
  {
    name: "Jaipur", currency: "₹",
    latMin: 26.4, latMax: 27.2, lngMin: 75.4, lngMax: 76.2,
    coffee: [50, 130], lunch: [90, 250], dinner: [350, 1200], groceries: [1300, 2600], rent1br: [10000, 30000],
    transportLocal: [10, 40],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 1.5, baseCostFixed: 10, speedKmh: 35 },
      { mode: "City Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 10, speedKmh: 16 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 10, baseCostFixed: 20, speedKmh: 22 },
    ],
  },
  {
    name: "Lucknow", currency: "₹",
    latMin: 26.3, latMax: 27.1, lngMin: 80.5, lngMax: 81.3,
    coffee: [50, 120], lunch: [80, 220], dinner: [300, 1000], groceries: [1200, 2400], rent1br: [10000, 28000],
    transportLocal: [10, 35],
    transportModes: [
      { mode: "Metro", emoji: "🚇", baseCostPerKm: 1.5, baseCostFixed: 10, speedKmh: 35 },
      { mode: "City Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 8, speedKmh: 16 },
      { mode: "Auto/Ola/Uber", emoji: "🛺", baseCostPerKm: 9, baseCostFixed: 20, speedKmh: 20 },
    ],
  },
  {
    name: "Chandigarh", currency: "₹",
    latMin: 30.3, latMax: 31.1, lngMin: 76.3, lngMax: 77.2,
    coffee: [60, 150], lunch: [100, 280], dinner: [400, 1300], groceries: [1500, 2900], rent1br: [12000, 32000],
    transportLocal: [12, 40],
    transportModes: [
      { mode: "CTU Bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 10, speedKmh: 18 },
      { mode: "Auto rickshaw", emoji: "🛺", baseCostPerKm: 10, baseCostFixed: 20, speedKmh: 22 },
      { mode: "Ola/Uber", emoji: "🚕", baseCostPerKm: 11, baseCostFixed: 30, speedKmh: 25 },
    ],
  },
  {
    name: "Goa", currency: "₹",
    latMin: 14.8, latMax: 15.8, lngMin: 73.3, lngMax: 74.3,
    coffee: [80, 200], lunch: [150, 400], dinner: [600, 2000], groceries: [1800, 3500], rent1br: [18000, 55000],
    transportLocal: [30, 80],
    transportModes: [
      { mode: "Scooter rental", emoji: "🛵", baseCostPerKm: 0, baseCostFixed: 400, speedKmh: 35 },
      { mode: "Local bus", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 20, speedKmh: 20 },
      { mode: "Ola/Uber", emoji: "🚕", baseCostPerKm: 15, baseCostFixed: 50, speedKmh: 30 },
    ],
  },
  {
    name: "Indore", currency: "₹",
    latMin: 22.2, latMax: 23.0, lngMin: 75.4, lngMax: 76.2,
    coffee: [50, 130], lunch: [80, 230], dinner: [300, 1100], groceries: [1200, 2500], rent1br: [9000, 26000],
    transportLocal: [10, 35],
    transportModes: [
      { mode: "City bus/BRT", emoji: "🚌", baseCostPerKm: 0, baseCostFixed: 8, speedKmh: 20 },
      { mode: "Auto rickshaw", emoji: "🛺", baseCostPerKm: 9, baseCostFixed: 20, speedKmh: 20 },
      { mode: "Ola/Uber", emoji: "🚕", baseCostPerKm: 10, baseCostFixed: 25, speedKmh: 22 },
    ],
  },
];

const COST_MULTIPLIERS: Record<string, [number, number]> = {
  "$":    [0.55, 0.75],
  "$$":   [0.85, 1.0],
  "$$$":  [1.3,  1.7],
  "$$$$": [2.0,  3.0],
};

function applyMultiplier(base: [number, number], mult: [number, number]): [number, number] {
  return [
    Math.round(base[0] * mult[0]),
    Math.round(base[1] * mult[1]),
  ];
}

function formatRange(range: [number, number], currency: string): string {
  return `${currency}${range[0].toLocaleString()}–${currency}${range[1].toLocaleString()}`;
}

export function detectCity(lat: number, lng: number): CityData | null {
  return CITY_DATA.find(
    (c) => lat >= c.latMin && lat <= c.latMax && lng >= c.lngMin && lng <= c.lngMax
  ) ?? null;
}

export interface CostIntelligenceResult {
  city: string;
  currency: string;
  costLevel: string;
  items: {
    label: string;
    emoji: string;
    range: string;
  }[];
}

export function computeCostIntelligence(lat: number, lng: number, costLevel: string): CostIntelligenceResult | null {
  const city = detectCity(lat, lng);
  if (!city) return null;

  const mult = COST_MULTIPLIERS[costLevel] ?? COST_MULTIPLIERS["$$"];

  return {
    city: city.name,
    currency: city.currency,
    costLevel,
    items: [
      { label: "Coffee", emoji: "☕", range: formatRange(applyMultiplier(city.coffee, mult), city.currency) },
      { label: "Casual lunch", emoji: "🍜", range: formatRange(applyMultiplier(city.lunch, mult), city.currency) },
      { label: "Nice dinner", emoji: "🍷", range: formatRange(applyMultiplier(city.dinner, mult), city.currency) },
      { label: "Groceries/week", emoji: "🛒", range: formatRange(applyMultiplier(city.groceries, mult), city.currency) },
      { label: "1BR rent/mo", emoji: "🏠", range: formatRange(applyMultiplier(city.rent1br, mult), city.currency) },
    ],
  };
}

export interface TransportEstimateResult {
  distanceKm: number;
  fromCity: string;
  currency: string;
  modes: {
    mode: string;
    emoji: string;
    costRange: string;
    timeMin: number;
  }[];
}

export function computeTransportEstimate(
  fromLat: number,
  fromLng: number,
  distanceKm: number,
  routeDurationSec: number | null = null,
): TransportEstimateResult | null {
  const city = detectCity(fromLat, fromLng);
  if (!city) return null;

  // Base travel time from OSRM route duration (driving baseline) or fallback from speed
  const drivingBaseMin = routeDurationSec != null
    ? Math.ceil(routeDurationSec / 60)
    : Math.ceil((distanceKm / 22) * 60);

  const modes = city.transportModes.map((m) => {
    const costMin = Math.round(m.baseCostFixed + distanceKm * m.baseCostPerKm * 0.9);
    const costMax = Math.round(m.baseCostFixed * 1.2 + distanceKm * m.baseCostPerKm * 1.3);

    // Adjust transit travel time relative to driving baseline
    // Metro/rail typically faster, bus slower in traffic, ride-share ≈ driving
    let timeMin: number;
    if (m.speedKmh >= 35) {
      // Rail/metro: faster than driving (fewer stops, no traffic)
      timeMin = Math.ceil(drivingBaseMin * 0.85 + 5);
    } else if (m.speedKmh >= 25) {
      // Ride-share/taxi: approx same as driving route
      timeMin = drivingBaseMin;
    } else {
      // Bus/local: slower due to stops and shared roads
      timeMin = Math.ceil(drivingBaseMin * 1.5 + 5);
    }

    return {
      mode: m.mode,
      emoji: m.emoji,
      costRange: costMin === costMax || m.baseCostPerKm === 0
        ? `${city.currency}${costMin}`
        : `${city.currency}${costMin}–${city.currency}${costMax}`,
      timeMin,
    };
  });

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    fromCity: city.name,
    currency: city.currency,
    modes,
  };
}
