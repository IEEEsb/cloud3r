var express = require('express');
var formidable = require('formidable');
var path = require('path');
var fs = require('fs-extra');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
	res.send(global.getFiles(path.join(__dirname, '../files/configs')));
});

router.post('/', function(req, res) {
	var form = new formidable.IncomingForm();
	//Formidable uploads to operating systems tmp dir by default
	// form.uploadDir = "./files/configs";       //set upload directory
	form.keepExtensions = true;
	//keep file extension

	form.parse(req, function(err, fields, files) {
		res.writeHead(200, {
			'content-type' : 'text/plain'
		});
		res.write('received upload:\n\n');
		console.log("form.bytesReceived");
		//TESTING
		console.log("file size: " + JSON.stringify(files.file.size));
		console.log("file path: " + JSON.stringify(files.file.path));
		console.log("file name: " + JSON.stringify(files.file.name));
		console.log("file type: " + JSON.stringify(files.file.type));
		console.log("astModifiedDate: " + JSON.stringify(files.file.lastModifiedDate));

		//Formidable changes the name of the uploaded file
		//Rename the file to its original name

		if (!fs.existsSync('./files/configs/' + fields.path)) {
			fs.mkdirSync('./files/configs/' + fields.path);
		}

		fs.rename(files.file.path, './files/configs/' + fields.path + '/' + files.file.name, function(err) {
			if (err)
				throw err;
			console.log('renamed complete');
		});
		res.end();
	});
});

router.get('/*', function(req, res) {
	var p = path.join(__dirname, '../files/configs/' + req.params[0]);

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
				'Content-Type' : 'text/plain',
				'Content-Disposition' : 'attachment; filename=' + path.basename(p)
			});
			res.write(data, 'utf-8');
			res.end();
		});
	}
});

module.exports = router;
