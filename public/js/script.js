$(document).ready(function() {
	getFiles();

	$('.songs').on('click', 'td' , function() {
		getFiles($(this).data('path'));		
	})
});

var getFiles = function(path) {
	$.when($.ajax({
		url : '/files',
		type : 'get',
		cache : false,
		data : {
			path : path ? path : ''
		}
	})).then(function(html) {
		$('.songs').append(html);
	}, function() {
		//error
	});
};
