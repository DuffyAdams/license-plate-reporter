export const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'PR', name: 'Puerto Rico' }, { code: 'GU', name: 'Guam' }, { code: 'VI', name: 'Virgin Islands' }
];

export const VIOLATIONS = [
  { value: 'speeding', label: 'Speeding', emoji: '💨', color: '#f59e0b' }, // orange
  { value: 'reckless driving', label: 'Reckless Driving', emoji: '⚠️', color: '#dc2626' }, // red
  { value: 'texting / phone use', label: 'Texting / Phone Use', emoji: '📱', color: '#8b5cf6' }, // purple
  { value: 'red light / stop sign', label: 'Red Light / Stop Sign', emoji: '🛑', color: '#ef4444' }, // red
  { value: 'illegal parking', label: 'Illegal Parking', emoji: '🅿️', color: '#6b7280' }, // gray
  { value: 'tailgating', label: 'Tailgating', emoji: '🚗', color: '#f97316' }, // orange
  { value: 'unsafe lane change', label: 'Unsafe Lane Change', emoji: '↔️', color: '#eab308' }, // yellow
  { value: 'failure to yield', label: 'Failure To Yield', emoji: '⚡', color: '#3b82f6' }, // blue
  { value: 'hit and run', label: 'Hit And Run', emoji: '💥', color: '#dc2626' }, // red
  { value: 'suspected dui', label: 'Suspected DUI', emoji: '🍺', color: '#7c3aed' } // violet
];

export const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan', emoji: '🚗' },
  { value: 'suv', label: 'SUV', emoji: '🚙' },
  { value: 'pickup', label: 'Pickup', emoji: '🛻' },
  { value: 'coupe', label: 'Coupe', emoji: '🚗' },
  { value: 'hatchback', label: 'Hatchback', emoji: '🚗' },
  { value: 'van/minivan', label: 'Van/Minivan', emoji: '🚐' },
  { value: 'motorcycle', label: 'Motorcycle', emoji: '🏍️' },
  { value: 'commercial truck', label: 'Commercial Truck', emoji: '🚚' },
  { value: 'bus', label: 'Bus', emoji: '🚌' },
  { value: 'other', label: 'Other', emoji: '🚘' }
];

export const COLORS = [
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'silver', label: 'Silver', hex: '#C0C0C0' },
  { value: 'gray', label: 'Gray', hex: '#808080' },
  { value: 'red', label: 'Red', hex: '#DC2626' },
  { value: 'blue', label: 'Blue', hex: '#2563EB' },
  { value: 'green', label: 'Green', hex: '#16A34A' },
  { value: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { value: 'orange', label: 'Orange', hex: '#EA580C' },
  { value: 'brown', label: 'Brown', hex: '#92400E' },
  { value: 'tan', label: 'Tan', hex: '#D2B48C' },
  { value: 'gold', label: 'Gold', hex: '#FFD700' },
  { value: 'other', label: 'Other', hex: '#6B7280' }
];

export const GENDERS = [
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'male', label: 'Male', emoji: '👨' }
];

export const MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz',
  'Audi', 'Kia', 'Hyundai', 'Volkswagen', 'Subaru', 'Tesla', 'Lexus',
  'Jeep', 'Dodge', 'Ram', 'GMC', 'Mazda', 'Volvo', 'Porsche'
];

// Type definitions for strict typing
export type StateCode = typeof US_STATES[number]['code'];
export type ViolationType = typeof VIOLATIONS[number]['value'];
export type VehicleType = typeof VEHICLE_TYPES[number]['value'];
export type ColorType = typeof COLORS[number]['value'];
export type GenderType = typeof GENDERS[number]['value'];