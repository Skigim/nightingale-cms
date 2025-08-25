/**
 * Nightingale CMS Professional Branding Icon Component
 *
 * A detailed SVG icon component featuring a professional nightingale bird design
 * representing the healthcare and care management focus of the system.
 * Uses a high-quality, detailed illustration with authentic colors.
 *
 * @param {Object} props - Component props
 * @param {string} props.className - CSS classes for styling (default: "h-6 w-6")
 * @returns {ReactElement} SVG icon element
 */
function NightingaleIcon({ className = 'h-6 w-6', ...props }) {
  const e = window.React.createElement;

  return e(
    'svg',
    {
      version: '1.1',
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 1024 1024',
      className,
      ...props,
    },
    // Background
    e('path', {
      d: 'M0 0 C337.92 0 675.84 0 1024 0 C1024 337.92 1024 675.84 1024 1024 C686.08 1024 348.16 1024 0 1024 C0 686.08 0 348.16 0 0 Z',
      fill: '#E8E8D6',
      transform: 'translate(0,0)',
    }),

    // Main bird body - detailed plumage
    e('path', {
      d: 'M0 0 C1.7015625 0.02707031 1.7015625 0.02707031 3.4375 0.0546875 C4.283125 0.07789063 5.12875 0.10109375 6 0.125 C3.14773026 2.97726974 -0.39798327 4.08396907 -4.0625 5.625 C-22.77789133 13.72383815 -45.38201569 25.63298115 -59 41.125 C-59.80315654 44.26981791 -59.80315654 44.26981791 -60 47.125 C-51.12268867 49.49228302 -42.0964401 47.82722431 -33.25 46.1875 C-16.74554932 43.30976241 -0.71717939 42.98457396 16 43.125 C14.39770535 46.3295893 11.09714251 46.76232032 7.875 47.875 C7.13886475 48.13450439 6.40272949 48.39400879 5.64428711 48.66137695 C-1.94715511 51.25481404 -9.69977629 53.20137753 -17.50634766 55.03222656 C-18.45171387 55.26264648 -19.39708008 55.49306641 -20.37109375 55.73046875 C-21.21599365 55.92793701 -22.06089355 56.12540527 -22.93139648 56.32885742 C-25.35590573 57.03346766 -25.35590573 57.03346766 -27 60.125 C-28.46703392 67.60687299 -28.24505943 74.65464342 -27 82.125 C-28.50559539 80.16117993 -29.89131683 78.34236634 -31 76.125 C-31 81.735 -31 87.345 -31 93.125',
      fill: '#631959',
      transform: 'translate(733,196.875)',
    }),

    // Wing and body details
    e('path', {
      d: 'M0 0 C4.58709342 1.14229981 8.65721961 3.0172353 12.93432617 5.00561523 C13.83909698 5.41881012 14.7438678 5.832005 15.67605591 6.25772095 C18.55955788 7.57580895 21.43853021 8.90344098 24.31713867 10.23217773 C27.1892854 11.55221695 30.06236429 12.8701595 32.9367981 14.18521118 C34.72139097 15.00225346 36.50457962 15.82237241 38.28610229 16.64608765 C43.27414081 18.93648664 48.27911557 20.99289732 53.44213867 22.85717773',
      fill: '#631B58',
      transform: 'translate(378.557861328125,616.142822265625)',
    }),

    // Head and beak area
    e('path', {
      d: 'M0 0 C0.99 0.33 1.98 0.66 3 1 C3.6875 3.0625 3.6875 3.0625 4 5 C5.32 3.68 6.64 2.36 8 1 C7.5359375 1.99 7.5359375 1.99 7.0625 3 C5.56369402 7.23192276 5 11.49367457 5 16 C13.25494097 16.65863891 19.13192147 15.61328212 26.6015625 11.99609375',
      fill: '#631D5B',
      transform: 'translate(421,432)',
    }),

    // Breast and lighter areas
    e('path', {
      d: 'M0 0 C0.90572754 -0.01417969 1.81145508 -0.02835937 2.74462891 -0.04296875 C12.74603102 0.10274463 22.11804107 4.00417473 29.6875 10.5625 C37.25515766 19.18816028 40.25393593 28.01646825 40.0625 39.375 C40.05234863 40.25446289 40.04219727 41.13392578 40.03173828 42.04003906',
      fill: '#F0D9E4',
      transform: 'translate(567.3125,339.4375)',
    }),

    // Wing feather details
    e('path', {
      d: 'M0 0 C1.11910026 1.18692452 2.23795253 2.37408396 3.35546875 3.5625 C5.3816863 5.33363553 7.48828256 6.44287105 9.875 7.6875 C17.28585605 11.58950245 24.10826469 16.26493139 31 21',
      fill: '#E9E5D8',
      transform: 'translate(513,601)',
    }),

    // Darker wing areas
    e('path', {
      d: 'M0 0 C4.18381827 0.52752491 7.24700519 1.41868489 10.875 3.5625 C12.04675781 4.24505859 12.04675781 4.24505859 13.2421875 4.94140625 C14.11230469 5.46541016 14.11230469 5.46541016 15 6',
      fill: '#611C57',
      transform: 'translate(341,599)',
    }),

    // Eye area
    e('path', {
      d: 'M0 0 C0.92941406 -0.020625 1.85882812 -0.04125 2.81640625 -0.0625 C9.44200127 -0.09998569 14.5405097 0.43690093 19.7109375 4.96875 C20.17757812 5.5565625 20.64421875 6.144375 21.125 6.75',
      fill: '#F2F3EA',
      transform: 'translate(967.25,956.75)',
    }),

    // Additional feather details
    e('path', {
      d: 'M0 0 C7.96157277 3.22485232 15.72575033 6.72032823 23.4375 10.5 C37.48593621 17.31762345 51.72553497 23.6740238 66 30',
      fill: '#F2DCEA',
      transform: 'translate(357,601)',
    }),

    // Shadow and depth areas
    e('path', {
      d: 'M0 0 C1 2 1 2 0.875 3.8125 C0 6 0 6 -2.203125 8.08984375 C-5.71329978 11.51530748 -8.08141 15.58657795 -10.625 19.75',
      fill: '#F1D6E8',
      transform: 'translate(355,660)',
    }),

    // Final detail areas
    e('path', {
      d: 'M0 0 C0.66 0.33 1.32 0.66 2 1 C0.6796757 2.01563408 -0.64068228 3.03122439 -1.96118164 4.04663086',
      fill: '#5E1A54',
      transform: 'translate(730,202)',
    })
  );
}

// Make component available globally
if (typeof window !== 'undefined') {
  window.NightingaleIcon = NightingaleIcon;

  // Register with UI component library if available
  if (window.NightingaleUI) {
    window.NightingaleUI.registerComponent('NightingaleIcon', NightingaleIcon);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NightingaleIcon;
}
