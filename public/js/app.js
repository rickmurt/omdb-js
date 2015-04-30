(function(){
  // we'll use this to control the logic flow
  document.querySelector('form').addEventListener('submit', function(e){
    // prevent the form from actually submitting to the server,
    // we'll handle what happens via javascript instead
    e.preventDefault();

    // get the value of the search input
    var input = document.querySelector('#q').value;

    // create object to make ajax request
    var req = new XMLHttpRequest();

    // specify the URL of the 3rd party API, encoding the search query properly
    req.open('GET', 'http://omdbapi.com/?s=' + encodeURIComponent(input));

    // check for errors when trying to contact the 3rd party API
    // this is different from an error returned by the API (like movie not found).
    // this would occur if the API were down, for example
    req.addEventListener('error', function(res){
      updateSearchResults('Error reaching OMDb API');
    });

    // define a callback function to fire once the request has been made
    req.addEventListener('load', function(res){
      // parse the response as JSON so we can easily manipulate with javascript
      var response = JSON.parse(res.target.response);

      // if there is an error, display it and stop processing
      // this would be an error actually returned by the API
      if (response.Error) {
        updateSearchResults(response.Error);
        return false;
      }

      // the API response is wrapped in "Search", we're only concerned about that
      var html = generateResultsHtml(response.Search);

      // update the search results with the generated html.  we just take an array
      // and concatenate it all together as a string with no spaces or characters in between.
      updateSearchResults(html.join(''));

      // register add to favorites click event to all add to favorites buttons
      var favoritesButtons = document.querySelectorAll('.js-add-to-favorites');
      for (var i = 0; i < favoritesButtons.length; i++){
        var button = favoritesButtons[i];
        button.addEventListener('click', favoriteClickEvent);
      }

      // register fetch API info click event to all headers
      var headers = document.querySelectorAll('.js-fetch-imdb-info');
      for (var i = 0; i < headers.length; i++){
        var header = headers[i];
        header.addEventListener('click', fetchMovieBodyClickEvent);
      }
    });

    // finally, send the request
    req.send();
  });

  function updateSearchResults(html){
    document.querySelector('#search-results').innerHTML = html;
  }

  // event handler to attach to dynamically created panels.
  // the panels are created when a search occurs and returns information like title and ID,
  // we'll then re-use that ID to query for more information in this click function
  function fetchMovieBodyClickEvent(e){
    var children = this.children;

    // this should be present from the search request
    var oid = this.getAttribute('data-oid');

    // loop through children to find the class we're looking for
    for(var i = 0; i < children.length; i++){
      // if this child is anything other than panel-body, we don't care about it and can continue
      // since there could be multiple classes, we check to see if the className string contains
      // the class that we're looking for
      if (children[i].className.indexOf("panel-body") == -1){
        continue;
      }

      // if there is already content, a request has already been made to get the information
      // so there is no need to do it again.
      if (children[i].innerText != "") {
        break;
      }

      // make a new request
      var req = new XMLHttpRequest();

      // specify the URL of the 3rd party API, encoding the search query properly
      req.open('GET', 'http://omdbapi.com/?i=' + encodeURIComponent(oid));

      // check for errors when trying to contact the 3rd party API
      // this is different from an error returned by the API (like movie not found).
      // this would occur if the API were down, for example
      req.addEventListener('error', function(res){
        children[i].innerHTML = 'Error reaching OMDb API';
      });

      req.addEventListener('load', function(res){

        // parse the response as JSON so we can easily manipulate with javascript
        var result = JSON.parse(res.target.response);

        // create the inner HTML using some bootstrap classes
        var html = [];
        html.push('<ul class="list-group">');
        // we'll just push all of the data we're returned from the API
        // separating keys (like "Year" or "Genre") with values (like the actual year or name of genre)
        for (var key in result) {
          html.push('<li class="list-group-item"><strong>' + key + '</strong>: ' + result[key] + '</li>');
        }
        html.push('</ul>');
        // we just take an array and concatenate it all together as a string with no spaces or characters in between.
        children[i].innerHTML = html.join('');
      });
      req.send();

      break;
    }
  }

  // event handler to attach to dynamically created favorite buttons.
  // the buttons are created when a search occurs and has a payload as a data attribute
  // that we can send to the back end to save to favorites
  function favoriteClickEvent(e){
    // make a new request, and send the data-favorite object to the backend API to save
    // to favorites
    var favoritePayload = this.getAttribute('data-favorite');
    var req = new XMLHttpRequest();
    req.open('POST', 'http://localhost:3000/favorites');
    // tell the server we're sending application/json (remember we set that in server.js with bodyParser.json())
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    req.send(favoritePayload);
    // add the filled in star icon to replace the empty star icon to indicate state has changed
    this.children[0].className = "glyphicon glyphicon-star";
  }

  // created this as a separate function because the search results can be updated
  // in a bunch of different places, and those places shouldn't have to be aware
  // of the query selector to complete the update
  function updateSearchResults(html){
    // using innerHTML rather than createElement because it's much faster
    // https://jsperf.com/innerhtml-vs-createelement-test/30
    document.querySelector('#search-results').innerHTML = html;
  }

  // loop through, building html for our search-results div
  // created this as a separate function because this function
  // shouldn't be concerned about the implementation of how it got the results (the xhr below)
  // only that it has some results, and that it'll have some data
  function generateResultsHtml(results){
    var html = [];
    for(var i = 0; i < results.length; i++){
      // create a javascript object that can be passed to our save to favorites API
      var favoritePayload = {};
      favoritePayload.oid = results[i].imdbID;
      favoritePayload.name = results[i].Title;

      // create a search result container with a heading and body. we should save the imdbID to the header
      // so that when we click on it, we can easily use that to query the API later
      html.push('<div class="panel panel-default js-fetch-imdb-info" data-oid="' + results[i].imdbID + '">');
        // heading should contain a button to add to favorites, and the title of the movie
        html.push('<div class="panel-heading">');
          // notice the escaped quote for data-favorite, as proper JSON always has double quotes
          html.push('<button type="button" class="btn btn-default js-add-to-favorites" data-favorite=\'' + JSON.stringify(favoritePayload) + '\'>');
            html.push('<span class="glyphicon glyphicon-star-empty" title="Add to favorites"></span>');
          html.push('</button>');
          html.push('<span>' + results[i].Title + '</span>');
        html.push('</div>');
        html.push('<div class="panel-body"></div>');
      html.push('</div>');
    }
    return html;
  }

// wrapping all functionality into an IIFE (Immediately-Invoked Function Expression) to not allow these functions
// to leak outside of this code block
})();
