"use strict";
(function() {

  var EMAILS = []; // replace all of these emails with email aliases
  var EMAILS_REDEEMED = []; // unless email is found in here

  // -------------------------------
  // data handling

  // parse emails from string and set EMAILS
  var setEmails = function(emailsString) {
    if(!emailsString) EMAILS = [];

    var emails = emailsString.split('\n');
    var emailsLength = emails.length;
    if(emailsLength > 0) {
      for(var i=0; i < emailsLength; i++) {
        emails[i] = emails[i].trim();
        if(emails[i] != '') EMAILS.push(emails[i]);
      }
    } else {
      EMAILS = [];
    }
  }

  // restore state
  chrome.storage.sync.get('emails', function(items) {
    setEmails(items.emails);
  });

  // monitor updates on options pages
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(changes.hasOwnProperty('emails')) {
      setEmails(changes.emails.newValue);
    }
  });
  

  // -------------------------------
  // build nice hostname 
  // @todo code cleanup!

  // https://gist.github.com/eduardocereto/3043239
  // Always return top level domain
  // i.e. google.com.au, google.com (no subdomains)
  var getHostnameWithTLD = function(){
    var i,h,
    weird_cookie='__top_level=cookie',
    hostname = document.location.hostname.split('.');
    for(i=hostname.length-1; i>=0; i--) {
      h = hostname.slice(i).join('.');
      document.cookie = weird_cookie + ';domain=.' + h + ';';
      if(document.cookie.indexOf(weird_cookie)>-1){
        document.cookie = weird_cookie.split('=')[0] + '=;domain=.' + h + ';expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        return h;
      }
    }
    return '';
  }

  var hostname = window.location.hostname;

  var hostnameWithTLD = getHostnameWithTLD();

  if(hostnameWithTLD != '') {
    var _hostnameWithTLD = hostnameWithTLD.split('.');
    if(_hostnameWithTLD.length >= 2) {
      var _2ndLevelDomain = _hostnameWithTLD.shift();
      var _tld = _hostnameWithTLD.join('.');
      var _xLevelDomains = window.location.hostname.replace(hostnameWithTLD, '').replace(/\.$/, '');
      
      // console.log("_2ndLevelDomain", _2ndLevelDomain);
      // console.log("_tld", _tld); 
      // console.log("_xLevelDomains", _xLevelDomains); 

      if(_xLevelDomains == 'www') {
        hostname = _2ndLevelDomain;  
      } else {
        if(_xLevelDomains != '') {
          hostname = _xLevelDomains + '.' + _2ndLevelDomain;  
        } else {
          hostname = _2ndLevelDomain;
        }
      }
    }
  }

  // sanitize
  hostname = hostname.replace(/\./g, '-').replace(/[^a-z0-9-]/ig, '');


  // -------------------------------

  // replace email with email alias
  var processInput = function(string) {
    
    // @todo extract all emails from string (this would support textarea fields i.e.)
    var foundEmails = [string];

    var foundEmailsLength = foundEmails.length;
    if(foundEmailsLength > 0) {
      for(var i=0; i < foundEmailsLength; i++) {
        var email = foundEmails[i];
        if(!~EMAILS_REDEEMED.indexOf(email) && ~EMAILS.indexOf(email)) {
          EMAILS_REDEEMED.push(email);
          var emailAlias = email.replace(/@/, '+' + hostname + '@');
          string = string.replace(new RegExp(email), emailAlias);
          // console.log("changed", email, "to", emailAlias, "hostname:", hostname);
        }
      }
    }
    return string;
  };

  var eventHandler = function(event) {
    var element = event.target;

    // consider INPUT dom elements
    if(element.tagName == 'INPUT') {

      // consider <input type="text"> elements
      if(~['text', 'email'].indexOf(element.getAttribute('type')) || element.getAttribute('type') === null) {
        element.value = processInput(element.value);
      }
    }
    // else if(element.tagName == "TEXTAREA") {
    //   element.value = processInput(element.value);
    // }
  }


  // add event listener to body
  document.body.addEventListener('change', eventHandler);

})();