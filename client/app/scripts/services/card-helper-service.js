'use strict';


spotinode.service('CardHelper', function($rootScope, $q, $timeout) {

  function closeCardOnEsc(evt) {
    if ((evt.keyCode || evt.which) !== 27) { return; }

    $('.card:last .close').trigger('click');
  }

  function toggleCardOpenClass(show) {

    if (!show) {
      show = $('.card').length > 1;
    }

    $rootScope.showBackdrop = show;
    $('body').toggleClass('card-open', show);
  }

  function applySourcePosition(source, card) {
    var realSource = source.is('.box') ? source.find('.background') : source,
        sourceOffset = realSource.offset(),
        scrollOffset = $(document).scrollTop(),
        winHeight = $(window).innerHeight(),
        topPos = sourceOffset.top - scrollOffset;

    card.css({
      top: topPos,
      left: sourceOffset.left,
      width: realSource.outerWidth(),
      bottom: winHeight - (topPos + source.height())
    });

    card.offset();

    return card;
  }

  function positionCard(source, card, closeCardCallback) {
    var cardData = card.data(),
        deferred = $q.defer();

    applySourcePosition(source, card)
      .addClass('positioned');

    toggleCardOpenClass(true, true);

    cardData.source = source;
    cardData.callback = closeCardCallback;

    $timeout(function() {
      deferred.resolve();
    });

    return deferred.promise;
  }

  function finalizePosition(card) {
    var deferred = $q.defer();

    $timeout(function() {
      card.css({
        width: '',
        bottom: '',
        top: '',
        left: ''
      }).one('transitionend', deferred.resolve);
    });

    return deferred.promise;
  }

  function closeCard(card) {
    var cardData = card.data(),
        deferred = $q.defer();

    applySourcePosition(cardData.source, card)
      .one('transitionend', function() {
        var callback = cardData.callback;

        card.removeClass('positioned');

        toggleCardOpenClass(false);

        if ($('.card').length === 1) {
          $rootScope.$emit('event:closed-card', card);
        }

        callback && callback();

        deferred.resolve();
      });

    return deferred.promise;
  }

  $(window).on('keydown', closeCardOnEsc);

  return {
    closeCard: closeCard,
    positionCard: positionCard,
    finalizePosition: finalizePosition,
    toggleCardOpenClass: toggleCardOpenClass
  };
});
