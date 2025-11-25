export default {
  mako: false,
  // Exclude test files from production build
  conventionRoutes: {
    exclude: [/\.test\.(tsx?|jsx?)$/, /\.e2e\.(tsx?|jsx?)$/],
  },
};
