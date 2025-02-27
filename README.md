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

**MeadCoScriptXJS** is a JavaScript library that provides a wrapper around 
MeadCo's ScriptX functionality. ScriptX is a solution for consistent printing from web browsers, 
available in two forms: [ScriptX Add-on (for Internet Explorer) and ScriptX Services (for any browser)](https://www.meadroid.com).

This library has been used with our samples system for some time. 

The aim of the library is to hide differences between versions of ScriptX and provide easy access to some common functionality.
The library works with both free and licensed ScriptX. Some convenience wrappers require licensed ScriptX functionality.

### Key Components

The library is organized into two main namespaces:

1. **MeadCo.ScriptX** - Wraps the core printing functionality
2. **MeadCo.Licensing** - Handles license management

#### Core Functionality

The `MeadCo.ScriptX` namespace provides core functionality:

##### Connection Types

The library supports two connection modes:
- `ADDON`: Direct connection to ScriptX Add-on in IE
- `SERVICE`: Connection to ScriptX.Services for cross-browser compatibility

##### Initialization
The library provides multiple initialization methods:
- `MeadCo.ScriptX.Init()` - Synchronous initialization (deprecated)
- `MeadCo.ScriptX.InitAsync()` - Asynchronous initialization using promises
- `MeadCo.ScriptX.StartAsync()` - Complete initialization including services connection and print settings

##### Printing Functions
The library includes wrappers for common printing tasks:
- `PrintPage()` - Print the current document
- `PrintFrame()` - Print a specific frame
- `BackgroundPrintURL()` - Download and print HTML from a URL
- `BackgroundPrintHTML()` - Print provided HTML content
- `DirectPrintString()` - Send raw data directly to a printer
- `PreviewPage()` - Preview the document before printing

##### Dialog Functions
Functions to launch printing-related dialogs:
- `PageSetup()` - Configure page settings
- `PrintSetup()` - Configure printer settings

##### Utility Functions
- `GetAvailablePrinters()` - List available printers
- `GetComponentVersion()` - Get component version information
- `WaitForSpoolingComplete()` - Wait for print jobs to complete
- `CloseWindow()` - Close window after ensuring print jobs complete

##### Browser Compatibility
The library handles differences between:
- Synchronous operations in ScriptX Add-on
- Asynchronous operations in ScriptX.Services
- Provides promise-based wrappers to unify APIs

#### Licensing Module

The `MeadCo.Licensing` namespace provides functionality to:
- Initialize the licensing system
- Check if the current document is properly licensed
- Report licensing errors

#### Modern vs Legacy Support

The library provides two API patterns:
1. Traditional callback-based methods (e.g., `PrintPage()`)
2. Promise-based methods (e.g., `PrintPage2()`) for modern asynchronous code

The code is designed to be backward compatible with older browsers while also supporting modern JavaScript practices when available.

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

## Quick start - ScriptX.Services for any browser

1. Link to the required libraries with service connection details
2. Initialise the library
3. Initilise print parameters

The same code will work when the add-on is present and the add-on will be used in preference (applies to IE 11 only)

```javascript
<script src="https://cdn.jsdelivr.net/npm/meadco-scriptxjs@1/dist/meadco-scriptx.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/scriptxprint-html@1.7/dist/meadco-scriptxservices.min.js"
        data-meadco-server="https://scriptxservices.meadroid.com" 
        data-meadco-license="xxx-xxx-xxxxxxx-xxx"></script>

<script>
window.addEventListener('load', async function() {
  try {
    await MeadCo.ScriptX.InitAsync();
    
    // Configure printing parameters
    MeadCo.ScriptX.Printing.header = 
      "MeadCo's ScriptX&b:&p of &P:&bBasic Printing Sample";
    MeadCo.ScriptX.Printing.footer = 
      "The de facto standard for advanced web-based printing";
    MeadCo.ScriptX.Printing.orientation = "landscape";
    
    document.querySelector("#btnprint").addEventListener('click', function() {
      // print page without showing the print dialog
      MeadCo.ScriptX.PrintPage(false);
    });
  } catch(error) {
    console.error("Failed to initialize ScriptX:", error);
  }
});
</script>
```

## Quick start for working with ScriptX Add-on only

1. Link to meadco-scriptx.js `<script src="https://cdn.jsdelivr.net/npm/meadco-scriptxjs@1/dist/meadco-scriptx.min.js"></script>`
2. Initialise the library in the document ready/window loaded event handler, and initialise printing parameters. For example, when using jQuery:

For those functions that return a Promise a promise polyfill is required if the browser does not support promises (for example Internet Explorer). 
We recommend (and test with) [Promise Polyfill](https://github.com/taylorhakes/promise-polyfill)


```javascript
<script src="https://cdn.jsdelivr.net/npm/meadco-scriptxjs@1/dist/meadco-scriptx.min.js"></script>

<script>
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
</script>
```
Please note that the library is not dependent upon jQuery or any other libraries.


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

