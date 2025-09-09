/**
 * Fuse.js ES6 Module Wrapper
 *
 * This module provides ES6 import/export compatibility for Fuse.js
 * by dynamically loading the UMD build and exposing it as an ES6 module.
 */

let Fuse = null;

// Load Fuse.js dynamically if not already loaded
async function loadFuse() {
  if (Fuse) {
    return Fuse;
  }

  // Check if Fuse is already available globally
  if (window.Fuse) {
    Fuse = window.Fuse;
    return Fuse;
  }

  // Dynamically load the Fuse.js script
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './src/assets/fuse.min.js';
    script.type = 'text/javascript';

    script.onload = () => {
      if (window.Fuse) {
        Fuse = window.Fuse;
        resolve(Fuse);
      } else {
        reject(new Error('Fuse.js loaded but not available on window object'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Fuse.js script'));
    };

    document.head.appendChild(script);
  });
}

// Initialize Fuse loading
const fusePromise = loadFuse();

// Export the Fuse constructor - this will be available after the promise resolves
export default fusePromise;

// Also provide a synchronous getter for when Fuse is already loaded
export function getFuse() {
  return Fuse || window.Fuse;
}
