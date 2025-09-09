/**
 * Toast System Test
 * Simple test to verify toast functionality
 */

function testToastSystem() {
  console.group('🍞 Toast System Test');

  // Test 1: Check if toast functions are available
  console.log('1. Function availability:');
  console.log('   window.showToast:', typeof window.showToast);
  console.log('   window.NightingaleToast:', typeof window.NightingaleToast);
  console.log(
    '   window.NightingaleToast.showToast:',
    typeof window.NightingaleToast?.showToast,
  );

  // Test 2: Check initialization
  console.log('2. Initialization:');
  const toastQueue = window.NightingaleToast?.initializeToastSystem?.();
  console.log('   Toast queue created:', !!toastQueue);
  console.log(
    '   Container exists:',
    !!document.getElementById('toast-container'),
  );

  // Test 3: Test basic functionality
  console.log('3. Testing basic toast:');
  try {
    const result = window.showToast?.(
      'Toast system test successful!',
      'success',
    );
    console.log('   Toast result:', !!result);
  } catch (error) {
    console.error('   Toast error:', error.message);
  }

  // Test 4: Test all toast types
  console.log('4. Testing all toast types:');
  setTimeout(() => {
    try {
      window.showToast?.('Info toast test', 'info');
      window.showToast?.('Warning toast test', 'warning');
      window.showToast?.('Error toast test', 'error');
      console.log('   All toast types tested');
    } catch (error) {
      console.error('   Multi-toast error:', error.message);
    }
  }, 1000);

  console.log('5. Active toast count:', window.getActiveToastCount?.() || 0);
  console.groupEnd();
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testToastSystem = testToastSystem;

  // Auto-run test after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testToastSystem, 2000); // Wait for other systems to load
    });
  } else {
    setTimeout(testToastSystem, 2000);
  }
}

export default testToastSystem;
