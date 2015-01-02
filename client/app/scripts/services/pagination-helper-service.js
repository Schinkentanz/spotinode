'use strict';

spotinode.service('PaginationHelper', function($rootScope, $timeout, PAGINATION) {

  var Pagination = function(name) {
    this.name = name;
    this.limit = PAGINATION.LIMIT;
    this.max = PAGINATION.MAX;
    this.isLoading = false;
    this.currentPage = 0;
    this.total = 0;
    this.skip = 0;
    this.text = '';
    this.events = [];

    this.trigger = function(paginationEvent) {
      var args = Array.prototype.slice.call(arguments, 1),
          eventName = 'event:pagination-' + this.name + '-' + paginationEvent;

      $rootScope.$emit.apply($rootScope, [eventName].concat(args));
    };

    this.on = function(paginationEvent, callback) {
      var eventName = 'event:pagination-' + this.name + '-' + paginationEvent,
          unbindFunction = $rootScope.$on(eventName, callback);

      this.events.push(unbindFunction);
    };

    this.destroy = function() {
      this.events.forEach(function(unbindFunction) {
        unbindFunction();
      });
    };

    this.pageChanged = function() {
      var changeEvent = this.trigger.bind(this, PAGINATION.EVENTS.CHANGED);

      this.fetch().then(changeEvent);
    };

    this.setFetchFunction = function(fetchFunction) {
      this.fetchFunction = fetchFunction;
    };

    this.fetch = function(currentPage, limit) {
      var self = this;

      this.limit = limit || this.limit;

      this.isLoading = true;

      return this.fetchFunction({
        limit: this.limit,
        skip: this.limit * Math.max(0, (currentPage || this.currentPage) - 1)
      }).$promise
        .then(function(result) {
          var elements = result.data,
              limit = self.limit = result.limit,
              total = self.total = result.total,
              skip = self.skip = result.skip;

          self.currentPage = Math.max(0, skip / limit) + 1;
          self.isLoading = false;

          self.text = [
            skip,
            ' - ',
            Math.min(skip + limit, total),
            ' of ',
            total
          ].join('');

          self.trigger(PAGINATION.EVENTS.FETCHED, elements);

          return elements;
        });
    };

  };

  function create(name) {
    return new Pagination(name);
  }

  return {
    create: create
  };
});
