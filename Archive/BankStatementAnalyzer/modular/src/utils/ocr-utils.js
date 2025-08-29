/**
 * OCR Utilities Module
 * Enhanced 3-Stage OCR Processing for Bank Statements
 */

// Global OCR configuration
window.OCRConfig = {
  tesseract: {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        console.log(`🔍 OCR Progress: ${(m.progress * 100).toFixed(1)}%`);
      }
    },
    options: {
      tessedit_char_whitelist:
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()-/$ \n\r\t',
      tessedit_pageseg_mode: 6, // PSM.SINGLE_BLOCK equivalent
      preserve_interword_spaces: '1',
    },
  },
  jimp: {
    preprocessing: {
      contrast: 0.3,
      brightness: 0.1,
      gaussianBlur: 0.5,
    },
  },
};

/**
 * STAGE 1: Image Preprocessing with Jimp
 * Enhances image quality for better OCR recognition
 */
window.stage1_PrepareImage = async function (canvas) {
  console.log('🎯 Stage 1: Image Preprocessing...');

  try {
    if (typeof window.Jimp === 'undefined') {
      throw new Error('Jimp library not loaded');
    }

    // Convert canvas to base64
    const imageData = canvas.toDataURL('image/png');

    // Load image with Jimp
    const image = await window.Jimp.read(imageData);

    // Apply preprocessing enhancements
    const { contrast, brightness, gaussianBlur } =
      window.OCRConfig.jimp.preprocessing;

    image
      .contrast(contrast) // Increase contrast
      .brightness(brightness) // Slight brightness boost
      .blur(gaussianBlur) // Minimal blur to smooth noise
      .normalize() // Normalize the image
      .greyscale(); // Convert to greyscale

    // Convert back to base64
    const processedBase64 = await new Promise((resolve) => {
      image.getBase64(window.Jimp.MIME_PNG, (err, src) => {
        if (err) throw err;
        resolve(src);
      });
    });

    console.log('✅ Stage 1 Complete: Image preprocessed');
    return {
      success: true,
      data: { processedImage: processedBase64 },
      message:
        '✅ Stage 1 Complete: Image preprocessed with enhanced contrast and noise reduction',
    };
  } catch (error) {
    console.error('❌ Stage 1 Failed:', error);

    // Fallback: return original canvas data
    return {
      success: false,
      data: { processedImage: canvas.toDataURL('image/png') },
      message: `⚠️ Stage 1 Fallback: Using original image (${error.message})`,
    };
  }
};

/**
 * STAGE 2: Text Recognition with Tesseract
 * Simplified, reliable OCR processing
 */
window.stage2_RecognizeText = async function (imageData) {
  console.log('🎯 Stage 2: OCR Text Recognition...');

  try {
    const result = await window.Tesseract.recognize(
      imageData.processedImage,
      'eng',
      {
        logger: window.OCRConfig.tesseract.logger,
        ...window.OCRConfig.tesseract.options,
      }
    );

    const text = result.data.text || '';
    const confidence = result.data.confidence || 0;

    console.log(
      `🎯 Stage 2 Complete: Text extracted (${text.length} chars, ${confidence.toFixed(1)}% confidence)`
    );

    return {
      success: true,
      data: { text, confidence },
      message: `🎯 Stage 2 Complete: OCR extracted ${text.length} characters with ${confidence.toFixed(1)}% confidence`,
      metadata: {
        confidence: confidence,
        textLength: text.length,
        ocrConfidence: confidence,
      },
    };
  } catch (error) {
    console.error('❌ Stage 2 Failed:', error);
    return {
      success: false,
      data: { text: '', confidence: 0 },
      message: `❌ Stage 2 Failed: ${error.message}`,
    };
  }
};

/**
 * STAGE 3: Data Refinement with Fuse.js
 * Enhances text recognition using fuzzy matching
 */
window.stage3_RefineData = async function (ocrResult) {
  console.log('🎯 Stage 3: Data Refinement...');

  try {
    const { text, confidence } = ocrResult;

    // Common banking terms for fuzzy matching
    const bankingTerms = [
      'BALANCE',
      'DEPOSIT',
      'WITHDRAWAL',
      'TRANSFER',
      'PAYMENT',
      'CHECK',
      'FEE',
      'INTEREST',
      'DIVIDEND',
      'REFUND',
      'PURCHASE',
      'DEBIT',
      'CREDIT',
      'ACH',
      'WIRE',
      'ATM',
      'POS',
      'OVERDRAFT',
      'NSF',
      'RETURNED',
      'CLEARED',
      'PENDING',
      'AUTHORIZED',
      'DECLINED',
      'APPROVED',
      'TRANSACTION',
    ];

    // Initialize Fuse.js for fuzzy matching
    const fuse = new window.Fuse(bankingTerms, {
      threshold: 0.6,
      distance: 100,
      minMatchCharLength: 3,
    });

    // Process text and enhance with fuzzy matching
    let enhancedText = text;
    const lines = text.split('\n');
    const bestFuseResults = [];

    lines.forEach((line) => {
      const words = line.split(/\s+/);
      words.forEach((word) => {
        if (word.length > 2) {
          const fuseResults = fuse.search(word);
          if (fuseResults.length > 0 && fuseResults[0].score < 0.3) {
            // Replace with better match if confidence is high
            const replacement = fuseResults[0].item;
            enhancedText = enhancedText.replace(word, replacement);
            bestFuseResults.push(fuseResults[0]);
          }
        }
      });
    });

    // Calculate enhancement confidence
    const enhancementConfidence =
      bestFuseResults.length > 0
        ? 1 -
          bestFuseResults.reduce((sum, r) => sum + r.score, 0) /
            bestFuseResults.length
        : 0.5;

    console.log(`🎯 Stage 3 Complete: Text refined with fuzzy matching`);
    console.log(`📈 OCR Confidence: ${confidence.toFixed(1)}%`);

    return {
      success: true,
      data: {
        originalText: text,
        enhancedText: enhancedText,
        confidence: enhancementConfidence,
      },
      message: `🎯 Stage 3 Complete: Text enhanced using fuzzy matching algorithms`,
      metadata: {
        originalLength: text.length,
        enhancedLength: enhancedText.length,
        ocrConfidence: confidence,
        enhancementConfidence: enhancementConfidence,
      },
    };
  } catch (error) {
    console.error('❌ Stage 3 Failed:', error);
    return {
      success: false,
      data: {
        originalText: ocrResult.text || '',
        enhancedText: ocrResult.text || '',
        confidence: ocrResult.confidence || 0,
      },
      message: `❌ Stage 3 Failed: ${error.message}`,
    };
  }
};

/**
 * MAIN ENHANCED OCR FUNCTION - Orchestrates all 3 stages
 */
window.enhancedOCRProcessing = async function (canvas) {
  console.log('🚀 Starting Enhanced 3-Stage OCR Pipeline...');

  const results = {
    stage1: null,
    stage2: null,
    stage3: null,
    final: null,
  };

  try {
    // Stage 1: Image Preprocessing
    results.stage1 = await window.stage1_PrepareImage(canvas);

    // Stage 2: OCR Recognition (proceed even if Stage 1 failed)
    results.stage2 = await window.stage2_RecognizeText(results.stage1.data);

    // Stage 3: Data Refinement (proceed even if Stage 2 had low confidence)
    results.stage3 = await window.stage3_RefineData(results.stage2.data);

    // Determine final result
    const finalText = results.stage3.success
      ? results.stage3.data.enhancedText
      : results.stage2.data.text;

    const finalConfidence = results.stage2.data.confidence || 0;

    results.final = {
      text: finalText,
      confidence: finalConfidence,
      stages: {
        preprocessing: results.stage1.success,
        recognition: results.stage2.success,
        refinement: results.stage3.success,
      },
    };

    console.log('🎉 Enhanced OCR Pipeline Complete!');
    console.log(`📄 Final text length: ${finalText.length} characters`);
    console.log(`📈 Final confidence: ${finalConfidence.toFixed(1)}%`);

    return results.final;
  } catch (error) {
    console.error('💥 OCR Pipeline Failed:', error);
    return {
      text: '',
      confidence: 0,
      error: error.message,
      stages: {
        preprocessing: false,
        recognition: false,
        refinement: false,
      },
    };
  }
};

// Export functions for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    stage1_PrepareImage: window.stage1_PrepareImage,
    stage2_RecognizeText: window.stage2_RecognizeText,
    stage3_RefineData: window.stage3_RefineData,
    enhancedOCRProcessing: window.enhancedOCRProcessing,
    OCRConfig: window.OCRConfig,
  };
}
