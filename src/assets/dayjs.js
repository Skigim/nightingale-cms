/**
 * Day.js ES6 Module Wrapper
 *
 * This module provides ES6 import/export compatibility for Day.js
 * and its plugins while maintaining backward compatibility.
 */

let dayjs = null;

// Load Day.js and its plugins dynamically
async function loadDayJS() {
  if (dayjs) {
    return dayjs;
  }

  // Check if dayjs is already available globally
  if (window.dayjs) {
    dayjs = window.dayjs;
    return dayjs;
  }

  // Dynamically load Day.js and its plugins
  return new Promise((resolve, reject) => {
    const loadScript = (src) => {
      return new Promise((resolveScript, rejectScript) => {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.onload = resolveScript;
        script.onerror = () => rejectScript(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    // Load Day.js core first
    loadScript('./src/assets/dayjs.min.js')
      .then(() => {
        if (!window.dayjs) {
          throw new Error('Day.js loaded but not available on window object');
        }
        dayjs = window.dayjs;

        // Load plugins sequentially
        return loadScript('./src/assets/dayjs-customParseFormat.min.js');
      })
      .then(() => {
        return loadScript('./src/assets/dayjs-relativeTime.min.js');
      })
      .then(() => {
        // (debug removed) plugin availability can be inspected via getDayjs() if needed

        // Explicitly extend Day.js with the loaded plugins
        // The plugins are available as global variables after loading
        if (window.dayjs_plugin_customParseFormat) {
          dayjs.extend(window.dayjs_plugin_customParseFormat);
        }

        if (window.dayjs_plugin_relativeTime) {
          dayjs.extend(window.dayjs_plugin_relativeTime);
        }

        // Verify the plugins are working by testing them
        // Removed runtime console verification; consumers may perform their own checks.

        resolve(dayjs);
      })
      .catch(reject);
  });
}

// Initialize Day.js loading
const dayjsPromise = loadDayJS();

// Export the Day.js constructor - this will be available after the promise resolves
export default dayjsPromise;

// Also provide a synchronous getter for when Day.js is already loaded
export function getDayjs() {
  return dayjs || window.dayjs;
}
