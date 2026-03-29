const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const { optionalAuth } = require('../middleware/auth');
const EvidenceEntry = require('../models/EvidenceEntry');
const Intervention = require('../models/Intervention');

// Get all evidence entries (public)
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;
  
  const category = req.query.category;
  const search = req.query.search;
  
  const query = { isActive: true };
  
  if (category) {
    query.category = category;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { summary: { $regex: search, $options: 'i' } },
      { keywords: { $in: [new RegExp(search, 'i')] } },
    ];
  }
  
  const [entries, total] = await Promise.all([
    EvidenceEntry.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-citations'),
    EvidenceEntry.countDocuments(query),
  ]);
  
  res.json({
    success: true,
    data: {
      entries: entries.map(e => ({
        id: e._id,
        title: e.title,
        slug: e.slug,
        summary: e.summary,
        evidenceStrength: e.evidenceStrength,
        category: e.category,
        relatedIntervention: e.relatedIntervention,
        imageUrl: e.imageUrl,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

// Get single evidence entry by slug (public)
router.get('/:slug', asyncHandler(async (req, res) => {
  const entry = await EvidenceEntry.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate('alternatives', 'name slug');
  
  if (!entry) {
    return res.status(404).json({
      success: false,
      error: { code: 'ENTRY_NOT_FOUND', message: 'Evidence entry not found' },
    });
  }
  
  res.json({
    success: true,
    data: { entry },
  });
}));

// Get all interventions (public)
router.get('/interventions/all', asyncHandler(async (req, res) => {
  const category = req.query.category;
  
  const query = { isActive: true };
  if (category) {
    query.category = category;
  }
  
  const interventions = await Intervention.find(query)
    .sort({ category: 1, sortOrder: 1 })
    .select('name slug category shortDescription bestFor evidenceLevel onsetMinutes');
  
  res.json({
    success: true,
    data: {
      interventions: interventions.map(i => ({
        id: i._id,
        name: i.name,
        slug: i.slug,
        category: i.category,
        shortDescription: i.shortDescription,
        bestFor: i.bestFor,
        evidenceLevel: i.evidenceLevel,
        onsetMinutes: i.onsetMinutes,
      })),
    },
  });
}));

// Get single intervention by slug (public)
router.get('/interventions/:slug', asyncHandler(async (req, res) => {
  const intervention = await Intervention.findOne({
    slug: req.params.slug,
    isActive: true,
  });
  
  if (!intervention) {
    return res.status(404).json({
      success: false,
      error: { code: 'INTERVENTION_NOT_FOUND', message: 'Intervention not found' },
    });
  }
  
  res.json({
    success: true,
    data: { intervention },
  });
}));

module.exports = router;