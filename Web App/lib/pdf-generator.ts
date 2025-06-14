import jsPDF from 'jspdf'
import type { User } from 'firebase/auth'

interface HealthData {
  steps: number
  heartRate: {
    average: number
    minimum: number
    maximum: number
  }
  location: {
    lat: number | null
    lng: number | null
    address?: string
  }
  medicines: Array<{
    name: string
    timing: string
    dosage: string
  }>
  alerts: Array<{
    message: string
    time: string
    type: string
  }>
  date: string
}

export const generateHealthReport = (user: User, healthData: HealthData) => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Colors
  const primaryColor = '#8B5CF6' // Purple
  const secondaryColor = '#3B82F6' // Blue
  const textColor = '#374151' // Gray
  const lightGray = '#F3F4F6'
  
  // Header with VocalEyes branding
  pdf.setFillColor(139, 92, 246) // Purple background
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  // VocalEyes logo/title
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('VocalEyes', 20, 25)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('by Team Deepship', 20, 35)
  
  // Report title
  pdf.setTextColor(textColor)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Health Report', pageWidth - 80, 25)
  
  // Date
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 80, 35)
  
  let yPosition = 60
  
  // User Information Section
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('Patient Information', 20, yPosition)
  
  yPosition += 15
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  
  const userName = user.displayName || user.email?.split('@')[0] || 'Unknown User'
  pdf.text(`Name: ${userName}`, 20, yPosition)
  yPosition += 10
  pdf.text(`Email: ${user.email || 'Not provided'}`, 20, yPosition)
  yPosition += 10
  pdf.text(`Report Date: ${healthData.date}`, 20, yPosition)
  
  yPosition += 25
  
  // Health Metrics Section
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('Health Metrics', 20, yPosition)
  
  yPosition += 15
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  
  // Steps
  pdf.text(`Daily Steps: ${healthData.steps.toLocaleString()}`, 20, yPosition)
  yPosition += 10
  
  // Heart Rate
  pdf.text(`Heart Rate (Average): ${healthData.heartRate.average} BPM`, 20, yPosition)
  yPosition += 10
  pdf.text(`Heart Rate (Min/Max): ${healthData.heartRate.minimum}/${healthData.heartRate.maximum} BPM`, 20, yPosition)
  
  yPosition += 25
  
  // Location Section
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('Location Information', 20, yPosition)
  
  yPosition += 15
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  
  if (healthData.location.lat && healthData.location.lng) {
    pdf.text(`Coordinates: ${healthData.location.lat.toFixed(6)}, ${healthData.location.lng.toFixed(6)}`, 20, yPosition)
    yPosition += 10
    if (healthData.location.address) {
      pdf.text(`Address: ${healthData.location.address}`, 20, yPosition)
      yPosition += 10
    }
  } else {
    pdf.text('Location: Not available', 20, yPosition)
    yPosition += 10
  }
  
  yPosition += 15
  
  // Medicines Section
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('Medications', 20, yPosition)
  
  yPosition += 15
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  
  if (healthData.medicines.length > 0) {
    healthData.medicines.forEach((medicine, index) => {
      pdf.text(`${index + 1}. ${medicine.name}`, 25, yPosition)
      yPosition += 8
      pdf.text(`   Timing: ${medicine.timing}`, 25, yPosition)
      yPosition += 8
      pdf.text(`   Dosage: ${medicine.dosage}`, 25, yPosition)
      yPosition += 12
      
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = 30
      }
    })
  } else {
    pdf.text('No medications recorded', 25, yPosition)
    yPosition += 15
  }
  
  // Alerts Section
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(primaryColor)
  pdf.text('Recent Alerts', 20, yPosition)
  
  yPosition += 15
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(textColor)
  
  if (healthData.alerts.length > 0) {
    healthData.alerts.forEach((alert, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage()
        yPosition = 30
      }
      
      pdf.text(`${index + 1}. [${alert.type.toUpperCase()}] ${alert.message}`, 25, yPosition)
      yPosition += 8
      pdf.text(`   Time: ${alert.time}`, 25, yPosition)
      yPosition += 12
    })
  } else {
    pdf.text('No recent alerts', 25, yPosition)
    yPosition += 15
  }
  
  // Footer
  const footerY = pageHeight - 20
  pdf.setFontSize(8)
  pdf.setTextColor(128, 128, 128)
  pdf.text('This report is generated by VocalEyes - Team Deepship Health Monitoring System', 20, footerY)
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 20, footerY + 8)
  
  // Save the PDF
  const fileName = `health-report-${userName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}
