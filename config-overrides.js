const {
  override,
  addWebpackPlugin,
  adjustStyleLoaders,
} = require("customize-cra");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = override(
  // Add compression plugin for gzip
  addWebpackPlugin(
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    })
  ),

  // Optimize CSS
  adjustStyleLoaders(({ use: [, css, postcss, resolve, processor] }) => {
    css.options.sourceMap = false; // Disable CSS source maps
  }),

  // Custom webpack configuration
  (config) => {
    // Optimize for production
    if (config.mode === "production") {
      // Better tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Optimize chunk splitting
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 5,
          },
        },
      };

      // Optimize Terser
      config.optimization.minimizer = config.optimization.minimizer.map(
        (minimizer) => {
          if (minimizer instanceof TerserPlugin) {
            return new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true, // Remove console.log in production
                  drop_debugger: true,
                },
                mangle: true,
              },
              extractComments: false, // Don't extract comments to separate file
            });
          }
          return minimizer;
        }
      );
    }

    // Disable source maps for faster builds
    if (process.env.GENERATE_SOURCEMAP === "false") {
      config.devtool = false;
    }

    return config;
  }
);
