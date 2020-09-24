"use strict";  

const gulp = require("gulp"),
    concat = require("gulp-concat"),
    cssmin = require("gulp-cssmin"),
    htmlmin = require("gulp-htmlmin"),
    uglify = require("gulp-uglify"),
    merge = require("merge-stream"),
    pipeline = require('readable-stream').pipeline,
    del = require("del"),
    bundleconfig = require("./build/distbundlesconfig.json"),
    replace = require('gulp-replace'),
    jsdoc = require('gulp-jsdoc3'),
    packagedef = require("./package.json");

//////////////////////////////
// build minimised distribution packages

// get the package bundle definitions 
function getBundles(regexPattern) {
    return bundleconfig.filter(function (bundle) {
        return regexPattern.test(bundle.outputFileName);
    });
}

// minimse and bundle
function mintoDist() {
    var tasks = getBundles(/\.js$/).map(function (bundle) {
        return pipeline(
            gulp.src(bundle.inputFiles, { base: "." }),
            uglify({
                output: {
                    comments: "some"
                }
            }),
            concat(bundle.outputFileName),
            gulp.dest(".")
        );
    });
    return merge(tasks);
}

// clean any previous bundle packages 
function cleanDist() {
    var files = bundleconfig.map(function (bundle) {
        return bundle.outputFileName;
    });

    return del(files, { force: true });
}


exports.buildDist = gulp.series(cleanDist, mintoDist);

////////////////////////////////////
// Build documentation site from js content using jsdoc

// remove previous output
function cleanDocs() {
    return del('./docs');
}

// extract docs and compile to html, adds in readme.md from docs-src
function compileDocs(cbDone) {
    const config = require('./build/jsdoc.json');
    gulp.src(['readme.md', '.src/**/*.js'], { read: false }).pipe(jsdoc(config, cbDone));
}

// post processing to put dot delimeters back into names
//
function processName(nsname1,nsname2) {
    var badName1 = nsname1.replace(/\./g, "");
    var regx1 = new RegExp(badName1 + "(?![a-zA-Z]*\.html)", "gi");
    var badName2 = nsname2.replace(/\./g, "");
    var regx2 = new RegExp(badName2 + "(?![a-zA-Z]*\.html)", "gi");

    return gulp.src("./docs/*.html").pipe(replace(regx1, nsname1)).pipe(replace(regx2, nsname2)).pipe(replace(/{@packageversion}/g, packagedef.version)).pipe(gulp.dest("./docs"));
}

// call dot processing for each update required so can chain one after the other .. crude but works
function processDocs1() {
    return processName("MeadCo.ScriptX","MeadCo.Licensing");
}

// static docs files that jsdocs won't put where we want
function docStatics() {
    return gulp.src('./docs-src/build/**').pipe(gulp.dest('./docs/build/'));
}

function dummy() { }

///////////////////////////////////////////
// callable processes to build outputs.
//

exports.makeDocs = gulp.series(compileDocs, processDocs1, docStatics);

exports.buildDocs = gulp.series(cleanDocs, exports.makeDocs);

exports.buildDist = gulp.series(gulp.parallel(cleanDist, cleanDocs), gulp.parallel(mintoDist, exports.makeDocs)); 


