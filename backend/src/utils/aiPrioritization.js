function calculatePriority({ title, description, status }) {
  let score = 1;
  const content = `${title} ${description}`.toLowerCase();

  const criticalKeywords = ["critical", "data loss", "security", "breach", "crash"];
  const mediumKeywords = ["slow", "performance", "incorrect", "fail"];

  if (criticalKeywords.some((k) => content.includes(k))) score += 3;
  if (mediumKeywords.some((k) => content.includes(k))) score += 1;
  if (status === "OPEN") score += 1;

  return Math.min(score, 5);
}

module.exports = { calculatePriority };
