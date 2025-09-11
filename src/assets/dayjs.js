// Modern ESM wrapper around dayjs using npm package and plugins.
import dayjsLib from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

// Configure once
dayjsLib.extend(customParseFormat);
dayjsLib.extend(relativeTime);

// Maintain previous Promise-based default export API
const dayjsPromise = Promise.resolve(dayjsLib);

export default dayjsPromise;

// Backward-compatible getter
export function getDayjs() {
  return dayjsLib;
}
