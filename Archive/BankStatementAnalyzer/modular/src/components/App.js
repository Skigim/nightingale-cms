/**
 * Main App Component
 * Bank Statement Analyzer with Enhanced OCR Processing
 */

function App() {
  const e = window.React.createElement;
  const { useState } = window.React;

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [rawText, setRawText] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const processFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setIsLoading(true);
    setProgressMessage('📄 Reading PDF file...');
    setOcrStatus('');
    setData([]);
    setRawText('');

    try {
      // Load PDF with PDF.js
      const fileReader = new FileReader();
      fileReader.onload = async (event) => {
        try {
          const typedArray = new Uint8Array(event.target.result);
          const pdf = await window.pdfjsLib.getDocument(typedArray).promise;

          setProgressMessage(`📊 Processing ${pdf.numPages} pages...`);

          // Process all pages
          let allText = '';
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            setProgressMessage(
              `🔍 Processing page ${pageNum} of ${pdf.numPages}...`
            );

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });

            // Create canvas for page rendering
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render page to canvas
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            setProgressMessage(`🎯 Running Enhanced OCR on page ${pageNum}...`);

            // Run enhanced 3-stage OCR processing
            const ocrResult = await window.enhancedOCRProcessing(canvas);

            if (ocrResult.text) {
              allText += `\n--- Page ${pageNum} ---\n${ocrResult.text}\n`;

              setOcrStatus(
                `✅ Page ${pageNum}: ${ocrResult.text.length} chars, ${ocrResult.confidence.toFixed(1)}% confidence`
              );
            } else {
              console.warn(`⚠️ No text extracted from page ${pageNum}`);
              setOcrStatus(`⚠️ Page ${pageNum}: No text extracted`);
            }
          }

          if (allText.trim()) {
            setRawText(allText);
            setProgressMessage('📋 Parsing transactions...');

            // Calculate average OCR confidence
            const avgConfidence = 75; // Placeholder - could be calculated from OCR results

            // Process transactions with enhanced parsing
            const processedData = window.processTransactionsWithSummary(
              allText,
              avgConfidence
            );
            setData(processedData);

            setProgressMessage('');
            setOcrStatus(
              `✅ Processing complete! Extracted and parsed ${allText.length} characters.`
            );
          } else {
            throw new Error('No text could be extracted from the PDF');
          }
        } catch (error) {
          console.error('PDF Processing Error:', error);
          setOcrStatus(`❌ Error: ${error.message}`);
          setProgressMessage('');
        } finally {
          setIsLoading(false);
        }
      };

      fileReader.onerror = () => {
        setOcrStatus('❌ Error reading file');
        setProgressMessage('');
        setIsLoading(false);
      };

      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File Processing Error:', error);
      setOcrStatus(`❌ Error: ${error.message}`);
      setProgressMessage('');
      setIsLoading(false);
    }
  };

  return e('div', { className: 'app-container' }, [
    e(window.FileUpload, {
      key: 'file-upload',
      onProcess: processFile,
      isLoading,
      progressMessage,
      rawText,
      ocrStatus,
    }),

    e(window.TransactionTable, {
      key: 'transaction-table',
      data,
      filterType,
      setFilterType,
      sortField,
      setSortField,
      sortDirection,
      setSortDirection,
    }),
  ]);
}

// Register component globally
if (typeof window !== 'undefined') {
  window.App = App;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App };
}
