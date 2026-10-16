'use client'

export interface Resource {
  id: string
  material_name: string
  category: string
  quantity: number
  unit: string
  condition: string
  location: string
  intended_use: string
  status: 'available' | 'matched' | 'collected' | 'reused'
  created_at: string
  photo_name?: string
  photo_preview?: string
  notes?: string
  is_demo?: boolean
}

export interface ResourceRequest {
  id: string
  requester_name: string
  requested_category: string
  material_needed: string
  quantity: number
  unit: string
  location: string
  distance_km?: number
  intended_use: string
  status: 'open' | 'matched' | 'fulfilled'
  created_at: string
  is_demo?: boolean
}

export interface Exchange {
  id: string
  resource_id: string
  request_id: string
  resource_name: string
  requester_name: string
  quantity: number
  unit: string
  status: 'matched' | 'collected' | 'confirmed_reused'
  quantity_collected: number
  quantity_reused: number
  collected_at: string | null
  reuse_confirmed_at: string | null
  created_at: string
  notes?: string
}

export interface CostEstimate {
  id: string
  exchange_id?: string
  title: string
  external_total: number
  local_total: number
  estimated_savings: number
  created_at: string
}

export interface MatchResult {
  resource: Resource
  request: ResourceRequest
  score: number
  status_badge: string
  reason: string
  distance_str: string
  transport_cost_str: string
  is_compatible: boolean
}

// Initial demonstration data (explicitly labelled)
export const initialResources: Resource[] = [
  {
    id: 'res-demo-01',
    material_name: 'Paddy straw',
    category: 'Crop residue',
    quantity: 240,
    unit: 'kg',
    condition: 'Dry and baled',
    location: 'Nashik, Maharashtra',
    intended_use: 'Mushroom substrate',
    status: 'available',
    created_at: '2026-10-12T10:00:00Z',
    is_demo: true,
  },
  {
    id: 'res-demo-02',
    material_name: 'Dry leaf litter',
    category: 'Organic matter',
    quantity: 85,
    unit: 'kg',
    condition: 'Dry, loose leaves',
    location: 'Igatpuri, Maharashtra',
    intended_use: 'Compost carbon layer',
    status: 'available',
    created_at: '2026-10-13T09:30:00Z',
    is_demo: true,
  },
  {
    id: 'res-demo-03',
    material_name: 'Coconut husk & coir',
    category: 'Horticultural residue',
    quantity: 120,
    unit: 'kg',
    condition: 'Clean and washed',
    location: 'Sinnar, Maharashtra',
    intended_use: 'Mulch or coir',
    status: 'available',
    created_at: '2026-10-13T14:15:00Z',
    is_demo: true,
  },
  {
    id: 'res-demo-04',
    material_name: 'Sugarcane bagasse',
    category: 'Crop residue',
    quantity: 350,
    unit: 'kg',
    condition: 'Sun-dried, fibrous',
    location: 'Niphad, Maharashtra',
    intended_use: 'Composting & mulch',
    status: 'available',
    created_at: '2026-10-14T08:00:00Z',
    is_demo: true,
  },
]

export const initialRequests: ResourceRequest[] = [
  {
    id: 'req-demo-01',
    requester_name: 'Sahyadri Mushroom Growers',
    requested_category: 'Crop residue',
    material_needed: 'Paddy straw',
    quantity: 250,
    unit: 'kg',
    location: 'Nashik (Rural)',
    distance_km: 8,
    intended_use: 'Mushroom substrate',
    status: 'open',
    created_at: '2026-10-12T11:00:00Z',
    is_demo: true,
  },
  {
    id: 'req-demo-02',
    requester_name: 'GreenGrow Organic Farm',
    requested_category: 'Organic matter',
    material_needed: 'Dry leaves or mulch',
    quantity: 100,
    unit: 'kg',
    location: 'Igatpuri Valley',
    distance_km: 14,
    intended_use: 'Compost carbon layer',
    status: 'open',
    created_at: '2026-10-13T12:00:00Z',
    is_demo: true,
  },
  {
    id: 'req-demo-03',
    requester_name: 'Godavari Horti Nursery',
    requested_category: 'Horticultural residue',
    material_needed: 'Coconut husk / coir',
    quantity: 150,
    unit: 'kg',
    location: 'Sinnar Agro Hub',
    distance_km: 21,
    intended_use: 'Mulch or coir',
    status: 'open',
    created_at: '2026-10-13T15:30:00Z',
    is_demo: true,
  },
]

export const initialExchanges: Exchange[] = [
  {
    id: 'exc-demo-01',
    resource_id: 'res-seed-01',
    request_id: 'req-seed-01',
    resource_name: 'Wheat straw bundle (Demo)',
    requester_name: 'Niphad Dairy Cooperative',
    quantity: 400,
    unit: 'kg',
    status: 'confirmed_reused',
    quantity_collected: 400,
    quantity_reused: 400,
    collected_at: '2026-10-07T14:00:00Z',
    reuse_confirmed_at: '2026-10-09T11:30:00Z',
    created_at: '2026-10-06T10:00:00Z',
    notes: 'Exchanged for cattle bedding; fully utilised and confirmed by receiving dairy farm.',
  },
  {
    id: 'exc-demo-02',
    resource_id: 'res-seed-02',
    request_id: 'req-seed-02',
    resource_name: 'Mustard stalk biomass (Demo)',
    requester_name: 'Panchavati Composters',
    quantity: 300,
    unit: 'kg',
    status: 'collected',
    quantity_collected: 300,
    quantity_reused: 0,
    collected_at: '2026-10-14T16:00:00Z',
    reuse_confirmed_at: null,
    created_at: '2026-10-13T16:00:00Z',
    notes: 'Collected and currently in aerated composting heap; reuse confirmation pending compost maturation.',
  },
]

export const initialCostEstimates: CostEstimate[] = [
  {
    id: 'est-demo-01',
    exchange_id: 'exc-demo-01',
    title: 'Wheat straw dairy bedding exchange',
    external_total: 6500,
    local_total: 2100,
    estimated_savings: 4400,
    created_at: '2026-10-07T15:00:00Z',
  },
]

// Transparent Agricultural Rules Engine
export interface AdvisorSuggestion {
  primary_category: string
  detected_name: string
  potential_uses: string[]
  fit_rationale: string
  information_needed: string[]
  precautions: string[]
  caution_level: 'standard' | 'high'
}

export function getAdvisorSuggestions(
  materialName: string,
  category: string,
  condition: string,
  intendedUse: string
): AdvisorSuggestion {
  const nameLower = materialName.toLowerCase().trim()
  const condLower = condition.toLowerCase().trim()

  if (nameLower.includes('straw') || nameLower.includes('paddy') || nameLower.includes('rice') || nameLower.includes('wheat')) {
    return {
      primary_category: 'Crop residue',
      detected_name: materialName || 'Paddy / Cereal Straw',
      potential_uses: [
        'Mushroom cultivation substrate (Oyster / Paddy straw mushrooms)',
        'Compost brown carbon layer (High C:N ~80:1 balance)',
        'Protective soil mulching for moisture retention',
        'Animal bedding (if free from agrochemical residues)',
      ],
      fit_rationale:
        'Cereal straws are dry, lignocellulosic fibers with high carbon content. They provide porous structural integrity in compost heaps and retain moisture well as organic mulch.',
      information_needed: [
        'Confirmation of recent systemic pesticide or fungicide applications',
        'Moisture content verification (must be < 14% to prevent Aspergillus mold)',
        'Storage duration and degree of weather exposure',
      ],
      precautions: [
        'Do not burn under any circumstances (causes severe air pollution and destroys micronutrients).',
        'If intended for mushroom substrate, ensure zero contamination from persistent fungicides.',
        'Always wear a dust mask during dry baling or turning to avoid spore inhalation.',
      ],
      caution_level: 'standard',
    }
  }

  if (nameLower.includes('leaf') || nameLower.includes('leaves') || nameLower.includes('litter') || nameLower.includes('foliage')) {
    return {
      primary_category: 'Organic matter',
      detected_name: materialName || 'Dry Leaf Litter',
      potential_uses: [
        'Rapid carbon layer for aerated compost piles',
        'Surface sheet mulching for orchards and tree basins',
        'Leaf mold soil conditioner (fungal decomposition over 6-12 months)',
      ],
      fit_rationale:
        'Dry leaves are abundant, gentle carbonaceous biomass. They break down moderately fast without nitrogen robbing if mixed in balanced ratios (30:1 C:N overall).',
      information_needed: [
        'Tree species source (e.g. avoid Eucalyptus or Walnut in large quantities due to allelopathic compounds)',
        'Presence of road dust, plastic rubbish, or urban contaminants',
      ],
      precautions: [
        'Avoid leaves showing signs of black spot fungus or powdery mildew if mulching sensitive crops.',
        'Ensure leaves are damp before shredding to prevent airborne dust.',
      ],
      caution_level: 'standard',
    }
  }

  if (nameLower.includes('coconut') || nameLower.includes('coir') || nameLower.includes('husk')) {
    return {
      primary_category: 'Horticultural residue',
      detected_name: materialName || 'Coconut Husk & Coir',
      potential_uses: [
        'Long-lasting weed-suppressing tree mulch',
        'Potted plant aeration medium & potting mix additive',
        'Coir geotextile or moisture boundary in raised beds',
      ],
      fit_rationale:
        'Coconut husk has remarkable lignin durability and resists rapid microbial decay, lasting 2-3 seasons as mulch. Highly absorbent for water conservation.',
      information_needed: [
        'Salinity / electrical conductivity (EC) level if sourced near coastal waters or washed with saline water',
        'Particle size (crushed husk vs raw shells)',
      ],
      precautions: [
        'High sodium/potassium in unwashed coir can burn sensitive root seedlings; ensure washing if used in nursery mix.',
      ],
      caution_level: 'standard',
    }
  }

  if (nameLower.includes('bagasse') || nameLower.includes('cane') || nameLower.includes('stalk') || nameLower.includes('cotton')) {
    return {
      primary_category: 'Crop residue',
      detected_name: materialName || 'Fibrous Agro-Stalks & Bagasse',
      potential_uses: [
        'Compost bulking agent for dense manure',
        'Biochar or pyrolyzed soil amendment',
        'Biomass briquettes for rural thermal energy',
        'Long-term orchard mulching',
      ],
      fit_rationale:
        'High lignin and hemicellulose provide structure that prevents anaerobic compaction in composting.',
      information_needed: [
        'Residual sugar content (in bagasse) which can attract pests or sour if stored damp',
        'Chipping/chipped size (coarse woody stalks require chipping before rapid use)',
      ],
      precautions: [
        'Woody stalks (e.g. cotton) decompose slowly if not shredded.',
        'Watch for termitic or borer attraction in large unmanaged piles.',
      ],
      caution_level: condLower.includes('wet') ? 'high' : 'standard',
    }
  }

  // Fallback generic agricultural residue rules
  return {
    primary_category: category || 'Organic residue',
    detected_name: materialName || 'Agricultural Residue',
    potential_uses: [
      'Layered compost carbon input',
      'Protective surface mulch',
      'Soil organic matter enrichment after shredding',
    ],
    fit_rationale:
      'Agricultural biomass provides valuable organic carbon and trace nutrients when returned to local agricultural soils rather than discarded.',
    information_needed: [
      'Moisture level and storage conditions',
      'Presence of foreign matter, plastic, or agrochemical sprays',
      'Verification with a local agricultural extension specialist',
    ],
    precautions: [
      'This rule-based suggestion is an advisory starting point, not a laboratory certification.',
      'Check local quarantine rules if moving plant residues between districts.',
    ],
    caution_level: 'standard',
  }
}

// Transparent Matching Algorithm
export function evaluateMatches(resources: Resource[], requests: ResourceRequest[]): MatchResult[] {
  const results: MatchResult[] = []

  const availableResources = resources.filter((r) => r.status === 'available')

  for (const resource of availableResources) {
    for (const request of requests) {
      if (request.status === 'fulfilled') continue

      // Suitability check 1: Category or Material compatibility
      const resName = resource.material_name.toLowerCase()
      const reqName = request.material_needed.toLowerCase()
      const reqCat = request.requested_category.toLowerCase()
      const resCat = resource.category.toLowerCase()

      const nameMatch = resName.includes(reqName) || reqName.includes(resName)
      const catMatch = resCat === reqCat || resCat.includes(reqCat) || reqCat.includes(resCat)

      // Intended use check
      const useMatch =
        resource.intended_use.toLowerCase().includes(request.intended_use.toLowerCase()) ||
        request.intended_use.toLowerCase().includes(resource.intended_use.toLowerCase()) ||
        resource.intended_use === 'Not sure' ||
        resource.intended_use === 'Not sure yet'

      // Exclude incompatible materials
      const isConditionIncompatible =
        (resource.condition.toLowerCase().includes('mixed') || resource.condition.toLowerCase().includes('soil')) &&
        request.intended_use.toLowerCase().includes('mushroom')

      if (isConditionIncompatible) {
        // Excluded by agricultural suitability rule
        continue
      }

      if (!nameMatch && !catMatch && !useMatch) {
        continue
      }

      // Transparent scoring
      let score = 50 // Base compatibility
      const reasons: string[] = []

      if (nameMatch) {
        score += 25
        reasons.push(`Material name (${resource.material_name}) matches request`)
      } else if (catMatch) {
        score += 15
        reasons.push(`Category (${resource.category}) is compatible`)
      }

      if (useMatch) {
        score += 15
        reasons.push(`Intended use (${request.intended_use}) aligns`)
      }

      // Quantity compatibility
      const qtyDiffRatio = Math.abs(resource.quantity - request.quantity) / Math.max(resource.quantity, request.quantity)
      if (qtyDiffRatio <= 0.25) {
        score += 10
        reasons.push(`Quantity (${resource.quantity} ${resource.unit}) closely fits demand (${request.quantity} ${request.unit})`)
      } else if (qtyDiffRatio <= 0.5) {
        score += 5
        reasons.push(`Quantity is within practical exchange margin`)
      }

      const finalScore = Math.min(score, 96)
      const distance = request.distance_km ?? 12
      const estTransport = Math.round(distance * 28 + 120) // ₹28/km + base handling ₹120

      results.push({
        resource,
        request,
        score: finalScore,
        status_badge: finalScore >= 85 ? 'Strong fit' : finalScore >= 70 ? 'Good fit' : 'Needs review',
        reason: reasons.join('; ') + '.',
        distance_str: `${distance} km`,
        transport_cost_str: `₹${estTransport}`,
        is_compatible: true,
      })
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score)
}
