'use strict';

spotinode.service('Player', function($rootScope, $timeout, Settings, PLAYER_EVENTS) {

  var audio = new Audio(),
      playlist = [],
      currentTitle = null,
      isPlaying = false,
      isPaused = false;

  function triggerProgress() {
    var preloadEnd = audio.buffered.end(0),
        duration = audio.duration,
        currentTime = audio.currentTime,
        progress = currentTime / duration * 100,
        preload = preloadEnd / duration * 100;

    trigger(PLAYER_EVENTS.PROGRESS, progress, preload, currentTime, duration);
  }

  function triggerPlaylist() {
    trigger(PLAYER_EVENTS.PLAYLIST, playlist, currentTitle);
  }

  function on(eventName, callback) {
    $rootScope.$on('event:player-' + eventName, callback);
  }

  function trigger(eventName) {
    var args = Array.prototype.slice.call(arguments, 1);
    $timeout(function() {
      $rootScope.$emit.apply($rootScope, ['event:player-' + eventName].concat(args));
    });
  }

  function stop() {
    audio.currentTime = 0;
    audio.pause();
    trigger(PLAYER_EVENTS.PAUSE);
  }

  function play(force, toPlay) {
    if (!playlist.length) { return; }

    if (!force && isPlaying) {
      audio.play();
      isPaused = false;
      trigger(PLAYER_EVENTS.PLAY);
      return true;
    }

    if (force && !toPlay) { return false; }
    if (force) { currentTitle = toPlay; }

    var currentPosition = !currentTitle ? 0 : playlist.indexOf(currentTitle),
        title = playlist.slice(currentPosition)[0];

    isPlaying = true;
    isPaused = false;
    $rootScope.currentTitle = currentTitle = title;

    audio.src = Settings.apiPrefix + '/title/' + currentTitle.slug;

    audio.play();

    triggerPlaylist();
    trigger(PLAYER_EVENTS.PLAY);

    return true;
  }

  function resetPlayer() {
    isPlaying = false;
    currentTitle = null;
  }

  function pause() {
    audio.pause();
    isPaused = true;
    trigger(PLAYER_EVENTS.PAUSE);
  }

  function forward() {
    var currentPosition = playlist.indexOf(currentTitle);

    return play(true, playlist[++currentPosition]);
  }

  function backward() {
    var currentPosition = playlist.indexOf(currentTitle);

    play(true, playlist[--currentPosition]);
  }

  function addToPlaylist(title) {
    if (playlist.indexOf(title) === -1) {
      playlist.push(title);
      triggerPlaylist();
    }
  }

  function clearPlaylist() {
    while (playlist.length) { playlist.pop(); }
    triggerPlaylist();
  }

  function playTitle(title) {
    if (playlist.indexOf(title) < 0) {
      clearPlaylist();
      addToPlaylist(title);
      resetPlayer();
      play();
    } else {
      play(true, title);
    }
  }

  function playTitles(titles) {
    clearPlaylist();
    titles.forEach(addToPlaylist);
    resetPlayer();
    play();
  }

  // audio.autoplay = true;

  audio.ontimeupdate = triggerProgress;
  audio.onprogress = triggerProgress;
  audio.onended = function() {
    if (!forward()) {
      stop();
    }
  };

  on(PLAYER_EVENTS.SET_PROGRESS, function(evt, percentage) {
    audio.currentTime = audio.duration * percentage;
  });

  return {
    on: on,
    play: play,
    pause: pause,
    trigger: trigger,
    forward: forward,
    backward: backward,
    playlist: playlist,
    playTitle: playTitle,
    playTitles: playTitles,
    addToPlaylist: addToPlaylist
  };
});
