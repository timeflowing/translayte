export interface DuplicateGroup {
  originalText: string;
  keys: string[];
  count: number;
  suggestions: {
    unifiedKey: string;
    action: 'merge' | 'rename';
  };
}

export interface DuplicateAnalysis {
  hasDuplicates: boolean;
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  potentialSavings: number;
}

export function detectDuplicates(translations: Record<string, string>): DuplicateAnalysis {
  const textToKeys: Record<string, string[]> = {};
  
  // Group keys by their text content
  Object.entries(translations).forEach(([key, text]) => {
    const normalizedText = text.trim().toLowerCase();
    if (!textToKeys[normalizedText]) {
      textToKeys[normalizedText] = [];
    }
    textToKeys[normalizedText].push(key);
  });
  
  // Find duplicates (groups with more than one key)
  const duplicateGroups: DuplicateGroup[] = Object.entries(textToKeys)
    .filter(([_, keys]) => keys.length > 1)
    .map(([normalizedText, keys]) => {
      const originalText = translations[keys[0]];
      
      const commonWords = keys
        .map(key => key.split(/[._-]/).filter(word => word.length > 2))
        .reduce((common, words) => {
          return common.filter(word => 
            words.some(w => w.toLowerCase().includes(word.toLowerCase()))
          );
        });
      
      const unifiedKey = commonWords.length > 0 
        ? commonWords[0].toLowerCase() 
        : keys[0].split(/[._-]/)[0] || 'unified_text';
      
      return {
        originalText,
        keys,
        count: keys.length,
        suggestions: {
          unifiedKey,
          action: 'merge' as const
        }
      };
    });
  
  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.count - 1, 0);
  
  return {
    hasDuplicates: duplicateGroups.length > 0,
    duplicateGroups,
    totalDuplicates,
    potentialSavings: totalDuplicates
  };
}

export function applyDuplicateUnification(
  originalTranslations: Record<string, string>,
  unificationPlan: Record<string, string>
): Record<string, string> {
  const unified: Record<string, string> = {};
  const processed = new Set<string>();
  
  Object.entries(originalTranslations).forEach(([key, text]) => {
    if (processed.has(key)) return;
    
    const unifiedKey = unificationPlan[key] || key;
    unified[unifiedKey] = text;
    
    Object.entries(unificationPlan).forEach(([oldKey, newKey]) => {
      if (newKey === unifiedKey) {
        processed.add(oldKey);
      }
    });
    
    if (!unificationPlan[key]) {
      processed.add(key);
    }
  });
  
  return unified;
}