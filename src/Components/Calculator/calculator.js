import React, { useState, useEffect } from 'react'
//import { LineChart } from '@mui/x-charts/LineChart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BoltTwoToneIcon from '@mui/icons-material/BoltTwoTone'
import SolarPowerTwoToneIcon from '@mui/icons-material/SolarPowerTwoTone'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import PercentIcon from '@mui/icons-material/Percent'
import './styles.css'  // Importing the updated CSS file

const xYearsLabel = ["2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035"]

const style = {
  py: 0,
  width: '100%',
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  marginBottom: '20px',
  maxWidth: '600px'
}

const textBoxStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}
// const modalStyle = {
//   position: 'absolute',
//   top: '50%',
//   left: '50%',
//   transform: 'translate(-50%, -50%)',
//   width: 400,
//   backgroundColor: 'background.paper',
//   border: '2px solid #000',
//   boxShadow: 24,
//   p: 4
// }

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
    const sceInitialIncrease = 1 + parseFloat(scePecentage) / 100
    const sceMinIncrease = 1 + parseFloat(projectedFutureRateIncrease) / 100
    const years = 10
  
    const sunrunBills = []
    const sceBills = []
  
    for (let i = 0; i <= years; i++) {
      const sunrunBill = sunRunStartMonthlyCost * Math.pow(sunrunIncrease, i)
  
      let sceBill
      if (i === 0) {
        sceBill = initialBill
      } else if (i === 1) {
        sceBill = sceBills[0] * sceInitialIncrease
      } else {
        sceBill = sceBills[i - 1] * sceMinIncrease
      }
  
      sunrunBills.push(sunrunBill.toFixed(2))
      sceBills.push(sceBill.toFixed(2))
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
    setProjectedFutureRateIncrease(null)
    setAvgPerMonthCost(null)
    setProjectedBills({ sunrunBills: [], sceBills: [] })
  }

  return (
<div className="calculator-container">
  <div className="calculator-header">
    <h2>SCE Rate Calculator</h2>
    {/* <Button onClick={handleOpen} color="error" variant="text">Important Notice</Button>
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6">IMPORTANT NOTICE!</Typography>
        <Typography sx={{ mt: 2 }}>
          The rate increase for SCE is based on a 10.10% increase year over year for a period of ten years. 
          Sunrun is set at 3.5% year over year. The SCE rates may not be accurate.
        </Typography>
      </Box>
    </Modal> */}
  </div>

  <form className="calculator-form" onSubmit={handleSubmit}>
    <div className="form-group">
      <label><AttachMoneyIcon /> Monthly Charges</label>
      <input type="number" step="0.01" value={charges} onChange={(e) => setCharges(e.target.value)} required />
    </div>
    
    <div className="form-group">
      <label><PowerOutlinedIcon /> Monthly kWh Usage</label>
      <input type="number" value={usage} onChange={(e) => setUsage(e.target.value)} required />
    </div>
    
    <div className="form-group">
      <label><BoltTwoToneIcon /> Annual kWh Usage</label>
      <input type="number" step="0.01" value={annualUsage} onChange={(e) => setAnnualUsage(e.target.value)} required />
    </div>

    <div className="form-group">
      <label><PercentIcon /> Rate Change Percentage (increase or decrease):</label>
      <input type="number" value={scePecentage} onChange={(e) => setScePecentage(e.target.value)} required />
    </div>

    <div className="form-group">
      <label><PercentIcon /> Minimal Rate Percentage:</label>
      <input type="number" value={projectedFutureRateIncrease} onChange={(e) => setProjectedFutureRateIncrease(e.target.value)} required />
    </div>

    <div className="button-group">
      <button type="submit">Calculate Rate</button>
      <button className="reset" type="button" onClick={handleReset}>Reset</button>
    </div>

  </form>

  {rate !== null && (
    <div className="sunrun-input-container">
      <p className="warning-label">Please enter SunRun Monthly charge:</p>
      <label><SolarPowerTwoToneIcon /> SunRun's Monthly Cost:</label>
      <input type="number" step="0.01" value={sunRunAnnualRateIncrease} onChange={(e) => setSunRunAnnualRateIncrease(e.target.value)} />
      <button className="sunrun-calculate-btn" onClick={handleSunRunMonthlyCost}>Calculate</button>
    </div>
  )}

  <div className="result-container">
    {rate !== null && (
      <>
        <Box sx={textBoxStyle}>
          <List sx={style}>
            <ListItem>
              <ListItemText primary={`The rate is ${rate} per kWh.`} />
              <Typography variant="p" gutterBottom>($ {charges} / {usage})</Typography>
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText primary={`The average monthly cost is ${avgPerMonthCost}`} />
              <Typography variant="p" gutterBottom>({annualUsage} X $ {rate} / 12)</Typography>
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText primary={`The monthly bill with change is $ ${projectedMonthlyBill}`}/>
              <Typography variant="p" gutterBottom>({avgPerMonthCost} × (1 + {scePecentage} / 100))</Typography>
            </ListItem>
            <Divider component="li" />
            {/* <ListItem><ListItemText primary="Projected Monthly Electric Bills (Next 10 Years)" /></ListItem>
            <Divider component="li" />
            <ListItem><ListItemText primary="This graph demonstrates Sunrun's rate increase vs SCE rate increase over the years." /></ListItem> */}
          </List> 
        </Box>
        <Typography variant="h5" gutterBottom>Projected monthly bill (10 years)</Typography>
        <Typography variant="h6" gutterBottom>Sunrun's rate vs SCE rates.</Typography>

        <div className="mobile-graph-layout">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectedBills.sunrunBills.map((bill, index) => ({
              year: xYearsLabel[index], 
              SunRun: bill,             
              SCE: projectedBills.sceBills[index]
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              {/* Adjust the XAxis to rotate labels for better readability */}
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }} 
                angle={-45}  // Rotate the labels for better fit
                textAnchor="end" // Align text to end (makes the rotated text readable)
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              {/* Remove Legend on mobile to save space */}
              {window.innerWidth > 600 && <Legend />}  {/* Show legend only on larger screens */}
              <Line type="monotone" dataKey="SunRun" stroke="#007bff" />
              <Line type="monotone" dataKey="SCE" stroke="#FF6A00" />
            </LineChart>
          </ResponsiveContainer>
          </div>
      </>
    )}
    </div>
  </div>
  )
}

export default Calculator
