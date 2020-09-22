### Current version {@packageversion}

## Background

Back in 2013 the MeadCoScriptXJS library originated as a project to provide a wrapper layer between client javascript and a prototype browser plug-in
for Firefox - before binary plug-ins were finally consigned to the dust-bin. Starting in 2013, this library took the approach 
of &quot;namespaces&quot; / static classes, which were popular(-ish) then as a means of ensuring no clashes of names etc. 

The library found use as a general and convenient wrapper of commonly used functions in ScriptX.Addon and so a significant amount of customer code has been written that relies upon this library. 
By definition there is only ever one instance of ScriptX.Addon on a page and therefore a static singleton javascript 'class' instance is perfectly adequate.

It is also known and acknowleged that much code utilising ScriptX.Addon predates React, Angular, Vue etc. etc. and exists in a world of 
relatively un-complex page operations; a "print button" and some code to set print parameters 
and then print (though the back-end code generating HTML to be printed was likely complex and comprehensive).

This library implements the following static objects/classes:

* MeadCo
* MeadCo.ScriptX
* MeadCo.ScriptX.Utils
* MeadCo.ScriptX.Printing
* MeadCo.Licensing
* MeadCo.Licensing.LicMgr

The &quot;trick&quot; here was that MeadCo.ScriptX.Utils was pointed to &quot;factory&quot;, MeadCo.ScriptX.Printing was pointed to &quot;factory.printing&quot; and MeadCo.Licensing.LicMgr pointed to &quot;secmgr&quot;.

MeadCo.ScriptX.Printing therefore exposed the entire [ScriptX printing API](https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/printing), 
MeadCo.ScriptX.Utils exposed the [ScriptX 'factory' API](https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/ScriptXAddOn/factory) and 
MeadCo.ScriptX.Licensing.LicMgr exposed the [ScriptX licensing API](https://www.meadroid.com/Developers/KnowledgeBank/TechnicalReference/SecurityManager/api).

MeadCo.ScriptX is an object providing for verified initialisation and a number of functions that wrapped common operations into a simpler API. So, for example:

```javascript
<script type="text/javascript">
   $(window).on('load', function () {
     if ( MeadCo.ScriptX.Init() (
     {
        $("#info").text("ScriptX version: " + MeadCo.ScriptX.GetComponentVersion("scriptx.factory"));
        MeadCo.ScriptX.Printing.header = 
          "MeadCo's ScriptX&b:&p of &P:&bBasic Printing Sample";
        MeadCo.ScriptX.Printing.footer = 
          "The de facto standard for advanced web-based printing";
        MeadCo.ScriptX.Printing.orientation = "landscape";
        $("#btnprint").click(function() { 
            MeadCo.ScriptX.PrintPage(false);
     }      
   });
</script>
```

MeadCo.Licensing is an object providing for checking that a license is ready and available on the page with error messages available to describe failures.

## Supporting ScriptX.Services 

The final &quot;trick&quot; is that if MeadCo.ScriptX.Printing is pointed to an implementation of the .Addon API in javascript and that 
implementation uses the ScriptX.Services API to perform printing then code using the MeadCoScriptXJS library will work with .Addon and .Services with no changes 
in simple cases and few changes in more complex cases.


