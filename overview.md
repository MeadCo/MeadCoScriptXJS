Once you know what is available, working with ScriptX to achieve controlled printing of html/xhtml documents in Internet Explorer is reasonably simple.

When working with ScriptX, the use of properties and methods can be thought of as 'namespaced' to factory.printing - assuming you follow the common naming convention. Within that 'namespace' there are properties such as headers, footers, orientation, margin, units of measure, page range to print etc. etc. and then there are methods to print; print\(\) and printHTML\(\).

There are some operations that require a few lines of script to wrap functionality into a more usable form - for example:

* obtaining the list of installed printers,
* checking that a license has been accepted,
* checking that ScriptX is available,
* obtaining version numbers of installed components.

This MeaCo ScriptX JS Library is used throughout our samples to simplify common tasks and to hide the few minor differences there are between different versions of ScriptX. Our samples also make use of jQuery to build the UI but the library has no dependency on jQuery.

The library is free to use and deploy, and works with both free and licensed ScriptX. Obviously use of licensed functionality on ScriptX still requires a license.

