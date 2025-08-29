/**
 * FileUpload Component
 * Handles PDF file upload and OCR processing
 */

function FileUpload({ onProcess, isLoading, progressMessage, rawText, ocrStatus }) {
  const e = window.React.createElement;
  const { useState } = window.React;
  
  const [copyButtonText, setCopyButtonText] = useState('Copy Raw Text');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onProcess(file);
    }
    event.target.value = null;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy Raw Text'), 2000);
    });
  };

  return e(
    'div',
    { className: 'file-upload-container' },
    [
      e('h3', { className: 'file-upload-header', key: 'header' }, [
        '📁 Upload Statement',
        e('span', { key: 'subtitle', style: { fontSize: '0.9em', fontWeight: 'normal', marginLeft: '0.5em' } }, 
          '(PDF files only)')
      ]),
      
      e('div', { className: 'file-input-wrapper', key: 'input-wrapper' }, [
        e('input', {
          key: 'file-input',
          id: 'file-input',
          type: 'file',
          accept: '.pdf',
          onChange: handleFileChange,
          disabled: isLoading,
          className: 'file-input'
        }),
        e('label', {
          key: 'file-label',
          htmlFor: 'file-input',
          className: `file-input-label ${isLoading ? 'disabled' : ''}`,
          style: isLoading ? { pointerEvents: 'none', opacity: 0.6 } : {}
        }, isLoading ? '⏳ Processing...' : '📤 Choose PDF File')
      ]),

      progressMessage && e('div', {
        key: 'progress',
        className: 'progress-message'
      }, progressMessage),

      ocrStatus && e('div', {
        key: 'ocr-status',
        className: `ocr-status ${ocrStatus.includes('✅') ? 'success' : 'error'}`
      }, ocrStatus),

      rawText && e('div', { className: 'raw-text-section', key: 'raw-text' }, [
        e('div', { className: 'raw-text-header', key: 'raw-header' }, [
          e('h4', { key: 'title', style: { margin: 0 } }, '📄 Extracted Text'),
          e('button', {
            key: 'copy-btn',
            onClick: handleCopy,
            className: 'copy-button',
            disabled: !rawText
          }, copyButtonText)
        ]),
        e('div', {
          key: 'raw-content',
          className: 'raw-text-content'
        }, rawText || 'No text extracted yet...')
      ])
    ]
  );
}

// Register component globally
if (typeof window !== 'undefined') {
  window.FileUpload = FileUpload;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FileUpload };
}
