import React, { useState, useEffect, useCallback } from 'react'
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
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import InsightsIcon from '@mui/icons-material/Insights'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import './styles.css'  // Importing the updated CSS file

const xYearsLabel = ["2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035"]
const SUNRUN_ESCALATION = 3.5

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
  const [sunRunMonthlyCost, setSunRunMonthlyCost] = useState('')
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

  const generateProjectedBills = useCallback((initialBill, sunRunStartMonthlyCost) => {
    const sunrunIncrease = 1 + SUNRUN_ESCALATION / 100
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
  }, [scePecentage, projectedFutureRateIncrease])

  useEffect(() => {
    const parsedPercentage = parseFloat(scePecentage)
    const parsedRate = rate !== null ? parseFloat(rate) : null

    if (parsedRate && annualUsage > 0 && !Number.isNaN(parsedPercentage)) {
      const avgMonthlyBill = (annualUsage * parsedRate) / 12
      const projectedFutureAvg = avgMonthlyBill * (parsedPercentage / 100)
      const totalProjectedMontlyBill = avgMonthlyBill + projectedFutureAvg

      setAvgPerMonthCost(avgMonthlyBill.toFixed(2))
      setProjectedMonthlyBill(totalProjectedMontlyBill.toFixed(2))
    } else {
      setAvgPerMonthCost(null)
      setProjectedMonthlyBill(null)
    }
  }, [rate, annualUsage, scePecentage])

  useEffect(() => {
    if (!avgPerMonthCost) {
      return
    }

    const parsedSunrun = parseFloat(sunRunMonthlyCost)

    if (!Number.isFinite(parsedSunrun) || parsedSunrun <= 0) {
      setProjectedBills({ sunrunBills: [], sceBills: [] })
      return
    }

    generateProjectedBills(parseFloat(avgPerMonthCost), parsedSunrun)
  }, [avgPerMonthCost, sunRunMonthlyCost, generateProjectedBills])

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
    const parsedSunrun = parseFloat(sunRunMonthlyCost)

    if (rate && avgPerMonthCost && Number.isFinite(parsedSunrun) && parsedSunrun > 0) {
      // Trigger the projected bills calculation with the SunRun start rate
      generateProjectedBills(parseFloat(avgPerMonthCost), parsedSunrun)
    } else {
      console.error("Rate or SunRun Start Monthly Cost is not set properly.")
    }
  }

  const handleReset = () => {
    setCharges('')
    setUsage('')
    setAnnualUsage('')
    setScePecentage('')
    setSunRunMonthlyCost('')
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
  const sunrunMonthlyCostNumber = sunRunMonthlyCost ? parseFloat(sunRunMonthlyCost) : null
  const monthlySavings = projectedMonthlyBillNumber !== null && sunrunMonthlyCostNumber > 0
    ? projectedMonthlyBillNumber - sunrunMonthlyCostNumber
    : null
  const firstYearSavings = chartData.length > 0 ? chartData[0].Savings * 12 : null
  const tenYearSavings = chartData.length > 0 ? chartData[chartData.length - 1].Savings * 12 : null
  const fiveYearSavings = chartData.length > 0 ? chartData.slice(0, 5).reduce((acc, item) => acc + item.Savings * 12, 0) : null
  const cumulativeTenYearSavings = chartData.length > 0 ? chartData.reduce((acc, item) => acc + item.Savings * 12, 0) : null
  const peakSavings = chartData.reduce((best, item) => {
    if (!best || item.Savings > best.Savings) {
      return { year: item.year, Savings: item.Savings }
    }

    return best
  }, null)
  const monthlyDifferenceDisplay = monthlySavings !== null ? Math.abs(monthlySavings) : null
  const monthlyDifferenceLabel = monthlySavings !== null && monthlySavings < 0 ? 'added cost' : 'saved'
  const hasFirstYearSavings = firstYearSavings !== null && firstYearSavings > 0
  const hasTenYearSavings = tenYearSavings !== null && tenYearSavings > 0
  const hasFiveYearSavings = fiveYearSavings !== null && fiveYearSavings > 0
  const hasCumulativeTenYearSavings = cumulativeTenYearSavings !== null && cumulativeTenYearSavings > 0
  const hasPeakSavings = peakSavings !== null && peakSavings.Savings > 0

  const parsedProjectedIncrease = parseFloat(scePecentage)
  const parsedBaselineIncrease = parseFloat(projectedFutureRateIncrease)
  const hasProjectedIncrease = !Number.isNaN(parsedProjectedIncrease)
  const hasBaselineIncrease = !Number.isNaN(parsedBaselineIncrease)
  const projectedVsBaselineDiff = hasProjectedIncrease && hasBaselineIncrease
    ? parsedProjectedIncrease - parsedBaselineIncrease
    : null
  const projectedVsSunrunDiff = hasProjectedIncrease ? parsedProjectedIncrease - SUNRUN_ESCALATION : null
  const formatPercentage = (value) => {
    if (value === null || Number.isNaN(value)) {
      return '--'
    }

    return `${value.toFixed(1)}%`
  }

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
        <p>Enter your recent charges and usage to calculate today&rsquo;s rate, then explore how your percentage-based projections stack up against a steady Sunrun plan.</p>
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
            <input
              type="number"
              value={scePecentage}
              onChange={(e) => {
                setScePecentage(e.target.value)
              }}
              placeholder="Projected annual increase"
              required
            />
          </div>

          <div className="form-group">
            <label><PercentIcon /> Minimal rate percentage</label>
            <input
              type="number"
              value={projectedFutureRateIncrease}
              onChange={(e) => {
                setProjectedFutureRateIncrease(e.target.value)
              }}
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
                  <input id="sunrun-rate" type="number" step="0.01" value={sunRunMonthlyCost} onChange={(e) => setSunRunMonthlyCost(e.target.value)} placeholder="e.g. 185.00" />
                </div>
                <button className="sunrun-calculate-btn" onClick={handleSunRunMonthlyCost} type="button">Update projection</button>
              </div>

              <div className="insight-highlights">
                <article className="insight-card accent-blue">
                  <span className="insight-label">Current rate</span>
                  <span className="insight-metric">${rate} <span className="insight-unit">/ kWh</span></span>
                  <p className="insight-caption">Reflects today&rsquo;s billing with your projected {scePecentage || 0}% annual increase.</p>
                </article>

                <article className="insight-card accent-emerald">
                  <span className="insight-label">Monthly difference</span>
                  <span className="insight-metric">
                    {monthlyDifferenceDisplay !== null ? `$${formatCurrency(monthlyDifferenceDisplay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                    {monthlyDifferenceDisplay !== null && <span className="insight-unit"> {monthlyDifferenceLabel}</span>}
                  </span>
                  <p className="insight-caption">
                    {hasFirstYearSavings
                      ? `Keep roughly $${formatCurrency(firstYearSavings)} more in year one when compared with Sunrun’s ${SUNRUN_ESCALATION.toFixed(1)}% escalation.`
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
                      ? `Projected annual savings by ${chartData.length > 0 ? chartData[chartData.length - 1].year : '2035'} using your utility increase inputs.`
                      : monthlySavings !== null && monthlySavings < 0
                        ? 'Sunrun remains above SCE over the next decade at this rate.'
                        : 'Add a Sunrun monthly cost to unlock decade-long comparisons.'}
                  </p>
                </article>
                <article className="insight-card accent-violet">
                  <span className="insight-label">Five-year cushion</span>
                  <span className="insight-metric">
                    {hasFiveYearSavings ? `$${formatCurrency(fiveYearSavings)}` : '--'}
                    {hasFiveYearSavings && <span className="insight-unit"> cumulative</span>}
                  </span>
                  <p className="insight-caption">
                    {hasFiveYearSavings
                      ? `Keep roughly $${formatCurrency(fiveYearSavings, { minimumFractionDigits: 0 })} in your pocket during the first five years.`
                      : 'If this value reads zero, lower the Sunrun starting cost or adjust rate increases to uncover savings.'}
                  </p>
                </article>
              </div>

              <div className="assumption-panel">
                <div className="assumption-panel__header">
                  <h4>Annual increase inputs</h4>
                  <p>Compare the percentages you entered for utility growth with Sunrun&rsquo;s assumed escalation.</p>
                </div>
                <div className="assumption-panel__grid">
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Projected SCE increase</span>
                    <span className="assumption-metric__value">{hasProjectedIncrease ? formatPercentage(parsedProjectedIncrease) : '--'}</span>
                  </div>
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Baseline SCE increase</span>
                    <span className="assumption-metric__value">{hasBaselineIncrease ? formatPercentage(parsedBaselineIncrease) : '--'}</span>
                  </div>
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Sunrun escalation</span>
                    <span className="assumption-metric__value">{formatPercentage(SUNRUN_ESCALATION)}</span>
                  </div>
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Projected vs. baseline</span>
                    <span className="assumption-metric__value">{projectedVsBaselineDiff !== null ? formatPercentage(projectedVsBaselineDiff) : '--'}</span>
                  </div>
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Projected vs. Sunrun</span>
                    <span className="assumption-metric__value">{projectedVsSunrunDiff !== null ? formatPercentage(projectedVsSunrunDiff) : '--'}</span>
                  </div>
                </div>
                <p className="assumption-panel__caption">
                  {hasProjectedIncrease
                    ? `Your projected SCE increase is ${formatPercentage(parsedProjectedIncrease)} compared with a ${formatPercentage(SUNRUN_ESCALATION)} Sunrun escalation.`
                    : 'Provide projected and baseline percentages to compare assumptions.'}
                </p>
              </div>

              {(hasCumulativeTenYearSavings || hasPeakSavings) && (
                <div className="savings-summary">
                  <div className="savings-summary__header">
                    <span className="savings-summary__badge"><TrendingUpIcon /> Savings storyline</span>
                    <h4>See how the gap evolves as rates shift</h4>
                    <p>Your figures recalculate instantly as you tweak the plan above.</p>
                  </div>
                  <div className="savings-summary__grid">
                    <div className="metric-chip">
                      <span className="metric-chip__icon" aria-hidden="true">
                        <EventAvailableIcon />
                      </span>
                      <div>
                        <p className="metric-chip__label">Ten-year cumulative</p>
                        <p className="metric-chip__value">
                          {hasCumulativeTenYearSavings ? `$${formatCurrency(cumulativeTenYearSavings)}` : '--'}
                          {hasCumulativeTenYearSavings && <span> saved</span>}
                        </p>
                        <p className="metric-chip__caption">
                          {hasCumulativeTenYearSavings
                            ? 'Total savings when comparing month-to-month bills over the coming decade.'
                            : 'Adjust assumptions until Sunrun pulls ahead to reveal decade-long savings.'}
                        </p>
                      </div>
                    </div>
                    <div className="metric-chip">
                      <span className="metric-chip__icon" aria-hidden="true">
                        <InsightsIcon />
                      </span>
                      <div>
                        <p className="metric-chip__label">Peak savings year</p>
                        <p className="metric-chip__value">
                          {hasPeakSavings && peakSavings
                            ? `${peakSavings.year}: $${formatCurrency(peakSavings.Savings * 12)}`
                            : '--'}
                        </p>
                        <p className="metric-chip__caption">
                          {hasPeakSavings
                            ? 'Highest projected annual savings before utility increases narrow the gap.'
                            : 'Savings never overtake SCE with the current entries—try a lower Sunrun rate.'}
                        </p>
                      </div>
                    </div>
                  </div>
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

      {rate !== null && chartData.length > 0 && (
        <div className="chart-card surface-card">
          <div className="chart-header">
            <h3>Projected monthly bills (next 10 years)</h3>
            <p>Track the gap between SCE&rsquo;s expected increases and Sunrun&rsquo;s steady {SUNRUN_ESCALATION.toFixed(1)}% escalation.</p>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart
                data={chartData}
                margin={{ top: 36, right: 36, bottom: 56, left: 24 }}
              >
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#cbd5f5" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#334155' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={70}
                  tickMargin={14}
                />
                <YAxis
                  tickFormatter={currencyFormatter}
                  tick={{ fontSize: 12, fill: '#334155' }}
                  width={90}
                  tickMargin={12}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '4 2', stroke: '#94a3b8' }} />
                {isDesktop && (
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 20, paddingTop: 8 }}
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
