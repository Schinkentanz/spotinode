'use strict';

spotinode.service('ImageHelper', function($timeout, Settings, IMAGE_SIZES) {
  var imageSizes = [IMAGE_SIZES.XXL, IMAGE_SIZES.XL, IMAGE_SIZES.L, IMAGE_SIZES.M, IMAGE_SIZES.S];

  function setImage(element, image) {
    // $timeout(function() {
      element.image = image;
    // });
  }

  function getImage(element, targetSize) {
    if (element.image) { return; }

    var imageObject = element.images,
        image = imageObject && imageObject[targetSize];

    imageObject = _.filter(imageObject, function(value) {
      return !!value;
    }).length ? imageObject : null;

    if (!imageObject) {
      var cleanName = element.name.replace(/['()]/g, '');
      return setImage(element, Settings.apiPrefix + '/placeholder?text=' + encodeURIComponent(cleanName)); // jshint ignore:line
    }

    if (image) {
      return setImage(element, image); // jshint ignore:line
    }

    imageSizes.slice(imageSizes.indexOf(targetSize) + 1).forEach(function(size) {
      if (!image && imageObject[size]) {
        image = imageObject[size];
      }
    });

    setImage(element, image);
  }

  function getImages(array, targetSize) {
    array.forEach(getImage);
  }

  return {
    getImage: getImage,
    getImages: getImages
  };
});

