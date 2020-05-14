const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const resolve = require('resolve');
const postcssNormalize = require('postcss-normalize');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const typescriptFormatter = require('react-dev-utils/typescriptFormatter');
const getEnv = require('./env');
const packageJson = require('../package.json');

const cwd = process.cwd();
const resolveApp = rel => path.resolve(cwd, rel);

const paths = {
  app: resolveApp('.'),
  src: resolveApp('src'),
  public: resolveApp('public'),
  html: resolveApp('public/index.html'),
  build: resolveApp('build'),
  nodeModules: resolveApp('node_modules'),
  tsConfig: resolveApp('tsconfig.json'),
  prodPath: `/demo/${packageJson.name}/${packageJson.version}/build/`,
  devPath: 'http://localhost:3001/',
};
const shouldUseSourceMap = true;
const imageInlineSizeLimit = 10000;
const shouldInlineRuntimeChunk = true;

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

module.exports = webpackEnv => {
  const isDev = webpackEnv === 'development';
  const isProd = webpackEnv === 'production';
  const isProdProfile = isProd && process.argv.includes('--profile');

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor, preProcessOption) => {
    const loaders = [
      isDev && require.resolve('style-loader'),
      isProd && {
        loader: MiniCssExtractPlugin.loader,
        options: {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          // Necessary for external CSS imports to work
          // https://github.com/facebook/create-react-app/issues/2677
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
            // Adds PostCSS Normalize as the reset css with default options,
            // so that it honors browserslist config in package.json
            // which in turn let's users customize the target behavior as per their needs.
            postcssNormalize(),
          ],
          sourceMap: isProd && shouldUseSourceMap,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: isProd && shouldUseSourceMap,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: Object.assign(
            {
              sourceMap: true,
            },
            preProcessOption || {}
          ),
        }
      );
    }
    return loaders;
  };

  const publicPath = isProd ? paths.prodPath : paths.devPath;

  const env = getEnv(publicPath.slice(0, -1));

  if (isProd) {
    fs.emptyDirSync(paths.build);
    // Merge with the public folder
    copyPublicFolder();
  }

  const config = {
    mode: isProd ? 'production' : 'development',
    bail: isProd,
    devtool: isProd ? 'source-map' : 'cheap-module-source-map',
    entry: ['./src/index.tsx'],
    output: {
      path: isProd ? paths.build : undefined,
      pathinfo: isDev,
      filename: isProd
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/bundle.js',
      chunkFilename: isProd
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
      futureEmitAssets: true,
      publicPath: publicPath,
      jsonpFunction: `webpackJsonp_${packageJson.name}:${packageJson.version}`,
      globalObject: 'this',
      library: `${packageJson.name}:${packageJson.version}`,
      libraryTarget: 'umd',
    },
    optimization: {
      minimize: isProd,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            // Added for profiling in devtools
            keep_classnames: isProdProfile,
            keep_fnames: isProdProfile,
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
          sourceMap: shouldUseSourceMap,
        }),
        // This is only used in production mode
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: shouldUseSourceMap
              ? {
                  // `inline: false` forces the sourcemap to be output into a
                  // separate file
                  inline: false,
                  // `annotation: true` appends the sourceMappingURL to the end of
                  // the css file, helping the browser find the sourcemap
                  annotation: true,
                }
              : false,
          },
        }),
      ],
      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      splitChunks: {
        chunks: 'all',
        name: false,
      },
      // Keep the runtime chunk separated to enable long term caching
      // https://twitter.com/wSokra/status/969679223278505985
      // https://github.com/facebook/create-react-app/issues/5358
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`,
      },
    },
    resolve: {
      modules: ['node_modules'],
      extensions: ['.mjs', '.js', '.ts', '.tsx', '.json', '.jsx'],
      plugins: [],
    },
    resolveLoader: {
      plugins: [],
    },
    externals: {
      react: '_externals_react',
      'react-dom': '_externals_react_dom',
      'react-router': '_externals_react_router',
      'react-router-dom': '_externals_react_router_dom',
      antd: '_externals_antd',
      moment: '_externals_moment',
    },
    module: {
      rules: [
        // 过babel之前先eslint
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          enforce: 'pre',
          use: [
            {
              loader: require.resolve('eslint-loader'),
              options: {
                cache: true,
                formatter: require.resolve('react-dev-utils/eslintFormatter'),
                eslintPath: require.resolve('eslint'),
                resolvePluginsRelativeTo: __dirname,
              },
            },
          ],
          exclude: /node_modules/,
          include: paths.src,
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: imageInlineSizeLimit,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.src,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve(
                  'babel-preset-react-app/webpack-overrides'
                ),
                plugins: [
                  [
                    require.resolve('babel-plugin-named-asset-import'),
                    {
                      loaderMap: {
                        svg: {
                          ReactComponent:
                            '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                        },
                      },
                    },
                  ],
                  // [
                  //   require.resolve('babel-plugin-import'),
                  //   {
                  //     libraryName: 'antd',
                  //     libraryDirectory: 'es',
                  //     style: 'css',
                  //   },
                  //   'fix-import-imports',
                  // ],
                ],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,
                compact: isProd,
              },
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [
                    require.resolve('babel-preset-react-app/dependencies'),
                    { helpers: true },
                  ],
                ],
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,

                // Babel sourcemaps are needed for debugging into node_modules
                // code.  Without the options below, debuggers like VSCode
                // show incorrect code and set breakpoints on the wrong lines.
                sourceMaps: shouldUseSourceMap,
                inputSourceMap: shouldUseSourceMap,
              },
            },
            // css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isProd && shouldUseSourceMap,
              }),
              sideEffects: true,
            },
            // css-modules
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isProd && shouldUseSourceMap,
                modules: {
                  getLocalIdent: getCSSModuleLocalIdent,
                },
              }),
            },
            // sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isProd && shouldUseSourceMap,
                },
                'sass-loader'
              ),
              sideEffects: true,
            },
            // sass-modules
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isProd && shouldUseSourceMap,
                  modules: {
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                'sass-loader'
              ),
            },
            // less
            {
              test: lessRegex,
              exclude: lessModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isProd && shouldUseSourceMap,
                },
                'less-loader',
                {
                  javascriptEnabled: true,
                }
              ),
              sideEffects: true,
            },
            // less-modules
            {
              test: lessModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isProd && shouldUseSourceMap,
                  modules: {
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                'less-loader',
                {
                  javascriptEnabled: true,
                }
              ),
            },
            {
              loader: require.resolve('file-loader'),
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ],
    },
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.html,
          },
          isProd
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true,
                },
              }
            : undefined
        )
      ),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      // https://github.com/facebook/create-react-app/issues/5358
      isProd &&
        shouldInlineRuntimeChunk &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // In production, it will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      // In development, this will be an empty string.
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.app),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // This is necessary to emit hot updates (currently CSS only):
      // isDev && new webpack.HotModuleReplacementPlugin(),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isDev && new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebook/create-react-app/issues/186
      isDev && new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isProd &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // TypeScript type checking
      new ForkTsCheckerWebpackPlugin({
        typescript: resolve.sync('typescript', {
          basedir: paths.nodeModules,
        }),
        async: isDev,
        useTypescriptIncrementalApi: true,
        checkSyntacticErrors: true,
        tsconfig: paths.tsConfig,
        reportFiles: [
          '**',
          '!**/__tests__/**',
          '!**/?(*.)(spec|test).*',
          '!**/src/setupProxy.*',
          '!**/src/setupTests.*',
        ],
        silent: true,
        // The formatter is invoked directly in WebpackDevServerUtils during development
        formatter: isProd ? typescriptFormatter : undefined,
      }),
    ].filter(Boolean),
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      module: 'empty',
      dgram: 'empty',
      dns: 'mock',
      fs: 'empty',
      http2: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false,
  };
  if (isDev) {
    config.devServer = {
      disableHostCheck: true,
      compress: true,
      clientLogLevel: 'none',
      contentBase: paths.public,
      watchContentBase: true,
      hot: false,
      transportMode: 'ws',
      injectClient: false,
      publicPath: publicPath,
      // quiet: true,
      watchOptions: {
        ignored: {},
      },
      https: false,
      host: '0.0.0.0',
      port: 3001,
      overlay: false,
      historyApiFallback: {
        disableDotRule: true,
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers':
          'X-Requested-With, Content-Type, Authorization',
      },
    };
  }

  return config;
};

function copyPublicFolder() {
  fs.copySync(paths.public, paths.build, {
    dereference: true,
    filter: file => file !== paths.html,
  });
}
