var URL = 'https://status.heroku.com/api/v3/';
var UI = require('ui');
var ajax = require('ajax');

var main = new UI.Card({
  title: 'Heroku Status',
  body: 'Fetching...',
  titleColor: 'purple',
});

main.show();

var envMapper = { 'Production': 'Prod', 'Development': 'Dev' };
var status = {};
var issues = [];

function displayMain() {
  var body = '';
  Object.keys(status).forEach(function(key) {
    var label = envMapper[key];
      
    body = body + '\n' + (!label ? key : label) + ': ' + status[key];  
  });
    
  main.body(body);
}

function loadData(callback, errorback) {
  var currentStatusURL = URL + 'current-status';
  ajax(
    {
      url: currentStatusURL,
      type: 'json'
    },
    function(data) {
      // Success!
      console.log('Successfully fetched Heroku current-status payload!');
      
      status = data.status;  
      issues = data.issues; // default issues to an issues included with current-status
      callback();
      
      // load more issues in the background
      var date = new Date();
      date.setDate(date.getDate() - 1);
      
      var issuesURL = URL + 'issues?since='+date.toISOString()+'&limit=25';
      ajax({
        url: issuesURL,
        type: 'json'
      },
      function(data) {
        console.log('Successfully fetched Heroku issues payload!');
        issues = data;
      },
      function (error) {
        // Failure!
        var message = 'Failed fetching Heroku issues payload: ' + error;
        console.log('ERROR:', issuesURL);
        console.log(message);
      });
    },
    function(error) {
      // Failure!
      var message = 'Failed fetching Heroku current-status payload: ' + error;
      
      if (errorback !== undefined) errorback(message);
      
      console.log('ERROR:', currentStatusURL);
      console.log(message);
    }
  );
}

loadData(displayMain, function(message) {
  main.body(message);
});

var issueNumber = -1;

function displayIssue(inc) {
  issueNumber = issueNumber + inc;
  console.log('Requesting issue number:', issueNumber);
  
  var issue = issues[issueNumber];
  console.log('Issue details:', JSON.stringify(issue));
  
  if (issue === undefined) {
    issueNumber = -1;
    displayMain();
    return;
  }

  main.body(issue.title + '\nLast Update:\n' + issue.updates[0].contents);
}

main.on('click', 'up', function() {
  displayIssue(-1);
});

main.on('click', 'down', function() {
  displayIssue(1);
});

main.on('click', 'select', function(e) {
  loadData(displayMain, function(message) {
    main.body(message);
  });
});
