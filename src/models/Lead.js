import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema(
  {
    searchQuery: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },
    keyword: { type: String, required: true },
    title: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    category: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    hasWebsite: { type: Boolean, default: false },
    gmbUrl: { type: String, default: '' },
    hasGmb: { type: Boolean, default: true },
    leadScore: { type: Number, default: 50 },
    priority: { 
      type: String, 
      enum: ['HIGH', 'MEDIUM', 'LOW'], 
      default: 'MEDIUM' 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
