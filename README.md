# MeadCoScriptXJS

**MeadCoScriptXJS** is a simple javascript wrapper library for use with [MeadCo's ScriptX Add-on/Services](http://scriptx.meadroid.com) for Microsoft Internet Explorer and any browser on any device. This library has been used with our samples system for some time. 

The aim of the library is to hide differences between versions of ScriptX and provide easy access to some common functionality.
The library works with both free and licensed ScriptX. Some convenience wrappers require licensed ScriptX functionality.

As of version 1.2.0 this library facilitates being able to write the same code for both the [ScriptX Add-on](http://scriptx.meadroid.com) for Internet Explorer and [MeadCo's ScriptX Services](https://scriptx.services.meadroid.com) browser agnostic printing services in the cloud and on premise. The dependency on the [ScriptX Service Client Library](https://github.com/MeadCo/ScriptX.Print.Client) is required for this to work.

1.4.0 Adds support for async in ScriptX Services

## Current version
1.5.0

## Packages

### NuGet Gallery
[MeadCo ScriptX JS Library](http://nuget.org/packages/MeadScriptXJS/)

### NPM (inc. Yarn)

npm install meadco-scriptxjs --save

## Quick start Add-on only

1. Link to meadco-scriptx.js `<script src="meadco-scriptx.js"></script>`
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

## Quick start - browser indepenent services

1. Link to the required libraries with service connection details
2. Initialise the library
3. Initilise print parameter

The same code will work when the add-on is present, but the add-on will be used in preference.

```javascript
<script src="/scripts/meadco-scriptx.js"></script>

<!-- ScriptX Services client emulation libraries - depend on jQuery -->
<script src="/scripts/jquery-3.1.1.js"></script>

<script src="/scripts/MeadCo.ScriptX/core.js"></script>
<script src="/scripts/MeadCo.ScriptX/scriptxprint.js"></script>
<script src="/scripts/MeadCo.ScriptX/scriptxprinthtml.js"></script>
<script src="/scripts/MeadCo.ScriptX/scriptxfactory.js" 
        data-meadco-server="https://scriptx.services.meadroid.com" 
        data-meadco-license="xxx-xxx-xxxxxxx-xxx"></script>
<script src="/scripts/MeadCo.ScriptX/scriptxlicense.js"></script>

<!-- A promise library will be required if targetting IE. -->
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
## Copyright
Copyright © 2013-2017 [Mead & Co Ltd](http://scriptx.meadroid.com).

## License 
**MeadCoScriptXJS** is under MIT license - http://www.opensource.org/licenses/mit-license.php

