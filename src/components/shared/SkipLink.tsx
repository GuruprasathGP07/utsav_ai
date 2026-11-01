import React from 'react';

/** @fileoverview Skip-to-main-content link — first focusable element on every page. */
export function SkipLink(): React.ReactElement {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}
