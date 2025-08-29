# Bank Statement Analyzer - Enhanced OCR

> Advanced bank statement processing with 3-stage OCR pipeline and intelligent error categorization.

## 🌟 Features

- **📄 PDF Processing**: Robust PDF reading with PDF.js
- **🎯 3-Stage OCR Pipeline**:
  - **Stage 1**: Image preprocessing with Jimp (contrast, brightness, noise reduction)
  - **Stage 2**: Text recognition with Tesseract.js (optimized settings)
  - **Stage 3**: Data refinement with Fuse.js (fuzzy matching for banking terms)
- **🔍 Smart Error Detection**:
  - **❌ Parsing Errors**: Data validation issues (amounts, balances, formatting)
  - **🔍 OCR Uncertainty**: Low confidence text recognition
- **📊 Advanced Analytics**: Transaction parsing with confidence scoring
- **🎨 Modern UI**: React-based interface with responsive design
- **⚡ Production Ready**: Modular architecture with hosting optimization

## 🚀 Quick Start

### Option 1: Local Development

```bash
# Clone or download the project
cd modular

# Install development server
npm install

# Start local server
npm run dev
# Opens http://localhost:3000
```

### Option 2: Static Hosting

```bash
# Upload the 'public' folder to any static host:
# - GitHub Pages
# - Netlify
# - Vercel
# - AWS S3 + CloudFront
# - Any web server
```

### Option 3: Direct File Access

```bash
# Simply open public/index.html in any modern browser
# All dependencies are loaded from CDN
```

## 📁 Project Structure

```
modular/
├── public/                 # Ready-to-host files
│   └── index.html         # Main HTML file with CDN dependencies
├── src/                   # Source code (modular)
│   ├── components/        # React components
│   │   ├── App.js        # Main application component
│   │   ├── FileUpload.js # PDF upload and processing
│   │   └── TransactionTable.js # Data display with warnings
│   ├── styles/           # CSS modules
│   │   ├── main.css      # Application base styles
│   │   ├── components.css # Component-specific styles
│   │   └── warnings.css  # Warning system styles
│   ├── utils/            # Utility modules
│   │   ├── ocr-utils.js  # 3-stage OCR processing
│   │   └── parser-utils.js # Transaction parsing
│   └── main.js           # Application entry point
├── package.json          # Project configuration
└── README.md            # This file
```

## 🎯 How It Works

### 1. **PDF Upload**

- Users upload bank statement PDFs
- PDF.js extracts pages as high-resolution canvases

### 2. **3-Stage OCR Processing**

```javascript
// Stage 1: Image Preprocessing
const enhanced = await stage1_PrepareImage(canvas);

// Stage 2: Text Recognition
const ocrResult = await stage2_RecognizeText(enhanced);

// Stage 3: Data Refinement
const refined = await stage3_RefineData(ocrResult);
```

### 3. **Smart Transaction Parsing**

- Extracts dates, descriptions, amounts, balances
- Validates data integrity
- Categorizes potential issues

### 4. **Error Categorization**

- **❌ Parsing Errors**: Critical data validation issues
  - Large amounts (possible missing decimals)
  - Balance calculation mismatches
  - Missing transaction amounts
- **🔍 OCR Uncertainty**: Text recognition confidence issues
  - Low OCR confidence scores
  - Suspicious characters
  - Short descriptions

## 🛠️ Technical Stack

- **Frontend**: React 18 (via CDN)
- **PDF Processing**: PDF.js 3.4.120
- **OCR Engine**: Tesseract.js 4.x
- **Image Processing**: Jimp 0.22.8
- **Fuzzy Matching**: Fuse.js 6.6.2
- **Styling**: Pure CSS (no framework dependencies)

## 🌐 Hosting Options

### GitHub Pages

```bash
# 1. Push to GitHub repository
# 2. Enable GitHub Pages
# 3. Set source to 'main branch /public folder'
# 4. Access via: https://username.github.io/repo-name
```

### Netlify

```bash
# 1. Connect GitHub repository to Netlify
# 2. Set build command: (leave empty)
# 3. Set publish directory: public
# 4. Deploy automatically on push
```

### Vercel

```bash
# 1. Import project to Vercel
# 2. Set output directory: public
# 3. Deploy with zero configuration
```

### Traditional Web Host

```bash
# 1. Upload 'public' folder contents to web root
# 2. Ensure HTTPS is enabled
# 3. Access via your domain
```

## 🔧 Configuration

### OCR Settings

Edit `src/utils/ocr-utils.js`:

```javascript
window.OCRConfig = {
  tesseract: {
    options: {
      tessedit_char_whitelist:
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()-/$ \n\r\t',
      preserve_interword_spaces: '1',
    },
  },
  jimp: {
    preprocessing: {
      contrast: 0.3, // Adjust image contrast
      brightness: 0.1, // Adjust brightness
      gaussianBlur: 0.5, // Noise reduction
    },
  },
};
```

### Warning Thresholds

Edit `src/utils/parser-utils.js`:

```javascript
// Large amount threshold
if (Math.abs(transaction.amount) > 50000) {
  // Adjust threshold as needed
}

// OCR confidence threshold
if (transaction.ocrConfidence < 60) {
  // Adjust confidence threshold
}
```

## 📊 Browser Support

- **Chrome/Edge**: 88+ ✅
- **Firefox**: 85+ ✅
- **Safari**: 14+ ✅
- **Mobile**: iOS 14+, Android 10+ ✅

**Requirements**:

- Modern browser with Canvas API support
- JavaScript enabled
- Internet connection (for CDN dependencies)

## 🔍 Troubleshooting

### Common Issues

**No text extracted from PDF**:

- Ensure PDF contains actual text (not just images)
- Try increasing OCR processing time
- Check browser console for errors

**Low OCR accuracy**:

- PDF quality may be poor
- Adjust preprocessing settings in `ocr-utils.js`
- Try different scan resolution

**Slow processing**:

- Large PDF files take longer
- OCR processing is CPU-intensive
- Consider processing fewer pages at once

**Dependencies not loading**:

- Check internet connection
- CDN services may be temporarily unavailable
- See backup loading strategies in code

## 🚀 Performance Tips

1. **Optimize PDF size** before upload
2. **Use high-quality scans** for better OCR
3. **Process smaller page ranges** for faster results
4. **Clear browser cache** if issues persist

## 🔐 Security Notes

- All processing happens **client-side** (in your browser)
- **No data is sent to external servers** (except CDN libraries)
- PDF files are **not uploaded** anywhere
- Safe to use with sensitive financial documents

## 📈 Future Enhancements

- [ ] Batch processing multiple PDFs
- [ ] Export results to CSV/Excel
- [ ] Custom OCR training for specific bank formats
- [ ] Advanced transaction categorization
- [ ] Offline capability with service workers
- [ ] Integration with accounting software APIs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes in `src/` directory
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Skigim/nightingale-cms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Skigim/nightingale-cms/discussions)
- **Documentation**: [Wiki](https://github.com/Skigim/nightingale-cms/wiki)

---

**Built with ❤️ by the Nightingale CMS Team**

_Empowering financial data processing with cutting-edge OCR technology._
