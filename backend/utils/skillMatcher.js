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

module.exports = { calculateSkillMatch, normalizeSkillList };