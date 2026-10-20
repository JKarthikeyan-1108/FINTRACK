// backend/tests/investmentPlanEngine.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  generateBeginnerRoadmap,
  generateSmartSuggestions
} = require('../utils/investmentPlanEngine');

test('generateBeginnerRoadmap: generates all 8 structured educational steps', () => {
  const profile = {
    hasRegularIncome: true,
    monthlyIncome: 60000,
    monthlyExpenses: 35000,
    hasHighInterestDebt: false,
    emergencyMonths: 4,
    hasHealthInsurance: true,
    hasTermInsurance: true,
    hasDependents: true,
    timeHorizon: 'long',
    riskTolerance: 'moderate',
    monthlyInvestableAmount: 15000,
    primaryGoal: 'wealth_growth'
  };

  const roadmap = generateBeginnerRoadmap(profile);
  assert.equal(roadmap.length, 8);
  assert.equal(roadmap[0].stepNumber, 1);
  assert.equal(roadmap[7].stepNumber, 8);
  assert.equal(roadmap[0].status, 'completed'); // No high interest debt
  assert.equal(roadmap[1].status, 'in_progress'); // 4 months emergency saved
});

test('generateBeginnerRoadmap: flags high interest debt as critical action in Step 1', () => {
  const profile = {
    hasHighInterestDebt: true,
    emergencyMonths: 0,
    hasHealthInsurance: false
  };

  const roadmap = generateBeginnerRoadmap(profile);
  assert.equal(roadmap[0].status, 'critical_action');
  assert.match(roadmap[0].rationale, /High-interest debt/);
  assert.equal(roadmap[1].status, 'critical_action'); // 0 months emergency
  assert.equal(roadmap[2].status, 'critical_action'); // Missing health insurance
});

test('generateBeginnerRoadmap: adapts asset allocation based on conservative vs aggressive profile', () => {
  const conservativeRoadmap = generateBeginnerRoadmap({ riskTolerance: 'conservative' });
  assert.match(conservativeRoadmap[4].estimatedTarget, /25\/65\/10/);

  const aggressiveRoadmap = generateBeginnerRoadmap({ riskTolerance: 'aggressive' });
  assert.match(aggressiveRoadmap[4].estimatedTarget, /75\/15\/10/);

  const moderateRoadmap = generateBeginnerRoadmap({ riskTolerance: 'moderate' });
  assert.match(moderateRoadmap[4].estimatedTarget, /55\/35\/10/);
});

test('generateSmartSuggestions: prioritizes emergency and health protection when missing', () => {
  const vulnerableProfile = {
    hasHighInterestDebt: false,
    emergencyMonths: 1,
    hasHealthInsurance: false,
    hasTermInsurance: false,
    hasDependents: true,
    timeHorizon: 'long',
    riskTolerance: 'aggressive',
    primaryGoal: 'wealth_growth'
  };

  const suggestions = generateSmartSuggestions(vulnerableProfile);
  assert.ok(suggestions.length >= 3);
  // Emergency fund should be top match
  assert.equal(suggestions[0].categoryId, 'emergency-savings');
  assert.equal(suggestions[0].matchScore, 98);
  // Health insurance should be second top match
  assert.equal(suggestions[1].categoryId, 'health-insurance');
  assert.equal(suggestions[1].matchScore, 96);
  // Life insurance for dependents
  const lifeSuggestion = suggestions.find(s => s.categoryId === 'lic-life-insurance');
  assert.ok(lifeSuggestion);
  assert.equal(lifeSuggestion.matchScore, 94);
});

test('generateSmartSuggestions: ranks equity index and NPS for debt-free long-term profiles', () => {
  const solidProfile = {
    hasHighInterestDebt: false,
    emergencyMonths: 6,
    hasHealthInsurance: true,
    hasTermInsurance: true,
    hasDependents: false,
    timeHorizon: 'long',
    riskTolerance: 'aggressive',
    primaryGoal: 'wealth_growth'
  };

  const suggestions = generateSmartSuggestions(solidProfile);
  // Emergency savings should NOT appear because emergencyMonths >= 6
  assert.equal(suggestions.some(s => s.categoryId === 'emergency-savings'), false);
  // Equity index fund should be top recommended
  assert.equal(suggestions[0].categoryId, 'mutual-funds');
  assert.equal(suggestions[0].matchScore, 95);
  // SGB / Gold and NPS should also appear
  assert.ok(suggestions.some(s => s.categoryId === 'gold-silver'));
  assert.ok(suggestions.some(s => s.categoryId === 'retirement-pension'));
});
