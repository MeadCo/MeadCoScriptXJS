#MeadCoScriptXJS

**MeadCoScriptXJS** is a simple javascript wrapper library for use with [MeadCo's ScriptX Add-on](http://scriptx.meadroid.com) for Microsoft Internet Explorer. This library has been used with our samples system for some time. 
The aim of the library is to hide differences between versions of ScriptX and provide easy access to some common functionality.
The library works with both free and licensed ScriptX. Some convenience wrappers require licensed ScriptX functionality.

##Current version
1.0.2

##NuGet Gallery
[MeadCo ScriptX JS Library](http://nuget.org/packages/MeadScriptXJS/)

##Quick start

1. Link to meadco-scriptx-1.0.2.js `<script src="meadco-scriptx-1.0.2.js"></script>`
2. Initialise the library in the document ready/window loaded event handler, and initialise printing parameters. For example, when using jQuery:

```javascript
$(document).ready(function () {
  // do stuff when DOM is ready
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

## Copyright
Copyright © 2013 [Mead & Co Ltd](http://scriptx.meadroid.com).

## License 
**MeadCoScriptXJS** is under MIT license - http://www.opensource.org/licenses/mit-license.php

