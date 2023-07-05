const multer = require("multer");

function MugglException(message, data = { code: 400, description: "Bad Request" }) {
    this.message = message;
    this.name = 'MugglException';
    this.data = data;
}
exports.MugglException = MugglException;
exports.handleError = (err, req, res, next) => {
    if(err instanceof MugglException){
        res.send(err.data);
    }else{
        res.send({ code: 400, description: "Bad Request hd" });
    }
}
