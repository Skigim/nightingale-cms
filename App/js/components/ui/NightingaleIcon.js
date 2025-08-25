/**
 * Nightingale CMS Default Branding Icon Component
 *
 * A reusable SVG icon component featuring a stylized nightingale bird
 * representing the healthcare and care management focus of the system.
 *
 * @param {Object} props - Component props
 * @param {string} props.className - CSS classes for styling (default: "h-6 w-6")
 * @param {string} props.color - Color override (uses currentColor by default)
 * @returns {ReactElement} SVG icon element
 */
function NightingaleIcon({
  className = 'h-6 w-6',
  color = 'currentColor',
  ...props
}) {
  const e = window.React.createElement;

  return e(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth: '1.5',
      className,
      ...props,
    },
    // Nightingale bird silhouette
    e('path', {
      d: 'M12 3c-1.5 0-3 1-4 2.5C7 6.5 6.5 8 7 9.5c.5 1.5 1.5 2.5 2.5 3L8 15c-.5 1-1 2-1 3s.5 2 1.5 2.5c1 .5 2.5.5 3.5 0s1.5-1.5 1.5-2.5-0.5-2-1-3l-1.5-2.5c1-.5 2-1.5 2.5-3s.5-3-.5-4.5C16 4 14.5 3 12 3z',
      fill: color,
      opacity: '0.8',
    }),

    // Wing detail
    e('path', {
      d: 'M10 7c.5.5 1 1.5 1.5 2.5S12.5 12 12 13',
      stroke: color,
      strokeWidth: '1',
      fill: 'none',
      opacity: '0.6',
    }),

    // Eye
    e('circle', {
      cx: '11',
      cy: '6.5',
      r: '0.5',
      fill: color,
    }),

    // Healing cross symbolism (subtle)
    e('path', {
      d: 'M18 4v2M17 5h2',
      stroke: color,
      strokeWidth: '1',
      opacity: '0.4',
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
