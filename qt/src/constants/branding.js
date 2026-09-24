export const DARK_THEME_LOGO = '/assets/img/starrex-logo.png'
// The product uses one fixed dark/gold skin on both mobile and desktop.
// Keep the legacy export for compatibility with existing components.
export const LIGHT_THEME_LOGO = DARK_THEME_LOGO

export function getThemeLogo() {
  return DARK_THEME_LOGO
}

