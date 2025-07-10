const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',

  entry: {
    ui: './src/ui.html',
    code: './src/code.ts',
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          minimize: true,
        },
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
      inject: 'body',
      cache: false,
    }),
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
    // Inject biến môi trường vào code của plugin Figma
    new webpack.DefinePlugin({
      // URL của API Vercel đã deploy (ví dụ: https://playstore-icon-finder-pink.vercel.app/api)
      'process.env.VERCEL_API_BASE_URL': JSON.stringify(process.env.VERCEL_API_BASE_URL),
      // API Key mà plugin Figma sẽ gửi tới server Vercel để xác thực.
      // Giá trị của biến này CẦN KHỚP VỚI SERVER_API_KEY mà server mong đợi.
      'process.env.FIGMA_PLUGIN_API_KEY': JSON.stringify(process.env.FIGMA_PLUGIN_API_KEY),
    }),
  ],
});