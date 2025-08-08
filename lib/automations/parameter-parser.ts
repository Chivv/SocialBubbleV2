/**
 * Replaces parameter placeholders in a template string with actual values
 * Supports {{parameterName}} syntax
 */
export function substituteParameters(
  template: string,
  parameters: Record<string, any>,
  isTest: boolean = false
): string {
  let result = template;
  
  // Add test prefix if in test mode
  if (isTest) {
    result = `[TEST] ${result}`;
  }
  
  // Replace all parameter placeholders
  Object.entries(parameters).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const replacementValue = value !== null && value !== undefined ? String(value) : '';
    result = result.replace(placeholder, replacementValue);
  });
  
  return result;
}

/**
 * Substitutes parameters in a JSON object (for Slack blocks)
 * Recursively processes nested objects and arrays
 */
export function substituteParametersInJson(
  template: any,
  parameters: Record<string, any>,
  isTest: boolean = false
): any {
  if (typeof template === 'string') {
    return substituteParameters(template, parameters, isTest);
  }
  
  if (Array.isArray(template)) {
    return template.map(item => substituteParametersInJson(item, parameters, false)); // Don't add test prefix to nested items
  }
  
  if (typeof template === 'object' && template !== null) {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(template)) {
      // Special handling for the main text field in Slack blocks
      if (isTest && key === 'text' && typeof value === 'object' && value !== null && (value as any).text && !template.type) {
        result[key] = {
          ...value,
          text: `[TEST] ${substituteParametersInJson((value as any).text, parameters, false)}`
        };
      } else {
        result[key] = substituteParametersInJson(value, parameters, false);
      }
    }
    
    return result;
  }
  
  return template;
}

/**
 * Validates that all required parameters are present in the template
 */
export function validateTemplateParameters(
  template: string,
  availableParameters: string[]
): { valid: boolean; missingParameters: string[]; unknownParameters: string[] } {
  const placeholderRegex = /{{\\s*(\\w+)\\s*}}/g;
  const usedParameters = new Set<string>();
  
  let match;
  while ((match = placeholderRegex.exec(template)) !== null) {
    usedParameters.add(match[1]);
  }
  
  const unknownParameters = Array.from(usedParameters).filter(
    param => !availableParameters.includes(param)
  );
  
  return {
    valid: unknownParameters.length === 0,
    missingParameters: [], // We don't require all parameters to be used
    unknownParameters
  };
}