var player = null;
$(document).ready(function() {


	var init = function() {
		
		var flow = $f('player', {
			src: '/swf/flowplayer.swf',
			wmode: 'opaque'
		}, {
			debug: false,
			plugins: {
				audio: {
					url: '/swf/flowplayer.audio.swf'
				},
				controls: {
					url: '/swf/flowplayer.controls.swf',
					fullscreen: false,
					height: 30,
					autoHide: false,
					playlist: false
				}
			},
			clip: {
				accelerated: true,
				autoBuffering: true,
				autoPlay: true,
				onBeforeBegin: function() {
					console.log('onBeforeBegin');
				},
				onStart: function(song) {
					console.log('onStart', song.metaData);
				},
				onFinish: function() {
					flow.stop();
					console.log('onFinish', flow.getState());
					if (!player.next() && player.repeat) {
						player.next();
					} else {
						bar.find('.play i').removeClass('icon-pause').addClass('icon-play');
						interval();
					}
				}
			}
		});
		
		var Player = function() {
			this.list = [];
			this.cursor = -1;
			this.repeat = false;
			this.playing = false;
			this.current = null;
			this.add = function(id) {
				this.list[this.list.length] = id;
			}
			this.remove = function(id) {
				var idx = this.list.indexOf(id);
				if (idx !== -1) {
					this.list.splice(idx, 1);
					if (this.current === id) {
						this.cursor--;
						return true;
					}
				}
			}
			this._next = function(forward) {
				forward ? this.cursor++ : this.cursor--;
				var id = this.list[this.cursor];
				flow.stopBuffering();
				flow.stop();
				if (id) {
					this.current = id;
					flow.play('/stream.mp3?file=' + id);
					return this.playing = true;
				}
				this.current = null;
				this.cursor = -1;
				return this.playing = false;
			};
			this.next = function() {
				if (!this._next(true)) {
					if (this.repeat) {
						return this._next(true);
					}
					return false;
				}
				return true;
			}
			this.prev = function() {
				if (!this._next(false)) {
					this.cursor = this.list.length;
					if (this.repeat) {
						return this._next(false);
					}
					return false;
				}
				return true;
			};
			this.play = function(id) {
				if (typeof(id) === 'string') {
					var idx = this.list.indexOf(id);
					if (idx !== -1) {
						this.cursor = idx - 1;
					} else {
						return false;
					}
				} else if (flow.isPlaying() === true) {
					flow.pause();
					return true;
				} else if (flow.isPaused() === true) {
					flow.resume();
					return true;
				}
				return this.next();
			}
			this.stop = function() {
				if (flow.isPlaying() === true) {
					this.cursor--;
				}
				flow.stopBuffering();
				flow.stop();
				this.playing = false;
				this.current = null;
			}
		};
		player = new Player();
		var bar = $('#bar');
		
		var _interval = 0;
		var interval = function(start) {
			clearInterval(_interval);
			if (start) {
				_interval = setInterval(function() {
					var clip = flow.getClip(),
						time = flow.getTime();
					if (clip) {
						bar.find('.progress .bar').css({
							width: time / clip.duration * 100 + '%'
						});
					} else {
						clearInterval(_interval);
					}
				}, 1000 / 60);
			}
		};
		
		bar.on('click', '.play', function() {
			if (player.play()) {
				$(this).find('i').toggleClass('icon-play icon-pause');
				interval(true);
			}
		}).on('click', '.stop', function() {
			player.stop();
			bar.find('.play i').removeClass('icon-pause').addClass('icon-play');
			interval();
		}).on('click', '.next', function() {
			if (!player.next()) {
				bar.find('.play i').removeClass('icon-pause').addClass('icon-play');
				clearInterval(interval);
			} else {
				bar.find('.play i').removeClass('icon-play').addClass('icon-pause');
				interval(true);
			}
		}).on('click', '.prev', function() {
			if (!player.prev()) {
				bar.find('.play i').removeClass('icon-pause').addClass('icon-play');
				clearInterval(interval);
			} else {
				bar.find('.play i').removeClass('icon-play').addClass('icon-pause');
				interval(true);
			}
		}).on('click', '.repeat', function() {
			var button = $(this);
			if (button.is('.active')) {
				$(this).removeClass('active btn-info');
				player.repeat = false;
			} else {
				$(this).addClass('active btn-info');
				player.repeat = true;
			}
		});
		
		
		$('.songs').on('click', '.add-all', function() {
			$('.songs tr[data-file] .btn').trigger('click');
		});
		$('.songs, .playlists').on('click', 'tr[data-file] .btn, li[data-file]', function(evt) {
			console.log($(this), $(evt.srcElement))
			var that = $(this),
				item = that.closest('tr, li'),
				src = $(evt.srcElement),
				id = item.data('file');
			if (that.is('.btn')) {
				player.add(id);
				if (!player.playing) {
					if (player.play(id)) {
						bar.find('.play i').toggleClass('icon-play icon-pause');
						interval(true);
					}
				}
				$('.playlists .active').append(
					$('<li />').attr('data-file', id).append(
						$('<a />').attr({
							href: '#!'
						}).append(
							$('<i />').addClass('icon-minus-sign'),
							item.children(':eq(1)').text()
						)
					)
				)
			} else if (that.is('li') && !src.is('.icon-minus-sign')) {
				player.play(id);
				interval(true);
			}
		});
		$('.playlists').on('click', '.icon-minus-sign', function() {
			var item = $(this).parent().parent();
				id = item.data('file');
			item.remove();
			if (player.remove(id)) {
				if (!player.next()) {
					bar.find('.play i').removeClass('icon-pause').addClass('icon-play');
				} else {
					bar.find('.play i').removeClass('icon-play').addClass('icon-pause');
				}
			};
		});
		
		
		
		
		
		
		
		
		/*var Playlist = function() {
			this.list = [];
			this.isPlaying = false;
			this.current = null;
			this.add = function(id, name) {
				this.list[this.list.length] = id;
				if (!this.isPlaying) {
					this.next();
				}
			};
			this.reset = function() {
				this.list = [];
				this.stop();
				player.stop();
			};
			this.remove = function(id) {
				var idx = this.list.indexOf(id);
				if (idx !== -1) {
					this.list.splice(idx, 1);
				}
				if (id == this.current) {
					player.stop();
				}
			};
			this.next = function() {
				var id = this.list[0];
				if (id) {
					this.remove(id);
					this.play(id);
				}
			};
			this.stop = function() {
				this.isPlaying = false;
			};
			this.play = function(id) {
				this.isPlaying = true;
				this.current = id;
				player.play('/stream.mp3?file=' + id);
			};
		};
		
		var playlist = new Playlist();
		
		
		
		$('.songs').on('click', 'tr[data-file]', function() {
			//var tr = $(this).closest('tr');
			var tr = $(this);
			var id = tr.data('file');
			playlist.add(id);
			$('.playlists .active').append(
				$('<li />').attr('data-file', id).append(
					$('<a />').attr({
						href: '#!'
					}).append(
						$('<i />').addClass('icon-minus-sign'),
						tr.children(':eq(1)').text()
					)
				)
			)
		});
		$('.playlists').on('click', '.active .icon-minus-sign', function(evt) {
			evt.stopPropagation();
			var li = $(this).parent().parent();
			var id = li.data('file');
			//playlist.add(tr.data('file'), tr.children(':eq(1)').text());
			li.remove();
			playlist.remove(id);
			//playlist.next();
		});
		$('.playlists').on('click', '.active li[data-file]', function(evt) {
			if (!$(e.srcElement).is('.icon-minus-sign')) {
					
				
				var li = $(this);
				var id = li.data('file');
				
				playlist.reset();
				playlist.add(id);
				
				var idx = li.index();
				var counter = 1;
				var ul = li.parent();
				var next = null;
				while (true) {
					next = ul.children().eq(idx + counter++);
					if (next.size() === 1) {
						playlist.add(next.data('file'));
					} else {
						break;
					}
				}
			}
			
		});
		$('.songs').on('click', '.add-all', function() {
			$('.songs tr[data-file]').trigger('click');
		});*/
		
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
		
		getFiles('/files', {
			cache: false
		});
		getStatus();
		
		/*
		var flash = swfobject.hasFlashPlayerVersion('10.1');
		var html5 = false;
		if (flash) {
			$f('player', {
				src: '/swf/flowplayer.swf',
				wmode: 'opaque'
			}, {
				debug: false,
				plugins: {
					audio: {
						url: '/swf/flowplayer.audio.swf'
					},
					controls: {
						url: '/swf/flowplayer.controls.swf',
						fullscreen: false,
						height: 30,
						autoHide: false,
						playlist: true
					}
				},
				clip: {
					autoPlay: true,
					onBeforeBegin: function() {
						$f().close();
					},
					onStart: function(song) {
						console.log(song.metaData);
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
		
		$('.songs, .playlists').on('click', '[data-file]', function(evt) {
			if (!$(evt.srcElement).is('.add, .icon-plus-sign, .icon-minus-sign')) {
				var path = '/stream.mp3?file=' + $(this).data('file')
				if (flash) {
					$f().play(path);
				} else if (html5) {
					$('#player').attr({
						src: path
					})
				}
			}
		});
		
		
		
		$('.songs').on('click', 'table tr[data-folder]', function() {
			getFiles('/files', {
				folder: $(this).data('folder'),
				cache: false
			});
		});
		
		
		$('.songs').on('click', '.add', function() {
			if (flash) {
				$f().addClip('/stream.mp3?file=' + $(this).closest('tr').data('file'));
			}
			$('.playlists .active').append(
				$('<li />').attr('data-file', $(this).closest('tr').data('file')).append(
					$('<a />').attr({
						href: '#!'
					}).append(
						$('<i />').addClass('icon-minus-sign'),
						$(this).closest('tr').find('td:eq(1)').text()
					)
				)
			);
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
		getStatus();*/
	};
	
	
	
	var login = $('#login');
	if (login.size() > 0) {
		login.modal({
			backdrop: true,
			keyboard: false,
			show: true
		}).on('hide', function() {
			if (!login.data('login')) {
				login.find('input').parent().removeClass('error');
				$.ajax({
					url: '/',
					cache: false,
					data: {
						name: $.trim(login.find('[name="name"]').val()),
						password: $.trim(login.find('[name="password"]').val()),
						login: true
					},
					success: function(data) {
						var _data = $(data);
						if ($(data).size() == 1 && !data.logged) {
							login.find('input').parent().addClass('error').end().val('');
						} else {
							$('.navbar-fixed-top').after(_data.filter('body > .progress, .container-fluid'));
							init();
							login.data('login', true).modal('toggle');
						}
					},
					error: function() {
						
					}
				});
				return false;
			}
		}).find('input:first').focus();
	} else {
		init();
	}
	
	
	
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
		cache: false,
		success: function(status) {
			$('body > .progress .bar').css({
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
