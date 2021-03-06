'use strict';

var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Entry point for static analyzer
  entry: {
    'webpack-bundle': './index.js'
  },

  output: {
    // Where to build results
    path: path.join(__dirname, 'docs'),

    // Filename to use in HTML
    filename: '[name].js'
  },
  devtool: 'cheap-eval-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      inject: 'body'
    })
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        query: {
          attrs: ['img:src', 'link:href']
        }
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|(?!template\b)\b\w+\.svg$|\.woff$|\.ttf$|\.wav$|\.mp3$/,
        loader: 'url-loader'
      },
      {
        test: /template\.svg$/,
        loader: 'html-loader',
        query: {
          attrs: ['image:xlink:href', 'image:href']
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },
  resolve: {
    mainFields: ['esnext', 'module', 'jsnext:main', 'browser', 'main']
  },
  node: {
    fs: 'empty'
  },
  stats: {
    warnings: false
  },
  devServer: {
    noInfo: true,
    clientLogLevel: 'none'
  }
};
