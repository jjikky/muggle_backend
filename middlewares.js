const routes = require("./routes");

exports.localsMiddleware = (req, res, next) => {
    res.set("Content-Security-Policy", "");
    res.locals.siteName = "spcial order";
    res.locals.routes = routes;
    res.locals.loggedUser = req.user || null;
    next();
};
