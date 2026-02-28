import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (!error) setTransactions(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (tx) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...tx, user_id: user.id }])
      .select()
      .single()
    if (!error) setTransactions(prev => [data, ...prev])
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  return { transactions, loading, add, remove, refetch: fetch }
}
