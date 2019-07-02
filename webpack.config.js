const CleanWebpackPlugin = require('clean-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin')
const path = require("path");
const TerserPlugin = require('terser-webpack-plugin');

const dev = !process.env.PROD;
const mode = dev ? "development" : "production";
const devtool = dev ? "inline-source-map" : false;
const minimize = !dev;

module.exports = {
	mode,
	devtool,
	entry: './src/index.ts',
	optimization: {
		minimize,
		minimizer: [new TerserPlugin({
			terserOptions: { }
		})],
		concatenateModules: true,
		flagIncludedChunks: true
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: /node_modules/,
				options: {
					//configFile: "./tsconfig.json"
				}
			}
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ]
	},
	output: {
		filename: 'dream-jobs.js',
		path: path.resolve(__dirname, "dist"),
		libraryTarget: "window"
	},
	plugins: [
		new DtsBundlePlugin(),
		new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /a\.js|node_modules/,
			// add errors to webpack instead of warnings
			failOnError: true,
			// allow import cycles that include an asyncronous import,
			// e.g. via import(/* webpackMode: "weak" */ './file.js')
			allowAsyncCycles: false,
			// set the current working directory for displaying module paths
			cwd: process.cwd(),
		}),
		new CleanWebpackPlugin({
			verbose: true,
			cleanOnceBeforeBuildPatterns: [],
			cleanAfterEveryBuildPatterns: [
				"./*",
				"!./dream-jobs.*"
			]
		})
	]
};

function DtsBundlePlugin(){}
DtsBundlePlugin.prototype.apply = function (compiler) {
	compiler.plugin('done', function(){
		var dts = require('dts-bundle');

		dts.bundle({
			name: "dream-jobs",
			main: 'dist/index.d.ts',
			out: 'dream-jobs.d.ts',
			removeSource: true,
			outputAsModuleFolder: true // to use npm in-package typings
		});
	});
};
