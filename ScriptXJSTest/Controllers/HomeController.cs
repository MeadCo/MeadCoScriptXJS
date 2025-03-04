using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;
using System.Web.Mvc;

namespace ScriptXJSTest.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult AsyncAddon()
        {
            return View();
        }

        public ActionResult AsyncService()
        {
            return View();
        }

        public ActionResult AsyncService2()
        {
            return View();
        }


        public ActionResult SyncService()
        {
            return View();
        }

        [HttpGet]
        public FileStreamResult Script(string filename,bool minified=false)
        {
            string scriptFilename = string.Empty;

            if (minified)
            {
                // Insert ".min" before the ".js" at the end of the filename
                string minifiedFilename = Path.GetFileNameWithoutExtension(filename) + ".min" + Path.GetExtension(filename);
                scriptFilename = Path.Combine("..\\dist", minifiedFilename);
            }
            else
            {
                scriptFilename = Path.Combine("..\\src", filename);
            }

            Stream fileStream = new FileStream(Path.Combine(HostingEnvironment.MapPath("~"), scriptFilename), FileMode.Open);
            return File(fileStream, "application/javascript");
        }

    }
}