import React, { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { registerComponent } from '../../services/registry';

/**
 * Nightingale SearchBar Component - Unified Version
 *
 * A single, flexible SearchBar component that can function as:
 * 1. A simple text input (when showDropdown=false or no data provided)
 * 2. A dropdown search with fuzzy matching (when showDropdown=true and data provided)
 *
 * This replaces SearchBar.js, SearchBar_Simple.js, and SearchBar_Fixed.js
 */

function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  className = '',
  showClearButton = true,
  onClear,
  showSearchIcon = true,
  size = 'md',
  // Dropdown-specific props (optional)
  data = [],
  searchKeys = [],
  fuseOptions = {},
  onResultSelect,
  renderResult,
  showDropdown = false,
  maxResults = 8,
  minQueryLength = 0,
}) {
  // State for dropdown functionality (only used when showDropdown=true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [usingKeyboardNav, setUsingKeyboardNav] = useState(false);

  // Refs
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const resultRefs = useRef([]);
  const searchServiceRef = useRef(null);

  // Size configurations
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Determine if we should use dropdown functionality
  const shouldUseDropdown = showDropdown && data.length > 0;

  // Memoize search service creation (only if dropdown enabled)
  const createSearchService = useCallback(() => {
    if (!shouldUseDropdown) return null;

    if (searchKeys.length > 0) {
      const options = {
        keys: searchKeys,
        includeScore: false,
        threshold: 0.3,
        ignoreLocation: true,
        ...fuseOptions,
      };
      return new window.NightingaleSearchService(data, options);
    }
    return null; // Will fall back to simple filtering
  }, [shouldUseDropdown, data, searchKeys, fuseOptions]);

  // Initialize search service only when dropdown is enabled
  useEffect(() => {
    if (shouldUseDropdown && searchKeys.length > 0) {
      searchServiceRef.current = createSearchService();
    } else {
      searchServiceRef.current = null;
    }
  }, [shouldUseDropdown, data, searchKeys]);

  // Handle search when value changes (only for dropdown mode)
  useEffect(() => {
    if (
      !shouldUseDropdown ||
      !hasUserInteracted ||
      value.length < minQueryLength
    ) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const service = searchServiceRef.current;
    if (service) {
      // Use fuzzy search service
      const results = service.search(value).slice(0, maxResults);
      setSearchResults(results);
      setIsDropdownOpen(results.length > 0 || value.length > 0);
    } else {
      // Fallback to simple text filtering
      const filtered = data
        .filter((item) => {
          const searchText = Object.values(item).join(' ').toLowerCase();
          return searchText.includes(value.toLowerCase());
        })
        .slice(0, maxResults);
      setSearchResults(filtered);
      setIsDropdownOpen(filtered.length > 0);
    }
  }, [shouldUseDropdown, value, hasUserInteracted, minQueryLength, maxResults]);

  // Handle result selection (dropdown only)
  const handleResultSelect = useCallback(
    (result) => {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
      setUsingKeyboardNav(false);

      if (onResultSelect) {
        onResultSelect(result);
      }
    },
    [onResultSelect],
  );

  // Handle input focus
  const handleFocus = () => {
    if (shouldUseDropdown) {
      setHasUserInteracted(true);
      if (data.length > 0) {
        setIsDropdownOpen(true);
      }
    }
  };

  // Handle input blur with delay to allow for clicks (dropdown only)
  const handleBlur = (e) => {
    if (!shouldUseDropdown) return;

    // Check if the blur is due to clicking on a dropdown item
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && dropdownRef.current?.contains(relatedTarget)) {
      return; // Don't close if clicking on dropdown
    }

    setTimeout(() => {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
      setUsingKeyboardNav(false);
    }, 200);
  };

  // Handle keyboard navigation (dropdown only)
  const handleKeyDown = (e) => {
    if (!shouldUseDropdown || !isDropdownOpen || searchResults.length === 0)
      return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setUsingKeyboardNav(true);
        setHighlightedIndex((prev) => {
          const newIndex = prev < searchResults.length - 1 ? prev + 1 : 0;
          // Scroll to view
          setTimeout(() => {
            const element = resultRefs.current[newIndex];
            if (element) {
              element.scrollIntoView({ block: 'nearest' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setUsingKeyboardNav(true);
        setHighlightedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : searchResults.length - 1;
          // Scroll to view
          setTimeout(() => {
            const element = resultRefs.current[newIndex];
            if (element) {
              element.scrollIntoView({ block: 'nearest' });
            }
          }, 0);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
          handleResultSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        setUsingKeyboardNav(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clear button
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }

    if (shouldUseDropdown) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setHasUserInteracted(false);
    }

    inputRef.current?.focus();
  };

  // Default result renderer (dropdown only)
  const defaultRenderResult = useCallback(
    (result, index) => {
      const isHighlighted = index === highlightedIndex;

      const displayText =
        result.displayName ||
        result.name ||
        result.title ||
        result.label ||
        `${result.mcn || result.masterCaseNumber || ''} ${result.personName || result.name || ''}`.trim() ||
        JSON.stringify(result);

      return (
        <div
          key={result.id || index}
          ref={(el) => {
            if (el) {
              resultRefs.current[index] = el;
            }
          }}
          className={`
          p-3 cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors
          ${isHighlighted ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}
        `
            .replace(/\s+/g, ' ')
            .trim()}
          style={{ pointerEvents: 'auto' }}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent input blur
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResultSelect(result);
          }}
          onMouseEnter={() => {
            if (!usingKeyboardNav) {
              setHighlightedIndex(index);
            }
          }}
          onMouseLeave={() => {
            if (!usingKeyboardNav && highlightedIndex === index) {
              setHighlightedIndex(-1);
            }
          }}
        >
          {displayText}
        </div>
      );
    },
    [highlightedIndex, usingKeyboardNav, handleResultSelect],
  );

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search icon */}
        {showSearchIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className={`${iconSizes[size]} text-gray-400`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
          w-full bg-gray-700 border border-gray-600 rounded-lg
          text-white placeholder-gray-400 focus:outline-none
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${sizeClasses[size]}
          ${showSearchIcon ? 'pl-10' : ''}
          ${showClearButton && value ? 'pr-10' : ''}
        `
            .replace(/\s+/g, ' ')
            .trim()}
        />

        {/* Clear button */}
        {showClearButton && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg
              className={`${iconSizes[size]} text-gray-400 hover:text-gray-300`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown results (only when showDropdown is enabled) */}
      {shouldUseDropdown && isDropdownOpen && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className={`
          absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600
          rounded-lg shadow-lg max-h-64 overflow-y-auto
        `
            .replace(/\s+/g, ' ')
            .trim()}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent any blur
          }}
        >
          {searchResults.map((result, index) => {
            const isHighlighted = index === highlightedIndex;
            const content = renderResult
              ? renderResult(result, index)
              : defaultRenderResult(result, index);

            // If using custom renderer, wrap with click handlers
            if (renderResult) {
              return (
                <div
                  key={result.id || index}
                  ref={(el) => {
                    if (el) {
                      resultRefs.current[index] = el;
                    }
                  }}
                  className={`
                p-3 cursor-pointer border-b border-gray-600 last:border-b-0 transition-colors
                ${isHighlighted ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}
              `
                    .replace(/\s+/g, ' ')
                    .trim()}
                  style={{ pointerEvents: 'auto' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResultSelect(result);
                  }}
                  onMouseEnter={() => {
                    if (!usingKeyboardNav) {
                      setHighlightedIndex(index);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!usingKeyboardNav && highlightedIndex === index) {
                      setHighlightedIndex(-1);
                    }
                  }}
                >
                  {content}
                </div>
              );
            }

            return content;
          })}
        </div>
      )}
    </div>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  showClearButton: PropTypes.bool,
  onClear: PropTypes.func,
  showSearchIcon: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  data: PropTypes.array,
  searchKeys: PropTypes.array,
  fuseOptions: PropTypes.object,
  onResultSelect: PropTypes.func,
  renderResult: PropTypes.func,
  showDropdown: PropTypes.bool,
  maxResults: PropTypes.number,
  minQueryLength: PropTypes.number,
};

// Register component
registerComponent('SearchBar', SearchBar);

export default SearchBar;
