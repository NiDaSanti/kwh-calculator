import React, { useEffect, useMemo, useState } from 'react'
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BoltTwoToneIcon from '@mui/icons-material/BoltTwoTone'
import SolarPowerTwoToneIcon from '@mui/icons-material/SolarPowerTwoTone'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined'
import Box from '@mui/material/Box'
import PercentIcon from '@mui/icons-material/Percent'
import './styles.css'  // Importing the updated CSS file

const xYearsLabel = ["2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035"]

const listStyles = {
  py: 0,
  width: '100%',
  borderRadius: 3,
  border: '1px solid rgba(148, 163, 184, 0.35)',
  backgroundColor: 'rgba(255,255,255,0.85)',
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.12)',
  backdropFilter: 'blur(14px)'
}

const listWrapperStyles = {
  width: '100%'
}
const currencyFormatter = (value) => {
  if (value === 0) {
    return '$0'
  }

  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatCurrency = (value, options = { minimumFractionDigits: 0, maximumFractionDigits: 0 }) => {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return `$${value.toLocaleString(undefined, options)}`
}

const formatCurrencyWithSpace = (value, options) => {
  const formatted = formatCurrency(value, options)

  if (formatted.startsWith('$') && formatted[1] !== ' ') {
    return `$ ${formatted.slice(1)}`
  }

  return formatted
}

const formatRate = (value) => {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return `$${value.toFixed(2)}`
}

const formatPercentage = (value, digits = 1) => {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return `${value.toFixed(digits)}%`
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const sunrun = payload.find((item) => item.dataKey === 'SunRun')
  const sce = payload.find((item) => item.dataKey === 'SCE')
  const savings = payload.find((item) => item.dataKey === 'Savings')

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {sunrun && (
        <div className="chart-tooltip__item" style={{ '--color': sunrun.color }}>
          <span>Sunrun</span>
          <strong>${sunrun.value.toFixed(2)}</strong>
        </div>
      )}
      {sce && (
        <div className="chart-tooltip__item" style={{ '--color': sce.color }}>
          <span>SCE</span>
          <strong>${sce.value.toFixed(2)}</strong>
        </div>
      )}
      {savings?.value != null && (
        <div className="chart-tooltip__savings">
          <span>Yearly savings</span>
          <strong>${(savings.value * 12).toFixed(2)}</strong>
        </div>
      )}
    </div>
  )
}

const Calculator = () => {
  const [formValues, setFormValues] = useState({
    charges: '',
    usage: '',
    annualUsage: '',
    sceIncrease: '',
    sceFloor: ''
  })
  const [results, setResults] = useState(null)
  const [sunrunInput, setSunrunInput] = useState('')
  const [sunrunMonthlyCost, setSunrunMonthlyCost] = useState(null)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.innerWidth >= 768
  })

  const handleInputChange = (key) => (event) => {
    setFormValues((previous) => ({
      ...previous,
      [key]: event.target.value
    }))
  }

  const parseInputValue = (value) => {
    const parsed = parseFloat(value)

    if (!Number.isFinite(parsed)) {
      return null
    }

    return parsed
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const chargesValue = parseInputValue(formValues.charges)
    const usageValue = parseInputValue(formValues.usage)
    const annualUsageValue = parseInputValue(formValues.annualUsage)

    if (!chargesValue || !usageValue || !annualUsageValue) {
      setResults(null)
      return
    }

    const sceIncreaseValue = parseInputValue(formValues.sceIncrease) ?? 0
    const sceFloorValue = parseInputValue(formValues.sceFloor)
    const rate = chargesValue / usageValue
    const avgMonthlyCost = (annualUsageValue * rate) / 12
    const projectedMonthlyBill = avgMonthlyCost * (1 + sceIncreaseValue / 100)

    setResults({
      rate,
      avgMonthlyCost,
      projectedMonthlyBill,
      charges: chargesValue,
      usage: usageValue,
      annualUsage: annualUsageValue,
      sceIncrease: sceIncreaseValue,
      sceFloor: Number.isFinite(sceFloorValue) ? sceFloorValue : sceIncreaseValue
    })
  }

  const handleSunrunMonthlyCost = () => {
    const parsed = parseInputValue(sunrunInput)

    if (!results || !parsed || parsed <= 0) {
      return
    }

    setSunrunMonthlyCost(parsed)
    setSunrunInput(parsed.toFixed(2))
  }

  const handleReset = () => {
    setFormValues({
      charges: '',
      usage: '',
      annualUsage: '',
      sceIncrease: '',
      sceFloor: ''
    })
    setResults(null)
    setSunrunInput('')
    setSunrunMonthlyCost(null)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const chartData = useMemo(() => {
    if (!results || !Number.isFinite(sunrunMonthlyCost) || sunrunMonthlyCost <= 0) {
      return []
    }

    const sunrunGrowth = 1.035
    const sceInitialMultiplier = 1 + (results.sceIncrease ?? 0) / 100
    const sceFloorMultiplier = 1 + (results.sceFloor ?? results.sceIncrease ?? 0) / 100
    let currentSunrun = sunrunMonthlyCost
    let currentSce = results.avgMonthlyCost

    return xYearsLabel.map((year, index) => {
      if (index === 0) {
        currentSunrun *= sunrunGrowth
        currentSce *= sceInitialMultiplier
      } else {
        currentSunrun *= sunrunGrowth
        currentSce *= sceFloorMultiplier
      }

      const savings = Math.max(currentSce - currentSunrun, 0)

      return {
        year,
        SunRun: Number(currentSunrun.toFixed(2)),
        SCE: Number(currentSce.toFixed(2)),
        Savings: Number(savings.toFixed(2))
      }
    })
  }, [results, sunrunMonthlyCost])

  const parsedRate = results ? results.rate : null
  const avgMonthlyCostValue = results ? results.avgMonthlyCost : null
  const projectedMonthlyBillValue = results ? results.projectedMonthlyBill : null
  const sunrunReady = chartData.length > 0
  const firstYearSunrunTotal = sunrunReady ? chartData[0].SunRun * 12 : null
  const firstYearSceTotal = sunrunReady ? chartData[0].SCE * 12 : null
  const firstYearSavings = sunrunReady ? chartData[0].Savings * 12 : null
  const lifetimeSavings = sunrunReady
    ? chartData.reduce((accumulator, point) => accumulator + point.Savings * 12, 0)
    : null
  const totalSceSpend = sunrunReady
    ? chartData.reduce((accumulator, point) => accumulator + point.SCE * 12, 0)
    : null
  const savingsPercentage = lifetimeSavings && totalSceSpend
    ? (lifetimeSavings / totalSceSpend) * 100
    : null
  const bestSavingsYear = sunrunReady
    ? chartData.reduce(
        (best, point) => {
          const annualSavings = point.Savings * 12

          if (annualSavings > best.amount) {
            return { year: point.year, amount: annualSavings }
          }

          return best
        },
        { year: chartData[0].year, amount: chartData[0].Savings * 12 }
      )
    : null

  return (
    <section className="calculator-container">
      <div className="calculator-header">
        <span className="calculator-badge">Energy insights</span>
        <h1>Visualize your SCE costs with clarity</h1>
        <p>Enter your recent charges and usage to calculate today&rsquo;s rate, then explore how future increases compare with a predictable Sunrun plan.</p>
      </div>

      <div className="calculator-grid">
        <form className="calculator-form surface-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <h3>Usage details</h3>
            <p>We&rsquo;ll use these figures to determine your current kWh rate.</p>
          </div>

          <div className="form-group">
            <label><AttachMoneyIcon /> Monthly Charges</label>
            <input
              type="number"
              step="0.01"
              value={formValues.charges}
              onChange={handleInputChange('charges')}
              placeholder="e.g. 225.60"
              required
            />
          </div>

          <div className="form-group">
            <label><PowerOutlinedIcon /> Monthly kWh Usage</label>
            <input
              type="number"
              value={formValues.usage}
              onChange={handleInputChange('usage')}
              placeholder="e.g. 540"
              required
            />
          </div>

          <div className="form-group">
            <label><BoltTwoToneIcon /> Annual kWh Usage</label>
            <input
              type="number"
              step="0.01"
              value={formValues.annualUsage}
              onChange={handleInputChange('annualUsage')}
              placeholder="e.g. 6480"
              required
            />
          </div>

          <div className="form-group">
            <label><PercentIcon /> Rate change percentage</label>
            <input
              type="number"
              value={formValues.sceIncrease}
              onChange={handleInputChange('sceIncrease')}
              placeholder="Projected annual increase"
              required
            />
          </div>

          <div className="form-group">
            <label><PercentIcon /> Minimal rate percentage</label>
            <input
              type="number"
              value={formValues.sceFloor}
              onChange={handleInputChange('sceFloor')}
              placeholder="Baseline annual increase"
              required
            />
          </div>

          <div className="button-group">
            <button type="submit">Calculate rate</button>
            <button className="reset" type="button" onClick={handleReset}>Reset</button>
          </div>
        </form>

        <div className="result-panel surface-card">
          <div className="result-header">
            <h3>Bill snapshot</h3>
            <p>See how your current rate compares with upcoming adjustments.</p>
          </div>

          {results ? (
            <>
              <Box sx={listWrapperStyles}>
                <List sx={listStyles}>
                  <ListItem className="result-item">
                    <ListItemText
                      primary={`The rate is ${formatRate(parsedRate)} per kWh.`}
                      secondary={`(${formatCurrency(results.charges, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${results.usage.toLocaleString()} kWh)`}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem className="result-item">
                    <ListItemText
                      primary={`The average monthly cost is ${formatCurrencyWithSpace(avgMonthlyCostValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      secondary={`(${results.annualUsage.toLocaleString()} kWh × ${formatRate(parsedRate)} ÷ 12)`}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem className="result-item">
                    <ListItemText
                      primary={`The monthly bill with change is ${formatCurrencyWithSpace(projectedMonthlyBillValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      secondary={`(${formatCurrency(avgMonthlyCostValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × (1 + ${(results.sceIncrease ?? 0).toFixed(2)}% SCE))`}
                    />
                  </ListItem>
                </List>
              </Box>

              <div className="insight-metrics">
                <div className="metric-card metric-card--primary">
                  <span className="metric-card__label">Current rate</span>
                  <strong className="metric-card__value">{formatRate(parsedRate)}</strong>
                  <span className="metric-card__hint">per kWh today</span>
                </div>

                <div className="metric-card">
                  <span className="metric-card__label">Average monthly spend</span>
                  <strong className="metric-card__value">{formatCurrency(avgMonthlyCostValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  <span className="metric-card__hint">based on your usage</span>
                </div>

                <div className="metric-card">
                  <span className="metric-card__label">Projected monthly bill</span>
                  <strong className="metric-card__value">{formatCurrency(projectedMonthlyBillValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  <span className="metric-card__hint">with SCE increases</span>
                </div>

                {sunrunReady && (
                  <div className="metric-card metric-card--positive">
                    <span className="metric-card__label">Year one Sunrun savings</span>
                    <strong className="metric-card__value">{formatCurrency(firstYearSavings, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                    <span className="metric-card__hint">vs. projected SCE spend</span>
                  </div>
                )}
              </div>

              <div className="sunrun-input-container">
                <p className="warning-label">Compare against a Sunrun plan</p>
                <div className="sunrun-input-row">
                  <label htmlFor="sunrun-rate"><SolarPowerTwoToneIcon /> Sunrun monthly cost</label>
                  <input
                    id="sunrun-rate"
                    type="number"
                    step="0.01"
                    value={sunrunInput}
                    onChange={(event) => setSunrunInput(event.target.value)}
                    placeholder="e.g. 185.00"
                    disabled={!results}
                  />
                </div>
                <button className="sunrun-calculate-btn" onClick={handleSunrunMonthlyCost} type="button" disabled={!results}>Update projection</button>
              </div>

              {sunrunReady && (
                <div className="insight-panel">
                  <div className="insight-panel__header">
                    <h4>Sunrun outlook</h4>
                    {Number.isFinite(lifetimeSavings) && (
                      <span className="insight-chip">{formatCurrency(lifetimeSavings)}</span>
                    )}
                  </div>
                  <ul className="insight-panel__list">
                    <li>
                      <span>Year one savings potential</span>
                      <strong>{formatCurrency(firstYearSavings, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                    </li>
                    {Number.isFinite(firstYearSceTotal) && (
                      <li>
                        <span>Projected SCE year one cost</span>
                        <strong>{formatCurrency(firstYearSceTotal, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                      </li>
                    )}
                    {Number.isFinite(firstYearSunrunTotal) && (
                      <li>
                        <span>Sunrun year one cost</span>
                        <strong>{formatCurrency(firstYearSunrunTotal, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                      </li>
                    )}
                    <li>
                      <span>Ten-year savings projection</span>
                      <strong>{formatCurrency(lifetimeSavings, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                    </li>
                    <li>
                      <span>Share of SCE costs avoided</span>
                      <strong>{formatPercentage(savingsPercentage)}</strong>
                    </li>
                    {bestSavingsYear && (
                      <li>
                        <span>Peak annual savings year</span>
                        <strong>{bestSavingsYear.year}: {formatCurrency(bestSavingsYear.amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
                      </li>
                    )}
                  </ul>
                  <p className="insight-panel__footnote">Savings assume Sunrun bills escalate at 3.5% annually compared with your projected SCE increases.</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h4>Ready when you are</h4>
              <p>Provide your charges and usage to unlock projections tailored to your household.</p>
            </div>
          )}
        </div>
      </div>

      {results && chartData.length > 0 && (
        <div className="chart-card surface-card">
          <div className="chart-header">
            <h3>Projected monthly bills (next 10 years)</h3>
            <p>Track the gap between SCE&rsquo;s expected increases and Sunrun&rsquo;s steady 3.5% escalation.</p>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#cbd5f5" vertical={false} strokeOpacity={0.6} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#334155' }} angle={-30} textAnchor="end" interval={0} height={70} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.4)' }} />
                <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12, fill: '#334155' }} width={90} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '4 2', stroke: '#94a3b8' }} />
                {isDesktop && (
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 20, paddingRight: 14 }}
                    iconType="circle"
                    iconSize={12}
                  />
                )}
                <Area type="monotone" dataKey="Savings" stroke="none" fill="url(#savingsGradient)" fillOpacity={1} legendType="none" />
                <Line
                  type="monotone"
                  dataKey="SunRun"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, stroke: '#f8fafc' }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#0f172a' }}
                />
                <Line
                  type="monotone"
                  dataKey="SCE"
                  stroke="#f97316"
                  strokeWidth={3}
                  strokeDasharray="6 3"
                  dot={{ r: 4, strokeWidth: 2, stroke: '#f8fafc' }}
                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#0f172a' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  )
}

export default Calculator
