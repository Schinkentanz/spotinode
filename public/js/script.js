var player = null;
$(document).ready(function() {


    var init = function() {
        
        var bar = $('#bar'),
            prev = bar.find('.prev'),
            play = bar.find('.play'),
            next = bar.find('.next'),
            stop = bar.find('.stop'),
            repeat = bar.find('.repeat'),
            progress = bar.find('.progress > .bar');
        
        
        // window.audio = $('audio').get(0);
        window.audio = new Audio();
        audio.controls = true;
        audio.autoplay = false;
        audio.loop = false;
        
        audio.addEventListener('timeupdate', function(e) {
            progress.css({
                width: audio.currentTime / audio.duration * 100 + '%'
            });
        });
        audio.addEventListener('loadedmetadata', function(e) {
            console.log('loadedmetadata', e);
        });
        audio.addEventListener('canplaythrough', function(e) {
            console.log('canplaythrough');
            audio.play();
        });
        audio.addEventListener('play', function(e) {
            console.log('play');
            play.find('i').toggleClass('icon-play', false).toggleClass('icon-pause', true);
        });
        audio.addEventListener('pause', function(e) {
            console.log('pause');
            play.find('i').toggleClass('icon-pause', false).toggleClass('icon-play', true);
        });
        audio.addEventListener('ended', function(e) {
            console.log('ended');
            audio.currentTime = 0;
        });
        audio.addEventListener('seeking', function(e) {
            console.log('seeking');
        });
        audio.addEventListener('seeked', function(e) {
            console.log('seeked');
        });
        
        play.on('click', function() {
            player.play();
        });
        prev.on('click', function() {
            player.prev();
        });
        next.on('click', function() {
            player.next();
        });
        stop.on('click', function() {
            player.stop();
        });
        repeat.on('click', function() {
            var button = $(this),
                active = button.is('.active');
            button.toggleClass('active btn-info', player.repeat = !active);
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
                audio.pause();
                if (id) {
                    this.current = id;
                    audio.src = '/stream.mp3?file=' + id;
                    audio.play();
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
                } else if (!audio.paused) {
                    audio.pause();
                    return true;
                } else if (audio.paused) {
                    audio.play();
                    return true;
                }
                return this.next();
            }
            this.stop = function() {
                audio.currentTime = 0;
                audio.pause();
                this.playing = false;
                this.current = null;
            }
        };
        window.player = new Player();
        
        
        
        
        $('.songs').on('click', '.add-all', function() {
            $('.songs tr[data-file] .btn').trigger('click');
        });
        $('.songs, .playlists').on('click', 'tr[data-file] .btn, li[data-file]', function(evt) {
            var that = $(this),
                item = that.closest('tr, li'),
                src = $(evt.srcElement),
                id = item.data('file');
            if (that.is('.btn')) {
                player.add(id);
                if (!player.playing) {
                    player.next();
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
        
        /*
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
                    if (!player.next()) {
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
                        console.log(time, clip.duration, flow.getStatus().time);
                    } else {
                        clearInterval(_interval);
                    }
                }, 1000);
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
        */
        
        
        
        
        
        
        
        
        
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
                            $('.navbar-fixed-top').after(_data.filter('.progress, .container-fluid'));
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
