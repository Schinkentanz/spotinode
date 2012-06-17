$(document).ready(function() {
	getFiles();

	$('.songs').on('click', 'td' , function() {
		getFiles($(this).data('path'));		
	})
});

var getFiles = function(path) {
	$.when($.ajax({
		url : '/files',
		type : 'post',
		cache : false,
		data : {
			path : path ? path : ''
		}
	})).then(function(html) {
		log(html)
		$('.songs').empty().append(html);
	}, function() {
		//error
	});
};
