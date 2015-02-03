'use strict';

var fs = require('fs');
var d3 = require('d3');
var request = require('request');
var cheerio = require('cheerio');

var seatProbability = 'http://electionforecast.co.uk/tables/predicted_probability_by_seat.html';
var seatResult = 'http://electionforecast.co.uk/tables/predicted_vote_by_seat.html';
var format = d3.time.format('%Y-%m-%d');

var constituencies = makeLookup(d3.tsv.parse( fs.readFileSync('constituency-lookup.tsv','utf-8') ), 'name');

console.log(format(new Date()));
//seat probability
request(seatProbability, function (error, response, body) {
  if (!error && response.statusCode === 200) {
    fs.writeFileSync('forecast-data/html/probability-'+format(new Date()), body);
    toTSV(body,'forecast-data/tsv/probability-'+format(new Date()));
  }
});

//predicted results
request(seatResult, function (error, response, body) {
  if (!error && response.statusCode === 200) {
    fs.writeFileSync( 'forecast-data/html/prediction-'+format(new Date()), body );
    toTSV( body,'forecast-data/tsv/prediction-'+format(new Date()) );
  }
});


function toTSV(body, file){
  var $ = cheerio.load(body);
  var rows = [];
  $('tr').each(function(i,d){
    var row = [];
    $(d).find('td,th').each(function(j,e){
      row.push( $(e).text() );
    });
    rows.push(row);
  });

  rows = d3.tsv.parse( d3.tsv.formatRows(rows) );
  rows = addID(rows);

  if(file){
    fs.writeFileSync( file, d3.tsv.format(rows) );
  }
  return rows;
}

function makeLookup(array, property){
  var lookup = {};
  array.forEach(function(d,i){
    lookup[d[property]] = d;
  });
  return lookup;
}

function addID(array){
  return array.map(function(d,i){
     d.id = constituencies[d.Seat].id;
     d.current = constituencies[d.Seat].currentholder;
     return d;
  });
}
