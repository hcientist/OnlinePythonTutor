// Codeopticon learner interface. Include on a page AFTER AFTER AFTER
// opt-frontend-common.js and opt-frontend.js
//
// assumes that an empty #chat_div div exists on the webpage page,
// preferably on the BOTTOM.
// also requires jquery.ui.chatbox-LEARNER.js and jquery.ui.chatbox-LEARNER.css

/* TODOs:

*/

var codeopticonSocketIO = undefined; // socket.io instance
var codeopticonSession = undefined;
//var codeopticonSession = 'CODEOPTICON_TESTING'; // to turn all monitoring on
var codeopticonUsername = undefined; // what should your username appear as in the observer's display?

var reconnectAttempts = 0;
var logEventQueue = []; // TODO: make sure this doesn't grow too large if socketio isn't enabled
var chatBox = undefined;


function createChatBox() {
  assert(!chatBox);
  chatBox = $("#chat_div").chatbox({id: "Me",
                                    user: {key : "value"},
                                    title: "Live Chat With Tutor",
                                    width: 250,
                                    offset: 2, // offset from right edge
                                    messageSent: chatMsgSent,
                                    boxClosed: chatBoxClosed,
                                    chatboxToggled: chatBoxToggled,
                                  });
}

function chatMsgSent(id, user, msg) {
  $("#chat_div").chatbox("option", "boxManager").addMsg(id, msg);
  logEventCodeopticon({type: 'opt-client-chat',
                       text: msg,
                       sid: codeopticonSocketIO ? codeopticonSocketIO.id : undefined
                      });
}

// only called when the user hits the X button to explicitly close the chat box
function chatBoxClosed(id) {
  logEventCodeopticon({type: 'opt-client-chat',
                       text: '[closed chat box]',
                       sid: codeopticonSocketIO ? codeopticonSocketIO.id : undefined
                      });
}

// called when the user toggles the chat box open or close
function chatBoxToggled(visible) {
  var msg = '[minimized chat box]';
  if (visible) {
    msg = '[maximized chat box]';
  }
  logEventCodeopticon({type: 'opt-client-chat',
                       text: msg,
                       sid: codeopticonSocketIO ? codeopticonSocketIO.id : undefined
                      });
}

function initCodeopticon() {
  // only initialize if you have a valid session ID
  if (!codeopticonSession) {
    return;
  }

  // hide header elements only if we're not doing CODEOPTICON_TESTING
  if (codeopticonSession !== 'CODEOPTICON_TESTING') {
    $("#ssDiv,#surveyHeader,#sharedSessionDisplayDiv").hide();
    $("#togetherjsStatus").css("font-size", "8pt");
    $("#togetherjsStatus").html("Codeopticon session " + codeopticonSession);
  }

  // connect on-demand in logEventCodeopticon(), not here
  codeopticonSocketIO = io('http://104.237.139.253:5000/userlog'); // PRODUCTION_PORT
  //codeopticonSocketIO = io('http://104.237.139.253:5001/userlog'); // DEBUG_PORT
  //codeopticonSocketIO = io('http://localhost:5000/userlog'); // localhost debugging

  if (codeopticonSocketIO) {
    codeopticonSocketIO.on('connect', function() {
      //console.log('CONNECTED and emitting', logEventQueue.length, 'events');

      if (logEventQueue.length > 0) {
        // the reconnectAttempts field that denotes how many times you've
        // attempted to reconnect (which is also how many times you've
        // been kicked off by the logging server for, say, being idle).
        // add this as an extra field on the FIRST event
        if (reconnectAttempts > 0) {
          logEventQueue[0].reconnectAttempts = reconnectAttempts;
        }

        while (logEventQueue.length > 0) {
          codeopticonSocketIO.emit('opt-client-event', logEventQueue.shift() /* FIFO */);
        }
      }
      assert(logEventQueue.length === 0);

      reconnectAttempts++;
    });

    codeopticonSocketIO.on('opt-codeopticon-observer-chat', function(msg) {
      if (!chatBox) {
        createChatBox();
      } else {
        $("#chat_div").chatbox("option", "hidden", false);
        $("#chat_div").chatbox("showContent");
      }

      $("#chat_div").chatbox("option", "boxManager").addMsg('Tutor', msg.text);
    });
  }
}

// using socket.io:
function logEventCodeopticon(obj) {
  //console.log(obj);
  if (codeopticonSocketIO) {
    assert(codeopticonSession);
    obj.codeopticonSession = codeopticonSession;

    obj.user_uuid = supports_html5_storage() ? localStorage.getItem('opt_uuid') : undefined,
    obj.session_uuid = sessionUUID;

    // this probably won't match the server time due to time zones, etc.
    obj.clientTime = new Date().getTime();

    if (codeopticonSocketIO.connected) {
      codeopticonSocketIO.emit('opt-client-event', obj);
      //console.log('emitted opt-client-event:', obj);
    } else {
      // TODO: be careful about this getting HUGE if codeopticonSocketIO
      // never connects properly ...
      logEventQueue.push(obj); // queue this up to be logged when the client
                               // finishes successfully connecting to the server

      // we're not yet connected, or we've been disconnected by the
      // server, so try to connect/reconnect first before emitting the event
      codeopticonSocketIO.connect(); // will trigger the .on('connect', ...) handler
    }
  }
}
