'use strict';

spotinode.filter('duration', function() {
  return function(duration, full) {
    var minutes = Math.floor(duration / 1000 / 60),
        seconds = Math.floor(duration / 1000 - 60 * minutes);

    seconds = ('00' + seconds).slice(- 2);
    if (full) { minutes = ('00' + minutes).slice(- 2); }

    minutes = minutes || '0';

    return minutes + ':' + seconds;
  };
});
