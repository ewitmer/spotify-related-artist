var unirest = require('unirest');
var express = require('express');
var events = require('events');
var fetch = require('node-fetch');  


var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};


var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0].id;
        var newEndPoint = "https://api.spotify.com/v1/artists/"+artist+"/related-artists";
        console.log(newEndPoint);
        fetch(newEndPoint)
        .then(function(response) {
            return response.json();
        }).then(function(body) {
            var newArtistArray = [];
            body.artists.forEach(function(element){
                newArtistArray.push(element.name);
            });
            res.json(newArtistArray);
        });
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});




app.listen(process.env.PORT || 3000);