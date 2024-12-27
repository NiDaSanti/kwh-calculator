import React, { useState, useEffect } from 'react'
//import { LineChart } from '@mui/x-charts/LineChart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ElectricBoltRoundedIcon from '@mui/icons-material/ElectricBoltRounded'
import BoltTwoToneIcon from '@mui/icons-material/BoltTwoTone'
import SolarPowerTwoToneIcon from '@mui/icons-material/SolarPowerTwoTone'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import './styles.css'  // Importing the updated CSS file

const xYearsLabel = ["2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035"]

const style = {
  // py: 0,
  // width: '100%',
  // //maxWidth: 360,
  // borderRadius: 2,
  // border: '1px solid',
  // borderColor: 'divider',
  // backgroundColor: 'background.paper',
  // marginBottom: '20px'
}

const Calculator = () => {
  const [charges, setCharges] = useState('')
  const [usage, setUsage] = useState('')
  const [annualUsage, setAnnualUsage] = useState('')
  const [sunRunAnnualRateIncrease, setSunRunAnnualRateIncrease] = useState('0.00')
  const [rate, setRate] = useState(null)
  const [avgPerMonthCost, setAvgPerMonthCost] = useState(null)
  const [projectedBills, setProjectedBills] = useState({ sunrunBills: [], sceBills: [] })

  function calcuateRate() {
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
    if (rate && annualUsage > 0) {
      const avgMonthlyBill = (annualUsage * parseFloat(rate)) / 12
      setAvgPerMonthCost(avgMonthlyBill.toFixed(2))
    }
  }

  function generateProjectedBills(initialBill, sunRunStartMonthlyCost) {
    const sunrunIncrease = 1.035  // 3.5% increase per year
    const sceIncrease = 1.105   // 10.5% increase per year
    const years = 10  // Number of years to project

    const sunrunBills = []
    const sceBills = []

    for (let i = 0; i <= years; i++) {
      const sunrunBill = sunRunStartMonthlyCost * Math.pow(sunrunIncrease, i)
      const sceBill = initialBill * Math.pow(sceIncrease, i)

      sunrunBills.push(sunrunBill.toFixed(2))
      sceBills.push(sceBill.toFixed(2))
    }

    setProjectedBills({
      sunrunBills,
      sceBills
    })
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

  const handleSubmit = (e) => {
    e.preventDefault()
    calcuateRate()
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
    setSunRunAnnualRateIncrease('0.00')
    setRate(null)
    setAvgPerMonthCost(null)
    setProjectedBills({ sunrunBills: [], sceBills: [] })
  }

  return (
    <div className="calculator-container">
      <div>
        <h2>SCE Rate Calculator</h2>
        <form onSubmit={handleSubmit}>
          <label>
          <AttachMoneyIcon/> Monthly Charges
            <input
              type="number"
              step="0.01"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
              required
            />
          </label>
          <label>
          <ElectricBoltRoundedIcon/> Monthly kWh Usage
            <input
              type="number"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              required
            />
          </label>
          <label>
            <BoltTwoToneIcon /> Annual kWh Usage
            <input
              type="number"
              step="0.01"
              value={annualUsage}
              onChange={(e) => setAnnualUsage(e.target.value)}
              required
            />
          </label>
          <button type="submit">Calculate Rate</button>
          <button type="button" onClick={handleReset}>Reset</button>
        </form>
        <div className="calculator-container">
          {rate !== null && (
            <div className="sunrun-input-container">
              <div className="warning-label">
                <p className="message-prompt">Please enter SunRun Monthly charge:</p>
              </div>
              <label>
                <SolarPowerTwoToneIcon /> SunRun's Monthly Cost:
                <input
                  type="number"
                  step="0.01"
                  value={sunRunAnnualRateIncrease}
                  onChange={(e) => setSunRunAnnualRateIncrease(e.target.value)} 
                  />
              </label>
              <button className="sunrun-calculate-btn" onClick={handleSunRunMonthlyCost} type="button">Calculate</button>
            </div>
          )}
        </div>
      </div>

      <div className="result-container">
        {rate !== null && (
          <>
            <Paper sx={{p:3}}>
              <List sx={style}>
                <ListItem>
                  <ListItemText primary={`The rate is ${rate} per kWh.`}/>
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary={`The average monthly cost is ${avgPerMonthCost}`} />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary='Projected Monthly Electric Bills (Next 10 Years)' />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText primary="This graph demonstrates SunRun's rate increase vs SCE rate increase over the years." />
                </ListItem>
                <Divider component="li" />
              </List>
              {/* <h4>The rate is ${rate} per kWh.</h4>
              <h4>The average monthly cost is ${avgPerMonthCost}</h4>
              <h4>Projected Monthly Electric Bills (Next 10 Years)</h4>
              <div className="graph-message">This graph demonstrates SunRun's rate increase vs SCE rate increase over the years.</div>
              <Divider  sx={{m: 3}}/> */}
            <div className="mobile-graph-layout">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={projectedBills.sunrunBills.map((bill, index) => ({
                  year: xYearsLabel[index], // Year for the x-axis
                  SunRun: bill,              // SunRun bill for the 'SunRun' line
                  SCE: projectedBills.sceBills[index] // SCE bill for the 'SCE' line
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="SunRun" stroke="#007bff" />
                  <Line type="monotone" dataKey="SCE" stroke="#FF6A00" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Paper>
          </>
        )}
      </div>
    </div>
  )
}

export default Calculator
