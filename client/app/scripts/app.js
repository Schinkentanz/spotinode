'use strict';

var spotinode = angular.module('spotinode', [
  'ngRoute',
  'ngResource',
  'ngAnimate',
  'angular-loading-bar',
  'cfp.loadingBar',
  'afkl.lazyImage',
  'angularSpinner',
  'ui.bootstrap.pagination',
  'mgcrea.ngStrap.helpers.dimensions',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.popover'
]);

spotinode.config(function($routeProvider, cfpLoadingBarProvider, usSpinnerConfigProvider) {

  $routeProvider
    .when('/artists/:page?/:artist?',  {
      controller: 'ArtistsOverviewCtrl',
      templateUrl: '/views/artists-overview.html'
    })
    .when('/albums/:page?/:album?',  {
      controller: 'AlbumsOverviewCtrl',
      templateUrl: '/views/albums-overview.html'
    })
    .when('/titles/:page?',  {
      controller: 'TitlesOverviewCtrl',
      templateUrl: '/views/titles-overview.html'
    })
    .otherwise('/artists');

  cfpLoadingBarProvider.latencyThreshold = 0;
  cfpLoadingBarProvider.includeSpinner = false;

  usSpinnerConfigProvider.setDefaults({
    lines: 15,
    length: 0,
    width: 2,
    radius: 20,
    corners: 1,
    rotate: 0,
    direction: 1,
    color: '#000',
    speed: 1.1,
    trail: 100,
    shadow: false,
    hwaccel: true
  });

}).run(function($rootScope, $timeout, $location, $route, Player) {

  $rootScope.$on('$routeChangeSuccess', function () {
    $timeout(function() {
      $('html, body').animate({
        scrollTop: 0
      }).trigger('scroll');
    });
  });

  $rootScope.$on('event:update-viewport', function () {
    var width = window.innerWidth || document.body.clientWidth,
        screenSM = 768,
        screenMD = 992,
        screenLG = 1200;

    $rootScope.viewport = {
      width: width,

      isXS: width < screenSM,
      isGtXS: width >= screenSM,

      isSM: width >= screenSM && width < screenMD,
      isGtSM: width >= screenMD,

      isLtMD: width < screenMD,
      isMD: width >= screenMD && width < screenLG,
      isGtMD: width >= screenLG,

      isLtLG: width < screenLG,
      isLG: width >= screenLG
    };

    $rootScope.$emit('event:viewport-updated', $rootScope.viewport);
  });

  var timeout = null;
  $(window).on('load resize orientationchange', function (evt) {
    $timeout.cancel(timeout);
    timeout = $timeout(function () {
      $rootScope.$emit('event:update-viewport');
    }, evt.type === 'load' ? 0 : 100);
  }).trigger('resize');



  $rootScope.stopPropagation = function(evt) {
    evt.stopPropagation();
  };

  $rootScope.isBoxView = true;
  $rootScope.toggleListBoxView = function() {
    $rootScope.isBoxView = !$rootScope.isBoxView;
  };


  var original = $location.path;
  $location.path = function (path, reload) {
    if (reload === false) {
      var lastRoute = $route.current,
          un = null;

      un = $rootScope.$on('$locationChangeSuccess', function () {
        $route.current = lastRoute;
        un();
      });
    }
    return original.apply($location, [path]);
  };

  $rootScope.playTitles = Player.playTitles;
  $rootScope.playTitle = Player.playTitle;
});
