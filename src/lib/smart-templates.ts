import type { AssetCategory } from '@/src/types/database';

export type SmartField = {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiline';
  options?: { value: string; label: string }[];
  required?: boolean;
};

export type SuggestedReminder = {
  title: string;
  description: string;
  frequencyType: 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'once';
  defaultEnabled: boolean;
};

export type SmartCategory = {
  id: string;
  icon: string;
  label: string;
  description: string;
  assetCategory: AssetCategory;
  suggestedRoom?: string;
  /** If true, the add flow asks "Which room?" */
  askRoom: boolean;
  /** If true, show camera/upload for label scan */
  offerPhotoScan: boolean;
  /** Custom fields for this category (beyond name) */
  fields: SmartField[];
  /** Reminders to suggest after adding */
  reminders: SuggestedReminder[];
  /** Common items in this category for quick-add */
  quickItems?: string[];
};

export const SMART_CATEGORIES: SmartCategory[] = [
  {
    id: 'appliance',
    icon: '📦',
    label: 'Appliance',
    description: 'Kitchen and household appliances',
    assetCategory: 'appliance',
    askRoom: true,
    offerPhotoScan: true,
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'serial_number', label: 'Serial number', type: 'text' },
      { key: 'retailer', label: 'Where did you buy it?', type: 'text' },
      { key: 'purchase_date', label: 'Purchase date', type: 'date' },
      { key: 'purchase_price', label: 'Price (£)', type: 'number' },
      { key: 'warranty_expiry', label: 'Warranty expiry', type: 'date' },
    ],
    reminders: [
      { title: 'Clean filter', description: 'Clean the appliance filter', frequencyType: 'monthly', defaultEnabled: false },
    ],
    quickItems: ['Dishwasher', 'Washing machine', 'Fridge-freezer', 'Oven', 'Microwave', 'Tumble dryer', 'Kettle', 'Coffee machine'],
  },
  {
    id: 'boiler',
    icon: '🔥',
    label: 'Heating & hot water',
    description: 'Boiler, radiators, thermostat',
    assetCategory: 'heating',
    suggestedRoom: 'Kitchen',
    askRoom: true,
    offerPhotoScan: true,
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'serial_number', label: 'Serial number', type: 'text' },
      { key: 'last_service', label: 'Last serviced', type: 'date' },
      { key: 'warranty_expiry', label: 'Warranty/guarantee expiry', type: 'date' },
    ],
    reminders: [
      { title: 'Annual boiler service', description: 'Book your annual boiler service', frequencyType: 'annual', defaultEnabled: true },
      { title: 'Gas safety certificate', description: 'Renew your gas safety certificate', frequencyType: 'annual', defaultEnabled: true },
      { title: 'Check boiler pressure', description: 'Check the pressure gauge is in the green zone', frequencyType: 'monthly', defaultEnabled: false },
    ],
    quickItems: ['Gas boiler', 'Combi boiler', 'Oil boiler', 'Heat pump', 'Hot water cylinder', 'Thermostat', 'Radiator'],
  },
  {
    id: 'safety',
    icon: '🛡️',
    label: 'Safety',
    description: 'Fire alarms, CO detectors, locks',
    assetCategory: 'security',
    askRoom: true,
    offerPhotoScan: false,
    fields: [
      { key: 'device_type', label: 'Type', type: 'select', options: [
        { value: 'smoke_alarm_battery', label: 'Smoke alarm (battery)' },
        { value: 'smoke_alarm_sealed', label: 'Smoke alarm (10-year sealed)' },
        { value: 'smoke_alarm_hardwired', label: 'Smoke alarm (hardwired)' },
        { value: 'co_detector', label: 'Carbon monoxide detector' },
        { value: 'burglar_alarm', label: 'Burglar alarm' },
        { value: 'cctv', label: 'CCTV camera' },
        { value: 'smart_lock', label: 'Smart lock' },
        { value: 'fire_extinguisher', label: 'Fire extinguisher' },
        { value: 'fire_blanket', label: 'Fire blanket' },
      ]},
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'install_date', label: 'Install date', type: 'date' },
    ],
    reminders: [
      { title: 'Replace batteries', description: 'Replace smoke alarm batteries', frequencyType: 'biannual', defaultEnabled: true },
      { title: 'Test alarm', description: 'Press the test button on your alarms', frequencyType: 'monthly', defaultEnabled: true },
      { title: 'Replace unit', description: 'Smoke alarms should be replaced every 10 years', frequencyType: 'once', defaultEnabled: false },
    ],
    quickItems: ['Smoke alarm', 'CO detector', 'Burglar alarm', 'CCTV camera', 'Smart lock', 'Fire extinguisher'],
  },
  {
    id: 'structure',
    icon: '🏗️',
    label: 'Structure & exterior',
    description: 'Roof, windows, doors, insulation',
    assetCategory: 'structural',
    askRoom: false,
    offerPhotoScan: false,
    fields: [
      { key: 'description', label: 'Description', type: 'multiline' },
      { key: 'contractor', label: 'Contractor/installer', type: 'text' },
      { key: 'purchase_date', label: 'Date installed/repaired', type: 'date' },
      { key: 'purchase_price', label: 'Cost (£)', type: 'number' },
      { key: 'warranty_expiry', label: 'Guarantee expiry', type: 'date' },
    ],
    reminders: [
      { title: 'Inspect', description: 'Visual inspection', frequencyType: 'annual', defaultEnabled: false },
      { title: 'Clean gutters', description: 'Clear gutters and downpipes', frequencyType: 'annual', defaultEnabled: false },
    ],
    quickItems: ['Roof', 'Windows', 'Front door', 'Gutters', 'Insulation', 'Chimney', 'Driveway', 'Fencing', 'Decking', 'Shed'],
  },
  {
    id: 'room_detail',
    icon: '🎨',
    label: 'Room detail',
    description: 'Paint colour, flooring, curtains',
    assetCategory: 'other',
    askRoom: true,
    offerPhotoScan: true,
    fields: [
      { key: 'detail_subtype', label: 'What is it?', type: 'select', options: [
        { value: 'paint', label: 'Paint colour' },
        { value: 'flooring', label: 'Flooring' },
        { value: 'tiles', label: 'Tiles' },
        { value: 'wallpaper', label: 'Wallpaper' },
        { value: 'curtains', label: 'Curtains / blinds' },
      ]},
      { key: 'colour_name', label: 'Colour name', type: 'text', placeholder: 'e.g. Cornforth White' },
      { key: 'colour_code', label: 'Colour code', type: 'text', placeholder: 'e.g. No. 228' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Farrow & Ball' },
      { key: 'finish', label: 'Finish', type: 'select', options: [
        { value: 'matt', label: 'Matt' }, { value: 'eggshell', label: 'Eggshell' },
        { value: 'silk', label: 'Silk' }, { value: 'gloss', label: 'Gloss' },
        { value: 'satin', label: 'Satin' },
      ]},
      { key: 'supplier', label: 'Where did you buy it?', type: 'text' },
      { key: 'quantity', label: 'Quantity', type: 'text', placeholder: 'e.g. 3 tins, 15 sqm' },
    ],
    reminders: [],
  },
  {
    id: 'furniture',
    icon: '🛋️',
    label: 'Furniture',
    description: 'Sofa, bed, wardrobe, table',
    assetCategory: 'furniture',
    askRoom: true,
    offerPhotoScan: true,
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'retailer', label: 'Where did you buy it?', type: 'text' },
      { key: 'purchase_date', label: 'Purchase date', type: 'date' },
      { key: 'purchase_price', label: 'Price (£)', type: 'number' },
      { key: 'warranty_expiry', label: 'Warranty expiry', type: 'date' },
    ],
    reminders: [],
    quickItems: ['Sofa', 'Bed', 'Mattress', 'Wardrobe', 'Dining table', 'Desk', 'Bookshelf', 'Coffee table'],
  },
  {
    id: 'garden',
    icon: '🌳',
    label: 'Garden & outdoor',
    description: 'Lawn mower, BBQ, garden furniture',
    assetCategory: 'garden',
    askRoom: false,
    offerPhotoScan: true,
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'purchase_date', label: 'Purchase date', type: 'date' },
      { key: 'purchase_price', label: 'Price (£)', type: 'number' },
    ],
    reminders: [],
    quickItems: ['Lawn mower', 'BBQ', 'Garden furniture', 'Hot tub', 'Trampoline', 'Garden shed'],
  },
  {
    id: 'technology',
    icon: '📡',
    label: 'Technology',
    description: 'WiFi router, smart home, TV',
    assetCategory: 'electrical',
    askRoom: true,
    offerPhotoScan: true,
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'serial_number', label: 'Serial number', type: 'text' },
      { key: 'purchase_date', label: 'Purchase date', type: 'date' },
      { key: 'purchase_price', label: 'Price (£)', type: 'number' },
    ],
    reminders: [],
    quickItems: ['WiFi router', 'TV', 'Soundbar', 'Smart speaker', 'Smart thermostat', 'Smart doorbell'],
  },
];

/** Non-asset smart categories (these create records in dedicated tables) */
export type SpecialCategory = {
  id: string;
  icon: string;
  label: string;
  description: string;
  route: string;
};

export const SPECIAL_CATEGORIES: SpecialCategory[] = [
  { id: 'insurance', icon: '🔑', label: 'Insurance & policy', description: 'Home, car, life, boiler cover', route: '/add/insurance' },
  { id: 'vehicle', icon: '🚗', label: 'Vehicle', description: 'Car, motorbike — MOT, tax, insurance', route: '/add/vehicle' },
  { id: 'energy', icon: '⚡', label: 'Energy & meters', description: 'Track electricity, gas, water, solar', route: '/energy' },
  { id: 'document', icon: '📄', label: 'Document', description: 'Scan or upload a receipt, manual, certificate', route: '/capture/scan' },
];
