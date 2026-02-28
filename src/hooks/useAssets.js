import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useAssets() {
  const { user } = useAuth()
  const [assets, setAssets]     = useState([])
  const [dividends, setDividends] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: a }, { data: d }] = await Promise.all([
      supabase.from('assets').select('*').eq('user_id', user.id).order('ticker'),
      supabase.from('dividends').select('*').eq('user_id', user.id).order('month'),
    ])
    setAssets(a ?? [])
    setDividends(d ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // ── Assets ──────────────────────────────────────────────────
  const addAsset = async (asset) => {
    const { data, error } = await supabase
      .from('assets')
      .insert([{ ...asset, user_id: user.id }])
      .select().single()
    if (!error) setAssets(prev => [...prev, data].sort((a,b) => a.ticker.localeCompare(b.ticker)))
    return { data, error }
  }

  const updateAsset = async (id, updates) => {
    const { data, error } = await supabase
      .from('assets').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (!error) setAssets(prev => prev.map(a => a.id === id ? data : a))
    return { data, error }
  }

  const removeAsset = async (id) => {
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (!error) {
      setAssets(prev => prev.filter(a => a.id !== id))
      setDividends(prev => prev.filter(d => d.asset_id !== id))
    }
    return { error }
  }

  // ── Dividends ────────────────────────────────────────────────
  const upsertDividend = async (div) => {
    const { data, error } = await supabase
      .from('dividends')
      .upsert([{ ...div, user_id: user.id }], { onConflict: 'asset_id,month' })
      .select().single()
    if (!error) setDividends(prev => {
      const filtered = prev.filter(d => !(d.asset_id === div.asset_id && d.month === div.month))
      return [...filtered, data].sort((a,b) => a.month.localeCompare(b.month))
    })
    return { data, error }
  }

  const removeDividend = async (id) => {
    const { error } = await supabase.from('dividends').delete().eq('id', id)
    if (!error) setDividends(prev => prev.filter(d => d.id !== id))
    return { error }
  }

  // ── Helper: dividends for a given asset ─────────────────────
  const getDividendsForAsset = (assetId) =>
    dividends.filter(d => d.asset_id === assetId)

  return {
    assets, dividends, loading,
    addAsset, updateAsset, removeAsset,
    upsertDividend, removeDividend,
    getDividendsForAsset, refetch: fetch,
  }
}
