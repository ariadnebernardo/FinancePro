import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useBudgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: false })
    if (!error) setBudgets(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const upsert = async (budget) => {
    const { data, error } = await supabase
      .from('budgets')
      .upsert([{ ...budget, user_id: user.id }], { onConflict: 'user_id,category,month' })
      .select().single()
    if (!error) setBudgets(prev => {
      const filtered = prev.filter(b => !(b.category === budget.category && b.month === budget.month))
      return [...filtered, data]
    })
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (!error) setBudgets(prev => prev.filter(b => b.id !== id))
    return { error }
  }

  return { budgets, loading, upsert, remove, refetch: fetch }
}
