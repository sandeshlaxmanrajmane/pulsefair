// Vercel Serverless Function: /api/sample
export default function handler(req, res) {
  const skinEffect = req.query.skin_effect === '1' || req.query.skin_effect === 'true';

  const tones = ['Type I', 'Type II', 'Type III', 'Type IV', 'Type V', 'Type VI'];
  const recordings = [];

  for (let i = 1; i <= 24; i++) {
    const tone = tones[(i - 1) % tones.length];
    recordings.push({
      recording_id: `REC_${String(i).padStart(3, '0')}`,
      participant_id: `P_${String(Math.floor((i - 1) / 2) + 1).padStart(3, '0')}`,
      skin_tone: tone,
      ref_hr: 60 + ((i * 11) % 40),
      fs: 50,
    });
  }

  res.status(200).json({
    dataset_id: 'DS_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    summary: {
      n_valid: recordings.length,
      n_invalid: 0,
      n_missing_ref: 0,
      n_repaired: 0,
      has_skin_tone: true,
      can_evaluate: true,
      recordings: recordings.map((r) => r.recording_id),
      skin_effect: skinEffect,
    },
  });
}
