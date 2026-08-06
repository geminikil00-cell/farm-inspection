import { buildScoreMap, STATUS_LEVELS } from './status';

export const getQuarterAndYear = (dateStr) => {
  if (!dateStr) {
    const d = new Date();
    const month = d.getMonth();
    const year = d.getFullYear();
    const q = month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4';
    return { year, quarter: q };
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let quarter = 'Q1';
  if (month >= 4 && month <= 6) quarter = 'Q2';
  else if (month >= 7 && month <= 9) quarter = 'Q3';
  else if (month >= 10 && month <= 12) quarter = 'Q4';
  return { year, quarter };
};

export const calculateScore = (rows, columns) => {
  if (!Array.isArray(rows)) return 0;
  let totalScore = 0;
  let count = 0;

  if (columns && columns.length > 0) {
    columns.forEach((col) => {
      if (col.type === 'select' && col.options) {
        const scoreMap = {};
        col.options.forEach((opt) => {
          if (opt.score != null) scoreMap[opt.value] = opt.score;
        });
        rows.forEach((row) => {
          const val = row[col.id];
          if (val && scoreMap[val] !== undefined) {
            totalScore += scoreMap[val];
            count++;
          }
        });
      }
    });
  } else {
    const scoreMapping = buildScoreMap(Object.values(STATUS_LEVELS).filter((s) => s.score != null));
    rows.forEach((row) => {
      if (row.status && scoreMapping[row.status] !== undefined) {
        totalScore += scoreMapping[row.status];
        count++;
      }
      for (let i = 1; i <= 6; i++) {
        const key = `status_${i}`;
        if (row[key] && scoreMapping[row[key]] !== undefined) {
          totalScore += scoreMapping[row[key]];
          count++;
        }
      }
    });
  }
  if (count === 0) return 0;
  return Math.round(totalScore / count);
};

export const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 60) return 'text-cyan-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};
