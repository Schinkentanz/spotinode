'use strict';

spotinode.directive('snCard', function(CardHelper) {
  return {
    link: function(scope, card) {

      function closeCard() {
        scope.isClosing = true;
        CardHelper.closeCard(card)
          .then(function() {
            // ?!?!?!?
          });
      }

      function openCard(source, closeCallback) {
        return CardHelper.positionCard(source, card, closeCallback);
      }

      scope.closeCard = closeCard;
      scope.openCard = openCard;

      scope.$on('$destroy', CardHelper.toggleCardOpenClass.bind(null, false));
    }
  };
});
