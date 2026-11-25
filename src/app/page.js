'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Download, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Building2, 
  Flame, 
  ExternalLink, 
  Loader2, 
  Compass, 
  SlidersHorizontal,
  Send,
  MessageSquare,
  Copy,
  X,
  Play,
  Zap,
  Tag,
  Flag,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { GEO_DATABASE } from '@/lib/geoData';

const ALL_COUNTRIES = [
  'India', 'United States', 'United Arab Emirates', 'United Kingdom', 
  'Canada', 'Australia', 'Saudi Arabia', 'Singapore', 'Germany', 
  'Malaysia', 'South Africa', 'New Zealand'
];

const POPULAR_CATEGORIES = [
  'Dental Clinic',
  'Hospital / Clinic',
  'Real Estate Consultant',
  'Physiotherapy Center',
  'Eye Hospital / Clinic',
  'Interior Designer',
  'Chartered Accountant',
  'Car Detailing & Ceramic',
  'Dermatologist / Skin Clinic',
  'Fitness Gym & Crossfit',
  'Bakery & Cake Shop',
  'Advocate & Legal Firm'
];

export default function Home() {
  // Cascading Geography States
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('Ghaziabad');
  const [locality, setLocality] = useState('Govindpuram');
  const [keyword, setKeyword] = useState('Dental Clinic');
  const [limit, setLimit] = useState(30);

  // Live Auto-Suggestion States for City
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const cityInputRef = useRef(null);

  // Live Auto-Suggestion States for Local Area
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [isAreaLoading, setIsAreaLoading] = useState(false);
  const areaInputRef = useRef(null);

  // Live Auto-Suggestion States for Keyword
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const catInputRef = useRef(null);

  // Table & Scraping States
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [exporting, setExporting] = useState(false);

  // Bulk Selection State
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [messageChannel, setMessageChannel] = useState('whatsapp');
  const [customPitch, setCustomPitch] = useState(
    `Hello {business_name}, we noticed your Google profile in {location}. We build modern websites that generate 3x more local inquiries. Would you be interested in a free website demo mockup this week?`
  );
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState(0);

  // Debounced City Suggestions
  useEffect(() => {
    if (!city || city.trim().length < 1) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCityLoading(true);
      try {
        const dbCities = Object.keys(GEO_DATABASE[country]?.cities || {});
        const localMatches = dbCities
          .filter((c) => c.toLowerCase().includes(city.toLowerCase()))
          .map((c) => ({ title: c, city: c, fullLabel: `${c}, ${country}` }));

        const res = await fetch(`/api/suggest?q=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`);
        const data = await res.json();
        const apiMatches = data.results || [];

        const combined = [...localMatches, ...apiMatches];
        const unique = Array.from(new Map(combined.map((item) => [item.city, item])).values());
        setCitySuggestions(unique.slice(0, 6));
      } catch {
        // Fallback
      } finally {
        setIsCityLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [city, country]);

  // Debounced Local Area Suggestions
  useEffect(() => {
    if (!locality || locality.trim().length < 1) {
      setAreaSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAreaLoading(true);
      try {
        const dbAreas = GEO_DATABASE[country]?.cities[city] || [];
        const localMatches = dbAreas
          .filter((a) => a.toLowerCase().includes(locality.toLowerCase()) && !a.includes('All '))
          .map((a) => ({ title: a, localArea: a, fullLabel: `${a}, ${city}` }));

        const q = `${locality} ${city}`;
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}`);
        const data = await res.json();
        const apiMatches = (data.results || []).map((r) => ({
          title: r.localArea || r.title,
          localArea: r.localArea || r.title,
          fullLabel: r.fullLabel,
        }));

        const combined = [...localMatches, ...apiMatches];
        const unique = Array.from(new Map(combined.map((item) => [item.localArea, item])).values());
        setAreaSuggestions(unique.slice(0, 6));
      } catch {
        // Fallback
      } finally {
        setIsAreaLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [locality, city, country]);

  // Category live suggestions filter
  useEffect(() => {
    if (!keyword) {
      setFilteredCategories(POPULAR_CATEGORIES.slice(0, 6));
      return;
    }
    const filtered = POPULAR_CATEGORIES.filter((c) =>
      c.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [keyword]);

  // Dismiss suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (cityInputRef.current && !cityInputRef.current.contains(e.target)) {
        setShowCitySuggestions(false);
      }
      if (areaInputRef.current && !areaInputRef.current.contains(e.target)) {
        setShowAreaSuggestions(false);
      }
      if (catInputRef.current && !catInputRef.current.contains(e.target)) {
        setShowCatSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    const countryData = GEO_DATABASE[newCountry];
    if (countryData && countryData.cities) {
      const cityList = Object.keys(countryData.cities);
      const firstCity = cityList[0] || '';
      setCity(firstCity);
      const areaList = countryData.cities[firstCity] || [];
      setLocality(areaList.length > 1 ? areaList[1] : (areaList[0] || ''));
    } else {
      setCity('');
      setLocality('');
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!city || !keyword.trim()) return;

    setLoading(true);
    setError('');
    setSelectedIndices([]);
    try {
      const actualLocality = locality && !locality.includes('All ') ? locality : '';
      const fullLocation = actualLocality 
        ? `${actualLocality}, ${city}, ${country}` 
        : `${city}, ${country}`;

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          city: `${city}, ${country}`, 
          locality: actualLocality, 
          keyword: keyword.trim(), 
          limit: Number(limit) 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch businesses');
      }

      setLeads(data.leads || []);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (leads.length === 0) return;
    setExporting(true);
    try {
      const exportList = selectedIndices.length > 0 
        ? leads.filter((_, idx) => selectedIndices.includes(idx))
        : filteredLeads;

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leads: exportList,
          filename: `${keyword}_${locality || city}_leads`
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${keyword.replace(/\s+/g, '_')}_${(locality || city).replace(/\s+/g, '_')}_leads.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  // Metrics
  const totalFound = leads.length;
  const noWebsiteCount = leads.filter((l) => !l.hasWebsite).length;
  const withWebsiteCount = leads.filter((l) => l.hasWebsite).length;
  const highPriorityCount = leads.filter((l) => l.priority === 'HIGH').length;
  const withEmailCount = leads.filter((l) => Boolean(l.email)).length;

  const filteredLeads = leads.filter((lead) => {
    if (filterType === 'NO_WEBSITE') return !lead.hasWebsite;
    if (filterType === 'HIGH_PRIORITY') return lead.priority === 'HIGH';
    if (filterType === 'HAS_PHONE') return Boolean(lead.phone);
    if (filterType === 'HAS_EMAIL') return Boolean(lead.email);
    return true;
  });

  const isAllSelected = filteredLeads.length > 0 && filteredLeads.every((_, idx) => selectedIndices.includes(idx));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(filteredLeads.map((_, idx) => idx));
    }
  };

  const toggleSelectRow = (idx) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const getPersonalizedMessage = (lead) => {
    const locName = locality && !locality.includes('All ') ? `${locality}, ${city}` : city;
    return customPitch
      .replace('{business_name}', lead.title || 'there')
      .replace('{location}', locName);
  };

  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    const currentCode = GEO_DATABASE[country]?.code?.replace('+', '') || '91';
    if (digits.length === 10) digits = currentCode + digits;
    if (digits.startsWith('0') && digits.length === 11) digits = currentCode + digits.substring(1);
    return digits;
  };

  const startAutoWhatsAppBlast = async () => {
    const selectedLeads = selectedIndices.map((idx) => filteredLeads[idx]).filter((l) => Boolean(cleanPhone(l?.phone)));
    if (selectedLeads.length === 0) {
      return alert('No selected businesses have valid phone numbers.');
    }

    setIsBlasting(true);
    setBlastProgress(0);

    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i];
      const phone = cleanPhone(lead.phone);
      const msg = encodeURIComponent(getPersonalizedMessage(lead));
      
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      setBlastProgress(Math.round(((i + 1) / selectedLeads.length) * 100));

      await new Promise((r) => setTimeout(r, 1600));
    }

    setIsBlasting(false);
  };

  const sendBulkEmailToAll = () => {
    const selectedLeads = selectedIndices.map((idx) => filteredLeads[idx]).filter((l) => Boolean(l?.email));
    if (selectedLeads.length === 0) {
      return alert('No selected businesses have valid emails.');
    }

    const bccList = selectedLeads.map((l) => l.email).join(',');
    const subject = encodeURIComponent(`Website & Digital Growth Opportunity`);
    const body = encodeURIComponent(
      customPitch.replace('{business_name}', 'Business Owner').replace('{location}', locality || city)
    );

    window.location.href = `mailto:?bcc=${bccList}&subject=${subject}&body=${body}`;
  };

  const copyBulkContacts = () => {
    const selectedLeads = selectedIndices.map((idx) => filteredLeads[idx]).filter(Boolean);
    if (messageChannel === 'whatsapp') {
      const numbers = selectedLeads.map((l) => cleanPhone(l.phone)).filter(Boolean).join(', ');
      navigator.clipboard.writeText(numbers);
      alert(`Copied ${selectedLeads.length} numbers to clipboard!`);
    } else {
      const emails = selectedLeads.map((l) => l.email).filter(Boolean).join(', ');
      navigator.clipboard.writeText(emails);
      alert(`Copied ${selectedLeads.length} emails to clipboard!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C221E] flex flex-col font-sans selection:bg-[#EADBC8] selection:text-[#382820]">
      {/* Responsive Header */}
      <header className="border-b border-[#E8DFD5] bg-[#FAF6F0]/95 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-md shadow-[#6F4E37]/15 overflow-hidden flex-shrink-0">
              <Image 
                src="/logo.svg" 
                alt="LeadRadar Logo" 
                fill 
                priority
                className="object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-[#382820]">
                  Lead<span className="text-[#8C5E3C]">Radar</span>
                </span>
                <span className="text-[10px] bg-[#EADBC8] text-[#5C3D2E] font-bold px-2 py-0.5 rounded-full border border-[#D5C2AD] uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#7D6B60] hidden sm:block">
                Local Business Intelligence & Automated Client Outreach
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            {selectedIndices.length > 0 && (
              <button
                onClick={() => setShowOutreachModal(true)}
                className="flex items-center gap-1.5 bg-[#6F4E37] hover:bg-[#583D2A] text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm animate-pulse"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Outreach ({selectedIndices.length})</span>
              </button>
            )}

            {leads.length > 0 && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 bg-[#4A3525] hover:bg-[#382820] text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Export</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Search Panel */}
        <section className="bg-white border border-[#E8DFD5] p-4 sm:p-7 rounded-2xl shadow-sm space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-[#F0E8DE] pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#382820] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8C5E3C]" /> Discover Local Businesses & Leads
              </h2>
              <p className="text-[11px] sm:text-xs text-[#7D6B60]">
                Type city or neighborhood for instant autocomplete suggestions
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
            
            {/* 1. Country Selection */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" /> 1. Country
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#2C221E] font-medium focus:outline-none focus:border-[#8C5E3C] focus:bg-white transition cursor-pointer"
              >
                {ALL_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 2. City Input with LIVE SUGGESTIONS */}
            <div className="relative" ref={cityInputRef}>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 2. City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder="e.g. Ghaziabad, Delhi"
                  className="w-full bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#2C221E] font-medium focus:outline-none focus:border-[#8C5E3C] focus:bg-white transition"
                  required
                />
                {isCityLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-[#8C5E3C] animate-spin absolute right-3 top-3" />
                )}
              </div>

              {/* City Suggestions Menu */}
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-16 bg-white border border-[#E0D5C7] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#EFE7DE] max-h-52 overflow-y-auto">
                  <div className="p-1.5 bg-[#FAF7F2] text-[10px] font-bold text-[#8C7A6E] uppercase tracking-wider">
                    Suggested Cities:
                  </div>
                  {citySuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCity(item.city || item.title);
                        setShowCitySuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAF7F2] text-xs flex items-center justify-between transition"
                    >
                      <span className="font-bold text-[#382820]">{item.city || item.title}</span>
                      <span className="text-[10px] text-[#8C7A6E] truncate max-w-[120px]">{item.fullLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Local Area Input with LIVE SUGGESTIONS */}
            <div className="relative" ref={areaInputRef}>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-1.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> 3. Local Area
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => {
                    setLocality(e.target.value);
                    setShowAreaSuggestions(true);
                  }}
                  onFocus={() => setShowAreaSuggestions(true)}
                  placeholder="e.g. Govindpuram, Sec 62"
                  className="w-full bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#2C221E] font-medium focus:outline-none focus:border-[#8C5E3C] focus:bg-white transition"
                />
                {isAreaLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-[#8C5E3C] animate-spin absolute right-3 top-3" />
                )}
              </div>

              {/* Area Suggestions Menu */}
              {showAreaSuggestions && areaSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-16 bg-white border border-[#E0D5C7] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#EFE7DE] max-h-52 overflow-y-auto">
                  <div className="p-1.5 bg-[#FAF7F2] text-[10px] font-bold text-[#8C7A6E] uppercase tracking-wider">
                    Suggested Areas in {city}:
                  </div>
                  {areaSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLocality(item.localArea || item.title);
                        setShowAreaSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAF7F2] text-xs flex items-center justify-between transition"
                    >
                      <span className="font-bold text-[#382820]">{item.localArea || item.title}</span>
                      <span className="text-[10px] text-[#8C7A6E] truncate max-w-[110px]">{item.fullLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Keyword / Category with LIVE AUTOCOMPLETE */}
            <div className="relative" ref={catInputRef}>
              <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> 4. Keyword / Niche
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setShowCatSuggestions(true);
                  }}
                  onFocus={() => setShowCatSuggestions(true)}
                  placeholder="Dental Clinic, Hospital..."
                  className="w-full bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#2C221E] font-medium focus:outline-none focus:border-[#8C5E3C] focus:bg-white transition"
                  required
                />
              </div>

              {/* Category Suggestions Menu */}
              {showCatSuggestions && filteredCategories.length > 0 && (
                <div className="absolute left-0 right-0 top-16 bg-white border border-[#E0D5C7] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[#EFE7DE] max-h-48 overflow-y-auto">
                  {filteredCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setKeyword(cat);
                        setShowCatSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAF7F2] text-xs font-semibold text-[#382820] transition"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Limit & Search Button */}
            <div className="flex gap-2 items-end">
              <div className="w-1/3">
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-1.5">
                  Limit
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl px-2 py-2.5 text-xs sm:text-sm text-[#2C221E] focus:outline-none focus:border-[#8C5E3C] focus:bg-white font-medium transition cursor-pointer"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={80}>80</option>
                  <option value={120}>120</option>
                </select>
              </div>

              <div className="w-2/3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#6F4E37] hover:bg-[#583D2A] text-white py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Discover</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Category Badges */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <span className="font-bold text-[#8C7A6E]">Suggested:</span>
            {POPULAR_CATEGORIES.slice(0, 7).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setKeyword(cat)}
                className={`px-2.5 py-1 rounded-lg border transition text-[11px] sm:text-xs ${
                  keyword.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[#EADBC8] text-[#4A3525] border-[#D5C2AD] font-bold shadow-2xs' 
                    : 'bg-[#FAF7F2] text-[#6A5A50] border-[#E8DFD5] hover:bg-[#F2ECE3]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Grid (Responsive 2 cols on mobile, 4 on desktop) */}
        {leads.length > 0 && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-[#E8DFD5] p-3.5 sm:p-5 rounded-2xl shadow-sm">
              <p className="text-[11px] sm:text-xs font-semibold text-[#8C7A6E]">Total Found</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#382820] mt-1">{totalFound}</h3>
              <p className="text-[10px] sm:text-xs text-[#A8988B] mt-0.5 truncate">In {locality || city}</p>
            </div>

            <div className="bg-[#FFF5F2] border border-[#F8D2C4] p-3.5 sm:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-[#A8422B]">No Website</p>
                <AlertCircle className="w-3.5 h-3.5 text-[#A8422B]" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#943621] mt-1">{noWebsiteCount}</h3>
              <p className="text-[10px] sm:text-xs text-[#B55741] mt-0.5 font-medium truncate">Web Leads 🔥</p>
            </div>

            <div className="bg-[#F4F9F4] border border-[#CDE5CD] p-3.5 sm:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-[#2E6B34]">Has Website</p>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E6B34]" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#235828] mt-1">{withWebsiteCount}</h3>
              <p className="text-[10px] sm:text-xs text-[#3D7F44] mt-0.5 font-medium truncate">{withEmailCount} emails</p>
            </div>

            <div className="bg-[#FFF9EC] border border-[#F5E2B8] p-3.5 sm:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] sm:text-xs font-bold text-[#9E650C]">Hot Leads</p>
                <Flame className="w-3.5 h-3.5 text-[#9E650C]" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#875507] mt-1">{highPriorityCount}</h3>
              <p className="text-[10px] sm:text-xs text-[#A16D19] mt-0.5 font-medium truncate">Ready to text</p>
            </div>
          </section>
        )}

        {/* Results Table Section */}
        {leads.length > 0 && (
          <section className="bg-white border border-[#E8DFD5] rounded-2xl overflow-hidden shadow-sm">
            {/* Filter Tabs */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-[#E8DFD5] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <Filter className="w-4 h-4 text-[#8C7A6E] flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#382820] flex-shrink-0">Filter:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'ALL', label: `All (${leads.length})` },
                    { id: 'NO_WEBSITE', label: `No Web (${noWebsiteCount})` },
                    { id: 'HIGH_PRIORITY', label: `Hot (${highPriorityCount})` },
                    { id: 'HAS_PHONE', label: 'Phone' },
                    { id: 'HAS_EMAIL', label: `Email (${withEmailCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id)}
                      className={`text-xs px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition flex-shrink-0 ${
                        filterType === tab.id
                          ? 'bg-[#6F4E37] text-white shadow-sm'
                          : 'bg-white text-[#6F4E37] border border-[#E0D5C7] hover:bg-[#F2ECE3]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {selectedIndices.length > 0 && (
                  <span className="font-bold bg-[#EADBC8] text-[#5C3D2E] px-2.5 py-1 rounded-md">
                    {selectedIndices.length} Selected
                  </span>
                )}
                <span className="font-medium text-[#7D6B60]">
                  Showing <strong className="text-[#382820]">{filteredLeads.length}</strong> leads
                </span>
              </div>
            </div>

            {/* Mobile Card View (For small screens < 768px) */}
            <div className="block md:hidden divide-y divide-[#EFE7DE]">
              {filteredLeads.map((item, index) => {
                const isSelected = selectedIndices.includes(index);
                return (
                  <div key={index} className={`p-4 space-y-3 transition ${isSelected ? 'bg-[#FAF2EB]' : 'hover:bg-[#FAF7F2]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(index)}
                          className="mt-1 rounded border-[#D5C2AD] text-[#6F4E37] focus:ring-[#8C5E3C] w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <h4 className="font-bold text-[#2C221E] text-sm leading-snug">{item.title}</h4>
                          <div className="text-[11px] text-[#7D6B60] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#A8988B] flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{item.address || 'Address visible on Maps'}</span>
                          </div>
                        </div>
                      </div>

                      {item.gmbUrl && (
                        <a
                          href={item.gmbUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-[#5C3D2E] bg-[#EFE7DE] px-2 py-1 rounded-md flex items-center gap-1 flex-shrink-0"
                        >
                          <span>GMB</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Status & Contact Row on Mobile */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F2ECE3] text-xs">
                      <div>
                        {item.hasWebsite ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[#235828] bg-[#EAF5EA] px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Has Website
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[#943621] bg-[#FCECE8] px-2 py-0.5 rounded text-[11px]">
                            <AlertCircle className="w-3 h-3" /> No Website
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            className="inline-flex items-center gap-1 font-bold text-[#5C3D2E] bg-[#EFE7DE] px-2 py-1 rounded-md text-[11px]"
                          >
                            <Phone className="w-3 h-3 text-[#6F4E37]" />
                            {item.phone}
                          </a>
                        )}
                        {item.email && (
                          <a
                            href={`mailto:${item.email}`}
                            className="inline-flex items-center gap-1 font-bold text-[#2E6B34] bg-[#EAF5EA] px-2 py-1 rounded-md text-[11px]"
                          >
                            <Mail className="w-3 h-3 text-[#2E6B34]" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-[#382820]">
                <thead className="bg-[#FAF7F2]/60 text-xs uppercase font-bold text-[#7D6B60] tracking-wider border-b border-[#E8DFD5]">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-[#D5C2AD] text-[#6F4E37] focus:ring-[#8C5E3C] w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-4">Business & Location</th>
                    <th className="py-3.5 px-4">Website Status</th>
                    <th className="py-3.5 px-4">Direct Phone</th>
                    <th className="py-3.5 px-4">Email Address</th>
                    <th className="py-3.5 px-4">Rating / Reviews</th>
                    <th className="py-3.5 px-4 text-right">Maps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE7DE]">
                  {filteredLeads.map((item, index) => {
                    const isSelected = selectedIndices.includes(index);
                    return (
                      <tr key={index} className={`transition ${isSelected ? 'bg-[#FAF2EB]' : 'hover:bg-[#FAF7F2]/80'}`}>
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(index)}
                            className="rounded border-[#D5C2AD] text-[#6F4E37] focus:ring-[#8C5E3C] w-4 h-4 cursor-pointer"
                          />
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <div className="font-bold text-[#2C221E] text-base truncate">{item.title}</div>
                          <div className="text-xs text-[#7D6B60] flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#A8988B]" />
                            <span className="truncate">{item.address || 'Address visible on Maps'}</span>
                          </div>
                          {item.category && (
                            <span className="inline-block mt-1 text-[11px] bg-[#EADBC8] text-[#5C3D2E] font-medium px-2 py-0.5 rounded-md">
                              {item.category}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {item.hasWebsite ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#235828] bg-[#EAF5EA] border border-[#BDE0BD] px-2 py-1 rounded-md">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Has Website
                              </span>
                              <div className="text-xs text-[#7D6B60] truncate max-w-[170px]">
                                <a
                                  href={item.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-[#6F4E37] underline flex items-center gap-1 font-medium"
                                >
                                  <Globe className="w-3 h-3 flex-shrink-0" />
                                  {item.website.replace(/^https?:\/\//, '')}
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#943621] bg-[#FCECE8] border border-[#F5C7BC] px-2 py-1 rounded-md">
                              <AlertCircle className="w-3.5 h-3.5" /> No Website Found
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {item.phone ? (
                            <a
                              href={`tel:${item.phone}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C3D2E] bg-[#EFE7DE] hover:bg-[#E2D4C5] border border-[#D5C2AD] px-3 py-1.5 rounded-lg transition"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
                              <span className="tracking-wide">{item.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-[#A8988B] italic">No phone found</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {item.email ? (
                            <a
                              href={`mailto:${item.email}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2E6B34] bg-[#EAF5EA] border border-[#BDE0BD] px-2.5 py-1.5 rounded-lg hover:bg-[#DDF0DD] transition"
                              title={item.email}
                            >
                              <Mail className="w-3.5 h-3.5 text-[#2E6B34]" />
                              <span className="truncate max-w-[130px]">{item.email}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-[#A8988B] italic">Not available</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-[#9E650C] text-xs font-bold">
                            <Star className="w-3.5 h-3.5 fill-[#E5A11E] text-[#E5A11E]" />
                            <span>{item.rating || 'N/A'}</span>
                            <span className="text-[#8C7A6E] font-normal">({item.reviewsCount})</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {item.gmbUrl && (
                            <a
                              href={item.gmbUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#5C3D2E] font-semibold hover:text-black bg-[#EFE7DE] hover:bg-[#E2D4C5] border border-[#D5C2AD] px-2.5 py-1.5 rounded-lg transition"
                              title="View on Google Maps"
                            >
                              <span>GMB</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Empty state placeholder */}
        {leads.length === 0 && !loading && (
          <div className="text-center py-12 sm:py-16 border-2 border-dashed border-[#E0D5C7] rounded-2xl bg-[#FAF7F2]/50 px-4">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#A8988B] mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-bold text-[#382820]">Ready to discover local leads</h3>
            <p className="text-xs text-[#7D6B60] max-w-sm mx-auto mt-1">
              Select or type your <strong>City</strong> & <strong>Area</strong>, enter your Category, and click &quot;Discover&quot;.
            </p>
          </div>
        )}

      </main>

      {/* Bulk Automated Outreach Modal */}
      {showOutreachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white border border-[#E8DFD5] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-[#E8DFD5] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm sm:text-base font-bold text-[#382820]">
                  Automated Outreach ({selectedIndices.length} Selected)
                </h3>
              </div>
              <button 
                onClick={() => setShowOutreachModal(false)}
                className="text-[#8C7A6E] hover:text-[#382820] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-2">
                  Choose Outreach Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setMessageChannel('whatsapp')}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold transition ${
                      messageChannel === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-[#FAF7F2] text-[#6F4E37] border-[#E8DFD5] hover:bg-[#F2ECE3]'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp Blast
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageChannel('email')}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 rounded-xl border text-xs sm:text-sm font-bold transition ${
                      messageChannel === 'email'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-[#FAF7F2] text-[#6F4E37] border-[#E8DFD5] hover:bg-[#F2ECE3]'
                    }`}
                  >
                    <Mail className="w-4 h-4" /> Bulk Email (BCC)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4E37]">
                    Pitch Message Template
                  </label>
                  <span className="text-[10px] text-[#8C7A6E]">Tags: <strong>{'{business_name}'}</strong>, <strong>{'{location}'}</strong></span>
                </div>
                <textarea
                  rows={3}
                  value={customPitch}
                  onChange={(e) => setCustomPitch(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl p-3 text-xs sm:text-sm text-[#2C221E] focus:outline-none focus:border-[#8C5E3C] focus:bg-white transition"
                />
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8DFD5] p-3.5 sm:p-4 rounded-xl space-y-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#382820] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    {messageChannel === 'whatsapp' ? 'Start Auto WhatsApp Blast' : 'Send Bulk Email to All'}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#7D6B60] mt-0.5">
                    {messageChannel === 'whatsapp'
                      ? `Launches personalized WhatsApp chats for all ${selectedIndices.length} leads in sequence!`
                      : `Prepares 1 email draft with all ${selectedIndices.length} addresses in BCC.`}
                  </p>
                </div>

                {messageChannel === 'whatsapp' ? (
                  <div>
                    <button
                      type="button"
                      disabled={isBlasting}
                      onClick={startAutoWhatsAppBlast}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-xl transition shadow-md disabled:opacity-50 text-xs sm:text-sm"
                    >
                      {isBlasting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Blasting ({blastProgress}%)...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          Launch WhatsApp Blast ({selectedIndices.length})
                        </>
                      )}
                    </button>
                    {isBlasting && (
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300" 
                          style={{ width: `${blastProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={sendBulkEmailToAll}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-xl transition shadow-md text-xs sm:text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Open Email Composer with {selectedIndices.length} Leads (BCC)
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyBulkContacts}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-[#D5C2AD] hover:bg-[#FAF7F2] text-[#5C3D2E] font-semibold text-[11px] sm:text-xs py-2 px-3 rounded-lg transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy {messageChannel === 'whatsapp' ? 'Numbers' : 'Emails'}
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#4A3525] hover:bg-[#382820] text-white font-semibold text-[11px] sm:text-xs py-2 px-3 rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export (.xlsx)
                </button>
              </div>

            </div>

            <div className="px-5 py-3 border-t border-[#E8DFD5] bg-[#FAF7F2] flex justify-end">
              <button
                type="button"
                onClick={() => setShowOutreachModal(false)}
                className="bg-[#6F4E37] text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#583D2A] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
