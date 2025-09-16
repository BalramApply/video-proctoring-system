function generateRecommendations(interview, detections) {
  const recs = [];

  if (interview.integrityScore < 70) recs.push('High risk candidate - Multiple violations detected');
  else if (interview.integrityScore < 85) recs.push('Medium risk candidate - Some concerns observed');
  else recs.push('Low risk candidate - Good behavior');

  if (interview.focusLostCount > 10) recs.push('Candidate frequently lost focus');
  if (interview.suspiciousEvents > 5) recs.push('Multiple suspicious activities detected - needs review');

  const phoneDetections = detections.filter(d => d.type === 'phone').length;
  if (phoneDetections > 0) recs.push(`Phone detected ${phoneDetections} times - potential cheating attempt`);

  return recs;
}

module.exports = generateRecommendations;
