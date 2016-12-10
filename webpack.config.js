 var CopyWebpackPlugin = require('copy-webpack-plugin');
 var webpack = require("webpack");
 var path = require('path');

 module.exports = {
     entry: {
        global: './src/pages/js/global.js',
        popover: './src/pages/js/popover.js'
     },
     module: {
         loaders: [
             {
                 test: /\.js$/,
                 loader: 'babel',
                 exclude: /node_modules/
             },
             {
                 test: /\.vue$/,
                 loader: 'vue'
             },
             {
                 test: /\.css$/,
                 loaders: [
                     'style',
                     'css'
                 ]
             }
         ]
     },
     vue: {
         loaders: {
             js: 'babel'
         }
     },
     plugins: [
        new CopyWebpackPlugin([
            { from: path.join(__dirname, 'src/icons/'), to: path.join(__dirname, 'build/Comments from Reddit.safariextension/') },
            { from: path.join(__dirname, 'src/images/refresh.png'), to: path.join(__dirname, 'build/Comments from Reddit.safariextension/img/refresh.png') },
            { from: path.join(__dirname, 'src/pages/html'), to: path.join(__dirname, 'build/Comments from Reddit.safariextension/html') },
            { from: path.join(__dirname, 'src/safari/Info.plist'), to: path.join(__dirname, 'build/Comments from Reddit.safariextension/Info.plist') },
            { from: path.join(__dirname, 'src/safari/Settings.plist'), to: path.join(__dirname, 'build/Comments from Reddit.safariextension/Settings.plist') },
        ])
     ],
     output: {
         path: path.join(__dirname, 'build/Comments from Reddit.safariextension/js'),
         filename: '[name].js',
         sourceMapFilename: '[name].map'
     }
 };