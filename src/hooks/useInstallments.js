import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useInstallments() {
  const { user } = useAuth()
  const [installments, setInstallments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('installments')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
    if (!error) setInstallments(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (item) => {
    const { data, error } = await supabase
      .from('installments')
      .insert([{ ...item, user_id: user.id }])
      .select().single()
    if (!error) setInstallments(prev => [data, ...prev])
    return { data, error }
  }

  const update = async (id, updates) => {
    const { data, error } = await supabase
      .from('installments').update(updates).eq('id', id).select().single()
    if (!error) setInstallments(prev => prev.map(i => i.id === id ? data : i))
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('installments').delete().eq('id', id)
    if (!error) setInstallments(prev => prev.filter(i => i.id !== id))
    return { error }
  }

  return { installments, loading, add, update, remove, refetch: fetch }
}
