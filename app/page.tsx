'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, AlertCircle, CheckCircle2, X } from 'lucide-react';
import citiesData from '../cities.json';
import { US_STATES, VIOLATIONS, VEHICLE_TYPES, COLORS, GENDERS, MAKES, StateCode, ViolationType, VehicleType, ColorType, GenderType } from '../lib/constants';
import { z } from 'zod';

const ALL_CITIES = Object.values(citiesData).flat();

// Zod schema for form validation
const reportSchema = z.object({
  plate: z.string().min(2).max(10),
  state_code: z.string().min(2).max(2),
  city: z.string().min(2),
  violation: z.enum(['speeding', 'reckless driving', 'texting / phone use', 'red light / stop sign', 'illegal parking', 'tailgating', 'unsafe lane change', 'failure to yield', 'hit and run', 'suspected dui']),
  vehicle_type: z.enum(['sedan', 'suv', 'pickup', 'coupe', 'hatchback', 'van/minivan', 'motorcycle', 'commercial truck', 'bus', 'other']),
  color: z.enum(['white', 'black', 'silver', 'gray', 'red', 'blue', 'green', 'yellow', 'orange', 'brown', 'tan', 'gold', 'other']),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional().refine((val) => !val || (parseInt(val) >= 1900 && parseInt(val) <= new Date().getFullYear()), {
    message: 'Invalid year'
  }),
  gender_observed: z.enum(['female', 'male', 'unknown']).optional(),
  description: z.string().max(500).optional(),
  reporter_email: z.string().email().optional().or(z.literal('')),
  contact_ok: z.boolean()
}).refine((data) => {
  // Validate city belongs to state
  const stateName = US_STATES.find(state => state.code === data.state_code)?.name;
  if (stateName && stateName in citiesData) {
    return citiesData[stateName as keyof typeof citiesData].includes(data.city);
  }
  return false;
}, {
  message: 'Please select a valid city from the list',
  path: ['city']
});

interface Report {
  id: string;
  plate: string;
  state_code: string;
  city: string;
  violation: string;
  vehicle_type: string;
  color: string;
  make?: string;
  model?: string;
  year?: number;
  gender_observed?: string;
  description?: string;
  reporter_email?: string;
  contact_ok: boolean;
  incident_at: string;
  created_at: string;
  media_count: number;
}

// FormData interface with strict unions
interface FormData {
  plate: string;
  state_code: StateCode;
  city: string;
  violation: ViolationType;
  vehicle_type: VehicleType;
  color: ColorType;
  make: string;
  model: string;
  year: string;
  gender_observed: GenderType;
  description: string;
  reporter_email: string;
  contact_ok: boolean;
}

export default function LicensePlateReporter() {
  const [view, setView] = useState('form');
  const [reports, setReports] = useState<Report[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [formData, setFormData] = useState<FormData>({
    plate: '',
    state_code: '' as StateCode,
    city: '',
    violation: '' as ViolationType,
    vehicle_type: '' as VehicleType,
    color: '' as ColorType,
    make: '',
    model: '',
    year: '',
    gender_observed: '' as GenderType,
    description: '',
    reporter_email: '',
    contact_ok: false
  });
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<{ file: File; preview: string; duration?: number; size: string; error?: string }[]>([]);
  const [filters, setFilters] = useState({
    state: '',
    city: '',
    violation: '',
    vehicle_type: '',
    plate: ''
  });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = useCallback(async (filterParams?: { state: string; city: string; violation: string; vehicle_type: string; plate: string }, append: boolean = false, cursor?: string | null) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(!append);
      setLoadingMore(append);

      const params = new URLSearchParams();
      if (filterParams?.state) params.append('state', filterParams.state);
      if (filterParams?.city) params.append('city', filterParams.city);
      if (filterParams?.violation) params.append('violation', filterParams.violation);
      if (filterParams?.vehicle_type) params.append('vehicle_type', filterParams.vehicle_type);
      if (filterParams?.plate) params.append('plate', filterParams.plate);
      if (cursor) params.append('cursor', cursor);

      const response = await fetch(`/api/reports?${params}`, {
        signal: controller.signal
      });

      if (response.ok) {
        const data = await response.json();
        setReports(prev => append ? [...prev, ...data.reports] : data.reports);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching reports:', error);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    if (field === 'plate') {
      value = (value as string).toUpperCase().replace(/\s/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Update city suggestions when state changes or city input changes
    if (field === 'state_code' || field === 'city') {
      updateCitySuggestions(field === 'state_code' ? value as string : formData.state_code, field === 'city' ? value as string : formData.city);
    }
  };

  const updateCitySuggestions = (stateCode: string, cityInput: string) => {
    if (!stateCode) {
      setCitySuggestions([]);
      return;
    }

    const stateName = US_STATES.find(state => state.code === stateCode)?.name;
    if (!stateName || !(stateName in citiesData)) {
      setCitySuggestions([]);
      return;
    }

    const stateCities = citiesData[stateName as keyof typeof citiesData];
    const filteredCities = stateCities.filter((city: string) =>
      city.toLowerCase().startsWith(cityInput.toLowerCase())
    );
    setCitySuggestions(filteredCities.slice(0, 10)); // Limit to 10 suggestions
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const stripExifData = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const strippedFile = new File([blob], file.name, { type: file.type });
            resolve(strippedFile);
          } else {
            resolve(file);
          }
        }, file.type);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    const maxSize = 25 * 1024 * 1024;

    const processedFiles: File[] = [];
    const previews: typeof filePreviews = [];

    for (const file of files) {
      let error: string | undefined;

      if (!validTypes.includes(file.type)) {
        error = 'Invalid file type';
      } else if (file.size > maxSize) {
        error = 'File too large (max 25MB)';
      } else if (processedFiles.length + mediaFiles.length >= 5) {
        error = 'Maximum 5 files allowed';
        break;
      }

      if (!error) {
        // Strip EXIF data for images
        const processedFile = await stripExifData(file);
        processedFiles.push(processedFile);

        let preview = '';
        let duration: number | undefined;

        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(processedFile);
        } else if (file.type.startsWith('video/')) {
          preview = URL.createObjectURL(processedFile);
          duration = await getVideoDuration(processedFile);
        }

        previews.push({
          file: processedFile,
          preview,
          duration,
          size: formatFileSize(file.size),
          error
        });
      } else {
        previews.push({
          file,
          preview: '',
          size: formatFileSize(file.size),
          error
        });
      }
    }

    setMediaFiles(prev => [...prev, ...processedFiles].slice(0, 5));
    setFilePreviews(prev => [...prev, ...previews].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Clean up object URLs
      prev[index]?.preview && URL.revokeObjectURL(prev[index].preview);
      return newPreviews;
    });
  };

  const validateForm = () => {
    const result = reportSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((error: z.ZodIssue) => {
        const field = error.path[0] as string;
        newErrors[field] = error.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setNetworkError(null);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'year' && value) {
          formDataToSend.append(key, parseInt(value as string).toString());
        } else if (key === 'contact_ok') {
          formDataToSend.append(key, value ? 'true' : 'false');
        } else if (value !== '' && value !== undefined) {
          formDataToSend.append(key, value as string);
        }
      });

      // Add media files as media[] array
      filePreviews.forEach(preview => {
        if (!preview.error) {
          formDataToSend.append('media[]', preview.file);
        }
      });

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.open('POST', '/api/reports');
        xhr.send(formDataToSend);
      });

      const response = await uploadPromise as any;

      if (response.errors) {
        setErrors(response.errors);
        return;
      }

      const newReport: Report = {
        id: Date.now().toString(),
        plate: formData.plate,
        state_code: formData.state_code,
        city: formData.city,
        violation: formData.violation,
        vehicle_type: formData.vehicle_type,
        color: formData.color,
        make: formData.make || undefined,
        model: formData.model || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        gender_observed: formData.gender_observed || undefined,
        description: formData.description || undefined,
        reporter_email: formData.reporter_email || undefined,
        contact_ok: formData.contact_ok,
        incident_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        media_count: filePreviews.filter(p => !p.error).length
      };

      setReports(prev => [newReport, ...prev]);

      // Reset form
      setFormData({
        plate: '',
        state_code: '' as StateCode,
        city: '',
        violation: '' as ViolationType,
        vehicle_type: '' as VehicleType,
        color: '' as ColorType,
        make: '',
        model: '',
        year: '',
        gender_observed: '' as GenderType,
        description: '',
        reporter_email: '',
        contact_ok: false
      });
      setMediaFiles([]);
      setFilePreviews([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      if (error.message.includes('Network error') || error.message.includes('HTTP')) {
        setNetworkError(error.message);
        setTimeout(() => setNetworkError(null), 5000);
      } else {
        setErrors({ general: 'Failed to submit report. Please try again.' });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Debounced filter handler
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setFilters(newFilters);
      fetchReports(newFilters);
    }, 300);
  }, [fetchReports]);

  // Load more reports for infinite scroll
  const loadMoreReports = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchReports(filters, true, nextCursor);
    }
  }, [hasMore, loadingMore, filters, nextCursor, fetchReports]);

  const [timeUpdate, setTimeUpdate] = useState(0);

  // Update time-ago every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src="/assets/License_Reporter_Logo.webp" alt="License Reporter Logo" className="h-16 w-auto" />
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

      {/* Network Error Toast */}
      {networkError && (
        <div className="fixed top-20 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-[slideIn_0.3s_ease-out]">
          <AlertCircle size={20} />
          <span>{networkError}</span>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="fixed top-20 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Uploading... {uploadProgress}%</span>
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
                <div className="relative">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="San Diego"
                    list="city-suggestions"
                    className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent"
                  />
                  <datalist id="city-suggestions">
                    {citySuggestions.map(city => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
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
                  disabled={filePreviews.length >= 5}
                  className="w-full bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-3 text-[#e5e7eb] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#60a5fa] file:text-white file:cursor-pointer hover:file:bg-[#5394e3] disabled:opacity-50"
                />
                {filePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative bg-[#171d24] rounded-lg p-3 border border-[#1f2733]">
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-[#f87171] rounded-full p-1 hover:bg-[#ef4444] z-10"
                        >
                          <X size={14} />
                        </button>
                        {preview.preview && !preview.error && (
                          <div className="mb-2">
                            {preview.file.type.startsWith('image/') ? (
                              <img
                                src={preview.preview}
                                alt={preview.file.name}
                                className="w-full h-20 object-cover rounded"
                              />
                            ) : (
                              <video
                                src={preview.preview}
                                className="w-full h-20 object-cover rounded"
                                muted
                              />
                            )}
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs text-[#94a3b8] truncate font-medium">{preview.file.name}</p>
                          <p className="text-xs text-[#60a5fa]">{preview.size}</p>
                          {preview.duration && (
                            <p className="text-xs text-[#94a3b8]">
                              {Math.floor(preview.duration / 60)}:{(preview.duration % 60).toFixed(0).padStart(2, '0')}
                            </p>
                          )}
                          {preview.error && (
                            <p className="text-xs text-[#f87171]">{preview.error}</p>
                          )}
                        </div>
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
                  disabled={isUploading}
                  className="w-full bg-[#60a5fa] hover:bg-[#5394e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:ring-offset-2 focus:ring-offset-[#0b0f14]"
                >
                  {isUploading ? 'Uploading...' : 'Submit Report'}
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  type="text"
                  value={filters.plate}
                  onChange={(e) => handleFilterChange({ ...filters, plate: e.target.value.toUpperCase() })}
                  placeholder="Search Plate Number"
                  className="bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-2 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                />
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange({ ...filters, state: e.target.value })}
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
                  onChange={(e) => handleFilterChange({ ...filters, city: e.target.value })}
                  placeholder="Filter by city"
                  className="bg-[#171d24] border border-[#1f2733] rounded-lg px-4 py-2 text-[#e5e7eb] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                />
                <select
                  value={filters.violation}
                  onChange={(e) => handleFilterChange({ ...filters, violation: e.target.value })}
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
                  onChange={(e) => handleFilterChange({ ...filters, vehicle_type: e.target.value })}
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
            {reports.length === 0 && !loading ? (
              <div className="bg-[#11161c] rounded-lg p-12 text-center">
                <AlertCircle className="mx-auto mb-4 text-[#94a3b8]" size={48} />
                <p className="text-[#94a3b8]">No reports yet. Be the first to submit one!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report: Report) => (
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
                          <span
                            className="px-2 py-1 text-white text-xs rounded-full font-medium"
                            style={{
                              backgroundColor: VIOLATIONS.find(v => v.value === report.violation)?.color + '33', // 20% opacity
                              border: `1px solid ${VIOLATIONS.find(v => v.value === report.violation)?.color}`
                            }}
                          >
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
                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMoreReports}
                      disabled={loadingMore}
                      className="bg-[#60a5fa] hover:bg-[#5394e3] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Reports'}
                    </button>
                  </div>
                )}
              </>
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