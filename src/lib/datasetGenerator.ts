import { RecordingSample } from '../types';

/**
 * Generates synthetic benchmark recordings across Fitzpatrick I through VI
 */
export function generateSyntheticDataset(options: {
  count?: number;
  skinEffect?: boolean;
}): RecordingSample[] {
  const { count = 30, skinEffect = false } = options;
  const groups = [
    { tone: 'Type I', monk: 1, ita: 58, melanin: 0.05 },
    { tone: 'Type II', monk: 2, ita: 47, melanin: 0.20 },
    { tone: 'Type III', monk: 4, ita: 34, melanin: 0.38 },
    { tone: 'Type IV', monk: 6, ita: 20, melanin: 0.55 },
    { tone: 'Type V', monk: 8, ita: -8, melanin: 0.75 },
    { tone: 'Type VI', monk: 10, ita: -42, melanin: 0.95 },
  ];

  const samples: RecordingSample[] = [];
  const fs = 50; // 50 Hz standard clinical wearable rate
  const duration = 12; // 12 seconds per recording
  const nPoints = fs * duration;

  for (let i = 0; i < count; i++) {
    const group = groups[i % groups.length];
    const recId = `REC_${String(i + 1).padStart(3, '0')}`;
    const partId = `P_${String(Math.floor(i / 2) + 1).padStart(3, '0')}`;

    // Target reference heart rate between 55 and 100 BPM
    const refHr = 60 + ((i * 13) % 38);
    const trueSaO2 = 92 + ((i * 7) % 7); // 92 to 98%
    const freq = refHr / 60.0;

    // Optical skin attenuation factor
    const melanin = group.melanin;
    const baseDc = 1000 * (1 - 0.55 * melanin);
    const acAmp = 25 * (1 - 0.4 * melanin);

    // If skinEffect is active, darker skin tones experience elevated relative noise
    const noiseMultiplier = skinEffect ? 0.04 + melanin * 0.16 : 0.05;

    // Occasional motion artifact in 15% of recordings
    const hasArtifact = (i % 7 === 0);

    const ppg: number[] = new Array(nPoints);
    const time: number[] = new Array(nPoints);

    for (let tIdx = 0; tIdx < nPoints; tIdx++) {
      const t = tIdx / fs;
      time[tIdx] = Number(t.toFixed(3));

      // Realistic cardiac pulsatile contour
      const phase = 2 * Math.PI * freq * t;
      const wave =
        Math.sin(phase) +
        0.35 * Math.sin(2 * phase - 0.8) +
        0.18 * Math.sin(3 * phase - 1.25);

      // Noise
      const u1 = Math.random() || 0.001;
      const u2 = Math.random() || 0.001;
      const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * noiseMultiplier * acAmp;

      let artifact = 0;
      if (hasArtifact && tIdx >= 140 && tIdx <= 180) {
        artifact = Math.sin((tIdx - 140) * 0.2) * 90;
      }

      ppg[tIdx] = Number((baseDc + acAmp * wave + noise + artifact).toFixed(1));
    }

    samples.push({
      recording_id: recId,
      participant_id: partId,
      skin_tone: group.tone,
      monk_scale: group.monk,
      ita: group.ita,
      fs,
      ref_hr: refHr,
      true_sao2: trueSaO2,
      ppg,
      time,
    });
  }

  return samples;
}

/**
 * Parses user-uploaded CSV text into validated recording samples
 */
export function parseCSVDataset(csvText: string): {
  recordings: RecordingSample[];
  errors: string[];
} {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { recordings: [], errors: ['CSV file is empty or missing headers.'] };
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const reqCols = ['recording_id', 'ppg', 'fs'];
  for (const c of reqCols) {
    if (!headers.includes(c)) {
      return { recordings: [], errors: [`Missing required column: "${c}"`] };
    }
  }

  const recIdx = headers.indexOf('recording_id');
  const ppgIdx = headers.indexOf('ppg');
  const fsIdx = headers.indexOf('fs');
  const refIdx = headers.indexOf('ref_hr');
  const toneIdx = headers.indexOf('skin_tone');
  const partIdx = headers.indexOf('participant_id');

  const groupsMap = new Map<string, {
    fs: number;
    ref_hr?: number;
    skin_tone?: string;
    participant_id?: string;
    ppgValues: number[];
  }>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length <= Math.max(recIdx, ppgIdx, fsIdx)) continue;

    const rId = parts[recIdx].trim();
    const pVal = parseFloat(parts[ppgIdx]);
    const fsVal = parseFloat(parts[fsIdx]);
    if (isNaN(pVal) || isNaN(fsVal)) continue;

    if (!groupsMap.has(rId)) {
      groupsMap.set(rId, {
        fs: fsVal,
        ref_hr: refIdx !== -1 && parts[refIdx] ? parseFloat(parts[refIdx]) : undefined,
        skin_tone: toneIdx !== -1 && parts[toneIdx] ? parts[toneIdx].trim() : undefined,
        participant_id: partIdx !== -1 && parts[partIdx] ? parts[partIdx].trim() : undefined,
        ppgValues: [],
      });
    }

    groupsMap.get(rId)!.ppgValues.push(pVal);
  }

  const recordings: RecordingSample[] = [];
  const errors: string[] = [];

  groupsMap.forEach((data, rId) => {
    if (data.ppgValues.length < data.fs * 5) {
      errors.push(`Recording ${rId}: shorter than minimum 5 seconds.`);
      return;
    }

    const time = data.ppgValues.map((_, idx) => Number((idx / data.fs).toFixed(3)));

    recordings.push({
      recording_id: rId,
      participant_id: data.participant_id || `P_${rId}`,
      skin_tone: data.skin_tone || 'Type III',
      monk_scale: 4,
      ita: 30,
      fs: data.fs,
      ref_hr: data.ref_hr || 72,
      true_sao2: 96,
      ppg: data.ppgValues,
      time,
    });
  });

  return { recordings, errors };
}
