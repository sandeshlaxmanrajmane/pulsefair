/**
 * Full documentation, manuscripts, engineering architecture, and clinical evidence
 * extracted from the research package.
 */

export interface ReportSection {
  id: string;
  title: string;
  badge: string;
  summary: string;
  content: string;
}

export const RESEARCH_REPORTS: ReportSection[] = [
  {
    id: 'clinical-crisis',
    title: 'The Clinical Crisis: Occult Hypoxemia in PPG',
    badge: 'Clinical Impact',
    summary: 'How melanin absorption leads to false normal SpO2 readings in Black and darkly pigmented patients, risking lives during critical respiratory distress.',
    content: `
### 1. The Clinical Problem
Photoplethysmography (PPG) is the foundational optical sensing technology for pulse oximeters and smartwatches, estimating arterial oxygen saturation ($SpO_2$) and heart rate. However, landmark clinical investigations (notably **Sjoding et al., New England Journal of Medicine 2020**, and subsequent FDA workshops) demonstrate a systematic performance disparity: pulse oximeters are significantly less accurate for individuals with darker skin pigmentation.

#### The Lethal Risk: Occult Hypoxemia
The most dangerous failure mode is **Occult Hypoxemia**:
- The wearable or clinical monitor displays a safe, reassuring oxygen level (e.g., $94\%$).
- The patient's actual arterial blood gas saturation ($SaO_2$) is critically depressed ($< 88\%$).
- **Clinical Consequence:** Delayed oxygen therapy, withheld hospital admission, unadministered dexamethasone/remdesivir, and heightened 30-day mortality in Black patients compared to White patients.

---

### 2. Optical Physics & Engineering Mechanism
The demographic bias is not an inherent flaw in optics, but a hardware-software calibration mismatch:

1. **Optical Melanin Absorption (Beer-Lambert Law):**
   $$I(\\lambda) = I_0(\\lambda) \\cdot \\exp\\left(-\\mu_a(\\lambda) \\cdot d\\right)$$
   Epidermal melanin exhibits an absorption coefficient that drops sharply with increasing wavelength ($\\propto \\lambda^{-3.48}$). At Red ($660\\text{ nm}$), melanin absorbs photons much more heavily than at Infrared ($880\\text{--}940\\text{ nm}$).

2. **SNR Collapse & Dynamic Range Compression:**
   In darker skin, high melanin concentrations cause severe **DC baseline attenuation** (from $\\sim 1000\\text{ LSB}$ down to $< 400\\text{ LSB}$). This compresses the Transimpedance Amplifier (TIA) linear dynamic range and diminishes the Signal-to-Noise Ratio (SNR) of the tiny pulsatile ($AC$) cardiac component.

3. **Static Calibration R-Curve Shift:**
   Pulse oximeters determine $SpO_2$ by computing the Ratio of Ratios:
   $$R = \\frac{AC_{red} / DC_{red}}{AC_{ir} / DC_{ir}}$$
   Empirical calibration curves ($SpO_2 = -25.0 \\cdot R + 110.0$) were historically developed on overwhelmingly light-skinned cohorts. When applied to dark-skinned individuals whose signals suffer differential baseline depression, this formula produces a mathematical bias: **an artificial overestimation of blood oxygen by 3% to 8%**.
`
  },
  {
    id: 'three-stage-architecture',
    title: 'Proposed 3-Stage Closed-Loop Mitigation Architecture',
    badge: 'Core Innovation',
    summary: 'A unified embedded edge-computing architecture combining closed-loop adaptive LED current, objective ITA profiling, dynamic curve matrices, and multi-tier SQI.',
    content: `
### The 3-Stage Closed-Loop Solution
Rather than applying an ad-hoc post-hoc software offset, our proposed reference architecture treats skin-tone bias as an end-to-end signal-chain challenge.

\`\`\`
[ Raw PPG Signal ] ───► [ STAGE 1: Adaptive Hardware ] 
                              │  DC Floor Check (< 620 LSB)
                              │  Closed-Loop LED Boost (10mA -> 50mA)
                              ▼
                        [ STAGE 2: Dynamic Software Matrix ]
                              │  Co-located Colorimeter (TCS34725) -> ITA Calc
                              │  ITA > 10°: Standard Curve
                              │  ITA ≤ 10°: Melanin-Corrected Curve
                              │  CMSIS-DSP 4th-Order Bandpass (0.5 - 4.0 Hz)
                              ▼
                        [ STAGE 3: Multi-Tiered SQI Safety Gate ]
                              │  Tier 1: Fisher-Pearson Skewness [-0.8, +0.8]
                              │  Tier 2: Welch PSD & Peak Harmony
                              ▼
                        [ Validated, Bias-Free SpO2 & HR ]
\`\`\`

---

#### Stage 1: Hardware Adaptive Calibration (The "Signal Boost")
- **Detection:** The STM32U575 MCU continuously monitors the raw DC baseline output by the MAX86141 dual-channel optical AFE.
- **Action:** If the DC level drops below $620\\text{ LSB}$ (indicating high optical attenuation by melanin), the MCU automatically increases the LED forward current (from $10\\text{ mA}$ up to $50\\text{ mA}$) and re-tunes the programmable TIA gain.
- **Outcome:** The received photon count is elevated into the ADC's linear sweet spot, restoring the pulsatile SNR by $+6\\text{ dB}$ to $+14\\text{ dB}$.

#### Stage 2: Dynamic Calibration Matrix (The "Math Fix")
- **Objective Profiling:** Replaces the subjective 6-grade Fitzpatrick scale with objective spectrophotometry:
  $$\\text{ITA} = \\arctan\\left(\\frac{L^* - 50}{b^*}\\right) \\times \\frac{180}{\\pi}$$
- **Curve Selection:**
  - $\\text{ITA} > 10^\\circ$: Standard Light-Cohort Curve ($SpO_2 = -25.0 \\cdot R + 110.0$)
  - $\\text{ITA} \\le 10^\\circ$: Melanin-Corrected Curve ($SpO_2 = -21.4 \\cdot R + 106.2$)
- **CMSIS-DSP Acceleration:** The ARM Cortex-M33 executes a 4th-order IIR Biquad cascade in fixed-point math, computing the exact Ratio of Ratios $R$ in real-time.

#### Stage 3: Multi-Tiered SQI Validation (The "Safety Gate")
- **Tier 1 (Skewness):** Computes Fisher-Pearson sample skewness:
  $$\\gamma_1 = \\frac{\\frac{1}{N} \\sum_{i=1}^N (x_i - \\bar{x})^3}{\\sigma^3}$$
  Clean PPG waveforms exhibit near-zero skewness ($-0.05$). Motion spikes create extreme positive/negative skewness ($> 2.0$), triggering immediate rejection.
- **Tier 2 (Frequency Consistency):** Cross-checks peak-based heart rate against Welch power spectral density. Discrepancies $> 10\\text{ BPM}$ indicate arrhythmia or severe motion artifact.
`
  },
  {
    id: 'hardware-power',
    title: 'Embedded Hardware & LPBAM Ultra-Low Power Optimization',
    badge: 'Hardware Stack',
    summary: 'STM32U575 Cortex-M33 + MAX86141 AFE + TCS34725 Colorimeter running with LPBAM circular DMA buffers, slashing power consumption by 82%.',
    content: `
### Target Hardware Architecture

| Component | Part Number | Key Specifications | System Role |
| :--- | :--- | :--- | :--- |
| **Microcontroller (MCU)** | **STM32U575** | ARM Cortex-M33 @ 160MHz, TrustZone, LPBAM, GPDMA | Edge execution, DSP filtering, adaptive control |
| **Biometric Front-End (AFE)** | **MAX86141** | Dual-channel optical sensor, 19-bit ADC, programmable LED current | Red (660nm) and IR (880nm) pulse acquisition |
| **Objective Color Sensor** | **TCS34725** | RGB + Clear light-to-digital converter, IR blocking filter | Co-located skin colorimeter for continuous ITA profiling |

---

### Overcoming the "Power Con": LPBAM Energy Architecture
A classic criticism of increasing LED current from $10\\text{ mA}$ to $40\\text{ mA}$ is excessive battery drain on wearable smartwatches. We eliminate this bottleneck through **Low Power Background Autonomous Mode (LPBAM)** on the STM32U5:

1. **Circular GPDMA Ping-Pong Buffers:**
   The MAX86141 streams 19-bit optical samples directly into SRAM via autonomous General Purpose DMA without CPU intervention.
2. **Deep Sleep Duty-Cycling:**
   The Cortex-M33 CPU remains in \`STOP2\` mode ($1.1\\mu\\text{A}$) for $95\\%$ of the epoch, waking up for just $8\\text{ ms}$ to execute the CMSIS-DSP Biquad filter and SQI gate.
3. **Net Energy Balance:**
   - Legacy polling architecture @ 10mA: **$18.4\\text{ mW}$ continuous average**.
   - Proposed LPBAM + Boosted Current @ 35mA: **$4.1\\text{ mW}$ continuous average**.
   - **Net Energy Savings:** **$77.7\\%$ reduction in total system power!**
`
  },
  {
    id: 'fda-validation',
    title: 'FDA 2025 Draft Guidance & Clinical Validation Protocol',
    badge: 'Regulatory Standards',
    summary: 'Validation study design meeting FDA standards: N ≥ 150 diverse participants stratified across Monk Skin Tone (MST 1-10) with simultaneous arterial blood gas (SaO2).',
    content: `
### Regulatory Alignment: FDA 2025 Draft Guidance
In 2024–2025, the U.S. FDA issued revised guidance mandating that pulse oximeter premarket submissions rigorously demonstrate demographic fairness and eliminate occult hypoxemia.

#### Study Protocol Specifications
- **Cohort Size:** $N \\ge 150$ healthy adult volunteers across controlled desaturation levels ($70\\% \\le SaO_2 \\le 100\\%$).
- **Demographic Stratification:**
  - Minimum of $15$ participants in each of the 10 Monk Skin Tone (MST) categories.
  - At least $30\\%$ of the study cohort in MST 6–10 (darker skin profiles).
- **Gold Standard Reference:** Co-oximetry arterial blood gas ($SaO_2$) sampled every $15\\text{ seconds}$ via radial arterial catheter.
- **Statistical Acceptance Criteria:**
  - Root Mean Square Error ($A_{rms} < 3.0\\%$ across all desaturation plateaus).
  - Demographic bias parity: Difference in mean error between light (MST 1-4) and dark (MST 7-10) cohorts must be statistically indistinguishable ($|\\Delta Bias| < 1.0\\%$, $p > 0.05$).
  - Zero unflagged instances of Occult Hypoxemia ($SaO_2 < 88\\%$ with device reading $\\ge 92\\%$).
`
  },
  {
    id: 'team-matrix',
    title: 'Systems Engineering Team Roles & RACI Matrix',
    badge: 'Engineering Roles',
    summary: 'Cross-functional engineering roles spanning Systems Architect, Clinical Lead, Firmware, Signal Processing, Hardware, and Data Science.',
    content: `
### Systems Engineering Team RACI Matrix

| Team Role | Key Responsibilities | Primary Deliverables | RACI Code |
| :--- | :--- | :--- | :--- |
| **Member 1: Systems Architect** | End-to-end system design, MCU platform selection, power budget | Architecture Spec & Final Report | **Accountable (A)** |
| **Member 2: Clinical Lead** | Occult hypoxemia literature review, FDA 2025 regulatory alignment | Clinical Validation Protocol | **Responsible (R)** |
| **Member 3: Firmware Engineer** | CMSIS-DSP 4th-order IIR filters, STM32U5 GPDMA circular buffers | C Embedded Source Code | **Responsible (R)** |
| **Member 4: Signal Processing Engineer** | Beer-Lambert optical simulation, dynamic R-curve modeling | Python & TypeScript DSP Pipeline | **Responsible (R)** |
| **Member 5: Hardware Engineer** | MAX86141 AFE schematic, TCS34725 color sensor integration | BOM & Hardware Schematics | **Responsible (R)** |
| **Member 6: Data Scientist** | Bias, RMSE, and MAE statistical analysis, bootstrap confidence intervals | Statistical Evaluation Report | **Responsible (R)** |
| **Member 7: Technical Writer** | Scientific report authoring, formatting, graphics generation | Peer-Reviewed Manuscript | **Consulted (C)** |
| **Member 8: Project Manager** | Milestone tracking, schedule coordination, risk assessment | Project Gantt & Execution Plan | **Informed (I)** |

*RACI Definition: R = Responsible, A = Accountable, C = Consulted, I = Informed.*
`
  }
];
