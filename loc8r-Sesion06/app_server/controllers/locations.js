var request = require('request');

var apiOptions = {
  server : "http://localhost:3000"
};


var _isNumeric = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

var _formatDistance = function (distance) {
  var numDistance, unit;
  if (distance && _isNumeric(distance)) {
    if (distance > 1) {
      numDistance = parseFloat(distance).toFixed(1);
      unit = 'km';
    } else {
      numDistance = parseInt(distance * 1000,10);
      unit = 'm';
    }
    return numDistance + unit; 
  } else {
    return "?";
  }
};

var _showError = function (req, res, status) {
  var title, content;
  if (status === 404) {
    title = "404, page not found";
    content = "Oh dear. Looks like we can't find this page. Sorry.";
  } else if (status === 500) {
    title = "500, internal server error";
    content = "How embarrassing. There's a problem with our server.";
  } else {
    title = status + ", something's gone wrong";
    content = "Something, somewhere, has gone just a little bit wrong.";
  }
  res.status(status);
  res.render('generic-text', {
    title : title,
    content : content
  });
};

var renderHomePage = function(req, res, responseBody){
  var message;
  
  if (!(responseBody instanceof Array)) {
    message = "API lookup error";
    responseBody = [];
  } else {
    if (!responseBody.length) {
      message = "No places found nearby";
    }
  }
  res.render('locations-list', {
    title: 'Loc8r - find a place to work with wifi',
    pageHeader: {
      title: 'Loc8r',
      strapline: 'Find places to work with wifi near you!'
    },
    sidebar: "Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you're looking for.",
    locations: responseBody,
    message: message
  });
};

var renderDetailPage = function (req, res, responseBody) {
  res.render('location-info', {
    title: 'Location Info',
    pageHeader: {title: responseBody.name},
    sidebar: {
      context: 'is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.',
      callToAction: 'If you\'ve been and you like it - or if you don\'t - please leave a review to help other people just like you.'
    },
    location: responseBody
  });
};

var renderReviewForm = function(err, res, responseBody){
    res.render('location-review-form', 
        { title: 'Add Review', 
        location : responseBody});    
};


/* GET 'home' page */
module.exports.homelist = function(req, res){
  var requestOption, path;
  var lng = req.query.lng, 
      lat = req.query.lat;

  if (lng && lat)
  {
    path = '/api/locations/' + lng + '/' + lat ;
    requestOption = {
        url : apiOptions.server + path,
        method : 'GET',
        json : {},
        qs :{
         lng : lng,
         lat : lat
        } 
    };
  }
  else {
     path = '/api/locations' ;
    requestOption = {
        url : apiOptions.server + path,
        method : 'GET',
        json : {},
    };

  }

  request(requestOption, function(err,response,body){
    var i, data;

    data = body;
    
    if (response.statusCode === 200 && data.length > 0)
    {
       if (lng && lat) 
        for (i=0; i<data.length; i++) 
         data[i].distance = _formatDistance(data[i].distance);
        
    } 
    renderHomePage(req, res, data);
  });

};


/* GET 'Location info' page */
module.exports.locationInfo = function(req, res){
  
  var requestOption, path;

  path = '/api/locations/' + req.params.locationid;
  requestOption = {
    url : apiOptions.server + path,
    method : 'GET',
    json : {},
  };

  request(requestOption, function(err,response,body){
    
    var data;

    data = body;

     data.coords = {
        lng : body.coords[0],
        lat : body.coords[1]
    }; 

    renderDetailPage(req, res, body);

  });

};

/* GET 'Add review' page */
module.exports.addReview = function(req, res){
  var requestOption, path;

  path = '/api/locations/' + req.params.locationid;
  requestOption = {
    url : apiOptions.server + path,
    method : 'GET',
    json : {},
  };

  request(requestOption, function(err,response,body){
    renderReviewForm(req, res, body);
  }); 
};


/* POST 'Add review' page */
module.exports.doAddReview = function(req, res){
  var requestOption, path;
  var postData = {
        author : req.body.name,
        rating : req.body.rating,
        reviewText: req.body.review
    };

  path = '/api/locations/' + req.params.locationid + '/reviews';
  requestOption = {
    url : apiOptions.server + path,
    method : 'POST',
    json : postData
  };

  request(requestOption, function(err,response,body){
    if (response.statusCode === 201) {
        res.redirect('/location/' + req.params.locationid);
    }

  });
};