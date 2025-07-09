const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const path = require('path');
const webpack = require('webpack'); // Quan trọng: import webpack

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map', // false cho prod, inline-source-map cho dev

  entry: {
    ui: './src/ui.html',  // Đường dẫn đến UI HTML
    code: './src/code.ts', // Đường dẫn đến code plugin TypeScript
  },

  module: {
    rules: [
      // Rule cho TypeScript/JavaScript
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Rule cho CSS (nếu bạn có file CSS riêng thay vì dùng CDN Tailwind)
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      // Rule cho HTML (để HtmlWebpackPlugin xử lý)
      {
        test: /\.html$/,
        loader: 'html-loader', // Cần cài `npm install html-loader`
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
    filename: '[name].js', // ui.js và code.js
    path: path.resolve(__dirname, 'dist'), // Output vào thư mục 'dist'
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html', // Sử dụng template từ src
      filename: 'ui.html',      // Output ra dist/ui.html
      chunks: ['ui'],           // Chỉ inject js của ui
      inject: 'body',           // Inject script vào cuối body
      cache: false,             // Không cache trong dev
    }),
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]), // Inline ui.js vào ui.html
    // Inject biến môi trường vào code của plugin (UI và code.ts)
    new webpack.DefinePlugin({
      // API_URL của server Vercel (sẽ được thay thế bằng giá trị thực tế)
      'process.env.VERCEL_API_URL': JSON.stringify(process.env.API_URL),
      // API Key mà plugin sẽ gửi tới server Vercel để xác thực.
      // KEY NÀY CŨNG CẦN ĐƯỢC THIẾT LẬP LÀM BIẾN MÔI TRƯỜNG CỦA PROJECT FIGMA
      // TRÊN VERCEl (nếu bạn dùng Vercel để deploy plugin) HOẶC TRONG .env.local CỦA PROJECT FIGMA.
      // KHÔNG PHẢI LÀ API_KEY CỦA GOOGLE PLAY SCRAPER!
      'process.env.FIGMA_PLUGIN_API_KEY': JSON.stringify(process.env.FIGMA_PLUGIN_API_KEY),
    }),
  ],
});