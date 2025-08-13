/**
 * Get the value of a specified parameter from command line arguments
 * Supports --param=value format
 * @param {string} paramName - Parameter name (without -- prefix)
 * @param {string|undefined} defaultValue - Default value, returned if parameter not found
 * @returns {string|undefined} Parameter value or default value
 */
export function getArgValue(
  paramName: string,
  defaultValue?: string
): string | undefined {
  const args = process.argv;
  const paramPrefix = `--${paramName}=`;

  for (const arg of args) {
    // Check if argument starts with specified prefix
    if (arg.startsWith(paramPrefix)) {
      return arg.substring(paramPrefix.length);
    }
  }

  // If parameter not found, return default value
  return defaultValue;
}
