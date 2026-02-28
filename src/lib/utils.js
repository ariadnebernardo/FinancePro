export const BRL = (v, digits = 2) =>
  Number(v ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

export const PCT = (v) => `${Number(v ?? 0).toFixed(2)}%`

export const MONTHS_BR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export const EXPENSE_CATS = ['Moradia','Alimentação','Transporte','Saúde','Educação','Lazer','Vestuário','Serviços','Outros']
export const INCOME_CATS  = ['Salário','Freelance','Investimentos','Aluguel','Outros']
export const INV_TYPES    = ['FII','Ação','BDR','ETF']
export const SEGMENTS     = ['Logístico','Shoppings','Papel','Lajes Corporativas','Energia','Seguros','Bancos','Tecnologia','Outros']

export const PALETTE = ['#63b3ed','#f6ad55','#68d391','#b794f4','#fc8181','#4fd1c5','#f687b3','#fbd38d']

export const SEGMENT_COLORS = {
  Logístico: '#63b3ed', Shoppings: '#f6ad55', Papel: '#68d391',
  'Lajes Corporativas': '#b794f4', Energia: '#fc8181', Seguros: '#4fd1c5',
  Bancos: '#fbd38d', Tecnologia: '#f687b3', Outros: '#cbd5e0',
}

export function getCurrentMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(m) {
  const [y, mo] = m.split('-')
  return `${MONTHS_BR[parseInt(mo) - 1]} ${y}`
}

export function prevMonth(m) {
  const [y, mo] = m.split('-')
  const d = new Date(+y, +mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nextMonth(m) {
  const [y, mo] = m.split('-')
  const d = new Date(+y, +mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function lastNMonths(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - (n - 1) + i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}
