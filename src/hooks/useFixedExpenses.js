import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFixedExpenses() {
  const { user } = useAuth()
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [incomePlan, setIncomePlan]       = useState([])
  const [loading, setLoading]             = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: fe }, { data: ip }] = await Promise.all([
      supabase.from('fixed_expenses').select('*').eq('user_id', user.id).order('category'),
      supabase.from('monthly_income_plan').select('*').eq('user_id', user.id).order('month', { ascending: false }),
    ])
    setFixedExpenses(fe ?? [])
    setIncomePlan(ip ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // Fixed expenses CRUD
  const addFixed = async (item) => {
    const { data, error } = await supabase
      .from('fixed_expenses').insert([{ ...item, user_id: user.id }]).select().single()
    if (!error) setFixedExpenses(prev => [...prev, data])
    return { data, error }
  }

  const updateFixed = async (id, updates) => {
    const { data, error } = await supabase
      .from('fixed_expenses').update(updates).eq('id', id).select().single()
    if (!error) setFixedExpenses(prev => prev.map(f => f.id === id ? data : f))
    return { data, error }
  }

  const removeFixed = async (id) => {
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id)
    if (!error) setFixedExpenses(prev => prev.filter(f => f.id !== id))
    return { error }
  }

  // Income plan upsert
  const upsertIncomePlan = async (month, expected) => {
    const { data, error } = await supabase
      .from('monthly_income_plan')
      .upsert([{ user_id: user.id, month, expected }], { onConflict: 'user_id,month' })
      .select().single()
    if (!error) setIncomePlan(prev => {
      const filtered = prev.filter(p => p.month !== month)
      return [data, ...filtered]
    })
    return { data, error }
  }

  const getExpectedIncome = (month) =>
    incomePlan.find(p => p.month === month)?.expected ?? 0

  return {
    fixedExpenses, incomePlan, loading,
    addFixed, updateFixed, removeFixed,
    upsertIncomePlan, getExpectedIncome,
    refetch: fetch,
  }
}
