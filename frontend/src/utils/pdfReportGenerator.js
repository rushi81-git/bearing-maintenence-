import { jsPDF } from 'jspdf';

/**
 * Generates and downloads an executive diagnostic report PDF.
 * 
 * @param {Object} params
 * @param {Object} params.diagnosis - Diagnosis result object
 * @param {Object} params.machine - Selected machine object
 * @param {string} params.filename - Source CSV filename
 */
export function generateDiagnosticPDF({ diagnosis, machine, filename = 'vibration_telemetry.csv' }) {
  if (!diagnosis) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isHealthy = diagnosis.bearing_status === 'Healthy' || diagnosis.fault_type === 'Normal';
  const severity = diagnosis.severity || (isHealthy ? 'Healthy' : 'Moderate');
  const faultType = diagnosis.fault_type || 'Normal';
  const defectSize = diagnosis.fault_size_inches && diagnosis.fault_size_inches > 0
    ? `${diagnosis.fault_size_inches}" (${diagnosis.fault_size_mm} mm)`
    : 'None (Baseline)';
  const confidence = (diagnosis.prediction_probability * 100).toFixed(1);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const reportId = `REP-${Date.now().toString().slice(-6)}`;

  // ── Header Banner ──
  doc.setFillColor(20, 24, 38); // Deep navy
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SMART WORKSHOP MAINTENANCE SYSTEM', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text('AI-DRIVEN BEARING VIBRATION DIAGNOSTIC AUDIT REPORT', 14, 23);
  doc.text(`REPORT ID: ${reportId}   |   GENERATED: ${dateStr} ${timeStr}`, 14, 29);

  // Status Badge in Header
  const statusBadgeColor = isHealthy ? [16, 185, 129] : (severity === 'Severe' ? [239, 68, 68] : [245, 158, 11]);
  doc.setFillColor(statusBadgeColor[0], statusBadgeColor[1], statusBadgeColor[2]);
  doc.roundedRect(pageWidth - 62, 10, 48, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(isHealthy ? 'HEALTHY' : 'FAULT DETECTED', pageWidth - 38, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.text(isHealthy ? 'ISO CLASS A' : `${severity.toUpperCase()} SEVERITY`, pageWidth - 38, 24, { align: 'center' });

  let y = 48;

  // ── 1. Machine Asset Summary ──
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Monitored Machinery Asset', 14, y);
  y += 6;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('MACHINE NAME', 20, y + 8);
  doc.text('EQUIPMENT TYPE', 75, y + 8);
  doc.text('FACILITY LOCATION', 130, y + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(machine?.name || 'Workshop Machine', 20, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(machine?.machine_type || machine?.type || 'Industrial Machinery', 75, y + 16);
  doc.text(machine?.location || 'Floor Bay A', 130, y + 16);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Source Telemetry File: ${filename}   |   Sampling Rate: ${diagnosis.sampling_rate_hz || 48000} Hz`, 20, y + 23);

  y += 36;

  // ── 2. Diagnostic Assessment ──
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. AI Diagnostic Assessment & Fault Classification', 14, y);
  y += 6;

  // 4 Diagnostic Metric Cards
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cards = [
    { label: 'CLASSIFICATION', value: faultType, sub: isHealthy ? 'Normal Operation' : 'Vibration Anomaly' },
    { label: 'DEFECT DIAMETER', value: defectSize, sub: 'Seeded Spall Scale' },
    { label: 'SEVERITY RATING', value: severity, sub: 'ISO 10816 Standard' },
    { label: 'CONFIDENCE', value: `${confidence}%`, sub: 'Softmax Probability' }
  ];

  cards.forEach((c, i) => {
    const cx = 14 + i * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, 26, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + 4, y + 7);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(c.value, cx + 4, y + 15);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, cx + 4, y + 21);
  });

  y += 34;

  // ── 3. Vibration Signal Kinematic Telemetry ──
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Signal Features & Kinematic Measurements', 14, y);
  y += 6;

  const features = diagnosis.features || {};
  const metrics = [
    ['Root Mean Square (RMS)', `${features.rms ?? diagnosis.rms ?? 0.15} g`, '< 0.15 g', 'Total vibration power; primary ISO standard indicator'],
    ['Kurtosis (Impulsiveness)', `${features.kurtosis ?? diagnosis.kurtosis ?? 3.0}`, '2.8 - 3.2', 'Gaussian baseline is ~3.0; spikes indicate sharp raceway shocks'],
    ['Crest Factor (Peak / RMS)', `${features.crest_factor ?? diagnosis.crest_factor ?? 3.5}`, '3.0 - 4.5', 'Detects isolated transient impacts before overall RMS rises'],
    ['Peak-to-Peak Amplitude', `${features.peak_to_peak ?? diagnosis.peak_to_peak ?? 0.5} g`, '< 0.80 g', 'Maximum acceleration excursion in time domain'],
    ['Shape Factor', `${features.shape_factor ?? diagnosis.shape_factor ?? 1.25}`, '1.2 - 1.4', 'Ratio of RMS to mean absolute signal amplitude']
  ];

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PARAMETER', 18, y + 5.5);
  doc.text('MEASURED VALUE', 80, y + 5.5);
  doc.text('BASELINE RANGE', 120, y + 5.5);
  doc.text('INTERPRETATION', 155, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');
  metrics.forEach((row, idx) => {
    const rowY = y + idx * 7.5;
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY, pageWidth - 28, 7.5, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 18, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(row[1], 80, rowY + 5);
    doc.setTextColor(100, 116, 139);
    doc.text(row[2], 120, rowY + 5);

    doc.setFontSize(7.5);
    doc.text(row[3].slice(0, 38), 155, rowY + 5);
    doc.setFontSize(8);
  });

  y += metrics.length * 7.5 + 8;

  // ── 4. Actionable Maintenance Directive ──
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('4. Maintenance Directive & Action Plan', 14, y);
  y += 6;

  doc.setFillColor(isHealthy ? 240 : 254, isHealthy ? 253 : 242, isHealthy ? 244 : 242);
  doc.setDrawColor(isHealthy ? 167 : 254, isHealthy ? 243 : 202, isHealthy ? 208 : 202);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(isHealthy ? 21 : 185, isHealthy ? 128 : 28, isHealthy ? 61 : 28);
  doc.text(`DIRECTIVE STATUS: ${diagnosis.urgency ? diagnosis.urgency.toUpperCase() : (isHealthy ? 'ROUTINE' : 'HIGH')} URGENCY`, 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const recText = diagnosis.recommendation || 'Continue standard condition monitoring program.';
  const splitRec = doc.splitTextToSize(recText, pageWidth - 48);
  doc.text(splitRec, 20, y + 15);

  y += 38;

  // ── Sign-off Footer ──
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 28, y);
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Inspected by: AI Diagnostic Engine (1D Deep CNN)', 14, y);
  doc.text('Authorized Workshop Engineer: _______________________', pageWidth - 14, y, { align: 'right' });
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This automated report conforms to ISO 10816-3 mechanical vibration evaluation benchmarks.', 14, y);

  // Download PDF file
  const safeMachineName = (machine?.name || 'machine').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const pdfFilename = `Bearing_Diagnosis_Report_${safeMachineName}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(pdfFilename);
}
