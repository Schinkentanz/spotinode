$(document).ready(function() {
	
	var flash = swfobject.hasFlashPlayerVersion('10.1');
	var html5 = false;
	if (flash) {
		$f('player', '/swf/flowplayer.swf', {
			debug: true, 
			plugins: {
				audio: {
					url: '/swf/flowplayer.audio.swf'
				},
				controls: {
					url: '/swf/flowplayer.controls.swf',
					fullscreen: false,
					height: 30,
					autoHide: false
				}
			},
			clip: {
				autoPlay: false,
				onBeforeBegin: function() {
					$f().close();
				}
			}
		})
	} else if ($('html').hasClass('audio')) {
		html5 = true;
		$('#player').replaceWith(
			$('<audio />').attr({
				id: 'player',
				controls: true,
				autoplay: true
			})
		)
	}
	
	$('.songs').on('click', 'table tr[data-file]', function() {
		var path = '/stream.mp3?file=' + $(this).data('file')
		if (flash) {
			$f().play(path);
		} else if (html5) {
			$('#player').attr({
				src: path
			})
		}
	});
	
	
	
	$('.songs').on('click', 'table tr[data-folder]', function() {
		getFiles('/files', {
			folder: $(this).data('folder'),
			cache: false
		});
	});
	
	
	
	
	
	
	
	$('.search-query').keyup(function(event) {
		var val = $.trim($(this).val());
		if (val !== '') {
			getFiles('/search', {
				search: val,
				cache: false
			});
		} else {
			getFiles('/files', {
				cache: false
			});
		}
	}).submit(function() {
		return false;
	});
	
	
	
	
	
	$('#index').on('click', function() {
		$.ajax({
			url: '/files/index',
			success: function(status) {
				if (status.success || status.indexing) {
					getStatus();
				}
			}
		});
	});
	
	
	
	getFiles('/files', {
		cache: false
	});
	getStatus();
});

var getFiles = function(url, data) {
	$.when($.ajax({
		url : url,
		type : 'get',
		cache : false,
		data : data
	})).then(function(html) {
		$('.songs').empty().append(html);
	}, function() {
		//error
	});
};

var getStatus = function() {
	$.ajax({
		url: '/files/status',
		success: function(status) {
			$('.progress .bar').css({
				width: status.indexing ? status.percentage + '%' : 0
			}).parent().animate({
				top: status.indexing ? 0 : -18
			});
			if (status.indexing) {
				setTimeout(getStatus, 1000);
			}
		}
	});
}
