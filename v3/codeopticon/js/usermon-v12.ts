/*

User monitor for codeopticon which displays code diffs and other goodness

Based on https://github.com/pgbovine/diffplayer


TODOs:
- assertion errors on:
  42 - fZ3_D_Zcyv5NqFlYANQq

- look into basically "resetting" the code display with a real piece of
  code whenever appState appears, so that we're not always taking diffs
  from the very first seeded piece of code. maybe that explains some of
  the weird garbled code sometimes?!? or maybe those are just weird diffs;
  in any case, we need to investigate more.

- figure out how long error messages should STICK AROUND FOR after the
  respective events

- sometimes runtime errors don't show up on the right lines

*/

declare var testDataDump: any[];


/* Each element is an object with 't' as timestamp and 'd' as the delta object

Each 'd' field is in the following format:

http://downloads.jahia.com/downloads/jahia/jahia6.6.1/jahia-root-6.6.1.0-aggregate-javadoc/name/fraser/neil/plaintext/DiffMatchPatch.html#diff_toDelta(java.util.LinkedList)

Crush the diff into an encoded string which describes the operations
required to transform text1 into text2. E.g. =3\t-2\t+ing -> Keep 3
chars, delete 2 chars, insert 'ing'. Operations are tab-separated.
Inserted text is escaped using %xx notation.

*/

interface SidToEvents { sid: any[]; }

var um; // global for debugging purposes
var sidToEvents : SidToEvents = <SidToEvents>{};

function loadSession(evts) {
  um = new UserMon($("#replayerPane"), 42, '400px', '500px');
  um.addEventsLst(evts);
}

$(document).ready(function() {
  testDataDump.forEach((e, i) => {
    if (!_.has(sidToEvents, e.sid)) {
      sidToEvents[e.sid] = [];
    }
    sidToEvents[e.sid].push(e);
  });

  var orderedSids = [];
  $.each(sidToEvents, (k, v) => {
    orderedSids.push([k, v.length]);
  });

  orderedSids.sort((a, b) => {return b[1] - a[1];}); // reverse

  var rot = $("#sessionChooserPane");
  $.each(orderedSids, (i, e) => {
    rot.append('<li><a class="sessionLink" id="' + i + '" href="javascript:false">' + e[1] + ' - ' + e[0] + '</a></li>');
  });

  $(".sessionLink").click(function() {
    var sessionIdx = Number($(this).attr("id"));
    var sid = orderedSids[sessionIdx][0];
    var sessionEvts = sidToEvents[sid];
    console.log("Load session:", sid);
    loadSession(sessionEvts);
  });
});
