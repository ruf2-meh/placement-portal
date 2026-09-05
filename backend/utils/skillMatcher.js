/**
 * Normalizes a skill input into an array of clean, trimmed lowercase strings
 * while preserving original display text.
 */
const normalizeSkillList = (rawSkills) => {
    if (!rawSkills) return [];
    
    // Handle both comma-separated strings and native arrays
    const skillArray = Array.isArray(rawSkills) 
        ? rawSkills 
        : String(rawSkills).split(',');

    const map = new Map();

    skillArray.forEach((item) => {
        if (typeof item === 'string') {
            const trimmed = item.trim();
            if (trimmed.length > 0) {
                const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
                // Store first unique casing encountered for display presentation
                if (!map.has(normalized)) {
                    map.set(normalized, trimmed);
                }
            }
        }
    });

    return map;
};

/**
 * Calculates skill compatibility between student skills and job requirements.
 */
const calculateSkillMatch = (studentRawSkills, jobRawRequirements) => {
    const studentMap = normalizeSkillList(studentRawSkills);
    const requiredMap = normalizeSkillList(jobRawRequirements);

    const requiredKeys = Array.from(requiredMap.keys());
    const requiredSkillCount = requiredKeys.length;

    // Edge Case: Job specifies no skills
    if (requiredSkillCount === 0) {
        return {
            matchPercentage: 100,
            matchedSkills: [],
            missingSkills: [],
            studentSkillCount: studentMap.size,
            requiredSkillCount: 0,
            message: "No specific skills required for this position."
        };
    }

    const matchedSkills = [];
    const missingSkills = [];

    requiredKeys.forEach((key) => {
        const originalDisplayName = requiredMap.get(key);
        if (studentMap.has(key)) {
            matchedSkills.push(originalDisplayName);
        } else {
            missingSkills.push(originalDisplayName);
        }
    });

    const matchedCount = matchedSkills.length;
    const matchPercentage = Math.round((matchedCount / requiredSkillCount) * 100);

    return {
        matchPercentage,
        matchedSkills,
        missingSkills,
        studentSkillCount: studentMap.size,
        requiredSkillCount
    };
};

/**
 * Calculates how well a student's CGPA fits a job's required CGPA range.
 *
 * A student exactly at minCgpa scores 0% ("just barely qualifies"); a
 * student at or above maxCgpa scores 100% ("as strong as the company is
 * looking for"); everything in between is linear. A student below minCgpa
 * also scores 0% — this is a *compatibility* signal, not an eligibility
 * gate (eligibility/:jobId/:studentId already handles hard pass/fail).
 *
 * If the job has no CGPA range configured (older jobs posted before this
 * was required), GPA is treated as neutral and doesn't penalize the score.
 */
const calculateGpaFit = (studentCgpa, minCgpa, maxCgpa) => {
    const hasRange = minCgpa !== null && minCgpa !== undefined &&
                      maxCgpa !== null && maxCgpa !== undefined &&
                      maxCgpa > minCgpa;

    if (!hasRange) {
        return { gpaFitPercentage: 100, message: 'This job does not specify a CGPA range.' };
    }

    const cgpa = parseFloat(studentCgpa);
    if (Number.isNaN(cgpa)) {
        return { gpaFitPercentage: 0, message: 'Add your CGPA to your profile to see GPA fit.' };
    }

    if (cgpa >= maxCgpa) return { gpaFitPercentage: 100 };
    if (cgpa <= minCgpa) return { gpaFitPercentage: 0 };

    const gpaFitPercentage = Math.round(((cgpa - minCgpa) / (maxCgpa - minCgpa)) * 100);
    return { gpaFitPercentage };
};

module.exports = { calculateSkillMatch, normalizeSkillList, calculateGpaFit };