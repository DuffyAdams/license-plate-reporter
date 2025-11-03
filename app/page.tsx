'use client';

import React, { useState } from 'react';
import { Camera, AlertCircle, CheckCircle2, X } from 'lucide-react';

const US_STATES = [
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
  { code: 'PR', name: 'Puerto Rico' }, { code: 'GU', name: 'Guam' }, { code: 'VI', name: 'Virgin Islands' },
  { code: 'OTHER', name: 'Other' }
];

const VIOLATIONS = [
  { value: 'speeding', label: 'Speeding', emoji: '💨' },
  { value: 'reckless driving', label: 'Reckless Driving', emoji: '⚠️' },
  { value: 'texting / phone use', label: 'Texting / Phone Use', emoji: '📱' },
  { value: 'red light / stop sign', label: 'Red Light / Stop Sign', emoji: '🛑' },
  { value: 'illegal parking', label: 'Illegal Parking', emoji: '🅿️' },
  { value: 'tailgating', label: 'Tailgating', emoji: '🚗' },
  { value: 'unsafe lane change', label: 'Unsafe Lane Change', emoji: '↔️' },
  { value: 'failure to yield', label: 'Failure To Yield', emoji: '⚡' },
  { value: 'hit and run', label: 'Hit And Run', emoji: '💥' },
  { value: 'suspected dui', label: 'Suspected DUI', emoji: '🍺' }
];

const VEHICLE_TYPES = [
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

const COLORS = [
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

const GENDERS = [
  { value: 'female', label: 'Female', emoji: '👩' },
  { value: 'male', label: 'Male', emoji: '👨' },
  { value: 'unknown', label: 'Unknown', emoji: '❓' }
];

const MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz',
  'Audi', 'Kia', 'Hyundai', 'Volkswagen', 'Subaru', 'Tesla', 'Lexus',
  'Jeep', 'Dodge', 'Ram', 'GMC', 'Mazda', 'Volvo', 'Porsche'
];

export default function LicensePlateReporter() {
  const [view, setView] = useState('form');
  const [reports, setReports] = useState([]);
  const [formData, setFormData] = useState({
    plate: '',
    state_code: '',
    city: '',
    violation: '',
    vehicle_type: '',
    color: '',
    make: '',
    model: '',
    year: '',
    gender_observed: '',
    description: '',
    reporter_email: '',
    contact_ok: false
  });
  const [errors, setErrors] = useState({});
  const [mediaFiles, setMediaFiles] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [filters, setFilters] = useState({
    state: '',
    city: '',
    violation: '',
    vehicle_type: ''
  });

  const handleInputChange = (field, value) => {
    if (field === 'plate') {
      value = value.toUpperCase().replace(/\s/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
      return validTypes.includes(file.type) && file.size <= 25 * 1024 * 1024;
    });
    setMediaFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.plate || formData.plate.length < 2 || formData.plate.length > 10) {
      newErrors.plate = 'Plate must be 2-10 characters';
    }
    if (!formData.state_code) newErrors.state_code = 'State is required';
    if (!formData.city || formData.city.length < 2) newErrors.city = 'City is required';
    if (!formData.violation) newErrors.violation = 'Violation is required';
    if (!formData.vehicle_type) newErrors.vehicle_type = 'Vehicle type is required';
    if (!formData.color) newErrors.color = 'Color is required';
    
    if (formData.year && (formData.year < 1900 || formData.year > new Date().getFullYear())) {
      newErrors.year = 'Invalid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newReport = {
      id: Date.now().toString(),
      ...formData,
      incident_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      media_count: mediaFiles.length
    };

    setReports(prev => [newReport, ...prev]);
    
    // Reset form
    setFormData({
      plate: '',
      state_code: '',
      city: '',
      violation: '',
      vehicle_type: '',
      color: '',
      make: '',
      model: '',
      year: '',
      gender_observed: '',
      description: '',
      reporter_email: '',
      contact_ok: false
    });
    setMediaFiles([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filteredReports = reports.filter(report => {
    if (filters.state && report.state_code !== filters.state) return false;
    if (filters.city && !report.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.violation && report.violation !== filters.violation) return false;
    if (filters.vehicle_type && report.vehicle_type !== filters.vehicle_type) return false;
    return true;
  });

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#e5e7eb]">
      {/* Header */}
      <header className="bg-[#11161c] border-b border-[#1f2733] sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#60a5fa]">Plate Reporter</h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setView('form')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'form' 
                  ? 'bg-[#60a5fa] text-white' 
                  : 'bg-[#171d24] text-[#94a3b8] hover:bg-[#1f2733]'
              }`}
            >
              Report
            </button>
            <button
              onClick={() => setView('feed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'feed' 
                  ? 'bg-[#60a5fa] text-white' 
                  : 'bg-[#171d24] text-[#94a3b8] hover:bg-[#1f2733]'
              }`}
            >
              Feed ({reports.length})
            </button>
          </nav>
        </div>
      </header>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-[slideIn_0.3s_ease-out]">
          <CheckCircle2 size={20} />
          <span>Report published successfully!</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'form' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#11161c] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-2">Submit a Report</h2>
              <p className="text-[#94a3b8] text-sm">
                Help keep our roads safe by reporting traffic violations. All reports are public.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Plate Number */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Plate Number <span className="text-[#f87171]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.plate}
                  onChange={(e) => handleInputChange('plate', e.target.value)}
                  placeholder="ABC1234"
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                />
                <p className="text-xs text-[#94a3b8] mt-1">Enter without spaces</p>
                {errors.plate && <p className="text-[#f87171] text-sm mt-1">{errors.plate}</p>}
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  State <span className="text-[#f87171]">*</span>
                </label>
                <select
                  value={formData.state_code}
                  onChange={(e) => handleInputChange('state_code', e.target.value)}
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                >
                  <option value="">Select a State</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
                {errors.state_code && <p className="text-[#f87171] text-sm mt-1">{errors.state_code}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  City <span className="text-[#f87171]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="San Diego"
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                />
                {errors.city && <p className="text-[#f87171] text-sm mt-1">{errors.city}</p>}
              </div>

              {/* Violation */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Violation <span className="text-[#f87171]">*</span>
                </label>
                <select
                  value={formData.violation}
                  onChange={(e) => handleInputChange('violation', e.target.value)}
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                >
                  <option value="">Select a Violation</option>
                  {VIOLATIONS.map(violation => (
                    <option key={violation.value} value={violation.value}>
                      {violation.emoji} {violation.label}
                    </option>
                  ))}
                </select>
                {errors.violation && <p className="text-[#f87171] text-sm mt-1">{errors.violation}</p>}
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vehicle Type <span className="text-[#f87171]">*</span>
                </label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                >
                  <option value="">Select a Vehicle</option>
                  {VEHICLE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </option>
                  ))}
                </select>
                {errors.vehicle_type && <p className="text-[#f87171] text-sm mt-1">{errors.vehicle_type}</p>}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Color <span className="text-[#f87171]">*</span>
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 py-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleInputChange('color', color.value)}
                      className="relative flex justify-center"
                      title={color.label}
                    >
                      <div 
                        className={`w-14 h-14 md:w-12 md:h-12 rounded-full transition-all ${
                          formData.color === color.value 
                            ? 'ring-4 ring-[#60a5fa] ring-offset-2 ring-offset-[#11161c] scale-110' 
                            : 'border-2 border-[#1f2733] hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    </button>
                  ))}
                </div>
                {formData.color && (
                  <div className="mt-4 text-center">
                    <span className="text-sm text-[#e5e7eb] font-medium">
                      Selected: {COLORS.find(c => c.value === formData.color)?.label}
                    </span>
                  </div>
                )}
                {errors.color && <p className="text-[#f87171] text-sm mt-1">{errors.color}</p>}
              </div>

              {/* Optional Fields Divider */}
              <div className="border-t border-[#1f2733] pt-5">
                <p className="text-sm text-[#94a3b8] mb-4">Optional Information</p>
              </div>

              {/* Make */}
              <div>
                <label className="block text-sm font-medium mb-2">Make</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  placeholder="Toyota"
                  list="makes-list"
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                />
                <datalist id="makes-list">
                  {MAKES.map(make => <option key={make} value={make} />)}
                </datalist>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Leave blank if unknown"
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                />
                {errors.year && <p className="text-[#f87171] text-sm mt-1">{errors.year}</p>}
              </div>

              {/* Gender Observed */}
              <div>
                <label className="block text-sm font-medium mb-2">Gender Observed</label>
                <div className="flex gap-4">
                  {GENDERS.map(gender => (
                    <label key={gender.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={gender.value}
                        checked={formData.gender_observed === gender.value}
                        onChange={(e) => handleInputChange('gender_observed', e.target.value)}
                        className="w-4 h-4 text-[#60a5fa] bg-[#171d24] border-[#1f2733] focus:ring-[#60a5fa] focus:ring-2"
                      />
                      <span className="ml-2 text-sm">{gender.emoji} {gender.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional details about the incident..."
                  maxLength={500}
                  rows={4}
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent resize-none"
                />
                <p className="text-xs text-[#94a3b8] mt-1 text-right">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Camera className="inline mr-2" size={18} />
                  Photos/Videos (up to 5)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  multiple
                  onChange={handleFileChange}
                  disabled={mediaFiles.length >= 5}
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#60a5fa] file:text-white file:cursor-pointer hover:file:bg-[#5394e3] disabled:opacity-50"
                />
                {mediaFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative bg-[#171d24] rounded-lg p-2">
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-[#f87171] rounded-full p-1 hover:bg-[#ef4444]"
                        >
                          <X size={14} />
                        </button>
                        <p className="text-xs text-[#94a3b8] truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reporter Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Email (optional, private)</label>
                <input
                  type="email"
                  value={formData.reporter_email}
                  onChange={(e) => handleInputChange('reporter_email', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                />
                <label className="flex items-center mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.contact_ok}
                    onChange={(e) => handleInputChange('contact_ok', e.target.checked)}
                    className="w-4 h-4 text-[#60a5fa] bg-[#171d24] border-[#1f2733] rounded focus:ring-[#60a5fa] focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-[#94a3b8]">Admin can contact me about this report</span>
                </label>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#60a5fa] hover:bg-[#5394e3] text-white font-semibold py-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:ring-offset-2 focus:ring-offset-[#0b0f14]"
                >
                  Submit Report
                </button>
                <p className="text-xs text-[#94a3b8] mt-3 text-center">
                  By submitting, you attest this information is accurate to the best of your knowledge.
                  All reports are public.
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* Filters */}
            <div className="bg-[#11161c] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Filter Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.state}
                  onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                  className="bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-2 text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                >
                  <option value="">All States</option>
                  {US_STATES.map(state => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Filter by city"
                  className="bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-2 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                />
                <select
                  value={filters.violation}
                  onChange={(e) => setFilters(prev => ({ ...prev, violation: e.target.value }))}
                  className="bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-2 text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                >
                  <option value="">All Violations</option>
                  {VIOLATIONS.map(violation => (
                    <option key={violation.value} value={violation.value}>
                      {violation.emoji} {violation.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.vehicle_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, vehicle_type: e.target.value }))}
                  className="bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-2 text-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                >
                  <option value="">All Vehicles</option>
                  {VEHICLE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reports Grid */}
            {filteredReports.length === 0 ? (
              <div className="bg-[#11161c] rounded-lg p-12 text-center">
                <AlertCircle className="mx-auto mb-4 text-[#94a3b8]" size={48} />
                <p className="text-[#94a3b8]">No reports yet. Be the first to submit one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map(report => (
                  <div key={report.id} className="bg-[#11161c] rounded-lg p-5 border border-[#1f2733] hover:border-[#60a5fa] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-[#60a5fa]">{report.plate}</h3>
                        <p className="text-sm text-[#94a3b8]">{report.state_code} • {report.city}</p>
                      </div>
                      <span className="text-xs text-[#94a3b8]">{formatTimeAgo(report.created_at)}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-[#f87171] bg-opacity-20 text-[#f87171] text-xs rounded-full font-medium">
                          {VIOLATIONS.find(v => v.value === report.violation)?.emoji} {VIOLATIONS.find(v => v.value === report.violation)?.label}
                        </span>
                        {report.media_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
                            <Camera size={14} />
                            {report.media_count}
                          </span>
                        )}
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <span className="text-[#94a3b8]">Vehicle:</span>
                        <div 
                          className="w-4 h-4 rounded-full border border-[#1f2733]"
                          style={{ backgroundColor: COLORS.find(c => c.value === report.color)?.hex }}
                        />
                        <span className="text-[#e5e7eb]">
                          {COLORS.find(c => c.value === report.color)?.label} {report.make && `${report.make} `}
                          {VEHICLE_TYPES.find(v => v.value === report.vehicle_type)?.label}
                          {report.year && ` (${report.year})`}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-[#94a3b8] line-clamp-2">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#11161c] border-t border-[#1f2733] mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-[#94a3b8]">
          <p>Plate Reporter • Community-driven traffic safety reporting</p>
          <p className="mt-1">This is for community reporting only, not law enforcement.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}