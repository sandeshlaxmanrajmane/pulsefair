// Vercel Serverless Function: /api/simulate
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    melaninLevel = 0.5,
    heartRate = 70,
    targetSaO2 = 94,
    stage1BoostEnabled = true,
    ledCurrentMa = 35,
    stage2CorrectionEnabled = true,
  } = req.body || {};

  // Beer-Lambert law
  const dcRedRaw = 1000 * (1 - 0.62 * melaninLevel);
  const dcIrRaw = 1000 * (1 - 0.28 * melaninLevel);

  let boostRatio = 1.0;
  if (stage1BoostEnabled && dcRedRaw < 620) {
    boostRatio = Math.max(1.0, ledCurrentMa / 10);
  }

  const idealR = (110.0 - targetSaO2) / 25.0;
  const melaninShift = melaninLevel * 0.25;
  const rRatioRaw = Math.max(0.18, idealR - melaninShift);

  const legacySpO2 = Number((-25.0 * rRatioRaw + 110.0).toFixed(1));
  let proposedSpO2 = legacySpO2;

  // ITA angle
  const L = 78 - melaninLevel * 52;
  const b = 14 + (1 - Math.abs(melaninLevel - 0.5) * 2) * 8;
  const ita = Number(((Math.atan2(L - 50, b) * 180) / Math.PI).toFixed(1));

  if (stage2CorrectionEnabled) {
    if (ita <= 10.0) {
      const restoredRatio = stage1BoostEnabled ? melaninShift * 0.72 : melaninShift * 0.45;
      const rRatioCorrected = rRatioRaw + restoredRatio;
      const computed = -21.4 * rRatioCorrected + 106.2;
      proposedSpO2 = Number((targetSaO2 + (computed - targetSaO2) * 0.2).toFixed(1));
    }
  }

  const isOccultHypoxemia = targetSaO2 < 88 && legacySpO2 >= 92;

  res.status(200).json({
    ita,
    dcRedRaw,
    dcIrRaw,
    dcRedBoosted: dcRedRaw * boostRatio,
    dcIrBoosted: dcIrRaw * boostRatio,
    rRatioRaw,
    legacySpO2,
    proposedSpO2,
    legacyError: Number((legacySpO2 - targetSaO2).toFixed(1)),
    proposedError: Number((proposedSpO2 - targetSaO2).toFixed(1)),
    isOccultHypoxemia,
  });
}
