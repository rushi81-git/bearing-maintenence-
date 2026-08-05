// ============================================================
// Workshop Maintenance System — AI Prediction Engine
// Algorithm: Weighted scoring model (Random Forest-inspired)
//
// FEATURE WEIGHTS:
//   vibration         35%   — ISO 10816 standard; dominant failure indicator
//   temperature       25%   — Arrhenius degradation law
//   power_usage       20%   — Mechanical load proxy
//   operational_hours 20%   — OEM service interval alignment
//   tool_condition    ±15%  — EXCEPTION: CNC/cutting machines only.
//                             When NULL → excluded entirely (0% impact).
//                             When present → applies adjustment on final score.
// ============================================================

/**
 * Normalise a raw sensor value to a 0–100 risk contribution.
 * Each parameter has empirically defined safe / warning / critical thresholds.
 */
function normalise(value, low, mid, high) {
  if (value <= low)  return 0;
  if (value >= high) return 100;
  if (value <= mid)  return ((value - low) / (mid - low)) * 50;
  return 50 + ((value - mid) / (high - mid)) * 50;
}

/**
 * Main prediction function.
 *
 * @param {object} params
 * @param {number}      params.temperature        °C   — required
 * @param {number}      params.vibration           mm/s — required
 * @param {number}      params.power_usage         kW   — required
 * @param {number}      params.operational_hours   hrs  — required
 * @param {number|null} params.tool_condition       %    — EXCEPTION (null = excluded)
 * @returns {object} prediction result
 */
function predict({ temperature, vibration, power_usage, operational_hours, tool_condition }) {
  // ── 1. Normalise each required parameter to 0–100 risk score ──────────────
  //   Thresholds: [safe_max, warning_start, critical_min]
  const tempScore  = normalise(temperature,       40,  70, 100); // °C
  const vibScore   = normalise(vibration,          1,   5,  15); // mm/s
  const powerScore = normalise(power_usage,       20,  60,  90); // kW
  const hrsScore   = normalise(operational_hours, 500, 3000, 8000); // hrs

  // ── 2. Weighted base score (four required features) ───────────────────────
  const baseScore =
    vibScore   * 0.35 +
    tempScore  * 0.25 +
    powerScore * 0.20 +
    hrsScore   * 0.20;

  // ── 3. Tool condition adjustment (EXCEPTION — CNC machines only) ──────────
  //   tool_condition is a health percentage (100 = new, 0 = fully worn).
  //   Lower tool condition → higher risk.  Adjustment range: –15% to +15%.
  let finalScore = baseScore;
  const hasToolCondition = tool_condition !== null && tool_condition !== undefined && !isNaN(parseFloat(tool_condition));

  if (hasToolCondition) {
    const tc = parseFloat(tool_condition);
    // tc=100 (perfect) → adjustment = -15 (lower risk)
    // tc=0   (worn)    → adjustment = +15 (higher risk)
    const toolAdjustment = ((100 - tc) / 100) * 30 - 15; // range: [-15, +15]
    finalScore = Math.min(100, Math.max(0, baseScore + toolAdjustment));
  }

  finalScore = Math.round(finalScore * 10) / 10;

  // ── 4. Status classification ───────────────────────────────────────────────
  let status, priority, days_until_maintenance, recommended_action;

  if (finalScore >= 70) {
    status                = 'Critical';
    priority              = 'High';
    days_until_maintenance = Math.max(1, Math.round(3 - (finalScore - 70) / 10));
    recommended_action    = buildAction('critical', { temperature, vibration, power_usage, operational_hours, tool_condition: hasToolCondition ? tool_condition : null });
  } else if (finalScore >= 40) {
    status                = 'Moderate';
    priority              = 'Medium';
    days_until_maintenance = Math.round(7 + (70 - finalScore) / 3);
    recommended_action    = buildAction('moderate', { temperature, vibration, power_usage, operational_hours, tool_condition: hasToolCondition ? tool_condition : null });
  } else {
    status                = 'Healthy';
    priority              = 'Low';
    days_until_maintenance = Math.round(30 + (40 - finalScore) * 1.5);
    recommended_action    = buildAction('healthy', { temperature, vibration, power_usage, operational_hours, tool_condition: hasToolCondition ? tool_condition : null });
  }

  // ── 5. Confidence score ────────────────────────────────────────────────────
  // Higher confidence when the score is clearly in a zone (far from thresholds).
  const distFromEdge = Math.min(
    Math.abs(finalScore - 40),
    Math.abs(finalScore - 70)
  );
  const confidence = Math.min(97, Math.round(72 + distFromEdge * 0.6));

  return {
    risk_score: finalScore,
    status,
    confidence,
    days_until_maintenance,
    recommended_action,
    priority,
    // Debug breakdown (not stored in DB, useful for logging)
    _breakdown: {
      temp_score:   +tempScore.toFixed(1),
      vib_score:    +vibScore.toFixed(1),
      power_score:  +powerScore.toFixed(1),
      hrs_score:    +hrsScore.toFixed(1),
      base_score:   +baseScore.toFixed(1),
      tool_applied: hasToolCondition,
      final_score:  finalScore,
    },
  };
}

/**
 * Build a human-readable recommended action string based on the dominant
 * contributing factor.
 */
function buildAction(level, { temperature, vibration, power_usage, operational_hours, tool_condition }) {
  const tc = tool_condition !== null ? parseFloat(tool_condition) : null;

  if (level === 'critical') {
    if (vibration > 10)      return 'URGENT: Excessive vibration detected. Shut down immediately — inspect bearings, shaft alignment, and coupling. Risk of catastrophic failure.';
    if (temperature > 90)    return 'URGENT: Critical overheating. Stop machine, check coolant flow, lubrication system, and motor windings before restart.';
    if (tc !== null && tc < 20) return 'URGENT: Tool condition critically degraded. Replace tooling immediately to prevent workpiece damage and spindle overload.';
    if (power_usage > 80)   return 'URGENT: Severe power overload. Inspect motor, drives, and mechanical transmission. Risk of motor burnout.';
    return 'URGENT: Multiple parameters in critical range. Perform full inspection before next operation cycle.';
  }

  if (level === 'moderate') {
    if (vibration > 4)       return 'Schedule vibration analysis within 7 days. Check bearing wear, belt tension, and foundation bolts.';
    if (temperature > 65)    return 'Elevated temperature trend. Inspect lubrication, cooling fins, and air filters. Schedule service within 2 weeks.';
    if (tc !== null && tc < 50) return 'Tool condition below 50%. Plan tool replacement at next scheduled downtime to maintain surface quality.';
    if (operational_hours > 2500) return 'Approaching scheduled service interval. Book preventive maintenance — inspect all wear components.';
    return 'Parameters trending toward warning thresholds. Schedule preventive inspection within 2 weeks.';
  }

  // healthy
  if (tc !== null)           return `All parameters within safe range. Tool condition at ${tc.toFixed(0)}%. Continue standard monitoring. Next service per schedule.`;
  return 'All parameters within safe operating range. Continue standard monitoring protocol.';
}

module.exports = { predict };
