$(document).ready(function() {
	getFiles('/files');
	$('.songs').on('click', 'td', function() {
		getFiles('/files', {
			path: $(this).data('path')
		});
	});

	$('.search-query').keyup(function(event) {
		getFiles('/search', {
			search: $(this).val()
		});
	});
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
