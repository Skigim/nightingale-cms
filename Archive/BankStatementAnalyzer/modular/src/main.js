/**
 * Main Entry Point
 * Initializes the Bank Statement Analyzer Application
 */

// Initialize PDF.js worker
if (typeof window !== 'undefined' && window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

// Application initialization
function initializeApp() {
  console.log('🚀 Initializing Bank Statement Analyzer...');

  // Check for required dependencies
  const requiredDependencies = [
    { name: 'React', check: () => typeof window.React !== 'undefined' },
    { name: 'ReactDOM', check: () => typeof window.ReactDOM !== 'undefined' },
    { name: 'PDF.js', check: () => typeof window.pdfjsLib !== 'undefined' },
    { name: 'Tesseract', check: () => typeof window.Tesseract !== 'undefined' },
    { name: 'Fuse.js', check: () => typeof window.Fuse !== 'undefined' },
  ];

  const missingDependencies = requiredDependencies.filter(
    (dep) => !dep.check()
  );

  if (missingDependencies.length > 0) {
    console.error(
      '❌ Missing dependencies:',
      missingDependencies.map((d) => d.name)
    );

    // Show error in UI
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="padding: 2rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
          <h3>🚫 Application Error</h3>
          <p>The following required libraries failed to load:</p>
          <ul>
            ${missingDependencies.map((d) => `<li>${d.name}</li>`).join('')}
          </ul>
          <p>Please check your internet connection and refresh the page.</p>
        </div>
      `;
    }
    return;
  }

  console.log('✅ All dependencies loaded successfully');

  // Wait for Jimp to load (it's loaded asynchronously)
  const checkJimp = () => {
    if (typeof window.Jimp !== 'undefined') {
      console.log('✅ Jimp loaded successfully');
      startApp();
    } else {
      console.log('⏳ Waiting for Jimp to load...');
      setTimeout(checkJimp, 100);
    }
  };

  checkJimp();
}

function startApp() {
  console.log('🎯 Starting Bank Statement Analyzer application...');

  try {
    const container = document.getElementById('root');
    if (!container) {
      throw new Error('Root container not found');
    }

    // Clear loading spinner
    container.innerHTML = '';

    // Create React root and render app
    const root = window.ReactDOM.createRoot(container);
    root.render(window.React.createElement(window.App));

    console.log('🎉 Bank Statement Analyzer initialized successfully!');

    // Log feature summary
    console.log('🔧 Available Features:');
    console.log('  📄 PDF Processing with PDF.js');
    console.log('  🎯 3-Stage Enhanced OCR Pipeline:');
    console.log('    • Stage 1: Image Preprocessing (Jimp)');
    console.log('    • Stage 2: Text Recognition (Tesseract.js)');
    console.log('    • Stage 3: Data Refinement (Fuse.js)');
    console.log('  ❌ Parsing Error Detection (Data Validation)');
    console.log('  🔍 OCR Uncertainty Detection (Recognition Confidence)');
    console.log('  📊 Smart Transaction Parsing');
    console.log('  🎨 Enhanced Warning Categorization');
  } catch (error) {
    console.error('💥 Application startup failed:', error);

    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="padding: 2rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; color: #721c24;">
          <h3>🚫 Startup Error</h3>
          <p>Failed to initialize the application: ${error.message}</p>
          <p>Please refresh the page and try again.</p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeApp, startApp };
}
