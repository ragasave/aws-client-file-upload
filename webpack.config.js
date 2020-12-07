const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    library: 'AwsFileUpload',
    // libraryTarget: "umd",
    libraryExport: 'default',
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
}