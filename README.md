# MeadCoScriptXJS

<p align="center">
	<a href="https://github.com/MeadCo/MeadCoScriptXJS/releases/latest" target="_blank">
        <img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/MeadCo/MeadCoScriptXJS">
    </a>
	<a href="https://www.npmjs.com/package/meadco-scriptxjs" target="_blank">
		<img alt="npm" src="https://img.shields.io/npm/v/meadco-scriptxjs">
	</a>
	<a href="https://www.nuget.org/packages/MeadScriptXJS" target="_blank">
        <img alt="Nuget" src="https://img.shields.io/nuget/v/MeadScriptXJS">
    </a>
	<br>
	<a href="https://github.com/MeadCo/MeadScriptXJS/blob/master/LICENSE" target="_blank">
		<img alt="MIT License" src="https://img.shields.io/github/license/MeadCo/MeadCoScriptXJS">
	</a>
</p>

**MeadCoScriptXJS** is a simple javascript wrapper library for use with [MeadCo's ScriptX Add-on/Services](https://www.meadroid.com)
 to achieve consistent printed output using any browser on any device. This library has been used with our samples system for some time. 

The aim of the library is to hide differences between versions of ScriptX and provide easy access to some common functionality.
The library works with both free and licensed ScriptX. Some convenience wrappers require licensed ScriptX functionality.

As of version 1.2.0 this library facilitates being able to write the same code for both the 
[ScriptX Add-on](http://scriptx.meadroid.com) for Internet Explorer and 
[MeadCo's ScriptX Services](https://scriptxservices.meadroid.com) browser agnostic printing services in the cloud, on premise and on Windows PC. 
The dependency on the [ScriptX Service Client Library](https://github.com/MeadCo/ScriptX.Print.Client) is required for this to work.

v1.5 and later add support for ScriptX Services on Windows PC.

## Packages

### NuGet Gallery
[MeadCo ScriptX JS Library](http://nuget.org/packages/MeadScriptXJS/)

### NPM Use

```
npm install meadco-scriptxjs --save
```

### CDN Use

<p>
    <br/>
	<a href="https://www.jsdelivr.com/package/npm/meadco-scriptxjs" target="_blank">
		<img alt="jsDelivr hits (npm)" src="https://img.shields.io/jsdelivr/npm/hm/meadco-scriptxjs">
	</a>
</p>

```html
<script src="https://cdn.jsdelivr.net/npm/meadco-scriptxjs@1/dist/meadco-scriptx.min.js"></script>
```

## Quick start for working with ScriptX Add-on only

1. Link to meadco-scriptx.js `<script src="https://cdn.jsdelivr.net/npm/meadco-scriptxjs@1/dist/meadco-scriptx.min.js"></script>`
2. Initialise the library in the document ready/window loaded event handler, and initialise printing parameters. For example, when using jQuery:

```javascript
$(window).on('load', function () {
  if (MeadCo.ScriptX.Init()) {
    MeadCo.ScriptX.Printing.header = "MeadCo's ScriptX&b:&p of &P:&bBasic Printing Sample";
    MeadCo.ScriptX.Printing.footer = "The de facto standard for advanced web-based printing";
    MeadCo.ScriptX.Printing.orientation = "landscape";
            
    // link the ui ...
    $("#print_link").click(function (e) { 
      e.preventDefault(); MeadCo.ScriptX.PrintPage(false); 
    });                           
  }
});
```
Please note that the library is not dependent upon jQuery or any other libraries.

## Quick start - ScriptX.Services for any browser

1. Link to the required libraries with service connection details
2. Initialise the library
3. Initilise print parameters

The same code will work when the add-on is present, but the add-on will be used in preference.

A promise polyfill is required if the browser does not support promises (for example Internet Explorer). 
We recommend (and test with) [Promise Polyfill](https://github.com/taylorhakes/promise-polyfill)

```javascript
<script src="https://cdn.jsdelivr.net/npm/meadco-scriptxjs@1/dist/meadco-scriptx.min.js"></script>

<!-- ScriptX Services client emulation libraries - depend on jQuery -->
<script src="/scripts/jquery-3.1.1.js"></script>

<!-- A promise library will be required if also targetting IE 11. -->
<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/scriptxprint-html@1.7/dist/meadco-scriptxservices.min.js"
        data-meadco-server="https://scriptxservices.meadroid.com" 
        data-meadco-license="xxx-xxx-xxxxxxx-xxx"></script>

<script type="text/javascript">
   $(window).on('load', function () {
     MeadCo.ScriptX.InitAsync().then(function {
       MeadCo.ScriptX.Printing.header = 
          "MeadCo's ScriptX&b:&p of &P:&bBasic Printing Sample";
       MeadCo.ScriptX.Printing.footer = 
          "The de facto standard for advanced web-based printing";
       MeadCo.ScriptX.Printing.orientation = "landscape";
       $("#btnprint").click(function() { 
            MeadCo.ScriptX.PrintPage(false);
       });
     })      
   });
</script>
```

### Resources

* [MeadCoScriptXJS Library Reference](https://meadco.github.io/MeadCoScriptXJS)

* [ScriptX.Services Client Library Reference](https://meadco.github.io/ScriptX.Print.Client)

* [Getting Started with ScriptX.Services](https://www.meadroid.com/Developers/KnowledgeBank/HowToGuides/ScriptXServices/GettingStarted)

* [ScriptX Add-on for Internet Explorer API reference](https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn).

* [ScriptX.Services on Cloud](https://scriptxservices.meadroid.com/)

* [ScriptX Services Samples - Cloud, On Premise, for Windows PC](https://scriptxprintsamples.meadroid.com/) the samples make use of MeadCoScriptXJS and ScriptX.Services.Client to deliver samples that work in any scenario with the same code.


## Copyright
Copyright © 2013-2021 [Mead & Co Ltd](http://www.meadroid.com).

## License 
**MeadCoScriptXJS** is under MIT license - http://www.opensource.org/licenses/mit-license.php

