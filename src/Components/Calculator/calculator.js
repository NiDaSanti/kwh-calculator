import React, { useState, useEffect } from 'react'
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
  const [charges, setCharges] = useState('')
  const [usage, setUsage] = useState('')
  const [annualUsage, setAnnualUsage] = useState('')
  const [scePecentage, setScePecentage] = useState('')
  const [projectedMonthlyBill, setProjectedMonthlyBill] = useState(null)
  const [sunRunAnnualRateIncrease, setSunRunAnnualRateIncrease] = useState('0.00')
  const [rate, setRate] = useState(null)
  const [projectedFutureRateIncrease, setProjectedFutureRateIncrease] = useState('0.00')
  const [avgPerMonthCost, setAvgPerMonthCost] = useState(null)
  const [projectedBills, setProjectedBills] = useState({ sunrunBills: [], sceBills: [] })
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.innerWidth >= 768
  })
  // const [open, setOpen] = useState(false)
  
  // const handleOpen = () => setOpen(true)
  // const handleClose = () => setOpen(false)

  function calculateRate() {
    const chargesValue = parseFloat(charges)
    const usageValues = parseFloat(usage)
  
    if (chargesValue > 0 && usageValues > 0) {
      const calculatedRate = chargesValue / usageValues
      const roundedRate = Math.floor(calculatedRate * 100) / 100
      setRate(roundedRate.toFixed(2))
    } else {
      setRate(null)
    }
  }

  function calculateAnnualUsage() {
    const parsedPercentage = parseFloat(scePecentage)

    if (rate && annualUsage > 0 && !Number.isNaN(parsedPercentage)) {
      const avgMonthlyBill = (annualUsage * parseFloat(rate)) / 12
      const projectedFutureAvg = avgMonthlyBill * (parsedPercentage / 100)
      const totalProjectedMontlyBill = avgMonthlyBill + projectedFutureAvg

      setAvgPerMonthCost(avgMonthlyBill.toFixed(2))
      setProjectedMonthlyBill(totalProjectedMontlyBill.toFixed(2))
    }
  }

  function generateProjectedBills(initialBill, sunRunStartMonthlyCost) {
    const sunrunIncrease = 1.035 // 3.5% annual increase
    const parsedInitialIncrease = parseFloat(scePecentage)
    const parsedMinIncrease = parseFloat(projectedFutureRateIncrease)
    const sceInitialIncrease = 1 + (Number.isNaN(parsedInitialIncrease) ? 0 : parsedInitialIncrease) / 100
    const sceMinIncrease = 1 + (Number.isNaN(parsedMinIncrease) ? 0 : parsedMinIncrease) / 100
    const totalYears = xYearsLabel.length

    if (!Number.isFinite(initialBill) || !Number.isFinite(sunRunStartMonthlyCost) || initialBill <= 0 || sunRunStartMonthlyCost <= 0) {
      setProjectedBills({ sunrunBills: [], sceBills: [] })
      return
    }

    const sunrunBills = []
    const sceBills = []

    let currentSunrunBill = sunRunStartMonthlyCost * sunrunIncrease
    let currentSceBill = initialBill * sceInitialIncrease

    sunrunBills.push(currentSunrunBill.toFixed(2))
    sceBills.push(currentSceBill.toFixed(2))

    for (let i = 1; i < totalYears; i++) {
      currentSunrunBill *= sunrunIncrease
      currentSceBill *= sceMinIncrease

      sunrunBills.push(currentSunrunBill.toFixed(2))
      sceBills.push(currentSceBill.toFixed(2))
    }

    setProjectedBills({ sunrunBills, sceBills })
  }

  useEffect(() => {
    if (rate && annualUsage > 0) {
      calculateAnnualUsage() // Only calculate annual usage if conditions are met
    }
  }, [rate, annualUsage]); // Remove calculateAnnualUsage and avgPerMonthCost from the dependencies

  useEffect(() => {
    if (avgPerMonthCost) {
      generateProjectedBills(parseFloat(avgPerMonthCost), parseFloat(sunRunAnnualRateIncrease)); // Now, handle projected bills based on avgPerMonthCost in a separate effect
    }
  }, [avgPerMonthCost]);

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

  const handleSubmit = (e) => {
    e.preventDefault()
    calculateRate()
  }

  const handleSunRunMonthlyCost = (e) => {
    if (rate && sunRunAnnualRateIncrease > 0) {
      // Trigger the projected bills calculation with the SunRun start rate
      const sunRunStartMonthlyCost = parseFloat(sunRunAnnualRateIncrease)
      generateProjectedBills(parseFloat(avgPerMonthCost), sunRunStartMonthlyCost)
    } else {
      console.error("Rate or SunRun Start Monthly Cost is not set properly.")
    }
  }

  const handleReset = () => {
    setCharges('')
    setUsage('')
    setAnnualUsage('')
    setScePecentage('')
    setSunRunAnnualRateIncrease('0.00')
    setRate(null)
    setProjectedFutureRateIncrease('0.00')
    setAvgPerMonthCost(null)
    setProjectedMonthlyBill(null)
    setProjectedBills({ sunrunBills: [], sceBills: [] })
  }

  const chartData = xYearsLabel
    .map((year, index) => {
      const sunrunBill = projectedBills.sunrunBills[index]
      const sceBill = projectedBills.sceBills[index]

      if (!sunrunBill || !sceBill) {
        return null
      }

      const sunrunValue = parseFloat(sunrunBill)
      const sceValue = parseFloat(sceBill)

      return {
        year,
        SunRun: sunrunValue,
        SCE: sceValue,
        Savings: Math.max(sceValue - sunrunValue, 0)
      }
    })
    .filter(Boolean)

  const projectedMonthlyBillNumber = rate !== null && projectedMonthlyBill ? parseFloat(projectedMonthlyBill) : null
  const sunrunMonthlyCostNumber = sunRunAnnualRateIncrease ? parseFloat(sunRunAnnualRateIncrease) : null
  const monthlySavings = projectedMonthlyBillNumber !== null && sunrunMonthlyCostNumber > 0
    ? projectedMonthlyBillNumber - sunrunMonthlyCostNumber
    : null
  const firstYearSavings = chartData.length > 0 ? chartData[0].Savings * 12 : null
  const tenYearSavings = chartData.length > 0 ? chartData[chartData.length - 1].Savings * 12 : null
  const monthlyDifferenceDisplay = monthlySavings !== null ? Math.abs(monthlySavings) : null
  const monthlyDifferenceLabel = monthlySavings !== null && monthlySavings < 0 ? 'added cost' : 'saved'
  const hasFirstYearSavings = firstYearSavings !== null && firstYearSavings > 0
  const hasTenYearSavings = tenYearSavings !== null && tenYearSavings > 0

  const formatCurrency = (value, options = {}) => {
    if (value === null || Number.isNaN(value)) {
      return '--'
    }

    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0, ...options })
  }

  return (
    <section className="calculator-container">
      <div className="calculator-header">
        <span className="calculator-badge">Energy insights</span>
        <h1><span>Visualize</span> your SCE costs with clarity</h1>
        <p>Enter your recent charges and usage to calculate today&rsquo;s rate, then explore how future increases compare with a predictable Sunrun plan.</p>
        <div className="header-pills">
          <span>10-year projection</span>
          <span>Side-by-side comparison</span>
          <span>Custom Sunrun plan</span>
        </div>
      </div>

      <div className="calculator-grid">
        <form className="calculator-form surface-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <h3>Usage details</h3>
            <p>We&rsquo;ll use these figures to determine your current kWh rate.</p>
          </div>

          <div className="form-group">
            <label><AttachMoneyIcon /> Monthly Charges</label>
            <input type="number" step="0.01" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder="e.g. 225.60" required />
          </div>

          <div className="form-group">
            <label><PowerOutlinedIcon /> Monthly kWh Usage</label>
            <input type="number" value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="e.g. 540" required />
          </div>

          <div className="form-group">
            <label><BoltTwoToneIcon /> Annual kWh Usage</label>
            <input type="number" step="0.01" value={annualUsage} onChange={(e) => setAnnualUsage(e.target.value)} placeholder="e.g. 6480" required />
          </div>

          <div className="form-group">
            <label><PercentIcon /> Rate change percentage</label>
            <input type="number" value={scePecentage} onChange={(e) => setScePecentage(e.target.value)} placeholder="Projected annual increase" required />
          </div>

          <div className="form-group">
            <label><PercentIcon /> Minimal rate percentage</label>
            <input type="number" value={projectedFutureRateIncrease} onChange={(e) => setProjectedFutureRateIncrease(e.target.value)} placeholder="Baseline annual increase" required />
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

          {rate !== null ? (
            <>
              <Box sx={listWrapperStyles}>
                <List sx={listStyles}>
                  <ListItem className="result-item">
                    <ListItemText primary={`The rate is ${rate} per kWh.`} secondary={`($ ${charges || 0} / ${usage || 0})`} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem className="result-item">
                    <ListItemText primary={`The average monthly cost is ${avgPerMonthCost}`} secondary={`(${annualUsage || 0} × $ ${rate} / 12)`} />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem className="result-item">
                    <ListItemText primary={`The monthly bill with change is $ ${projectedMonthlyBill}`} secondary={`(${avgPerMonthCost} × (1 + ${scePecentage || 0} / 100))`} />
                  </ListItem>
                </List>
              </Box>

              <div className="sunrun-input-container">
                <p className="warning-label">Compare against a Sunrun plan</p>
                <div className="sunrun-input-row">
                  <label htmlFor="sunrun-rate"><SolarPowerTwoToneIcon /> Sunrun monthly cost</label>
                  <input id="sunrun-rate" type="number" step="0.01" value={sunRunAnnualRateIncrease} onChange={(e) => setSunRunAnnualRateIncrease(e.target.value)} placeholder="e.g. 185.00" />
                </div>
                <button className="sunrun-calculate-btn" onClick={handleSunRunMonthlyCost} type="button">Update projection</button>
              </div>

              <div className="insight-highlights">
                <article className="insight-card accent-blue">
                  <span className="insight-label">Current rate</span>
                  <span className="insight-metric">${rate} <span className="insight-unit">/ kWh</span></span>
                  <p className="insight-caption">Reflects today&rsquo;s billing with a {scePecentage || 0}% annual increase assumption.</p>
                </article>

                <article className="insight-card accent-emerald">
                  <span className="insight-label">Monthly difference</span>
                  <span className="insight-metric">
                    {monthlyDifferenceDisplay !== null ? `$${formatCurrency(monthlyDifferenceDisplay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                    {monthlyDifferenceDisplay !== null && <span className="insight-unit"> {monthlyDifferenceLabel}</span>}
                  </span>
                  <p className="insight-caption">
                    {hasFirstYearSavings
                      ? `Keep roughly $${formatCurrency(firstYearSavings)} more in year one when compared with Sunrun.`
                      : monthlySavings !== null && monthlySavings < 0
                        ? 'Sunrun currently adds to your monthly costs—lower the starting rate to see savings.'
                        : 'Enter a Sunrun monthly cost to explore first-year savings.'}
                  </p>
                </article>

                <article className="insight-card accent-amber">
                  <span className="insight-label">Long-term outlook</span>
                  <span className="insight-metric">
                    {tenYearSavings !== null ? `$${formatCurrency(tenYearSavings)}` : '--'}
                    {tenYearSavings !== null && <span className="insight-unit"> / yr</span>}
                  </span>
                  <p className="insight-caption">
                    {hasTenYearSavings
                      ? `Projected annual savings by ${chartData.length > 0 ? chartData[chartData.length - 1].year : '2035'} assuming current trends continue.`
                      : monthlySavings !== null && monthlySavings < 0
                        ? 'Sunrun remains above SCE over the next decade at this rate.'
                        : 'Add a Sunrun monthly cost to unlock decade-long comparisons.'}
                  </p>
                </article>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h4>Ready when you are</h4>
              <p>Provide your charges and usage to unlock projections tailored to your household.</p>
            </div>
          )}
        </div>
      </div>

      {rate !== null && chartData.length > 0 && (
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
                <CartesianGrid strokeDasharray="4 4" stroke="#cbd5f5" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#334155' }} angle={-30} textAnchor="end" interval={0} height={70} />
                <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12, fill: '#334155' }} width={90} />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '4 2', stroke: '#94a3b8' }} />
                {isDesktop && (
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 20 }}
                    iconType="circle"
                  />
                )}
                <Area type="monotone" dataKey="Savings" stroke="none" fill="url(#savingsGradient)" fillOpacity={1} legendType="none" />
                <Line type="monotone" dataKey="SunRun" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="SCE" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  )
}

export default Calculator
