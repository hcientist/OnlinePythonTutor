/*

Online Python Tutor
https://github.com/pgbovine/OnlinePythonTutor/

Copyright (C) 2010-2014 Philip J. Guo (philip@pgbovine.net)

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


// simplified version of opt-frontend.js for ../composingprograms.html


// Pre-reqs:
// - pytutor.js
// - jquery.ba-bbq.min.js
// - jquery.ba-dotimeout.min.js // for event debouncing: http://benalman.com/code/projects/jquery-dotimeout/examples/debouncing/
// - opt-frontend-common.js
// - js/togetherjs/togetherjs-min.js
// should all be imported BEFORE this file


var originFrontendJsFile = 'composingprograms.js';


var postSessionSurvey = '\n\
<div id="postSessionSurveyDiv" style="border: 1px solid #C2382F; padding: 5px; margin-top: 5px; line-height: 175%;">\n\
<span style="font-size: 8pt; color: #666;">Support our research by answering these questions before you leave:</span><br/>\n\
How useful was this particular session? (click star to rate)\n\
<span class="star-rating togetherjsIgnore">\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="1"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="2"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="3"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="4"/><i></i>\n\
  <input type="radio" class="togetherjsIgnore" name="rating" value="5"/><i></i>\n\
</span>\n\
<br/>\
What did you just learn? <input type="text" id="what-learned" class="surveyQ togetherjsIgnore" size=60 maxlength=140/>\n\
<button id="submitSessionSurveyBtn" type="button" style="font-size: 8pt;">Submit</button>\n\
</div>'


function TogetherjsReadyHandler() {
  populateTogetherJsShareUrl();
  $("#togetherjsStatus").append(postSessionSurvey);

  updateChatName();
}

function TogetherjsCloseHandler() {
  // NOP
}


function executeCode(forceStartingInstr, forceRawInputLst) {
    if (forceRawInputLst !== undefined) {
        rawInputLst = forceRawInputLst; // UGLY global across modules, FIXME
    }

    backend_script = python3_backend_script; // Python 3

    var backendOptionsObj = {cumulative_mode: ($('#cumulativeModeSelector').val() == 'true'),
                             heap_primitives: false,
                             show_only_outputs: false,
                             py_crazy_mode: false,
                             origin: originFrontendJsFile};

    var startingInstruction = forceStartingInstr ? forceStartingInstr : 0;

    var frontendOptionsObj = {startingInstruction: startingInstruction,
                              executeCodeWithRawInputFunc: executeCodeWithRawInput,
                              updateOutputCallback: function() {$('#urlOutput,#embedCodeOutput').val('');},
                              compactFuncLabels: true,
                             }

    executePythonCode(pyInputCodeMirror.getValue(),
                      backend_script, backendOptionsObj,
                      frontendOptionsObj,
                      'pyOutputPane',
                      enterDisplayMode, handleUncaughtExceptionFunc);
}

$(document).ready(function() {
  $('#signoutButton').click(signout);

  genericOptFrontendReady(); // initialize at the very end
});


var chatDisplayName = null; // sign in with Google account to get your real chat name

// for Google+ Web signin:
// https://developers.google.com/+/web/signin/add-button
function signinCallback(authResult) {
  if (authResult) {
    if (authResult['error'] == undefined){

      $("#signinButton").hide();
      $("#loggedInDiv").show();

      // This sample assumes a client object has been created.
      // To learn more about creating a client, check out the starter:
      //  https://developers.google.com/+/quickstart/javascript
      gapi.client.load('plus','v1', function() {
        var request = gapi.client.plus.people.get({
          'userId': 'me'
        });
        request.execute(function(resp) {
          // From https://developers.google.com/+/web/people/#retrieve_an_authenticated_users_email_address

          // Filter the emails object to find the user's primary account, which might
          // not always be the first in the array. The filter() method supports IE9+.
          var email = resp['emails'].filter(function(v) {
            return v.type === 'account'; // Filter out the primary email
          })[0].value; // get the email from the filtered results, should always be defined.

          //alert('Real name: "' + resp.displayName + '", Email addr: "' + email + '"');

          // if we can actually grab the display name (e.g., from a
          // Google+ account), then use it
          if (resp.displayName) {
            chatDisplayName = resp.displayName;
            updateChatName();
          }

          // otherwise try to look up the email address on the server to
          // find a real name mapping on the server
          else if (email) {
            $.get('name_lookup.py',
                  {email : email},
                  function(data) {
                    // fall back on email address
                    chatDisplayName = data.name ? data.name : email;
                    updateChatName();
                  },
                  "json");
          }
        });
      });

    } else {
      console.log('signinCallback: error occurred');
    }
  } else {
    console.log('signinCallback: empty authResult');  // Something went wrong
  }
}

function updateChatName() {
  if (chatDisplayName) {
    $("#loggedInNameDisplay").html("Welcome, " + chatDisplayName);

    if (TogetherJS.running) {
      var p = TogetherJS.require("peers");
      p.Self.update({name: chatDisplayName});
      console.log('updateChatName:', p.Self.name);
    }
  }
}

// adapted from https://developers.google.com/+/quickstart/javascript
/**
 * Calls the OAuth2 endpoint to disconnect the app for the user.
 */
function signout() {
  chatDisplayName = null;
  if (supports_html5_storage()) {
    localStorage.removeItem('togetherjs.settings.name'); // purge from cache

    // restore the default name
    if (TogetherJS.running) {
      var defaultName = $.parseJSON(localStorage.getItem('togetherjs.settings.defaultName'));
      var p = TogetherJS.require("peers");
      p.Self.update({name: defaultName});
    }
  }

  var tok = gapi.auth.getToken();
  if (tok) {
    // Revoke the access token.
    $.ajax({
      type: 'GET',
      url: 'https://accounts.google.com/o/oauth2/revoke?token=' +
          tok.access_token,
      async: false,
      contentType: 'application/json',
      dataType: 'jsonp',
      success: function(result) {
        $('#signinButton').show();
        $('#loggedInDiv').hide();
      },
      error: function(e) {
        console.log(e);
      }
    });
  }
  else {
    console.log('signout failed :(');
  }
}
