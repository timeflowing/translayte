import { useState, useEffect, useCallback } from 'react';
import { detectDuplicates, DuplicateAnalysis } from '../utils/duplicateDetection';

interface UseRealtimeDuplicateDetectionProps {
  inputText: string;
  debounceMs?: number;
}

export function useRealtimeDuplicateDetection({ 
  inputText, 
  debounceMs = 300 
}: UseRealtimeDuplicateDetectionProps) {
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<DuplicateAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const parseInput = useCallback((input: string): Record<string, string> => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      return {};
    }

    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(trimmedInput);
      
      if (typeof parsed === 'object' && parsed !== null) {
        // Flatten nested objects
        const flattened: Record<string, string> = {};
        const flatten = (obj: any, prefix = '') => {
          Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              flatten(obj[key], fullKey);
            } else {
              flattened[fullKey] = String(obj[key]);
            }
          });
        };
        flatten(parsed);
        return flattened;
      }
    } catch (e) {
      // Not valid JSON, try other formats
    }

    // Handle line-by-line format
    const lines = trimmedInput.split('\n').filter(line => line.trim());
    const result: Record<string, string> = {};
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      const colonIndex = trimmedLine.indexOf(':');
      const equalIndex = trimmedLine.indexOf('=');
      
      if (colonIndex > 0 && (equalIndex === -1 || colonIndex < equalIndex)) {
        const key = trimmedLine.substring(0, colonIndex).trim().replace(/['"]/g, '');
        const value = trimmedLine.substring(colonIndex + 1).trim().replace(/['"]/g, '');
        if (key && value) {
          result[key] = value;
        }
      } else if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim().replace(/['"]/g, '');
        const value = trimmedLine.substring(equalIndex + 1).trim().replace(/['"]/g, '');
        if (key && value) {
          result[key] = value;
        }
      } else {
        result[`text_${index + 1}`] = trimmedLine;
      }
    });
    
    return result;
  }, []);

  useEffect(() => {
    if (!inputText.trim()) {
      setDuplicateAnalysis(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    
    const timeoutId = setTimeout(() => {
      try {
        const parsedTranslations = parseInput(inputText);
        const keyCount = Object.keys(parsedTranslations).length;
        
        if (keyCount >= 2) { // Only analyze if we have at least 2 items
          const analysis = detectDuplicates(parsedTranslations);
          setDuplicateAnalysis(analysis);
        } else {
          setDuplicateAnalysis(null);
        }
      } catch (error) {
        console.error('Error analyzing duplicates:', error);
        setDuplicateAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [inputText, debounceMs, parseInput]);

  return {
    duplicateAnalysis,
    isAnalyzing,
    hasDuplicates: duplicateAnalysis?.hasDuplicates || false,
    duplicateCount: duplicateAnalysis?.totalDuplicates || 0,
    potentialSavings: duplicateAnalysis?.potentialSavings || 0
  };
}