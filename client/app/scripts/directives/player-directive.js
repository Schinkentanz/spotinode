'use strict';

spotinode.directive('snPlayer', function($timeout, $filter, Player, PLAYER_EVENTS) {
  return {
    templateUrl: '/views/player-bar.html',
    replace: true,
    link: function(scope, elem) {

      var isMouseDown = false,
          oldProgressBarText = '';

      elem.on('mousedown touchstart', function() {
        isMouseDown = true;
        elem.addClass('no-transition');
      });

      elem.on('mouseup touchend', function() {
        isMouseDown = false;
        elem.removeClass('no-transition');
      });

      elem.on('click touchmove mousemove', '.progress', function(evt) {

        var $bar = $(this),
            clientX = evt.clientX || evt.originalEvent.touches[0].clientX,
            barOffset = $bar.offset(),
            barWidth = $bar.width();

        if (evt.type === 'mousemove' && !isMouseDown) { return; }

        Player.trigger(PLAYER_EVENTS.SET_PROGRESS, (clientX - barOffset.left) / barWidth);
        // console.log('progress click', clientX - barOffset.left, barWidth);
      });

      Player.on(PLAYER_EVENTS.PLAY, function() {
        scope.isPlaying = true;
        scope.wasPlaying = true;
      });

      Player.on(PLAYER_EVENTS.PAUSE, function() {
        scope.isPlaying = false;
      });

      function toggleProgressMarquee(text) {
        if (text === oldProgressBarText) { return; }

        oldProgressBarText = text;

        var progressBar = elem.find('.progress'),
            div = $('<div class="invisible"></div>').text(text).appendTo(progressBar),
            progressBarWidth = progressBar.width(),
            testDivWidth = div.width();

        progressBar.find('.progress-bar-primary').toggleClass('marquee', testDivWidth > progressBarWidth);

        div.remove();
      }

      Player.on(PLAYER_EVENTS.PROGRESS, function(evt, progress, preload, currentTime, duration) {
        duration = (duration * 1000).toFixed(0);
        currentTime = (currentTime * 1000).toFixed(0);

        scope.progress = progress;
        scope.preload = preload - progress;
        scope.duration = duration;
        scope.currentTime = currentTime;

        var artist = scope.title.artist,
            progressBarText = (artist && artist.name ? artist.name + ' - ' : '') + scope.title.name;

        toggleProgressMarquee(progressBarText);

        scope.progressText = [
          progressBarText,
          '–',
          $filter('duration')(currentTime, true),
          '|',
          $filter('duration')(duration, true)
        ].join(' ');
      });

      Player.on(PLAYER_EVENTS.PLAYLIST, function(evt, playlist, currentTitle) {
        var playlistPosition = 0;


        if (!playlist) { return; }

        scope.title = currentTitle;
        playlistPosition = playlist.indexOf(currentTitle);

        scope.canForward = !!playlist[playlistPosition + 1];
        scope.canBackward = !!playlist[playlistPosition - 1];
      });

      scope.canForward = false;
      scope.canBackward = false;

      scope.pause = Player.pause;
      scope.play = Player.play;
      scope.backward = Player.backward;
      scope.forward = Player.forward;

      scope.togglePlaylist = function() {
        scope.showPlaylist = !scope.showPlaylist;
      };

      scope.playlist = Player.playlist;

      function closePlaylistOnEsc(evt) {
        if ((evt.keyCode || evt.which) !== 27) { return; }

        scope.showPlaylist = false;
      }

      $(window).on('keydown', closePlaylistOnEsc);
    }
  };
});
