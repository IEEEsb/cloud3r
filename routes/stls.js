var express = require('express');
var formidable = require('formidable');
var path = require('path');
var fs = require('fs-extra');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
	res.send(global.getFiles(path.join(__dirname, '../files/stls/')));
});

router.get('/*', function(req, res) {
	var p = path.join(__dirname, '../files/stls/' + req.params[0]);
	if (fs.statSync(p).isDirectory()) {
		res.send(global.getFiles(p));
	} else {
		var file = fs.readFile(p, function read(err, data) {
			if (err) {
				throw err;
			}
			var stat = fs.statSync(p);
			res.writeHead(200, {
				'Content-Length' : stat.size,
				'Content-Type' : 'application/octet-stream',
				'Content-Disposition' : 'attachment; filename=' + path.basename(p)
			});
			res.write(data, 'binary');
			res.end();
		});
	}
});

module.exports = router;
