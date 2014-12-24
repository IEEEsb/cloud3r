$(function() {

	var files = {
		stls : {},
		gcodes : {},
		configs : {}
	};

	$('#slice').click(function(e) {

		if (activeSTL === undefined) {
			alert('Selecciona un stl mojiperro');
			return;
		}
		var params = new FormData(this);
		params.append('config_path', activeSettingsFile);
		for (var i = 0; i < activeSettings.length; i++) {
			if(activeSettings[i].value != 0)
			params.append(activeSettings[i].name.replace(new RegExp('_', 'g'), '-'), activeSettings[i].value);
		}

		$.ajax({
			url : '/slice' + activeSTL,
			data : params,
			cache : false,
			contentType : false,
			processData : false,
			type : 'POST',
			success : function(data) {
				alert(data);
			}
		});

	});

	var activeFiles;
	var activeAction;
	var activeSTL;
	var activeSettingsFile;
	var activeSettings;

	var getSTLS = function(path) {
		getFiles(path, files.stls, function(data) {
			files.stls = data;
			activeFiles = files.stls;
			activeAction = openSTL;
			showFiles();
		});
	};

	var getGcodes = function(path) {
		getFiles(path, files.gcodes, function(data) {
			files.gcodes = data;
			activeFiles = files.gcodes;
			activeAction = openGcode;
			showFiles();
		});
	};

	var getConfigs = function(path) {
		getFiles(path, files.configs, function(data) {
			files.configs = data;
			activeFiles = files.configs;
			activeAction = openConfig;
			showFiles();
		});
	};

	var openSTL = function(e) {
		activeSTL = $(e.target).closest('tr').attr('data-url');
		$('#canvas').attr('width', $('#viewer').width());
		$('#canvas').attr('height', $('#viewer').height());
		view($(e.target).closest('tr').attr('data-url'));
		return false;
	};

	var openGcode = function(e) {
		return false;
	};

	function showActiveSettings() {
		if (activeSettings === undefined)
			return;
		for (var i = 0; i < activeSettings.length; i++) {
			if ($('#' + activeSettings[i].name).prop('type') == 'checkbox') {
				$('#' + activeSettings[i].name).prop('checked', activeSettings[i].value == 1 ? true : false);
			} else
				$('#' + activeSettings[i].name).val(activeSettings[i].value);
		}
	}

	var openConfig = function(e) {
		activeSettingsFile = $(e.target).closest('tr').attr('data-url');
		$.get($(e.target).closest('tr').attr('data-url'), function(data) {
			if ( typeof (Worker) !== "undefined") {
				var worker = new Worker('/javascripts/parse_config.js');

				worker.addEventListener('message', function(e) {
					activeSettings = e.data;
					showActiveSettings();
				}, false);

				worker.postMessage(data);

			} else {
				alert('No Webworker support, sorry bro');
			}
		});
		return false;
	};

	var getFiles = function(path, array, callback) {
		$.getJSON(path, function(data) {
			array = data;
			if (callback !== undefined)
				callback(array);
		});
	};

	var showFiles = function(offset) {
		$('#files-table>tbody').empty();
		var data = activeFiles;
		var openFileFunction = activeAction;
		if (offset === undefined)
			offset = 0;
		var max_files = 8;
		var count = 0;
		var added = 0;

		for (key in data.folders) {
			if (count++ < max_files * offset)
				continue;
			if (added == max_files)
				break;
			if (!data.folders.hasOwnProperty(key))
				continue;
			var $tr = $('<tr>').attr('data-url', '/' + data.folders[key].path + '/' + data.folders[key].name);
			var $name = $('<td>').html(data.folders[key].name);
			var $size = $('<td>').html(data.folders[key].size);

			var $open = $('<a>', {
				'css' : 'disabled',
				'href' : '#'
			}).click(function(e) {
				var p = $(e.target).closest('tr').attr('data-url');
				if (p.indexOf('/stls') === 0)
					getSTLS(p);
				else if (p.indexOf('/gcodes') === 0)
					getGcodes(p);
				else if (p.indexOf('/configs') === 0)
					getConfigs(p);

			}).append('<span class="glyphicon glyphicon-folder-open"></span>');

			var $actions = $('<td>').append($open);

			$tr.append($name).append($size).append($actions);
			$('#files-table>tbody').append($tr);
			added++;
		}

		for (key in data.files) {
			if (count++ < max_files * offset)
				continue;
			if (added == max_files)
				break;
			if (!data.files.hasOwnProperty(key))
				continue;
			var $tr = $('<tr>').attr('data-url', '/' + data.files[key].path + '/' + data.files[key].name);
			var $name = $('<td>').html(data.files[key].name);
			var $size = $('<td>').html(data.files[key].size);

			var $delete = $('<a>', {
				'css' : 'disabled',
				'href' : '#'
			}).click(function() {
				return false;
			}).append('<span class="glyphicon glyphicon-trash"></span>');

			var $download = $('<a>', {
				'css' : 'disabled',
				'href' : '/' + data.files[key].path + '/' + data.files[key].name
			}).append('<span class="glyphicon glyphicon-download-alt"></span>');

			var $open = $('<a>', {
				'css' : 'disabled',
				'href' : '#'
			}).click(openFileFunction).append('<span class="glyphicon glyphicon-folder-open"></span>');

			var $actions = $('<td>').append($open).append(' | ').append($download).append(' | ').append($delete);
			$tr.append($name).append($size).append($actions);
			$('#files-table>tbody').append($tr);
			added++;
		}

		var items = data.files.length + data.folders.length;

		var pages = Math.ceil(items / max_files);
		$('#files-pagination>ul').empty();
		if (offset - 1 >= 0)
			$('#files-pagination>ul').append($('<li>').append($('<a>', {
				'href' : '#',
				'data-page' : offset - 1
			}).append('<').click(function(e) {
				showFiles($(this).attr('data-page'));
				return false;
			})));
		for (var i = 1; i <= pages; i++) {
			var item = $('<li>').append($('<a>', {
				'href' : '#'
			}).append(i).click(function(e) {
				showFiles($(this).html() - 1);
				return false;
			}));
			$('#files-pagination>ul').append(item);
		}
		if (offset + 1 < pages)
			$('#files-pagination>ul').append($('<li>').append($('<a>', {
				'href' : '#',
				'data-page' : offset + 1
			}).append('>').click(function(e) {
				showFiles($(this).attr('data-page'));
				return false;
			})));

	};

	var loaded = false;
	var viewer;
	function view(file) {
		if (!loaded) {
			loaded = true;
			var canvas = document.getElementById('canvas');
			viewer = new JSC3D.Viewer(canvas);
			viewer.setParameter('SceneUrl', file);
			viewer.setParameter('InitRotationX', -30);
			viewer.setParameter('InitRotationY', -30);
			viewer.setParameter('InitRotationZ', 0);
			viewer.setParameter('ModelColor', '#00B7FF');
			viewer.setParameter('BackgroundColor1', '#FFFFFF');
			viewer.setParameter('BackgroundColor2', '#FFFFFF');
			viewer.setParameter('RenderMode', 'flat');
			viewer.setParameter('ProgressBar', 'off');
			viewer.setParameter('Definition', 'high');
			viewer.init();
			viewer.update();
		} else {
			viewer.replaceSceneFromUrl(file);
			viewer.update();
		}
	}

	function createSettingView(setting) {
		var $input = undefined;
		if (setting.type == 'checkbox') {
			$input = $('<input>', {
				'id' : setting.name,
				'class' : 'pull-right',
				'type' : 'checkbox'
			});
		} else if (setting.type == 'list') {
			$input = $('<select>', {
				'id' : setting.name,
				'class' : 'form-control'
			});
			for (key in setting.options) {
				$input.append($('<option>', {
					'value' : setting.options[key],
					'text' : setting.options[key]
				}));
			}
		} else if (setting.type == 'number' || setting.type == 'percentage') {
			$input = $('<input>', {
				'id' : setting.name,
				'class' : 'form-control',
				'type' : 'number'
			});
		} else {
			$input = $('<input>', {
				'id' : setting.name,
				'class' : 'form-control',
				'type' : 'text'
			});
		}

		return $('<li>', {
			'class' : 'form-horizontal'
		}).append($('<div>', {
			'class' : 'form-group'
		}).append($('<label>', {
			'class' : 'col-md-6 control-label',
			'for' : setting.name
		}).html(setting.text)).append($('<div>', {
			'class' : 'col-md-6'
		}).append($input)));
	}

	function showSettings(settings) {
		$('#settings').empty();
		for (key in settings) {
			if (!settings.hasOwnProperty(key))
				continue;

			var $group = $('<div>', {
				'class' : 'col-xs-12 col-sm-4'
			}).append($('<div>', {
				'class' : 'settings-group-name'
			}).html(settings[key].name));

			var $list = $('<ul>');

			for (p in settings[key].parameters) {
				if (!settings.hasOwnProperty(key))
					continue;
				if (!settings[key].parameters.hasOwnProperty(p))
					continue;

				$list.append(createSettingView(settings[key].parameters[p]));
				$group.append($list);
				$('#settings').append($group);
			}

			showActiveSettings();
		}
	}

	/* a partir de aqui */

	getSTLS('/stls/');

	$('a.files').click(function(e) {
		e.preventDefault();
		$('#files-table>tbody').empty();
		var files = $(this).attr('id').replace('files-', '');
		if (files == 'stls')
			getSTLS('/stls/');
		else if (files == 'gcodes')
			getGcodes('/gcodes/');
		else if (files == 'configs')
			getConfigs('/configs/');
		$(this).tab('show');
	});

	$('a.settings').click(function(e) {
		e.preventDefault();
		var s = $(this).attr('id').replace('settings-', '');
		showSettings(settings_parameters[s]);
		$(this).tab('show');
	});

	var settings_parameters = {
		'print' : [{
			'name' : 'Layers and perimeters',
			'parameters' : [{
				'name' : 'layer_height',
				'text' : 'Layer height',
				'type' : 'number'
			}, {
				'name' : 'first_layer_height',
				'text' : 'First layer height',
				'type' : 'number'
			}, {
				'name' : 'perimeters',
				'text' : 'Perimeters',
				'type' : 'number'
			}, {
				'name' : 'spiral_vase',
				'text' : 'Spiral vase',
				'type' : 'checkbox'
			}, {
				'name' : 'bottom_solid_layers',
				'text' : 'Bottom solid layers',
				'type' : 'number'
			}, {
				'name' : 'top_solid_layers',
				'text' : 'Top solid layers',
				'type' : 'number'
			}, {
				'name' : 'extra_perimeters',
				'text' : 'Extra perimeters',
				'type' : 'checkbox'
			}, {
				'name' : 'avoid_crossing_perimeters',
				'text' : 'Avoid crossing perimeters',
				'type' : 'checkbox'
			}, {
				'name' : 'thin_walls',
				'text' : 'Detect thin walls',
				'type' : 'checkbox'
			}, {
				'name' : 'seam_position',
				'text' : 'Seam position',
				'type' : 'list',
				'options' : ['aligned', 'random', 'nearest']
			}, {
				'name' : 'external_perimeters_first',
				'text' : 'External perimeters first',
				'type' : 'checkbox'
			}]
		}, {
			'name' : 'Infill',
			'parameters' : [{
				'name' : 'fill_density',
				'text' : 'Fill density',
				'type' : 'perecentage'
			}, {
				'name' : 'fill_pattern',
				'text' : 'Fill pattern',
				'type' : 'list',
				'options' : ['rectilinear', 'line', 'concentric', 'honeycomb', 'hilbertcurve', 'archimedeanchords', 'octagramspiral']
			}, {
				'name' : 'solid_fill_pattern',
				'text' : 'Solid fill pattern',
				'type' : 'list',
				'options' : ['rectilinear', 'line', 'concentric', 'honeycomb', 'hilbertcurve', 'archimedeanchords', 'octagramspiral']
			}, {
				'name' : 'infill_only_where_needed',
				'text' : 'Infill only where needed',
				'type' : 'checkbox'
			}, {
				'name' : 'solid_infill_every_layers',
				'text' : 'Solid infill every',
				'type' : 'number'
			}, {
				'name' : 'fill_angle',
				'text' : 'Fill angle',
				'type' : 'number'
			}, {
				'name' : 'solid_infill_below_area',
				'text' : 'Solid infill threshold area',
				'type' : 'number'
			}, {
				'name' : 'only_retract_when_crossing_perimeters',
				'text' : 'Only retract when crossing perimeters',
				'type' : 'checkbox'
			}, {
				'name' : 'infill_first',
				'text' : 'Infill before perimeters',
				'type' : 'checkbox'
			}]
		}, {
			'name' : 'Speed',
			'parameters' : [{
				'name' : 'perimeter_speed',
				'text' : 'Perimeter',
				'type' : 'number'
			}, {
				'name' : 'small_perimeter_speed',
				'text' : 'Small perimeter speed',
				'type' : 'number'
			}, {
				'name' : 'external_perimeter_speed',
				'text' : 'External perimeter speed',
				'type' : 'number'
			}, {
				'name' : 'infill_speed',
				'text' : 'Infill',
				'type' : 'number'
			}, {
				'name' : 'solid_infill_speed',
				'text' : 'Solid infill',
				'type' : 'number'
			}, {
				'name' : 'top_solid_infill_speed',
				'text' : 'Top solid infill',
				'type' : 'number'
			}, {
				'name' : 'support_material_speed',
				'text' : 'Support material speed',
				'type' : 'number'
			}, {
				'name' : 'support_material_interface_speed',
				'text' : 'Support material interface',
				'type' : 'number'
			}, {
				'name' : 'bridge_speed',
				'text' : 'Bridges',
				'type' : 'number'
			}, {
				'name' : 'gap_fill_speed',
				'text' : 'Gap fill',
				'type' : 'number'
			}, {
				'name' : 'travel_speed',
				'text' : 'Travel',
				'type' : 'number'
			}, {
				'name' : 'first_layer_speed',
				'text' : 'First layer',
				'type' : 'number'
			}, {
				'name' : 'perimeter_acceleration',
				'text' : 'Perimeter acceleration',
				'type' : 'number'
			}, {
				'name' : 'infill_acceleration',
				'text' : 'Infill acceleration',
				'type' : 'number'
			}, {
				'name' : 'bridge_acceleration',
				'text' : 'Bridge acceleration',
				'type' : 'number'
			}, {
				'name' : 'first_layer_acceleration',
				'text' : 'First layer acceleration',
				'type' : 'number'
			}, {
				'name' : 'default_acceleration',
				'text' : 'Default acceleration',
				'type' : 'number'
			}]
		}, {
			'name' : 'Skirt and brim',
			'parameters' : [{
				'name' : 'skirts',
				'text' : 'Loops',
				'type' : 'number'
			}, {
				'name' : 'skirt_distance',
				'text' : 'Distance',
				'type' : 'number'
			}, {
				'name' : 'skirt_height',
				'text' : 'Height',
				'type' : 'number'
			}, {
				'name' : 'min_skirt_length',
				'text' : 'Minimun extrusion length',
				'type' : 'number'
			}, {
				'name' : 'brim_width',
				'text' : 'Brim width',
				'type' : 'number'
			}]
		}, {
			'name' : 'Support',
			'parameters' : [{
				'name' : 'support_material',
				'text' : 'Generate support',
				'type' : 'checkbox'
			}, {
				'name' : 'support_material_threshold',
				'text' : 'Overhang threshold',
				'type' : 'number'
			}, {
				'name' : 'support_material_enforce_layers',
				'text' : 'Enforce support for the first',
				'type' : 'number'
			}, {
				'name' : 'raft_layers',
				'text' : 'Raft layers',
				'type' : 'number'
			}, {
				'name' : 'support_material_pattern',
				'text' : 'Pattern',
				'type' : 'list',
				'options' : ['rectilinear', 'rectilinear_grid', 'honeycomb', 'pillars']
			}, {
				'name' : 'support_material_spacing',
				'text' : 'Pattern spacing',
				'type' : 'number'
			}, {
				'name' : 'support_material_angle',
				'text' : 'Pattern angle',
				'type' : 'number'
			}, {
				'name' : 'support_material_interface_layers',
				'text' : 'Interface layers',
				'type' : 'number'
			}, {
				'name' : 'support_material_interface_spacing',
				'text' : 'Interface pattern spacing',
				'type' : 'number'
			}, {
				'name' : 'dont_support_bridges',
				'text' : 'Don\'t support bridges',
				'type' : 'checkbox'
			}]
		}],
		'printer' : [{
			'name' : 'Filament',
			'parameters' : [{
				'name' : 'filament_diameter',
				'text' : 'Diameter',
				'type' : 'number'
			}, {
				'name' : 'extrusion_multiplier',
				'text' : 'Extrusion multiplier',
				'type' : 'number'
			}, {
				'name' : 'first_layer_temperature',
				'text' : 'Extruder first layer temperature',
				'type' : 'number'
			}, {
				'name' : 'temperature',
				'text' : 'Extruder temperature',
				'type' : 'number'
			}, {
				'name' : 'first_layer_bed_temperature',
				'text' : 'Bed first layer temperature',
				'type' : 'number',
			}, {
				'name' : 'bed_temperature',
				'text' : 'Bed temperature',
				'type' : 'number'
			}]
		}]
	};

	showSettings(settings_parameters.print);

});
