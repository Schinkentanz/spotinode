$(document).ready(function() {
	
	$('.songs').on('click', 'tr', function() {
		if ($(this).data('stream')) {
			$('audio').attr({
				src: '/stream?path=' + $(this).data('path')
			});
		}
	});
	$('.songs').on('click', 'td', function() {
		getFiles('/files', {
			path: $(this).data('path'),
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
			getFiles('/files');
		}
	});
	getFiles('/files');
	
	
	$('.btn-primary').on('click', function() {
		$.ajax({
			url: '/files/index',
			success: function(status) {
				if (status.success || status.indexing) {
					getStatus();
				}
			}
		});
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
			});
			if (status.indexing) {
				setTimeout(getStatus, 1000);
			}
		}
	});
}
