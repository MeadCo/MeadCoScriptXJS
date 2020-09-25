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
        public FileStreamResult Script(string filename)
        {
            string absoluteName = Path.Combine(HostingEnvironment.MapPath("~"), Path.Combine("..\\src", filename));
            Stream fileStream = new FileStream(absoluteName, FileMode.Open);
            return File(fileStream, "application/javascript");
        }

    }
}