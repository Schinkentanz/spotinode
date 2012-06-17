$(document).ready(function() {
	$.when($.ajax({
		url: '/files',
		type: 'get',
		cache: false
	})).then(function(html) {
		$('.songs').append(html);
	}, function() {
		//error
	});
});
