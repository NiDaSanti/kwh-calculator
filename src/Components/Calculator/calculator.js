import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceDot
} from 'recharts'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BoltTwoToneIcon from '@mui/icons-material/BoltTwoTone'
import SolarPowerTwoToneIcon from '@mui/icons-material/SolarPowerTwoTone'
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined'
import PercentIcon from '@mui/icons-material/Percent'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import InsightsIcon from '@mui/icons-material/Insights'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import TableChartIcon from '@mui/icons-material/TableChart'
import SavingsTwoToneIcon from '@mui/icons-material/SavingsTwoTone'
import './styles.css'  // Importing the updated CSS file

const DEFAULT_PROJECTION_YEARS = 10
const MIN_PROJECTION_YEARS = 5
const MAX_PROJECTION_YEARS = 20
const DEFAULT_SUNRUN_ESCALATION = 3.5
const UTILITY_DATA_KEY = 'Utility'

const UTILITY_CONFIGS = {
  sce: {
    id: 'sce',
    displayName: 'Southern California Edison',
    shortName: 'SCE',
    tagline: 'Add your latest bill to pin down today\'s rate, then compare it with a steady Sunrun plan.',
    defaults: {
      projectedIncrease: '7.5',
      baselineIncrease: '4.0',
      sunrunEscalation: DEFAULT_SUNRUN_ESCALATION.toString()
    }
  },
  ladwp: {
    id: 'ladwp',
    displayName: 'Los Angeles Department of Water and Power',
    shortName: 'LADWP',
    tagline: 'Model Los Angeles Department of Water and Power bills to see how a Sunrun plan compares.',
    defaults: {
      projectedIncrease: '6.0',
      baselineIncrease: '3.0',
      sunrunEscalation: DEFAULT_SUNRUN_ESCALATION.toString()
    }
  }
}

const resolveUtilityId = (utilityId) => (UTILITY_CONFIGS[utilityId] ? utilityId : 'sce')

const generateYearLabels = (startYear, count) => {
  const safeStartYear = Number.isFinite(startYear) ? Math.floor(startYear) : new Date().getFullYear()
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0

  return Array.from({ length: safeCount }, (_, index) => String(safeStartYear + index))
}

const FIELD_CONSTRAINTS = {
  charges: {
    min: 0,
    max: 5000,
    helper: 'Enter monthly charges between $0 and $5,000.'
  },
  usage: {
    min: 0,
    max: 20000,
    helper: 'Enter monthly usage between 0 and 20,000 kWh.'
  },
  annualUsage: {
    min: 0,
    max: 240000,
    helper: 'Enter annual usage between 0 and 240,000 kWh.'
  },
  scePecentage: {
    min: 0,
    max: 50,
    helper: 'Use a rate increase between 0% and 50% to keep projections realistic.'
  },
  projectedFutureRateIncrease: {
    min: 0,
    max: 50,
    helper: 'Use a baseline increase between 0% and 50% for ongoing projections.'
  },
  sunRunMonthlyCost: {
    min: 0,
    max: 5000,
    helper: 'Enter a Sunrun monthly cost between $0 and $5,000.'
  },
  sunrunEscalation: {
    min: 0,
    max: 20,
    helper: 'Enter a Sunrun escalation between 0% and 20%.'
  }
}

const computeProjectedBills = (
  initialBill,
  sunRunStartMonthlyCost,
  firstYearIncrease,
  ongoingIncrease,
  sunrunEscalation,
  totalYears
) => {
  if (
    !Number.isFinite(initialBill) ||
    !Number.isFinite(sunRunStartMonthlyCost) ||
    initialBill <= 0 ||
    sunRunStartMonthlyCost <= 0 ||
    totalYears <= 0
  ) {
    return { sunrunBills: [], utilityBills: [] }
  }

  const safeFirstYearIncrease = Number.isFinite(firstYearIncrease) ? firstYearIncrease : 0
  const safeOngoingIncrease = Number.isFinite(ongoingIncrease) ? ongoingIncrease : safeFirstYearIncrease
  const safeSunrunEscalation = Number.isFinite(sunrunEscalation)
    ? sunrunEscalation
    : DEFAULT_SUNRUN_ESCALATION

  const sunrunIncrease = 1 + safeSunrunEscalation / 100
  const firstYearFactor = 1 + safeFirstYearIncrease / 100
  const ongoingFactor = 1 + safeOngoingIncrease / 100

  const sunrunBills = [sunRunStartMonthlyCost]
  const utilityBills = [initialBill * firstYearFactor]

  for (let i = 1; i < totalYears; i++) {
    const nextSunrunBill = sunrunBills[i - 1] * sunrunIncrease
    const nextUtilityBill = utilityBills[i - 1] * ongoingFactor

    sunrunBills.push(nextSunrunBill)
    utilityBills.push(nextUtilityBill)
  }

  return { sunrunBills, utilityBills }
}

const currencyFormatter = (value) => {
  if (value === 0) {
    return '$0'
  }

  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const tooltipAccentColors = {
  SunRun: '#2a9d8f',
  [UTILITY_DATA_KEY]: '#e76f51',
  Savings: '#f4a261'
}

const ChartTooltip = ({ active, payload, label, utilityLabel }) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const sunrun = payload.find((item) => item.dataKey === 'SunRun')
  const utility = payload.find((item) => item.dataKey === UTILITY_DATA_KEY)
  const savings = payload.find((item) => item.dataKey === 'Savings')

  const getAccentColor = (item) => {
    if (!item) {
      return undefined
    }

    return tooltipAccentColors[item.dataKey] ?? item.color ?? item.stroke ?? undefined
  }

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {sunrun && (
        <div className="chart-tooltip__item" style={{ '--color': getAccentColor(sunrun) }}>
          <span>Sunrun</span>
          <strong>${sunrun.value.toFixed(2)}</strong>
        </div>
      )}
      {utility && (
        <div className="chart-tooltip__item" style={{ '--color': getAccentColor(utility) }}>
          <span>{utilityLabel}</span>
          <strong>${utility.value.toFixed(2)}</strong>
        </div>
      )}
      {savings?.value != null && (
        <div className="chart-tooltip__savings">
          <span>{savings.value >= 0 ? 'Yearly savings' : 'Yearly additional cost'}</span>
          <strong>${Math.abs(savings.value * 12).toFixed(2)}</strong>
        </div>
      )}
    </div>
  )
}

const Calculator = ({ initialUtility = 'sce', allowUtilitySelection = false, id }) => {
  const [charges, setCharges] = useState('')
  const [usage, setUsage] = useState('')
  const [annualUsage, setAnnualUsage] = useState('')
  const [scePecentage, setScePecentage] = useState('')
  const [projectedMonthlyBill, setProjectedMonthlyBill] = useState(null)
  const [sunRunMonthlyCost, setSunRunMonthlyCost] = useState('')
  const [sunrunEscalation, setSunrunEscalation] = useState(DEFAULT_SUNRUN_ESCALATION.toString())
  const [selectedUtility, setSelectedUtility] = useState(() => resolveUtilityId(initialUtility))
  const [rate, setRate] = useState(null)
  const [projectedFutureRateIncrease, setProjectedFutureRateIncrease] = useState('0.00')
  const [avgPerMonthCost, setAvgPerMonthCost] = useState(null)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.innerWidth >= 768
  })
  const [copyStatus, setCopyStatus] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [sunrunProjectionStatus, setSunrunProjectionStatus] = useState(null)
  const [projectionYears, setProjectionYears] = useState(DEFAULT_PROJECTION_YEARS)
  const [brushRange, setBrushRange] = useState(null)
  const [brushKey, setBrushKey] = useState(0)
  const previousUtilityRef = useRef(null)
  const utilityConfig = UTILITY_CONFIGS[selectedUtility] ?? UTILITY_CONFIGS.sce
  const utilityShortName = utilityConfig.shortName
  const utilityDisplayName = utilityConfig.displayName
  const utilityTagline = utilityConfig.tagline
  const utilityPossessive = `${utilityShortName}’s`
  const utilityOptions = useMemo(() => Object.values(UTILITY_CONFIGS), [])
  const projectionStartYear = useMemo(() => new Date().getFullYear(), [])
  const yearLabels = useMemo(
    () => generateYearLabels(projectionStartYear, projectionYears),
    [projectionStartYear, projectionYears]
  )

  useEffect(() => {
    const nextUtility = resolveUtilityId(initialUtility)

    setSelectedUtility((prev) => (prev === nextUtility ? prev : nextUtility))
  }, [initialUtility])

  useEffect(() => {
    const config = UTILITY_CONFIGS[selectedUtility]

    if (!config) {
      return
    }

    if (previousUtilityRef.current !== selectedUtility) {
      setScePecentage(config.defaults.projectedIncrease)
      setProjectedFutureRateIncrease(config.defaults.baselineIncrease)
      setSunrunEscalation(config.defaults.sunrunEscalation ?? DEFAULT_SUNRUN_ESCALATION.toString())
    }

    previousUtilityRef.current = selectedUtility
  }, [selectedUtility])

  const setFieldError = useCallback((name, message) => {
    setFieldErrors((prev) => {
      if (message) {
        return { ...prev, [name]: message }
      }

      if (!prev[name]) {
        return prev
      }

      const next = { ...prev }
      delete next[name]

      return next
    })
  }, [])

  const validateField = useCallback((name, rawValue) => {
    const constraint = FIELD_CONSTRAINTS[name]

    if (!constraint) {
      return null
    }

    if (rawValue === '' || rawValue === null || typeof rawValue === 'undefined') {
      return null
    }

    const value = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue)

    if (!Number.isFinite(value)) {
      return constraint.helper
    }

    if (Number.isFinite(constraint.min) && value < constraint.min) {
      return constraint.helper
    }

    if (Number.isFinite(constraint.max) && value > constraint.max) {
      return constraint.helper
    }

    return null
  }, [])

  const getHelperText = useCallback((name) => {
    const constraint = FIELD_CONSTRAINTS[name]

    if (!constraint) {
      return ''
    }

    return fieldErrors[name] || constraint.helper
  }, [fieldErrors])

  const validateFields = useCallback((fields) => {
    let hasError = false

    Object.entries(fields).forEach(([name, value]) => {
      const message = validateField(name, value)
      setFieldError(name, message)

      if (message) {
        hasError = true
      }
    })

    return !hasError
  }, [setFieldError, validateField])
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

  const projectedBills = useMemo(() => {
    const monthlyBill = typeof avgPerMonthCost === 'string' ? parseFloat(avgPerMonthCost) : avgPerMonthCost
    const sunrunStart = typeof sunRunMonthlyCost === 'string' ? parseFloat(sunRunMonthlyCost) : sunRunMonthlyCost

    if (!Number.isFinite(monthlyBill) || !Number.isFinite(sunrunStart) || sunrunStart <= 0) {
      return { sunrunBills: [], utilityBills: [] }
    }

    const parsedInitialIncrease = parseFloat(scePecentage)
    const parsedMinIncrease = parseFloat(projectedFutureRateIncrease)
    const parsedEscalation = parseFloat(sunrunEscalation)

    return computeProjectedBills(
      monthlyBill,
      sunrunStart,
      Number.isNaN(parsedInitialIncrease) ? 0 : parsedInitialIncrease,
      Number.isNaN(parsedMinIncrease) ? 0 : parsedMinIncrease,
      Number.isNaN(parsedEscalation) ? DEFAULT_SUNRUN_ESCALATION : parsedEscalation,
      yearLabels.length
    )
  }, [
    avgPerMonthCost,
    projectedFutureRateIncrease,
    scePecentage,
    sunRunMonthlyCost,
    sunrunEscalation,
    yearLabels.length
  ])

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
    const isValid = validateFields({
      charges,
      usage,
      annualUsage,
      scePecentage,
      projectedFutureRateIncrease
    })

    if (!isValid) {
      return
    }

    calculateRate()
  }

  const handleSunRunMonthlyCost = (e) => {
    const parsedSunrun = parseFloat(sunRunMonthlyCost)

    const isValid = validateFields({
      sunRunMonthlyCost,
      sunrunEscalation
    })

    if (!isValid) {
      setSunrunProjectionStatus({
        type: 'error',
        message: 'Enter a valid Sunrun monthly cost before updating the projection.'
      })
      return
    }

    const parsedAvgMonthly = avgPerMonthCost ? parseFloat(avgPerMonthCost) : NaN
    const parsedRate = rate !== null ? parseFloat(rate) : NaN
    const canProject = Number.isFinite(parsedRate) && Number.isFinite(parsedAvgMonthly) && Number.isFinite(parsedSunrun) && parsedSunrun > 0

    if (canProject) {
      setSunrunProjectionStatus({
        type: 'success',
        message: 'Projection updated with your Sunrun monthly cost.'
      })
    } else {
      setSunrunProjectionStatus({
        type: 'error',
        message: 'Calculate the projected utility bill first, then enter a Sunrun cost to compare.'
      })
    }
  }

  const handleReset = () => {
    setCharges('')
    setUsage('')
    setAnnualUsage('')
    setScePecentage(utilityConfig.defaults.projectedIncrease)
    setSunRunMonthlyCost('')
    setSunrunEscalation(utilityConfig.defaults.sunrunEscalation ?? DEFAULT_SUNRUN_ESCALATION.toString())
    setRate(null)
    setProjectedFutureRateIncrease(utilityConfig.defaults.baselineIncrease)
    setAvgPerMonthCost(null)
    setProjectedMonthlyBill(null)
    setFieldErrors({})
    setSunrunProjectionStatus(null)
    setProjectionYears(DEFAULT_PROJECTION_YEARS)
  }

  const chartData = useMemo(() => yearLabels
    .map((year, index) => {
      const sunrunBill = projectedBills.sunrunBills[index]
      const utilityBill = projectedBills.utilityBills[index]

      if (!Number.isFinite(sunrunBill) || !Number.isFinite(utilityBill)) {
        return null
      }

      return {
        year,
        SunRun: sunrunBill,
        [UTILITY_DATA_KEY]: utilityBill,
        Savings: utilityBill - sunrunBill
      }
    })
    .filter(Boolean), [projectedBills.sunrunBills, projectedBills.utilityBills, yearLabels])

  useEffect(() => {
    setBrushRange(null)
    setBrushKey((prev) => prev + 1)
  }, [chartData.length])

  const handleBrushChange = useCallback((range) => {
    if (!range || typeof range.startIndex !== 'number' || typeof range.endIndex !== 'number') {
      setBrushRange(null)
      return
    }

    setBrushRange(range)
  }, [])

  const handleBrushReset = useCallback(() => {
    setBrushRange(null)
    setBrushKey((prev) => prev + 1)
  }, [])

  const renderChartTooltip = useCallback(
    (tooltipProps) => <ChartTooltip utilityLabel={utilityShortName} {...tooltipProps} />,
    [utilityShortName]
  )

  const brushWindowLabel = useMemo(() => {
    if (chartData.length === 0) {
      return null
    }

    if (!brushRange) {
      return 'Viewing full projection'
    }

    const start = chartData[brushRange.startIndex]?.year
    const end = chartData[Math.min(brushRange.endIndex, chartData.length - 1)]?.year

    if (!start || !end) {
      return null
    }

    return start === end ? `Zoomed to ${start}` : `Zoomed view: ${start} – ${end}`
  }, [brushRange, chartData])

  const yearlyBreakdown = useMemo(() => {
    if (chartData.length === 0) {
      return []
    }

    return chartData.reduce((acc, item) => {
      const sunrunAnnual = item.SunRun * 12
      const utilityAnnual = item[UTILITY_DATA_KEY] * 12
      const diffAnnual = utilityAnnual - sunrunAnnual
      const cumulativeSavings = (acc[acc.length - 1]?.cumulativeSavings ?? 0) + diffAnnual

      acc.push({
        year: item.year,
        sunrunAnnual,
        utilityAnnual,
        diffAnnual,
        cumulativeSavings
      })

      return acc
    }, [])
  }, [chartData])

  const projectedMonthlyBillNumber = rate !== null && projectedMonthlyBill ? parseFloat(projectedMonthlyBill) : null
  const sunrunMonthlyCostNumber = sunRunMonthlyCost ? parseFloat(sunRunMonthlyCost) : null
  const sunrunEscalationNumber = sunrunEscalation ? parseFloat(sunrunEscalation) : null
  const effectiveSunrunEscalation = Number.isFinite(sunrunEscalationNumber)
    ? sunrunEscalationNumber
    : DEFAULT_SUNRUN_ESCALATION
  const monthlyDifference = projectedMonthlyBillNumber !== null && sunrunMonthlyCostNumber > 0
    ? projectedMonthlyBillNumber - sunrunMonthlyCostNumber
    : null
  const firstYearDifference = chartData.length > 0 ? chartData[0].Savings * 12 : null
  const finalYearDifference = chartData.length > 0 ? chartData[chartData.length - 1].Savings * 12 : null
  const fiveYearDifference = chartData.length > 0 ? chartData.slice(0, 5).reduce((acc, item) => acc + item.Savings * 12, 0) : null
  const cumulativeProjectionDifference = yearlyBreakdown.length > 0
    ? yearlyBreakdown[yearlyBreakdown.length - 1].cumulativeSavings
    : null
  const peakSavings = chartData.reduce((best, item) => {
    if (!best || item.Savings > best.Savings) {
      return { year: item.year, Savings: item.Savings }
    }

    return best
  }, null)
  const monthlyDifferenceDisplay = monthlyDifference !== null ? Math.abs(monthlyDifference) : null
  const monthlyDifferenceLabel = monthlyDifference !== null && monthlyDifference < 0 ? 'added cost' : 'saved'
  const hasFirstYearDifference = firstYearDifference !== null && firstYearDifference !== 0
  const hasFinalYearDifference = finalYearDifference !== null && finalYearDifference !== 0
  const hasFiveYearDifference = fiveYearDifference !== null && fiveYearDifference !== 0
  const hasCumulativeProjectionDifference = cumulativeProjectionDifference !== null && cumulativeProjectionDifference !== 0
  const hasPeakSavings = peakSavings !== null && peakSavings.Savings > 0
  const hasYearlyBreakdown = yearlyBreakdown.length > 0
  const totalSunrunSpend = yearlyBreakdown.reduce((acc, item) => acc + item.sunrunAnnual, 0)
  const totalUtilitySpend = yearlyBreakdown.reduce((acc, item) => acc + item.utilityAnnual, 0)
  const totalSavings = totalUtilitySpend - totalSunrunSpend
  const hasPositiveTotalSavings = totalSavings > 0
  const breakEvenYear = yearlyBreakdown.find((item) => item.cumulativeSavings > 0)?.year ?? null
  const hasBreakEven = breakEvenYear !== null
  const breakEvenPoint = useMemo(() => {
    if (!hasBreakEven) {
      return null
    }

    return chartData.find((item) => item.year === breakEvenYear) ?? null
  }, [chartData, hasBreakEven, breakEvenYear])
  const projectionLabel = projectionYears > 0 ? `${projectionYears}-year` : ''
  const finalYearLabel = chartData.length > 0 ? chartData[chartData.length - 1].year : null
  const projectionWindowStart = yearLabels[0] ?? null
  const projectionWindowEnd = yearLabels.length > 0 ? yearLabels[yearLabels.length - 1] : null
  const projectionWindowDisplay = projectionWindowStart && projectionWindowEnd
    ? `${projectionWindowStart}–${projectionWindowEnd}`
    : ''
  const projectionPillLabel = projectionLabel
    ? `${projectionLabel} horizon${projectionWindowDisplay ? ` (${projectionWindowDisplay})` : ''}`
    : 'Dynamic projection horizon'
  const projectionYearsText = projectionYears === 1 ? 'year' : 'years'
  const summaryProjectionLabel = projectionLabel || 'Projection window'
  const totalDifferenceLabel = hasYearlyBreakdown
    ? `${projectionLabel} ${hasPositiveTotalSavings ? 'saved total' : 'additional cost'}`.trim()
    : ''
  const breakEvenDescription = hasBreakEven
    ? `Savings overtake ${utilityShortName} in ${breakEvenYear} based on your current assumptions.`
    : `Sunrun never surpasses the projected ${utilityShortName} costs within this projection window.`

  const chargesNumber = charges ? parseFloat(charges) : null
  const usageNumber = usage ? parseFloat(usage) : null
  const avgPerMonthCostNumber = avgPerMonthCost ? parseFloat(avgPerMonthCost) : null
  const annualUsageNumber = annualUsage ? parseFloat(annualUsage) : null
  const monthlyUsageKwh = Number.isFinite(annualUsageNumber) ? annualUsageNumber / 12 : null
  const currentAnnualBill = Number.isFinite(chargesNumber) ? chargesNumber * 12 : null
  const projectedAnnualBill = projectedMonthlyBillNumber !== null ? projectedMonthlyBillNumber * 12 : null
  const sunrunAnnualCost = sunrunMonthlyCostNumber !== null ? sunrunMonthlyCostNumber * 12 : null
  const projectedPlanAnnualSavings = projectedAnnualBill !== null && sunrunAnnualCost !== null
    ? projectedAnnualBill - sunrunAnnualCost
    : null
  const baselineAnnualSavings = currentAnnualBill !== null && sunrunAnnualCost !== null
    ? currentAnnualBill - sunrunAnnualCost
    : null

  const scenarioSummaries = useMemo(() => {
    if (!avgPerMonthCost || !sunrunMonthlyCostNumber) {
      return []
    }

    const initialBill = parseFloat(avgPerMonthCost)
    const sunrunStart = sunrunMonthlyCostNumber

    if (!Number.isFinite(initialBill) || !Number.isFinite(sunrunStart) || initialBill <= 0 || sunrunStart <= 0) {
      return []
    }

    const parsedProjectedIncrease = parseFloat(scePecentage)
    const parsedBaselineIncrease = parseFloat(projectedFutureRateIncrease)
    const parsedSunrunEscalation = parseFloat(sunrunEscalation)
    const firstYearIncrease = Number.isNaN(parsedProjectedIncrease) ? 0 : parsedProjectedIncrease
    const ongoingIncrease = Number.isNaN(parsedBaselineIncrease) ? firstYearIncrease : parsedBaselineIncrease
    const safeSunrunEscalation = Number.isNaN(parsedSunrunEscalation)
      ? DEFAULT_SUNRUN_ESCALATION
      : parsedSunrunEscalation

    const summarize = (definition) => {
      const { sunrunBills, utilityBills } = computeProjectedBills(
        initialBill,
        sunrunStart,
        definition.firstYear,
        definition.ongoing,
        safeSunrunEscalation,
        yearLabels.length
      )

      if (sunrunBills.length === 0 || utilityBills.length === 0) {
        return null
      }

      const monthlyDiffs = utilityBills.map((bill, index) => bill - sunrunBills[index])
      const cumulative = monthlyDiffs.reduce((acc, diff) => acc + diff * 12, 0)
      const finalIndex = monthlyDiffs.length - 1
      const finalMonthlyDiff = monthlyDiffs[finalIndex]

      return {
        ...definition,
        finalYear: yearLabels[finalIndex],
        finalMonthlyDiff,
        finalAnnualDiff: finalMonthlyDiff * 12,
        cumulative,
        firstYearAnnualDiff: monthlyDiffs[0] * 12,
        finalSunrunBill: sunrunBills[finalIndex],
        finalUtilityBill: utilityBills[finalIndex]
      }
    }

    return [
      {
        key: 'plan',
        label: 'Your projection',
        badge: 'Entered rates',
        description: 'Matches the first-year and ongoing increases you provided.',
        firstYear: firstYearIncrease,
        ongoing: ongoingIncrease
      },
      {
        key: 'baseline',
        label: 'Historic baseline',
        badge: '+0% stress',
        description: 'Assumes utilities grow at your baseline rate every year.',
        firstYear: ongoingIncrease,
        ongoing: ongoingIncrease
      },
      {
        key: 'stress',
        label: 'Stress test (+2%)',
        badge: 'Hotter inflation',
        description: 'Adds 2 percentage points to each utility increase to test resilience.',
        firstYear: firstYearIncrease + 2,
        ongoing: ongoingIncrease + 2
      }
    ].map(summarize).filter(Boolean)
  }, [
    avgPerMonthCost,
    projectedFutureRateIncrease,
    scePecentage,
    sunrunEscalation,
    sunrunMonthlyCostNumber,
    yearLabels
  ])

  const parsedProjectedIncrease = parseFloat(scePecentage)
  const parsedBaselineIncrease = parseFloat(projectedFutureRateIncrease)
  const hasProjectedIncrease = !Number.isNaN(parsedProjectedIncrease)
  const hasBaselineIncrease = !Number.isNaN(parsedBaselineIncrease)
  const projectedVsBaselineDiff = hasProjectedIncrease && hasBaselineIncrease
    ? parsedProjectedIncrease - parsedBaselineIncrease
    : null
  const projectedVsSunrunDiff = hasProjectedIncrease ? parsedProjectedIncrease - effectiveSunrunEscalation : null
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

  const formatCurrencyAbsolute = (value, options = {}) => {
    if (value === null || Number.isNaN(value)) {
      return '--'
    }

    return formatCurrency(Math.abs(value), options)
  }

  const formatNumber = (value, options = {}) => {
    if (value === null || Number.isNaN(value)) {
      return '--'
    }

    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0, ...options })
  }

  const projectedIncreaseDisplay = formatPercentage(Number.parseFloat(scePecentage))

  const animationTriggerKey = useMemo(() => [
    rate ?? 'null',
    projectedBills.sunrunBills.join(','),
    projectedBills.utilityBills.join(','),
    chartData.length
  ].join('|'), [rate, projectedBills.sunrunBills, projectedBills.utilityBills, chartData.length])

  const summaryText = rate !== null
    ? [
      `Current rate: $${rate} per kWh`,
      projectedMonthlyBillNumber !== null
        ? `Projected monthly bill with utility increases: $${formatCurrency(projectedMonthlyBillNumber, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
        : null,
      sunrunMonthlyCostNumber !== null
        ? `Sunrun monthly cost: $${formatCurrency(sunrunMonthlyCostNumber, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
        : null,
      `Sunrun escalation: ${formatPercentage(effectiveSunrunEscalation)}`,
      projectionWindowStart && projectionWindowEnd
        ? `Projection horizon: ${projectionWindowStart}–${projectionWindowEnd} (${projectionYears} ${projectionYearsText})`
        : null,
      monthlyDifferenceDisplay !== null
        ? `Monthly difference: $${formatCurrency(monthlyDifferenceDisplay, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} ${monthlyDifferenceLabel}`
        : null,
      hasYearlyBreakdown ? `${summaryProjectionLabel} total ${utilityShortName} spend: $${formatCurrency(totalUtilitySpend)}` : null,
      hasYearlyBreakdown ? `${summaryProjectionLabel} total Sunrun spend: $${formatCurrency(totalSunrunSpend)}` : null,
      hasYearlyBreakdown
        ? `${summaryProjectionLabel} total difference: $${formatCurrency(Math.abs(totalSavings))} ${hasPositiveTotalSavings ? 'saved' : 'additional cost'}`
        : null,
      hasBreakEven
        ? `Projected break-even year: ${breakEvenYear}`
        : 'Break-even not reached within projection.'
    ].filter(Boolean).join('\n')
    : ''

  const handleCopySummary = useCallback(() => {
    if (!summaryText) {
      setCopyStatus('')
      return
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyStatus('Clipboard unavailable')
      return
    }

    navigator.clipboard.writeText(summaryText)
      .then(() => {
        setCopyStatus('Copied to clipboard')
      })
      .catch(() => {
        setCopyStatus('Copy failed')
      })
  }, [summaryText])

  const handleDownloadSummary = useCallback(() => {
    if (!hasYearlyBreakdown || typeof document === 'undefined') {
      return
    }

    const formatDollars = (value) => {
      if (!Number.isFinite(value)) {
        return '--'
      }

      const absolute = Math.abs(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })

      return `${value < 0 ? '-' : ''}$${absolute}`
    }

    const lines = [
      'Homeowner energy projection',
      `Generated on: ${new Date().toLocaleDateString()}`,
      ''
    ]

    if (rate !== null) {
      lines.push(`Current kWh rate: ${formatDollars(parseFloat(rate))}`)
    }

    if (projectedMonthlyBillNumber !== null) {
      lines.push(`Projected monthly ${utilityShortName} bill: ${formatDollars(projectedMonthlyBillNumber)}`)
    }

    if (sunrunMonthlyCostNumber !== null) {
      lines.push(`Sunrun monthly cost: ${formatDollars(sunrunMonthlyCostNumber)}`)
    }

    lines.push(`Sunrun escalation: ${formatPercentage(effectiveSunrunEscalation)}`)

    if (projectionWindowStart && projectionWindowEnd) {
      lines.push(`Projection horizon: ${projectionWindowStart}–${projectionWindowEnd} (${projectionYears} ${projectionYearsText})`)
    }

    if (monthlyDifferenceDisplay !== null) {
      lines.push(`Monthly difference: ${formatDollars(monthlyDifferenceDisplay)} ${monthlyDifferenceLabel}`)
    }

    lines.push('')

    if (hasYearlyBreakdown) {
      lines.push(`${summaryProjectionLabel} total ${utilityShortName} spend: ${formatDollars(totalUtilitySpend)}`)
      lines.push(`${summaryProjectionLabel} total Sunrun spend: ${formatDollars(totalSunrunSpend)}`)
      lines.push(`${summaryProjectionLabel} total difference: ${formatDollars(Math.abs(totalSavings))} ${hasPositiveTotalSavings ? 'saved' : 'additional cost'}`)
      lines.push(
        hasBreakEven
          ? `Projected break-even year: ${breakEvenYear}`
          : 'Break-even not reached within the projection window.'
      )
    }

    lines.push('', 'Year-by-year outlook:')

    yearlyBreakdown.forEach((item) => {
      lines.push(
        `${item.year}: ${utilityShortName} ${formatDollars(item.utilityAnnual)}, Sunrun ${formatDollars(item.sunrunAnnual)}, Annual difference ${formatDollars(item.diffAnnual)}, Cumulative savings ${formatDollars(item.cumulativeSavings)}`
      )
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'homeowner-energy-summary.txt')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [
    breakEvenYear,
    hasBreakEven,
    hasPositiveTotalSavings,
    hasYearlyBreakdown,
    monthlyDifferenceDisplay,
    monthlyDifferenceLabel,
    projectedMonthlyBillNumber,
    rate,
    sunrunMonthlyCostNumber,
    effectiveSunrunEscalation,
    projectionWindowEnd,
    projectionWindowStart,
    projectionYears,
    projectionYearsText,
    summaryProjectionLabel,
    totalSavings,
    totalUtilitySpend,
    totalSunrunSpend,
    utilityShortName,
    yearlyBreakdown
  ])

  useEffect(() => {
    if (!copyStatus) {
      return undefined
    }

    const timer = setTimeout(() => {
      setCopyStatus('')
    }, 2800)

    return () => clearTimeout(timer)
  }, [copyStatus])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const animatableElements = document.querySelectorAll('[data-animate]')

    if (animatableElements.length === 0) {
      return undefined
    }

    const supportsMatchMedia = typeof window.matchMedia === 'function'
    const prefersReducedMotion = supportsMatchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

    if (!supportsMatchMedia || prefersReducedMotion.matches) {
      animatableElements.forEach((element) => {
        element.classList.add('is-visible')
      })

      return undefined
    }

    const observer = new IntersectionObserver((entries, entryObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          entryObserver.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -40px 0px'
    })

    animatableElements.forEach((element) => {
      if (!element.classList.contains('is-visible')) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [animationTriggerKey])

  return (
    <section id={id} className="calculator-container">
      <div className="calculator-header animatable" data-animate>
        <span className="calculator-badge">Energy insights</span>
        <h1><span>Visualize</span> your {utilityShortName} costs with clarity</h1>
        <p>{utilityTagline}</p>
        <div className="header-pills">
          <span>{projectionPillLabel}</span>
          <span>Side-by-side comparison</span>
          <span>Custom Sunrun plan</span>
        </div>
      </div>

      <div className="calculator-grid">
        <form className="calculator-form surface-card animatable" data-animate style={{ '--delay': '0.05s' }} onSubmit={handleSubmit}>
          <div className="form-header">
            <h3>Usage details</h3>
            <p>These numbers set your current kWh rate.</p>
          </div>

          {allowUtilitySelection && (
            <div className="form-section">
              <div className="form-section__header">
                <span>Utility focus</span>
                <p>Switch providers to match the bill you&rsquo;re modeling.</p>
              </div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="utility-provider"><PowerOutlinedIcon /> Utility provider</label>
                  <select
                    id="utility-provider"
                    value={selectedUtility}
                    onChange={(event) => {
                      setSelectedUtility(event.target.value)
                      setSunrunProjectionStatus(null)
                    }}
                  >
                    {utilityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.displayName} ({option.shortName})
                      </option>
                    ))}
                  </select>
                  <p className="input-helper">Prefill assumptions for {utilityDisplayName}.</p>
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <div className="form-section__header">
              <span>Current usage snapshot</span>
              <p>Use a recent bill so the rate stays accurate.</p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label><AttachMoneyIcon /> Monthly Charges</label>
                <input
                  className={fieldErrors.charges ? 'input-error' : ''}
                  type="number"
                  step="0.01"
                  min={FIELD_CONSTRAINTS.charges.min}
                  max={FIELD_CONSTRAINTS.charges.max}
                  value={charges}
                  onChange={(e) => {
                    const { value } = e.target
                    setCharges(value)
                    setFieldError('charges', validateField('charges', value))
                  }}
                  placeholder="e.g. 225.60"
                  required
                />
                <p className={`input-helper ${fieldErrors.charges ? 'input-helper--error' : ''}`}>{getHelperText('charges')}</p>
              </div>

              <div className="form-group">
                <label><PowerOutlinedIcon /> Monthly kWh Usage</label>
                <input
                  className={fieldErrors.usage ? 'input-error' : ''}
                  type="number"
                  min={FIELD_CONSTRAINTS.usage.min}
                  max={FIELD_CONSTRAINTS.usage.max}
                  value={usage}
                  onChange={(e) => {
                    const { value } = e.target
                    setUsage(value)
                    setFieldError('usage', validateField('usage', value))
                  }}
                  placeholder="e.g. 540"
                  required
                />
                <p className={`input-helper ${fieldErrors.usage ? 'input-helper--error' : ''}`}>{getHelperText('usage')}</p>
              </div>

              <div className="form-group full-width">
                <label><BoltTwoToneIcon /> Annual kWh Usage</label>
                <input
                  className={fieldErrors.annualUsage ? 'input-error' : ''}
                  type="number"
                  step="0.01"
                  min={FIELD_CONSTRAINTS.annualUsage.min}
                  max={FIELD_CONSTRAINTS.annualUsage.max}
                  value={annualUsage}
                  onChange={(e) => {
                    const { value } = e.target
                    setAnnualUsage(value)
                    setFieldError('annualUsage', validateField('annualUsage', value))
                  }}
                  placeholder="e.g. 6480"
                  required
                />
                <p className={`input-helper ${fieldErrors.annualUsage ? 'input-helper--error' : ''}`}>{getHelperText('annualUsage')}</p>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section__header">
              <span>Future assumptions</span>
              <p>Estimate how your utility rates might grow.</p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label><PercentIcon /> Rate change percentage</label>
                <input
                  className={fieldErrors.scePecentage ? 'input-error' : ''}
                  type="number"
                  step="0.01"
                  min={FIELD_CONSTRAINTS.scePecentage.min}
                  max={FIELD_CONSTRAINTS.scePecentage.max}
                  value={scePecentage}
                  onChange={(e) => {
                    const { value } = e.target
                    setScePecentage(value)
                    setFieldError('scePecentage', validateField('scePecentage', value))
                  }}
                  placeholder="Projected annual increase"
                  required
                />
                <p className={`input-helper ${fieldErrors.scePecentage ? 'input-helper--error' : ''}`}>{getHelperText('scePecentage')}</p>
              </div>

              <div className="form-group">
                <label><PercentIcon /> Minimal rate percentage</label>
                <input
                  className={fieldErrors.projectedFutureRateIncrease ? 'input-error' : ''}
                  type="number"
                  step="0.01"
                  min={FIELD_CONSTRAINTS.projectedFutureRateIncrease.min}
                  max={FIELD_CONSTRAINTS.projectedFutureRateIncrease.max}
                  value={projectedFutureRateIncrease}
                  onChange={(e) => {
                    const { value } = e.target
                    setProjectedFutureRateIncrease(value)
                    setFieldError('projectedFutureRateIncrease', validateField('projectedFutureRateIncrease', value))
                  }}
                  placeholder="Baseline annual increase"
                  required
                />
                <p className={`input-helper ${fieldErrors.projectedFutureRateIncrease ? 'input-helper--error' : ''}`}>{getHelperText('projectedFutureRateIncrease')}</p>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button type="submit">Calculate rate</button>
            <button className="reset" type="button" onClick={handleReset}>Reset</button>
          </div>
        </form>

        <div className="result-panel surface-card animatable" data-animate style={{ '--delay': '0.12s' }}>
          <div className="result-header">
            <h3>Bill snapshot</h3>
            <p>See how today&rsquo;s rate stacks up against your future inputs.</p>
          </div>

          {rate !== null ? (
            <>
              <div className="bill-snapshot-grid animatable" data-animate style={{ '--delay': '0.16s' }}>
                <article className="bill-card accent-sky">
                  <span className="bill-card__icon"><BoltTwoToneIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Current rate</span>
                    <span className="bill-card__value">
                      ${rate}
                      <span className="bill-card__unit">/ kWh</span>
                    </span>
                    <p className="bill-card__hint">
                      {chargesNumber !== null && usageNumber !== null
                        ? `Based on $${formatCurrency(chargesNumber, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${formatNumber(usageNumber, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kWh.`
                        : 'Add monthly charges and usage to calculate a rate.'}
                    </p>
                  </div>
                </article>

                <article className="bill-card accent-lime">
                  <span className="bill-card__icon"><AttachMoneyIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Average monthly cost</span>
                    <span className="bill-card__value">
                      {avgPerMonthCostNumber !== null
                        ? `$${formatCurrency(avgPerMonthCostNumber, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '--'}
                    </span>
                    <p className="bill-card__hint">
                      {annualUsageNumber !== null
                        ? `Derived from ${formatNumber(annualUsageNumber, { maximumFractionDigits: 0 })} kWh each year.`
                        : 'Add annual usage to reveal a monthly average.'}
                    </p>
                  </div>
                </article>

                <article className="bill-card accent-amber">
                  <span className="bill-card__icon"><TrendingUpIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Projected monthly bill</span>
                    <span className="bill-card__value">
                      {projectedMonthlyBillNumber !== null
                        ? `$${formatCurrency(projectedMonthlyBillNumber, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '--'}
                    </span>
                    <p className="bill-card__hint">
                      {projectedMonthlyBillNumber !== null && projectedIncreaseDisplay !== '--'
                        ? `Includes a ${projectedIncreaseDisplay} annual utility increase.`
                        : 'Update the projected increase to see how future rates shift.'}
                    </p>
                  </div>
                </article>

                <article className="bill-card accent-indigo">
                  <span className="bill-card__icon"><PowerOutlinedIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Average usage</span>
                    <span className="bill-card__value">
                      {monthlyUsageKwh !== null ? `${formatNumber(monthlyUsageKwh, { maximumFractionDigits: 0 })} kWh` : '--'}
                    </span>
                    <p className="bill-card__hint">
                      {monthlyUsageKwh !== null
                        ? `${formatNumber(annualUsageNumber, { maximumFractionDigits: 0 })} kWh each year ÷ 12 months.`
                        : 'Add annual usage to unlock this insight.'}
                    </p>
                  </div>
                </article>

                <article className="bill-card accent-slate">
                  <span className="bill-card__icon"><EventAvailableIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Current annual spend</span>
                    <span className="bill-card__value">
                      {currentAnnualBill !== null ? `$${formatCurrency(currentAnnualBill)}` : '--'}
                    </span>
                    <p className="bill-card__hint">
                      {currentAnnualBill !== null && chargesNumber !== null
                        ? `$${formatCurrency(chargesNumber, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo today.`
                        : 'Enter a monthly charge to calculate.'}
                    </p>
                  </div>
                </article>

                <article className="bill-card accent-blue">
                  <span className="bill-card__icon"><InsightsIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Projected annual {utilityShortName} bill</span>
                    <span className="bill-card__value">
                      {projectedAnnualBill !== null ? `$${formatCurrency(projectedAnnualBill)}` : '--'}
                    </span>
                    <p className="bill-card__hint">
                      {projectedAnnualBill !== null && projectedMonthlyBillNumber !== null
                        ? `Equivalent to $${formatCurrency(projectedMonthlyBillNumber, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo.`
                        : 'Provide projected increases to calculate.'}
                    </p>
                  </div>
                </article>

                <article className="bill-card accent-emerald">
                  <span className="bill-card__icon"><SolarPowerTwoToneIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Sunrun annual cost</span>
                    <span className="bill-card__value">
                      {sunrunAnnualCost !== null ? `$${formatCurrency(sunrunAnnualCost)}` : '--'}
                    </span>
                    <p className="bill-card__hint">
                      {sunrunAnnualCost !== null && sunrunMonthlyCostNumber !== null
                        ? `$${formatCurrency(sunrunMonthlyCostNumber, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo plan.`
                        : 'Enter a Sunrun monthly cost above.'}
                    </p>
                  </div>
                </article>

                <article
                  className={`bill-card ${projectedPlanAnnualSavings !== null && projectedPlanAnnualSavings < 0 ? 'accent-rose is-negative' : 'accent-emerald'}`}
                >
                  <span className="bill-card__icon"><SavingsTwoToneIcon /></span>
                  <div className="bill-card__content">
                    <span className="bill-card__label">Difference vs. Sunrun</span>
                    <span className="bill-card__value">
                      {projectedPlanAnnualSavings !== null
                        ? `$${formatCurrencyAbsolute(projectedPlanAnnualSavings, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        : '--'}
                      {projectedPlanAnnualSavings !== null && (
                        <span className="bill-card__unit">/ yr {projectedPlanAnnualSavings >= 0 ? 'saved' : 'added cost'}</span>
                      )}
                    </span>
                    <p className="bill-card__hint">
                      {projectedPlanAnnualSavings !== null
                        ? projectedPlanAnnualSavings >= 0
                          ? 'Annual savings versus Sunrun.'
                          : 'Annual cost above Sunrun.'
                        : 'Add Sunrun and utility costs to compare.'}
                    </p>
                  </div>
                </article>
              </div>

              <div className="sunrun-input-container animatable" data-animate style={{ '--delay': '0.18s' }}>
                <p className="warning-label">Compare against a Sunrun plan</p>
                <div className="sunrun-input-grid">
                  <div className="sunrun-input-row">
                    <label htmlFor="sunrun-rate"><SolarPowerTwoToneIcon /> Sunrun monthly cost</label>
                    <input
                      id="sunrun-rate"
                      className={fieldErrors.sunRunMonthlyCost ? 'input-error' : ''}
                      type="number"
                      step="0.01"
                      min={FIELD_CONSTRAINTS.sunRunMonthlyCost.min}
                      max={FIELD_CONSTRAINTS.sunRunMonthlyCost.max}
                      value={sunRunMonthlyCost}
                      onChange={(e) => {
                        const { value } = e.target
                        setSunRunMonthlyCost(value)
                        setFieldError('sunRunMonthlyCost', validateField('sunRunMonthlyCost', value))
                        setSunrunProjectionStatus(null)
                      }}
                      placeholder="e.g. 185.00"
                    />
                  </div>
                  <div className="sunrun-input-row">
                    <label htmlFor="sunrun-escalation"><TrendingUpIcon /> Sunrun escalation</label>
                    <input
                      id="sunrun-escalation"
                      className={fieldErrors.sunrunEscalation ? 'input-error' : ''}
                      type="number"
                      step="0.1"
                      min={FIELD_CONSTRAINTS.sunrunEscalation.min}
                      max={FIELD_CONSTRAINTS.sunrunEscalation.max}
                      value={sunrunEscalation}
                      onChange={(e) => {
                        const { value } = e.target
                        setSunrunEscalation(value)
                        setFieldError('sunrunEscalation', validateField('sunrunEscalation', value))
                        setSunrunProjectionStatus(null)
                      }}
                      placeholder="e.g. 3.5"
                    />
                  </div>
                </div>
                <div className="sunrun-input-helpers">
                  <p className={`input-helper ${fieldErrors.sunRunMonthlyCost ? 'input-helper--error' : ''}`}>
                    {getHelperText('sunRunMonthlyCost')}
                  </p>
                  <p className={`input-helper ${fieldErrors.sunrunEscalation ? 'input-helper--error' : ''}`}>
                    {getHelperText('sunrunEscalation')}
                  </p>
                </div>
                <button className="sunrun-calculate-btn" onClick={handleSunRunMonthlyCost} type="button">Update projection</button>
                {sunrunProjectionStatus?.message && (
                  <p className={`input-helper ${sunrunProjectionStatus.type === 'error' ? 'input-helper--error' : ''}`}>
                    {sunrunProjectionStatus.message}
                  </p>
                )}
                <div className="projection-length-control">
                  <label htmlFor="projection-years">
                    <EventAvailableIcon /> Projection length
                  </label>
                  <input
                    id="projection-years"
                    type="range"
                    min={MIN_PROJECTION_YEARS}
                    max={MAX_PROJECTION_YEARS}
                    step={1}
                    value={projectionYears}
                    onChange={(event) => {
                      setProjectionYears(Number(event.target.value))
                      setSunrunProjectionStatus(null)
                    }}
                  />
                  <div className="projection-length-control__values">
                    <span>{projectionYears} {projectionYearsText}</span>
                    {projectionWindowDisplay && <span>{projectionWindowDisplay}</span>}
                  </div>
                  <p className="projection-length-control__caption">
                    Choose how many years the charts and tables should cover.
                  </p>
                </div>
              </div>

              <div className="insight-highlights">
                <article className="insight-card accent-blue animatable" data-animate style={{ '--delay': '0.22s' }}>
                  <span className="insight-label">Current rate</span>
                  <span className="insight-metric">${rate} <span className="insight-unit">/ kWh</span></span>
                  <p className="insight-caption">Uses today&rsquo;s bill with your projected {scePecentage || 0}% annual increase.</p>
                </article>

                <article className="insight-card accent-emerald animatable" data-animate style={{ '--delay': '0.28s' }}>
                  <span className="insight-label">Monthly difference</span>
                  <span className="insight-metric">
                    {monthlyDifferenceDisplay !== null ? `$${formatCurrency(monthlyDifferenceDisplay, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                    {monthlyDifferenceDisplay !== null && <span className="insight-unit"> {monthlyDifferenceLabel}</span>}
                  </span>
                  <p className="insight-caption">
                    {hasFirstYearDifference
                      ? firstYearDifference > 0
                        ? `Save about $${formatCurrencyAbsolute(firstYearDifference)} in year one versus Sunrun's ${formatPercentage(effectiveSunrunEscalation)} escalation.`
                        : `Plan for about $${formatCurrencyAbsolute(firstYearDifference)} more in year one at this rate.`
                      : monthlyDifference !== null && monthlyDifference < 0
                        ? 'Sunrun currently costs more—lower the starting rate to find savings.'
                        : 'Enter a Sunrun monthly cost to view first-year differences.'}
                  </p>
                </article>

                <article className="insight-card accent-amber animatable" data-animate style={{ '--delay': '0.34s' }}>
                  <span className="insight-label">Final year outlook</span>
                  <span className="insight-metric">
                    {finalYearDifference !== null ? `$${formatCurrencyAbsolute(finalYearDifference)}` : '--'}
                    {finalYearDifference !== null && (
                      <span className="insight-unit"> {finalYearDifference >= 0 ? '/ yr saved' : '/ yr added cost'}</span>
                    )}
                  </span>
                  <p className="insight-caption">
                    {hasFinalYearDifference
                      ? finalYearDifference > 0
                        ? `Annual savings by ${finalYearLabel ?? 'final year'} with your inputs.`
                        : `Annual added cost by ${finalYearLabel ?? 'final year'} with your inputs.`
                      : monthlyDifference !== null && monthlyDifference < 0
                        ? `Sunrun stays above ${utilityShortName} across this window.`
                        : 'Add a Sunrun monthly cost to see multi-year comparisons.'}
                  </p>
                </article>
                <article className="insight-card accent-violet animatable" data-animate style={{ '--delay': '0.4s' }}>
                  <span className="insight-label">Five-year cushion</span>
                  <span className="insight-metric">
                    {hasFiveYearDifference ? `$${formatCurrencyAbsolute(fiveYearDifference)}` : '--'}
                    {hasFiveYearDifference && (
                      <span className="insight-unit"> {fiveYearDifference >= 0 ? 'cumulative saved' : 'cumulative added cost'}</span>
                    )}
                  </span>
                  <p className="insight-caption">
                    {hasFiveYearDifference
                      ? fiveYearDifference > 0
                        ? `Save about $${formatCurrencyAbsolute(fiveYearDifference, { minimumFractionDigits: 0 })} over the first five years.`
                        : `Expect about $${formatCurrencyAbsolute(fiveYearDifference, { minimumFractionDigits: 0 })} in added costs over the first five years.`
                      : 'If this reads zero, adjust the Sunrun cost or rate increases to uncover savings or pinpoint added costs.'}
                  </p>
                </article>
                <article className="insight-card accent-slate animatable" data-animate style={{ '--delay': '0.46s' }}>
                  <span className="insight-label">{projectionLabel || 'Multi-year'} spend gap</span>
                  <span className="insight-metric">
                    {hasYearlyBreakdown ? `$${formatCurrency(Math.abs(totalSavings))}` : '--'}
                    {hasYearlyBreakdown && (
                      <span className="insight-unit"> {totalDifferenceLabel}</span>
                    )}
                  </span>
                  <p className="insight-caption">
                    {hasYearlyBreakdown
                      ? hasPositiveTotalSavings
                        ? 'Total projected savings across your full horizon.'
                        : 'Sunrun costs more overall—tweak the starting price or escalations to find savings.'
                      : 'Add a Sunrun monthly cost to compare total spending.'}
                  </p>
                </article>
                <article className="insight-card accent-indigo animatable" data-animate style={{ '--delay': '0.52s' }}>
                  <span className="insight-label">Break-even outlook</span>
                  <span className="insight-metric">
                    {hasBreakEven ? breakEvenYear : '--'}
                    {hasBreakEven && <span className="insight-unit"> projected</span>}
                  </span>
                  <p className="insight-caption">{breakEvenDescription}</p>
                </article>
              </div>

              <div className="assumption-panel animatable" data-animate style={{ '--delay': '0.28s' }}>
                <div className="assumption-panel__header">
                  <h4>Annual increase inputs</h4>
                  <p>Compare your utility increases with the Sunrun escalation.</p>
                </div>
                <div className="assumption-panel__grid">
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Projected {utilityShortName} increase</span>
                    <span className="assumption-metric__value">{hasProjectedIncrease ? formatPercentage(parsedProjectedIncrease) : '--'}</span>
                  </div>
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Baseline {utilityShortName} increase</span>
                    <span className="assumption-metric__value">{hasBaselineIncrease ? formatPercentage(parsedBaselineIncrease) : '--'}</span>
                  </div>
                  <div className="assumption-metric">
                    <span className="assumption-metric__label">Sunrun escalation</span>
                    <span className="assumption-metric__value">{formatPercentage(effectiveSunrunEscalation)}</span>
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
                    ? `Your projected ${utilityShortName} increase is ${formatPercentage(parsedProjectedIncrease)} compared with a ${formatPercentage(effectiveSunrunEscalation)} Sunrun escalation.`
                    : 'Provide projected and baseline percentages to compare assumptions.'}
                </p>
              </div>

              <div className="homeowner-snapshot surface-card animatable" data-animate style={{ '--delay': '0.3s' }}>
                <div className="homeowner-snapshot__header">
                  <span className="homeowner-snapshot__badge">Household essentials</span>
                  <h4>The numbers homeowners ask about first</h4>
                  <p>Quickly see how today&rsquo;s bills and tomorrow&rsquo;s projections affect your budget.</p>
                </div>
                <div className="homeowner-snapshot__grid">
                  <div className="snapshot-tile">
                    <span className="snapshot-tile__label">Average monthly usage</span>
                    <span className="snapshot-tile__value">
                      {monthlyUsageKwh !== null ? `${formatNumber(monthlyUsageKwh, { maximumFractionDigits: 0 })} kWh` : '--'}
                    </span>
                    <p className="snapshot-tile__caption">
                      {monthlyUsageKwh !== null
                        ? 'Based on your annual usage entry divided across 12 months.'
                        : 'Add annual usage above to see an average kWh figure.'}
                    </p>
                  </div>
                  <div className="snapshot-tile">
                    <span className="snapshot-tile__label">Current annual {utilityShortName} spend</span>
                    <span className="snapshot-tile__value">
                      {currentAnnualBill !== null ? `$${formatCurrency(currentAnnualBill)}` : '--'}
                    </span>
                    <p className="snapshot-tile__caption">
                      {currentAnnualBill !== null
                        ? `That's roughly ${formatCurrency(chargesNumber ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo before new increases.`
                        : "Enter your current monthly charges to reveal today's baseline."}
                    </p>
                  </div>
                  <div className="snapshot-tile">
                    <span className="snapshot-tile__label">Projected annual {utilityShortName} bill</span>
                    <span className="snapshot-tile__value">
                      {projectedAnnualBill !== null ? `$${formatCurrency(projectedAnnualBill)}` : '--'}
                    </span>
                    <p className="snapshot-tile__caption">
                      {projectedAnnualBill !== null
                        ? `Reflects your ${scePecentage || 0}% increase assumption applied to today's bill.`
                        : "Provide a projected increase percentage to forecast next year's bill."}
                    </p>
                  </div>
                  <div className="snapshot-tile">
                    <span className="snapshot-tile__label">Sunrun plan impact</span>
                    <span className="snapshot-tile__value" data-positive={projectedPlanAnnualSavings !== null ? projectedPlanAnnualSavings >= 0 : undefined}>
                      {projectedPlanAnnualSavings !== null
                        ? `$${formatCurrencyAbsolute(projectedPlanAnnualSavings)}`
                        : '--'}
                      {projectedPlanAnnualSavings !== null && (
                        <span className="snapshot-tile__value-detail">
                          {projectedPlanAnnualSavings >= 0 ? 'saved / yr' : 'added cost / yr'}
                        </span>
                      )}
                    </span>
                    <p className="snapshot-tile__caption">
                      {projectedPlanAnnualSavings !== null ? (
                        <>
                          {projectedPlanAnnualSavings >= 0
                            ? 'Annual breathing room versus your projected utility bill.'
                            : 'Extra annual spend versus your projected utility bill—tweak assumptions to find savings.'}
                          {baselineAnnualSavings !== null && (
                            <span className="snapshot-tile__note">
                              {baselineAnnualSavings >= 0
                                ? `Today's rate check: $${formatCurrencyAbsolute(baselineAnnualSavings)} saved per year.`
                                : `Today's rate check: $${formatCurrencyAbsolute(baselineAnnualSavings)} extra per year.`}
                            </span>
                          )}
                        </>
                      ) : 'Add a Sunrun monthly cost to compare annual spend.'}
                    </p>
                  </div>
                </div>
              </div>

              {scenarioSummaries.length > 0 && (
                <div className="scenario-panel surface-card animatable" data-animate style={{ '--delay': '0.34s' }}>
                  <div className="scenario-panel__header">
                    <span className="scenario-panel__badge">Rate planning</span>
                    <h4>Stress-test your savings story</h4>
                    <p>See how different utility growth paths reshape your long-term budget.</p>
                  </div>
                  <div className="scenario-panel__grid">
                    {scenarioSummaries.map((scenario, index) => (
                      <div className="scenario-card" key={scenario.key} data-index={index}>
                        <span className="scenario-card__chip">{scenario.badge}</span>
                        <h5>{scenario.label}</h5>
                        <p className="scenario-card__description">{scenario.description}</p>
                        <div className="scenario-card__metrics">
                          <div className="scenario-metric">
                            <span className="scenario-metric__label">Year 1 impact</span>
                            <span className="scenario-metric__value" data-positive={scenario.firstYearAnnualDiff >= 0}>
                              ${formatCurrencyAbsolute(scenario.firstYearAnnualDiff)}
                              <small>{scenario.firstYearAnnualDiff >= 0 ? 'saved / yr' : 'added cost / yr'}</small>
                            </span>
                          </div>
                          <div className="scenario-metric">
                            <span className="scenario-metric__label">{scenario.finalYear}</span>
                            <span className="scenario-metric__value" data-positive={scenario.finalAnnualDiff >= 0}>
                              ${formatCurrencyAbsolute(scenario.finalAnnualDiff)}
                              <small>{scenario.finalAnnualDiff >= 0 ? 'saved / yr' : 'added cost / yr'}</small>
                            </span>
                          </div>
                          <div className="scenario-metric">
                            <span className="scenario-metric__label">{summaryProjectionLabel} total</span>
                            <span className="scenario-metric__value" data-positive={scenario.cumulative >= 0}>
                              ${formatCurrencyAbsolute(scenario.cumulative)}
                              <small>{scenario.cumulative >= 0 ? 'saved overall' : 'extra overall'}</small>
                            </span>
                          </div>
                        </div>
                        <div className="scenario-card__footer">
                          <span>{utilityShortName}: ${formatCurrency(scenario.finalUtilityBill)}</span>
                          <span>Sunrun: ${formatCurrency(scenario.finalSunrunBill)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(hasCumulativeProjectionDifference || hasPeakSavings) && (
                <div className="savings-summary animatable" data-animate style={{ '--delay': '0.38s' }}>
                  <div className="savings-summary__header">
                    <span className="savings-summary__badge"><TrendingUpIcon /> Savings storyline</span>
                    <h4>See how the gap evolves as rates shift</h4>
                    <p>Figures update instantly as you tweak the plan above.</p>
                  </div>
                  <div className="savings-summary__grid">
                    <div className="metric-chip">
                      <span className="metric-chip__icon" aria-hidden="true">
                        <EventAvailableIcon />
                      </span>
                      <div>
                        <p className="metric-chip__label">{projectionLabel || 'Long-term'} cumulative</p>
                        <p className="metric-chip__value">
                          {hasCumulativeProjectionDifference ? `$${formatCurrencyAbsolute(cumulativeProjectionDifference)}` : '--'}
                          {hasCumulativeProjectionDifference && (
                            <span> {cumulativeProjectionDifference > 0 ? 'saved' : 'added cost'}</span>
                          )}
                        </p>
                        <p className="metric-chip__caption">
                          {hasCumulativeProjectionDifference
                            ? cumulativeProjectionDifference > 0
                              ? 'Total savings across your projection window.'
                              : 'Sunrun adds to your projected costs across this window.'
                            : 'Adjust the entries until Sunrun pulls ahead to reveal multi-year differences.'}
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
                            ? 'Highest annual savings before the gap narrows.'
                            : `Savings never pass ${utilityShortName} here—try a lower Sunrun rate.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {hasYearlyBreakdown && (
                <div className="projection-actions animatable" data-animate style={{ '--delay': '0.44s' }}>
                  <div className="projection-actions__buttons">
                    <button type="button" className="utility-button" onClick={handleCopySummary}>
                      <ContentCopyIcon /> Copy quick summary
                    </button>
                    <button type="button" className="utility-button secondary" onClick={handleDownloadSummary}>
                      <DownloadIcon /> Download homeowner summary
                    </button>
                  </div>
                  {copyStatus && <span className="projection-actions__status">{copyStatus}</span>}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state animatable" data-animate style={{ '--delay': '0.12s' }}>
              <h4>Ready when you are</h4>
              <p>Add your charges and usage to unlock tailored projections.</p>
            </div>
          )}
        </div>
      </div>

      {rate !== null && chartData.length > 0 && (
        <div className="chart-card surface-card animatable" data-animate style={{ '--delay': '0.18s' }}>
          <div className="chart-header">
            <h3>Projected monthly bills (next {projectionYears} {projectionYearsText})</h3>
            <p>
              Track the gap between {utilityPossessive} expected increases and Sunrun&rsquo;s steady {formatPercentage(effectiveSunrunEscalation)} escalation
              across {projectionWindowDisplay || 'your selected horizon'}.
            </p>
            {brushWindowLabel && (
              <div className="chart-controls">
                <span>{brushWindowLabel}</span>
                {brushRange && (
                  <button type="button" onClick={handleBrushReset}>
                    Reset zoom
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={420}>
              <ComposedChart
                data={chartData}
                margin={{ top: 36, right: 36, bottom: 56, left: 24 }}
              >
                <defs>
                  <linearGradient id="sunrunLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2a9d8f" />
                    <stop offset="60%" stopColor="#3fc8b3" />
                    <stop offset="100%" stopColor="#64d7c7" />
                  </linearGradient>
                  <linearGradient id="sceLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f08a6b" />
                    <stop offset="55%" stopColor="#f5a585" />
                    <stop offset="100%" stopColor="#f9c1a7" />
                  </linearGradient>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(244, 162, 97, 0.35)" />
                    <stop offset="45%" stopColor="rgba(243, 154, 126, 0.24)" />
                    <stop offset="100%" stopColor="rgba(100, 215, 199, 0.16)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c8" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#5a4c43' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={70}
                  tickMargin={18}
                  axisLine={{ stroke: '#d9cbb8' }}
                  tickLine={{ stroke: '#d9cbb8' }}
                />
                <YAxis
                  tickFormatter={currencyFormatter}
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#5a4c43' }}
                  width={90}
                  tickMargin={16}
                  axisLine={{ stroke: '#d9cbb8' }}
                  tickLine={{ stroke: '#d9cbb8' }}
                />
                <Tooltip content={renderChartTooltip} cursor={{ strokeDasharray: '4 2', stroke: '#d7b89a' }} />
                {isDesktop && (
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 20, paddingTop: 8 }}
                    iconType="circle"
                  />
                )}
                <Area type="monotone" dataKey="Savings" stroke="none" fill="url(#savingsGradient)" fillOpacity={1} legendType="none" />
                {hasBreakEven && (
                  <>
                    <ReferenceLine
                      x={breakEvenYear}
                      stroke="#b07a5b"
                      strokeDasharray="4 4"
                      label={{ value: 'Break-even', position: 'insideTop', fill: '#b07a5b', fontSize: 12 }}
                    />
                    {breakEvenPoint && (
                      <>
                        <ReferenceDot
                          x={breakEvenPoint.year}
                          y={breakEvenPoint.SunRun}
                          r={6}
                          fill="#2a9d8f"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                        <ReferenceDot
                          x={breakEvenPoint.year}
                          y={breakEvenPoint[UTILITY_DATA_KEY]}
                          r={6}
                          fill="#f08a6b"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="SunRun"
                  stroke="url(#sunrunLineGradient)"
                  strokeWidth={3.5}
                  dot={{ r: 6, strokeWidth: 2, stroke: '#bfe9df', fill: '#2a9d8f' }}
                  activeDot={{ r: 9, strokeWidth: 0, fill: '#2a9d8f' }}
                />
                <Line
                  type="monotone"
                  dataKey={UTILITY_DATA_KEY}
                  name={utilityShortName}
                  stroke="url(#sceLineGradient)"
                  strokeWidth={3.5}
                  dot={{ r: 6, strokeWidth: 2, stroke: '#fce0d4', fill: '#f08a6b' }}
                  activeDot={{ r: 9, strokeWidth: 0, fill: '#f08a6b' }}
                />
                <Brush
                  key={brushKey}
                  dataKey="year"
                  height={36}
                  stroke="#e76f51"
                  fill="rgba(231, 111, 81, 0.12)"
                  travellerWidth={12}
                  traveller={{ fill: '#e76f51' }}
                  onChange={handleBrushChange}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {hasYearlyBreakdown && (
        <div className="yearly-breakdown-card surface-card animatable" data-animate style={{ '--delay': '0.24s' }}>
          <div className="yearly-breakdown__header">
            <div className="yearly-breakdown__title">
              <span className="yearly-breakdown__badge"><TableChartIcon /> Yearly breakdown</span>
              <h3>Compare annual totals side by side</h3>
            </div>
            <p>Watch cumulative savings grow as rates change.</p>
          </div>
          <div className="yearly-breakdown__table-wrapper">
            <table className="yearly-breakdown__table">
              <thead>
                <tr>
                  <th scope="col">Year</th>
                  <th scope="col">{utilityShortName} annual bill</th>
                  <th scope="col">Sunrun annual bill</th>
                  <th scope="col">Annual difference</th>
                  <th scope="col">Cumulative savings</th>
                </tr>
              </thead>
              <tbody>
                {yearlyBreakdown.map((item) => (
                  <tr key={item.year}>
                    <td>{item.year}</td>
                    <td>${formatCurrency(item.utilityAnnual)}</td>
                    <td>${formatCurrency(item.sunrunAnnual)}</td>
                    <td data-positive={item.diffAnnual >= 0}>
                      ${formatCurrency(Math.abs(item.diffAnnual))}
                      <span className="yearly-breakdown__difference-label">
                        {item.diffAnnual >= 0 ? 'saved' : 'extra cost'}
                      </span>
                    </td>
                    <td data-positive={item.cumulativeSavings >= 0}>
                      ${formatCurrency(Math.abs(item.cumulativeSavings))}
                      <span className="yearly-breakdown__difference-label">
                        {item.cumulativeSavings >= 0 ? 'saved total' : 'extra overall'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{projectionLabel || 'Projection'} totals</th>
                  <td>${formatCurrency(totalUtilitySpend)}</td>
                  <td>${formatCurrency(totalSunrunSpend)}</td>
                  <td data-positive={totalSavings >= 0}>
                    ${formatCurrency(Math.abs(totalSavings))}
                    <span className="yearly-breakdown__difference-label">{hasPositiveTotalSavings ? 'saved total' : 'extra cost'}</span>
                  </td>
                  <td data-positive={totalSavings >= 0}>
                    ${formatCurrency(Math.abs(totalSavings))}
                    <span className="yearly-breakdown__difference-label">{hasPositiveTotalSavings ? 'net savings' : 'net cost'}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </section>
  )
}

export default Calculator
