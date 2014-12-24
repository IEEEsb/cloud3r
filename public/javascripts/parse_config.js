self.addEventListener('message', function(e) {
	var data = e.data.split('\n');
	var array = [];
	var splitted;
	for (var i = 0; i < data.length; i++) {
		splitted = data[i].split(' = ');
		if(splitted.length == 2)
		array.push({
			'name' : splitted[0],
			'value' : splitted[1]
		});
	}
	self.postMessage(array);
	self.close();
}, false); 