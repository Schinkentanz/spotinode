$(document).ready(function() {
	getFiles();

	$('.songs').on('click', 'td', function() {
		getFiles($(this).data('path'));
	})

	$('.search-query').keyup(function(event) {
		getSuggestions($(this).val());
	});

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

var getSuggestions = function(search) {
	$.when($.ajax({
		url : '/search',
		type : 'get',
		cache : false,
		data : {
			search : search ? search : ''
		}
	})).then(function(html) {
		$('.songs').empty().append(html);
	}, function() {
		//error
	});
}
