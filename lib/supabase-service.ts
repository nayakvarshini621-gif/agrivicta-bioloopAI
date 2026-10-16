import { supabase, isSupabaseConfigured } from './supabase'
import {
  Resource,
  ResourceRequest,
  Exchange,
  CostEstimate,
  initialResources,
  initialRequests,
  initialExchanges,
  initialCostEstimates,
} from './store'

export async function fetchResourcesFromSupabase(): Promise<Resource[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetchResources error:', error)
      return null
    }
    return data as Resource[]
  } catch (err) {
    console.error('Supabase fetchResources exception:', err)
    return null
  }
}

export async function fetchRequestsFromSupabase(): Promise<ResourceRequest[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('resource_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetchRequests error:', error)
      return null
    }
    return data as ResourceRequest[]
  } catch (err) {
    console.error('Supabase fetchRequests exception:', err)
    return null
  }
}

export async function fetchExchangesFromSupabase(): Promise<Exchange[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('exchanges')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetchExchanges error:', error)
      return null
    }
    return data as Exchange[]
  } catch (err) {
    console.error('Supabase fetchExchanges exception:', err)
    return null
  }
}

export async function fetchCostEstimatesFromSupabase(): Promise<CostEstimate[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase
      .from('cost_estimates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetchCostEstimates error:', error)
      return null
    }
    return data as CostEstimate[]
  } catch (err) {
    console.error('Supabase fetchCostEstimates exception:', err)
    return null
  }
}

export async function insertResourceToSupabase(resource: Resource): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false
  try {
    const { error } = await supabase.from('resources').insert({
      id: resource.id,
      material_name: resource.material_name,
      category: resource.category,
      quantity: resource.quantity,
      unit: resource.unit,
      condition: resource.condition,
      location: resource.location,
      intended_use: resource.intended_use,
      status: resource.status,
      created_at: resource.created_at,
      photo_name: resource.photo_name ?? null,
      photo_preview: resource.photo_preview ?? null,
      notes: resource.notes ?? null,
      is_demo: resource.is_demo ?? false,
    })

    if (error) {
      console.error('Supabase insertResource error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase insertResource exception:', err)
    return false
  }
}

export async function updateResourceStatusInSupabase(
  id: string,
  status: Resource['status']
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false
  try {
    const { error } = await supabase
      .from('resources')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Supabase updateResourceStatus error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase updateResourceStatus exception:', err)
    return false
  }
}

export async function insertExchangeToSupabase(exchange: Exchange): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false
  try {
    const { error } = await supabase.from('exchanges').insert({
      id: exchange.id,
      resource_id: exchange.resource_id,
      request_id: exchange.request_id,
      resource_name: exchange.resource_name,
      requester_name: exchange.requester_name,
      quantity: exchange.quantity,
      unit: exchange.unit,
      status: exchange.status,
      quantity_collected: exchange.quantity_collected,
      quantity_reused: exchange.quantity_reused,
      collected_at: exchange.collected_at,
      reuse_confirmed_at: exchange.reuse_confirmed_at,
      created_at: exchange.created_at,
      notes: exchange.notes ?? null,
    })

    if (error) {
      console.error('Supabase insertExchange error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase insertExchange exception:', err)
    return false
  }
}

export async function updateExchangeInSupabase(
  id: string,
  updates: Partial<Exchange>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false
  try {
    const { error } = await supabase
      .from('exchanges')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Supabase updateExchange error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase updateExchange exception:', err)
    return false
  }
}

export async function insertCostEstimateToSupabase(estimate: CostEstimate): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false
  try {
    const { error } = await supabase.from('cost_estimates').insert({
      id: estimate.id,
      exchange_id: estimate.exchange_id ?? null,
      title: estimate.title,
      external_total: estimate.external_total,
      local_total: estimate.local_total,
      estimated_savings: estimate.estimated_savings,
      created_at: estimate.created_at,
    })

    if (error) {
      console.error('Supabase insertCostEstimate error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase insertCostEstimate exception:', err)
    return false
  }
}

export async function seedSupabaseIfEmpty(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false
  try {
    // Check if resources table has any rows
    const { data, error } = await supabase.from('resources').select('id').limit(1)
    if (error) {
      console.error('Check resources table error:', error)
      return false
    }

    if (!data || data.length === 0) {
      // Seed initial resources
      await supabase.from('resources').insert(
        initialResources.map((r) => ({
          ...r,
          photo_name: r.photo_name ?? null,
          photo_preview: r.photo_preview ?? null,
          notes: r.notes ?? null,
        }))
      )
      // Seed initial requests
      await supabase.from('resource_requests').insert(
        initialRequests.map((req) => ({
          ...req,
        }))
      )
      // Seed initial exchanges
      await supabase.from('exchanges').insert(
        initialExchanges.map((exc) => ({
          ...exc,
          notes: exc.notes ?? null,
        }))
      )
      // Seed initial cost estimates
      await supabase.from('cost_estimates').insert(
        initialCostEstimates.map((est) => ({
          ...est,
          exchange_id: est.exchange_id ?? null,
        }))
      )
      return true
    }
    return false
  } catch (err) {
    console.error('Supabase seed error:', err)
    return false
  }
}

export async function resetSupabaseData(): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false
  try {
    // Delete in reverse dependency order
    await supabase.from('cost_estimates').delete().neq('id', '')
    await supabase.from('exchanges').delete().neq('id', '')
    await supabase.from('resource_requests').delete().neq('id', '')
    await supabase.from('resources').delete().neq('id', '')

    // Re-seed default demo records
    await supabase.from('resources').insert(
      initialResources.map((r) => ({
        ...r,
        photo_name: r.photo_name ?? null,
        photo_preview: r.photo_preview ?? null,
        notes: r.notes ?? null,
      }))
    )
    await supabase.from('resource_requests').insert(
      initialRequests.map((req) => ({
        ...req,
      }))
    )
    await supabase.from('exchanges').insert(
      initialExchanges.map((exc) => ({
        ...exc,
        notes: exc.notes ?? null,
      }))
    )
    await supabase.from('cost_estimates').insert(
      initialCostEstimates.map((est) => ({
        ...est,
        exchange_id: est.exchange_id ?? null,
      }))
    )
    return true
  } catch (err) {
    console.error('Supabase reset error:', err)
    return false
  }
}
