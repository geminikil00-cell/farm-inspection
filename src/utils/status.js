export const STATUS_LEVELS = {
  EXCELLENT:  { value: 'ممتاز',    score: 100, color: 'bg-green-100 text-green-800' },
  VERY_GOOD:  { value: 'جيد جداً', score:  80, color: 'bg-blue-100 text-blue-800' },
  GOOD:       { value: 'جيد',      score:  60, color: 'bg-cyan-100 text-cyan-800' },
  ACCEPTABLE: { value: 'مقبول',    score:  40, color: 'bg-yellow-100 text-yellow-800' },
  POOR:       { value: 'سيء',      score:   0, color: 'bg-red-100 text-red-800' },
  N_A:        { value: 'غير منطبق', score: null, color: 'bg-gray-100 text-gray-800' },
};

export const classifyStatus = (statusVal) => {
  if (!statusVal) return null;
  for (const [level, def] of Object.entries(STATUS_LEVELS)) {
    if (def.value === statusVal) return level;
  }
  return null;
};

export const buildScoreMap = (levels) => {
  const map = {};
  levels.forEach((s) => {
    if (s.score != null) map[s.value] = s.score;
  });
  return map;
};

export const getStatusDefaults = () =>
  Object.entries(STATUS_LEVELS).map(([, def]) => ({
    value: def.value,
    label: def.value,
    color: def.color,
    score: def.score,
  }));
