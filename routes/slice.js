var express = require('express');
var formidable = require('formidable');
var path = require('path');
var fs = require('fs-extra');
var sys = require('sys');
var exec = require('child_process').exec;

var config = require('konphyg')(__dirname + "/../config");
var config = config.all();
var child;

var router = express.Router();

router.post('/*', function(req, res) {
	var form = new formidable.IncomingForm();
	// form.keepExtensions = true;
	//keep file extension
	console.log(new Date().getTime());
	form.parse(req, function(err, fields, files) {
		res.writeHead(200, {
			'content-type' : 'text/plain'
		});
		
		console.log(new Date().getTime());
		

		var origin = './files/' + req.params[0];
		var dest = origin.replace('stls', 'gcodes').replace('.stl', '.gcode'); //TODO esto esta yendo muy mal
		
		if (!fs.existsSync('./files/' + req.params[0])) {
			return;
			//TODO TRATAR;
		}

		var command = config.settings.slic3r + ' ' + origin + ' --output ' + dest + ('config_path' in fields ? ' --load ' + path.join(__dirname, '../files' + fields.config_path) : '');

		for (var key in fields) {
			if (key != 'path' && key != 'config_path' && key != 'store') {
				command += ' --' + key + ' \'' + fields[key] + '\'';
			}
		}

		console.log(command);

		child = exec(command, function(error, stdout, stderr) {
			sys.print('stdout: ' + stdout);
			sys.print('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
			}
		});

		if ('config_path' in fields && fs.existsSync(path.join(__dirname, '../files/configs/' + fields.config_path)) && fields.store == 'true') {
			fs.readFile(path.join(__dirname, '../files/configs/' + fields.config_path), 'utf8', function(err, data) {
				if (err) {
					return console.log(err);
				}
				for (var key in fields) {
					if (key != 'path' && key != 'config_path' && key != 'store') {
						var k = key.replace('-', '_');
						var reg = new RegExp('^' + k + " = [a-zA-Z0-9.%;, \\\\\\[\\]_]*", "gm");
						data = data.replace(reg, k + ' = ' + fields[key]);
					}
				}

				fs.writeFile(path.join(__dirname, '../files/configs/' + fields.config_path), data, 'utf8', function(err) {
					if (err)
						return console.log(err);
				});
			});
		}

		res.end();
	});
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
		console.log("lastModifiedDate: " + JSON.stringify(files.file.lastModifiedDate));

		//Formidable changes the name of the uploaded file
		//Rename the file to its original name

		if (!fs.existsSync('./files/stls/' + fields.path)) {
			fs.mkdirSync('./files/stls/' + fields.path);
		}

		if (!fs.existsSync('./files/gcodes/' + fields.path)) {
			fs.mkdirSync('./files/gcodes/' + fields.path);
		}

		fs.rename(files.file.path, './files/stls/' + fields.path + '/' + files.file.name, function(err) {
			if (err)
				throw err;
			console.log('renamed complete');

			var origin = './files/stls/' + fields.path + '/' + files.file.name;
			var dest = './files/gcodes/' + fields.path + '/' + path.basename(files.file.name, path.extname(files.file.name)) + '.gcode';

			var command = config.settings.slic3r + ' ' + origin + ' --output ' + dest + ('config_path' in fields ? ' --load ' + path.join(__dirname, '../files/configs/' + fields.config_path) : '');

			for (var key in fields) {
				if (key != 'path' && key != 'config_path' && key != 'store') {
					command += ' --' + key + ' ' + fields[key];
				}
			}

			console.log(command);

			child = exec(command, function(error, stdout, stderr) {
				sys.print('stdout: ' + stdout);
				sys.print('stderr: ' + stderr);
				if (error !== null) {
					console.log('exec error: ' + error);
				}
			});

			if ('config_path' in fields && fs.existsSync(path.join(__dirname, '../files/configs/' + fields.config_path)) && fields.store == 'true') {
				fs.readFile(path.join(__dirname, '../files/configs/' + fields.config_path), 'utf8', function(err, data) {
					if (err) {
						return console.log(err);
					}
					for (var key in fields) {
						if (key != 'path' && key != 'config_path' && key != 'store') {
							var k = key.replace('-', '_');
							var reg = new RegExp('^' + k + " = [a-zA-Z0-9.%;, \\\\\\[\\]_]*", "gm");
							data = data.replace(reg, k + ' = ' + fields[key]);
						}
					}

					fs.writeFile(path.join(__dirname, '../files/configs/' + fields.config_path), data, 'utf8', function(err) {
						if (err)
							return console.log(err);
					});
				});
			}

		});

		res.end();
	});
});

module.exports = router;
