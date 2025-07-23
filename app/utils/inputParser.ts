

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

// Helper for flattening JSON objects
export function flattenJson(
    obj: JsonValue,
    prefix = '',
    res: Record<string, string> = {},
): Record<string, string> {
    if (typeof obj !== 'object' || obj === null) {
        if (prefix) {
            res[prefix.slice(0, -1)] = String(obj);
        }
        return res;
    }

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const propName = prefix ? `${prefix}${key}.` : `${key}.`;
            const value = (obj as Record<string, JsonValue>)[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                flattenJson(value as JsonValue, propName, res);
            } else if (typeof value !== 'function') {
                res[propName.slice(0, -1)] = String(value);
            }
        }
    }

    return res;
}

// Main function to parse various input formats into a flat key-value object
export const parseInput = (input: string): Record<string, string> => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
        return {};
    }

    // 1. Try parsing as JSON
    try {
        const parsed = JSON.parse(trimmedInput);
        if (typeof parsed === 'object' && parsed !== null) {
            return flattenJson(parsed);
        }
    } catch {
        // Not valid JSON, proceed to other formats
    }

    // 2. Handle line-by-line formats (key: value, key=value, or plain text)
    const lines = trimmedInput.split('\n').filter(line => line.trim());
    const result: Record<string, string> = {};

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const colonIndex = trimmedLine.indexOf(':');
        const equalIndex = trimmedLine.indexOf('=');
        let key: string;
        let value: string;

        if (colonIndex > 0 && (equalIndex === -1 || colonIndex < equalIndex)) {
            key = trimmedLine.substring(0, colonIndex).trim().replace(/['"]/g, '');
            value = trimmedLine.substring(colonIndex + 1).trim().replace(/['"]/g, '');
        } else if (equalIndex > 0) {
            key = trimmedLine.substring(0, equalIndex).trim().replace(/['"]/g, '');
            value = trimmedLine.substring(equalIndex + 1).trim().replace(/['"]/g, '');
        } else {
            // Treat as plain text line
            key = `text_${index + 1}`;
            value = trimmedLine;
        }
        result[key] = value;
    });

    return result;
};