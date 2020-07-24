const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


module.exports = {
    entry: './index.js',
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: [__dirname, './dist'],
        port: 5500,
        writeToDisk: true

    },
    plugins: [
        new CleanWebpackPlugin({ cleanStaleWebpackAssets: false })
    ],

    output: {
        filename: 'sonicsensor.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
}