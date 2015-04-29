(function(){

  // convenience method to prevent typing document.querySelector every time
  var $ = function(selector){
    return document.querySelector(selector);
  }

  // event handler to attach to dynamically created panels.
  // the panels are created when a search occurs and returns information like title and ID,
  // we'll then re-use that ID to query for more information in this click function
  function movieBodyClickEvent() {
    var children = this.children;

    // this should be present from the search request
    var oid = this.getAttribute('data-oid');

    // loop through children to find the class we're looking for
    for(var i = 0; i < children.length; i++){
      if (children[i].className != "panel-body"){
        continue;
      }

      // if there is already content, a request has already been made to get the information
      // so there is no need to do it again.
      if (children[i].innerText != "") {
        break;
      }
      var req = new XMLHttpRequest();

      // specify the URL of the 3rd party API, encoding the search query properly
      req.open('GET', 'http://omdbapi.com/?i=' + encodeURIComponent(oid));
      req.addEventListener('load', function(res){

        // parse the response as JSON so we can easily manipulate with javascript
        var result = JSON.parse(res.target.response);

        // create the inner HTML using some bootstrap classes
        var html = [];
        html.push('<ul class="list-group">');
        for (var key in result) {
          html.push('<li class="list-group-item"><strong>' + key + '</strong>: ' + result[key] + '</li>');
        }
        html.push('</ul>');
        children[i].innerHTML = html.join('');
      });
      req.send();

      break;
    }
  }

  // event handler to attach to dynamically created favorite buttons.
  // the buttons are created when a search occurs and has a payload as a data attribute
  // that we can send to the back end to save to favorites
  function favoriteClickEvent() {
    var favoritePayload = this.getAttribute('data-favorite');
    var req = new XMLHttpRequest();
    req.open('POST', 'http://localhost:3000/favorites');
    req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    req.send(favoritePayload);
    // add the filled in star icon to replace the empty star icon to indicate state has changed
    this.children[0].className = "glyphicon glyphicon-star";
  }

  $('form').addEventListener('submit', function(e){
    // prevent the form from actually submitting to the server,
    // we'll handle what happens via javascript instead
    e.preventDefault();

    // clear any results that may already be there for a new search
    $('#search-results').innerHTML = '';

    // get the value of the search input
    var input = $('#q').value;

    // create object to make ajax request
    var req = new XMLHttpRequest();

    // specify the URL of the 3rd party API, encoding the search query properly
    req.open('GET', 'http://omdbapi.com/?s=' + encodeURIComponent(input));

    // define a callback function to fire once the request has been made
    req.addEventListener('load', function(res){
      console.log(res);

      // parse the response as JSON so we can easily manipulate with javascript
      var response = JSON.parse(res.target.response);

      // if there is an error, display it and stop processing
      if (response.Error) {
        $('#search-results').innerHTML = response.Error;
        return false;
      }

      results = response.Search;

      // loop through, outputting all of the results
      for(var i = 0; i < results.length; i++){
        // create a the result container
        var result = document.createElement('div');

        // apply some bootstrap classes
        result.className = "panel panel-default js-fetch-imdb-info";

        // save the imdbID to query for more info if a user clicks
        result.setAttribute('data-oid', results[i].imdbID);
        // register click event
        result.onclick = movieBodyClickEvent;

        // create the heading
        var heading = document.createElement('div');
        heading.className = "panel-heading";

        // create a javascript object that can be passed to our save to favorites API
        var favoritePayload = {};
        favoritePayload.oid = results[i].imdbID;
        favoritePayload.name = results[i].Title;

        // create the favorite button
        var favorite = document.createElement('button');
        favorite.setAttribute('type', 'button');
        favorite.className = "btn btn-default js-add-to-favorites";
        favorite.setAttribute('data-favorite', JSON.stringify(favoritePayload));
        favorite.onclick = favoriteClickEvent;

        // create the star glyphicon and append it to the favorite button
        var star = document.createElement('span');
        star.className = "glyphicon glyphicon-star-empty";
        star.title = "Add to favorites";
        favorite.appendChild(star);

        // create title span and append it to heading
        heading.appendChild(favorite);
        var title = document.createElement('span');
        title.innerText = results[i].Title;
        heading.appendChild(title);

        // create the body
        var body = document.createElement('div');
        body.className = "panel-body";

        // add the heading and body as children of the container
        result.appendChild(heading);
        result.appendChild(body);

        // add to search results
        $('#search-results').appendChild(result);
      }
    });
    req.send();
  });

})();
