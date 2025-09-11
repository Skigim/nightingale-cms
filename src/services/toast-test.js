/**
 * Toast System Test (manual)
 */
import Toast from './nightingale.toast.js';

function testToastSystem() {
  console.group('🍞 Toast System Test');

  // Ensure initialized
  Toast.initializeToastSystem?.();
  const containerExists = !!document.getElementById('toast-container');
  console.log('Toast container exists:', containerExists);

  // Basic toast
  try {
    const result = Toast.show('Toast system test successful!', 'success');
    console.log('Toast result:', !!result);
  } catch (error) {
    console.error('Toast error:', error.message);
  }

  // All types
  setTimeout(() => {
    try {
      Toast.show('Info toast test', 'info');
      Toast.show('Warning toast test', 'warning');
      Toast.show('Error toast test', 'error');
      console.log('All toast types tested');
    } catch (error) {
      console.error('Multi-toast error:', error.message);
    }
  }, 500);

  console.log('Active toast count:', Toast.getActiveToastCount?.() || 0);
  console.groupEnd();
}

export default testToastSystem;
