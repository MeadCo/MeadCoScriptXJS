"use strict";  

const gulp = require("gulp");
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const merge = require("merge-stream");
const packagedef = require("./package.json");
const webpackConfig = require('./webpack.config.js');

/**
 * Minifies JavaScript files in the src folder and generates source maps
 * without using deprecated gulp-sourcemaps library
 */
function minifyAndMapJavaScriptToDist() {

    var tasks = gulp.src(['src/**/*.js', '!src/**/*.min.js'], { base: 'src' })
        .pipe(webpackStream(webpackConfig, webpack))
        .pipe(gulp.dest('dist'));

    return merge(tasks);

}

async function cleanDistFolder() {
    console.log("Cleaning dist folder...");
    const del = await import('del');
    return del.deleteAsync(['./dist/*']);
}

//////////////////////////////////////
//// Build documentation site from js content using jsdoc

// remove previous output
async function cleanDocsFolder() {
    console.log("Cleaning docs folder...");
    const del = await import('del');
    return del.deleteAsync(['./docs/*']);
}

// extract docs and compile to html, adds in readme.md from docs-src
function compileDocs(done) {
    //    const config = require('./build/jsdoc.json');
    //    gulp.src(['readme.md', '.src/**/*.js'], { read: false }).pipe(jsdoc(config, cbDone));

    const { exec } = require('child_process');

    console.log("Building documentation.");
    exec('npx jsdoc -c ./configs/jsdoc.json', (err, stdout, stderr) => {
        if (err) {
            console.error(stderr);
            return done(err);
        }
        console.log(stdout);
        done();
    });
}

// post processing to put dot delimeters back into names
//
function processName(nsname1,nsname2) {
    var badName1 = nsname1.replace(/\./g, "");
    var regx1 = new RegExp(badName1 + "(?![a-zA-Z]*\.html|[a-zA-Z]*\")", "gi");
    var badName2 = nsname2.replace(/\./g, "");
    var regx2 = new RegExp(badName2 + "(?![a-zA-Z]*\.html|[a-zA-Z]*\")", "gi");

    return gulp.src("./docs/*.html").pipe(replace(regx1, nsname1)).pipe(replace(regx2, nsname2)).pipe(replace(/{@packageversion}/g, packagedef.version)).pipe(gulp.dest("./docs"));
}

// call dot processing for each update required so can chain one after the other .. crude but works
function processDocs1() {
    return processName("MeadCo.ScriptX","MeadCo.Licensing");
}

// static docs files that jsdocs won't put where we want
function docStatics() {
    return gulp.src('./docs-src/configs/**').pipe(gulp.dest('./docs/configs/'));
}



///////////////////////////////////////////
// callable processes to build outputs.
//

exports.Minify = gulp.series(cleanDistFolder, minifyAndMapJavaScriptToDist);

exports.BuildDocs = gulp.series(cleanDocsFolder, gulp.series(compileDocs, processDocs1, docStatics));

exports.Clean = gulp.parallel(cleanDistFolder, cleanDocsFolder);

exports.BuildDist = gulp.series(exports.Clean, gulp.parallel(minifyAndMapJavaScriptToDist, gulp.series(compileDocs, processDocs1, docStatics))); 


