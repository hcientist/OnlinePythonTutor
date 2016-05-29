// Codeopticon observer
// Created by Philip Guo in Feb 2015

// based on observer-v18.ts in the original Spring 2015 code repo

/*

This is the initial version for the UIST 2015 user study

- mouseover gutter to loop past 30 seconds [maybe]


Other TODOs (lower priority for laterz)

- when a tile is in the graveyard, add a "promote" button to move it to
  main, since we want a user to be able to promote a tile to main

- need some indication of when new events come in, just in case the user
  is scrubbing backwards and doesn't realize when new events come in
  - maybe show the times since the last 3 most recent kinds of events?
  - displaying seconds since the last event is actually pretty useful --
    the other metrics aren't as much help.

- when a user switches cells, their entire chat history is cleared since
  a brand new chat box gets created; it would be good to preserve their
  history
  - actually this is VITAL if we want the user to be able to proactively
    start a chat with the tutor and then have their UserMon moved up to
    the main table
  - if a user sends a chat to the observer, and their UserMon isn't in
    main table yet, then proactively call moveUserToTable() to move them
    to the main table (after a delay for politeness, of course)

- [Low priority] after i upgrade to new jQuery UI version, there are
  sometimes warning messages about the slider, maybe because younginTable
  is hidden?!?

*/

// pesky globals
var co : Codeopticon;


// if this is true, then run a canned (prerecorded) session
var isCannedMode = false;
//var isCannedMode = true;


// magic constants to tune
var YOUNGIN_PROBATIONARY_PERIOD_SECS = 15;
var YOUNGIN_PROBATIONARY_MIN_EVENTS_TO_PROMOTE_TO_MAIN = 3;
var GRAVEYARD_SWEEP_SECS = 10;
var FORCE_MOVE_DELAY_SECS = 5;
var MAIN_TABLE_INCUMBENT_ADVANTAGE = 1.3;
var GRAVEYARD_TABLE_INCUMBENT_ADVANTAGE = 1; // don't do an incumbent advantage here
var E60_MIN_EVENTS_FOR_PROMOTING_TO_MAIN = 3; // the connection event automatically counts as 1
var WEPS_LAMBDA_PARAM = 0.0001; // = 0.00005;

var NUM_CELLS_PER_ROW = 5;
var NUM_CELLS_IN_MAIN_TABLE = 15;


var baseBorderColor = '#ddd';
var warningBorderColor = 'green';
var lockedBorderColor = '#E66767'; // make it reddish


// TODO: can get rid of ... only for user study for backup
function logCoEvent(evt) {
  evt.dt = new Date().getTime();
  allCoEvents.push(evt);
  //console.log(evt);
  localStorage[coSessionName] = JSON.stringify(allCoEvents);
}

// careful!!!
function clearAllCoLogs() {
  for (var k in localStorage) {
    if (k.indexOf('coSession_') === 0) {
      delete localStorage[k];
      console.log('DELETED', 'localStorage[' + k + ']');
    }
  }
}


interface SidToUser { sid: User; }
interface SidToNum { sid: number; }
interface UserStat {user: User;
                    SSLE: number; EPS: number; WEPS: number;
                    E15: number; E30: number; E60: number;}

class Codeopticon {
  younginTable: DisplayTable;
  mainTable: DisplayTable;
  graveyardTableLst: DisplayTable[];

  sidToUser: SidToUser = <SidToUser>{};
  sidToSmallIDs: SidToNum = <SidToNum>{};
  curSmallID: number = 1;

  rootDiv: JQuery;

  // tunable constants
  graveyardSweepSecs = GRAVEYARD_SWEEP_SECS;
  forceMoveDelaySecs = FORCE_MOVE_DELAY_SECS;

  socket;

  constructor(rootDivId: string, socket) {
    this.socket = socket;
    this.socket.on('logEvent', (obj) => {
      this.addUserEvent(obj);
    });

    // sanity check to make sure that we don't delay until the next
    // graveyard sweep or else things might be inconsistent
    console.assert(this.forceMoveDelaySecs < this.graveyardSweepSecs - 1);

    this.rootDiv = $('#' + rootDivId);

    this.younginTable = new DisplayTable('younginTable', this.rootDiv.find('#younginRoot'), NUM_CELLS_PER_ROW);
    this.mainTable = new DisplayTable('mainTable', this.rootDiv.find('#mainRoot'), NUM_CELLS_PER_ROW, NUM_CELLS_IN_MAIN_TABLE);
    this.graveyardTableLst = [];

    this.addGraveyardTable(); // start with one graveyard layer


    this.rootDiv.find('#younginRoot').hide(); // for aesthetics

    // periodic stats rendering -- nix this
    /*
    setInterval(() => {
      $.each(this.sidToUser, function(k, v: User) {
        console.assert(v !== undefined);
        if (v.curTable !== undefined && v.cellID !== undefined) {
          v.renderStats();
        }
      });
    }, 1000);
    */

    // periodic graveyard resurrection sweep
    setInterval(() => {
      // OK start with the DEEPEST level of the graveyard and try to
      // promote each entry as high as possible, first going for gold
      // and trying to get into the mainTable, and then sweeping
      // downwards from the shallowest level to the deepest
      var n = this.graveyardTableLst.length;

      for (var i = n-1; i >= 0; i--) {
        var srcGraveyardLayer = this.graveyardTableLst[i];

        // first try for mainTable with some filtering and an incumbent
        // handicap so that there's somewhat of a barrier to promoting to main
        this.resurrect(srcGraveyardLayer, this.mainTable,
                       function(e) {return e.E60 >= E60_MIN_EVENTS_FOR_PROMOTING_TO_MAIN},
                       'WEPS', MAIN_TABLE_INCUMBENT_ADVANTAGE);

        // then try in the graveyard from the shallowest until table i
        for (var j = 0; j < i; j++) {
          var dstGraveyardLayer = this.graveyardTableLst[j];

          this.resurrect(srcGraveyardLayer, dstGraveyardLayer,
                         null,
                         'WEPS', GRAVEYARD_TABLE_INCUMBENT_ADVANTAGE);
        }
      }

    }, this.graveyardSweepSecs * 1000);
  }

  getSmallID(sid: string) : number {
    var smallId = this.sidToSmallIDs[sid];
    if (smallId === undefined) {
      smallId = this.curSmallID;
      this.sidToSmallIDs[sid] = smallId;
      this.curSmallID++;
    }
    return smallId;
  }

  // find a table cell in which to render this user
  renderUser(u: User,
             immediate=false /* true for an immediate move, false for deferred */) {
    // if we don't have a table, start in youngins
    if (u.curTable === undefined) {
      u.curTable = this.younginTable;
    }

    // if there's no more empty slots in u.curTable, try to either free
    // up a lot or demote it elsewhere ...
    if (u.curTable.freeCellIDs.length === 0) {

      var tryToAdd = u.curTable.addCell();

      if (!tryToAdd) {
        // if we couldn't add a new cell, then we need to take more
        // drastic action:

        if (u.curTable === this.mainTable) {
          // kick someone out to the graveyard
          // pick the one that's least recently been updated (LRU cache).
          var stats = u.curTable.getAllUserStats();
          stats.sort(function(a, b) {return b.SSLE - a.SSLE;}); // sort by time, reversed
          if (stats.length > 0) {
            // kick out the first one (LRU cache policy)
            var toKickOut = stats[0].user;

            console.assert(toKickOut.locked !== LockedState.Locked);

            // VERY important so that when this runs again, the LRU algorithm
            // won't pick this SAME USER TO kick out since it's now locked
            toKickOut.templock();

            if (immediate) {
              //console.log("IMMEDIATE KICKED OUT to graveyard", toKickOut.smallID());
              this.moveToGraveyard(toKickOut);
              u.findFreeCellAndRender(); // don't forget this! ugh weird control flow
            } else {
              // defer the kickout ...
              //console.log("DEFER kickout of", toKickOut.smallID(), "to accommodate", u.smallID());
              var timeoutId = setTimeout(() => {
                console.assert(u.locked !== LockedState.Locked);

                if (toKickOut.locked === LockedState.Locked) {
                  u.unlock();
                  toKickOut.cancelForceMove();
                  //console.warn("C - ABORT kickout to graveyard", u.smallID());
                  return;
                }

                // do we still need to render this user, or are we all good?
                if (u.cellID === undefined) {
                  if (u.curTable.freeCellIDs.length === 0) {
                    this.moveToGraveyard(toKickOut);
                    //console.log("  KICKED", toKickOut.smallID(), "to graveyard to accommodate", u.smallID());
                  } else {
                    //console.warn("  A - ABORT kickout of", toKickOut.smallID(), "to graveyard to accommodate", u.smallID());
                    u.unlock();
                    toKickOut.cancelForceMove();
                  }
                  u.findFreeCellAndRender(); // don't forget this! ugh weird control flow
                } else {
                  u.unlock();
                  toKickOut.cancelForceMove();
                  //console.warn("  B - ABORT kickout of", toKickOut.smallID(), "to graveyard to accommodate", u.smallID());
                }
              }, this.forceMoveDelaySecs * 1000);

              u.prepareForForceMove(() => {
                clearTimeout(timeoutId);

                u.cancelForceMove();
                toKickOut.cancelForceMove();
              });

              toKickOut.prepareForForceMove(() => {
                clearTimeout(timeoutId);

                u.cancelForceMove();
                toKickOut.cancelForceMove();
              });

              return; // safety get out!
            }
          } else {
            // NOTE that if someone tries to move into the main table
            // and EVERYTHING IS LOCKED, then it must go directly to the
            // graveyard. That's an edge case, but we must handle it.
            this.moveToGraveyard(u);
          }
        } else {
          // we shouldn't be in youngins ...
          console.assert(u.curTable !== this.younginTable);

          // so we're already in the graveyard. (weirdly enough!) call
          // moveToGraveyard to find the shallowest graveyard level to
          // place this user ...
          this.moveToGraveyard(u);
        }
      } else {
        // tryToAdd is successful!
        console.assert(u.curTable.freeCellIDs.length > 0);
        u.findFreeCellAndRender();
      }
    } else {
      console.assert(u.curTable.freeCellIDs.length > 0);
      u.findFreeCellAndRender(); // TODO: problematic ...
    }


    // log at the END once we've got the proper table and cell info ...
    logCoEvent({type: 'renderUser',
                smallId: u.smallID(),
                table: u.curTable.name,
                cell: u.cellID});
  }

  // obj is an event from the server
  addUserEvent(eventObj) {
    var sid = eventObj.sid;
    var u = this.sidToUser[sid];

    var me = this;

    // create a new user if this is the first event for that user
    if (u === undefined) {
      u = new User(sid, this, this.younginTable);

      // start all new users in the youngins table and then promote to
      // main after a probationary period. this prevents the main table
      // from changing too rapidly

      // do just ONE check since the code gets too complicated when
      // there are multiple setTimeout calls here ...
      var timeoutId = setTimeout(() => {
        // VERY important that we don't try to move it if it's no longer
        // in younginTable ...
        if (u.curTable !== this.younginTable) {
          return;
        }

        // old metric -- too complicated
        //if (u.events.length >= 5 || u.getNumEventsPerSec(new Date()) >= 0.15) {
        // new simpler metric:
        if (u.events.length >= YOUNGIN_PROBATIONARY_MIN_EVENTS_TO_PROMOTE_TO_MAIN) {
          logCoEvent({type: 'younginMoveToMain', smallId: u.smallID()});
          me.moveToMainTable(u);
        } else {
          logCoEvent({type: 'younginMoveToGraveyard', smallId: u.smallID()});
          me.moveToGraveyard(u);
        }
      }, YOUNGIN_PROBATIONARY_PERIOD_SECS * 1000);

      u.prepareForForceMove(function() {
        clearTimeout(timeoutId);
        u.cancelForceMove();
        console.assert(u.locked !== LockedState.TempLocked);
      });
    }

    // don't double-render
    if (u.cellID === undefined) {
      this.renderUser(u);
    }

    u.addEvent(eventObj);
  }

  moveUserToTable(u: User, newParentTable: DisplayTable,
                  immediate=false /* true for an immediate move, false for deferred */) {
    console.assert(u.locked !== LockedState.Locked); // VERY IMPORTANTE!

    u.untrack();

    u.curTable = newParentTable;
    u.cellID = undefined;
    this.renderUser(u, immediate);

    // HACKY: to prevent the graveyard from fragmenting, if the FINAL
    // graveyard table is empty, then remove it. DO THIS AT THE VERY END
    // OF THE FUNCTION after the user has been rendered in newParentTable
    if (this.graveyardTableLst.length > 1) {
      var deepestGraveyard = _.last(this.graveyardTableLst);
      if (_.size(deepestGraveyard.cellIDtoUser) === 0) {
        //console.log("GRAVEYARD POP", deepestGraveyard.name);
        deepestGraveyard.domRoot.remove();
        this.graveyardTableLst.pop();
      }
    }
  }

  moveToMainTable(u: User) {
    this.moveUserToTable(u, this.mainTable);
  }

  // always do an *immediate* move, not a deferred move
  moveToGraveyard(u: User) {
    // move to the first graveyard level where there's free space
    for (var i = 0; i < this.graveyardTableLst.length; i++) {
      var e = this.graveyardTableLst[i];
      if (e.numFreeCells() > 0) {
        this.moveUserToTable(u, e, true /* always immediate! */);
        return; // done!
      }
    }
    // hmmm no more room in graveyard, so add a new level of hell
    var n = this.addGraveyardTable();
    this.moveUserToTable(u, n, true /* always immediate */);
  }

  addGraveyardTable() : DisplayTable {
    var graveyardNum = this.graveyardTableLst.length + 1;
    var newDivId = 'graveyardTbl' + graveyardNum;
    var root = this.rootDiv.find('#graveyardRoot'); root.append('<table id="' + newDivId + '"></table>');

    var newGT = new DisplayTable(newDivId, root.find('#' + newDivId), 5, 5);
    this.graveyardTableLst.push(newGT);
    console.assert(this.graveyardTableLst.length === graveyardNum);
    return newGT;
  }

  // try to resurrect all entries from srcTbl to dstTbl by first
  // prefiltering based on a filterFunc, then comparing elements of srcTbl
  // and dstTbl using a metric (e.g., 'WEPS') while giving incumbents in
  // dstTbl a handicap multipler of incumbentHandicap
  resurrect(srcTbl: DisplayTable, dstTbl: DisplayTable,
            filterFunc: (e: UserStat) => boolean, // optional
            metric: string, incumbentHandicap: number) {
    // sweep through graveyard to find candidates for resurrection:
    var srcStats = srcTbl.getAllUserStats();
    var resurrectionCandidates = filterFunc ? srcStats.filter(filterFunc) : srcStats;

    // priority sort by weightedEPS metric (descending)
    resurrectionCandidates.sort(function(a, b) {return b[metric] - a[metric];}); // sort descending

    // if there's still spare room in dstTbl, then directly resurrect onto there
    var f = dstTbl.numFreeCells();
    while (f > 0 && resurrectionCandidates.length > 0) {
      var c = resurrectionCandidates.shift();

      //console.log("ABOUT TO RESURRECT", srcTbl.name, c.user.cellID, '->', dstTbl.name);

      // defer this resurrection ...
      var timeoutId = setTimeout(() => {
        console.assert(c.user.locked !== LockedState.Locked);
        if ((c.user.cellID !== undefined) &&
            (c.user.locked !== LockedState.Locked) && // if you manually locked, don't do anything!
            (dstTbl.numFreeCells() > 0)) { // do another check since that table might now be full!
          this.moveUserToTable(c.user, dstTbl, true /* immediate */);
          //console.log("  RESURRECTED", srcTbl.name, '->', dstTbl.name, c.user.sessionID);
          logCoEvent({type: 'freebieResurrect',
                      srcTbl: srcTbl.name,
                      dstTbl: dstTbl.name,
                      smallId: c.user.smallID()
                     });
        } else {
          //console.warn("  ABORTED resurrection", srcTbl.name, c.user.cellID, '->', dstTbl.name);
          c.user.cancelForceMove();
        }
      }, this.forceMoveDelaySecs * 1000);

      c.user.prepareForForceMove(function() {
        clearTimeout(timeoutId);
        c.user.cancelForceMove();
        console.assert(c.user.locked !== LockedState.TempLocked);
      });

      f--;
    }

    // if we still need to resurrect more, then we need to decide who to
    // kick out of the main table
    if (resurrectionCandidates.length > 0) {
      // let's try to kick out everyone with a smaller metric than
      // EVERYONE in resurrectionCandidates. sort by metric ascending
      var dstTblStats = dstTbl.getAllUserStats().sort(function(a, b) {return a[metric] - b[metric]});
      // remember to start with the highest metric one, replacing the
      // lowest metric one from mainTable ...
      for (var i = 0; i < resurrectionCandidates.length; i++) {
        var cur = resurrectionCandidates[i];
        if (dstTblStats.length === 0) {
          break;
        }

        // we're done as soon as one isn't smaller, since
        // resurrectionCandidates is sorted DESCENDING and dstTblStats
        // is sorted ASCENDING
        var firstDstElt = dstTblStats.shift();
        if (firstDstElt[metric] * incumbentHandicap > cur[metric]) {
          break;
        }

        // sanity check!
        console.assert(cur.user.curTable === srcTbl);
        console.assert(firstDstElt.user.curTable === dstTbl);

        // otherwise swap it!
        /*
        console.log('SWAPPED RESURRECTION:', srcTbl.name, cur.user.cellID,
                    '->', dstTbl.name, firstDstElt.user.cellID,
                    metric, firstDstElt[metric], cur[metric],
                    (cur[metric] / firstDstElt[metric]).toFixed(2));
        */

        this.swapUserCells(cur.user, firstDstElt.user);
      }
    }
  }

  swapUserCells(usrA: User, usrB: User) {
    var timeoutId = setTimeout(() => {
      console.assert(usrA.locked !== LockedState.Locked);
      console.assert(usrB.locked !== LockedState.Locked);

      // very delicate operation! first grab existing values ...
      var aTable = usrA.curTable;
      var aCellID = usrA.cellID;

      var bTable = usrB.curTable;
      var bCellID = usrB.cellID;

      // crappp, usrA or usrB might have been auto-untracked (i.e.,
      // destroyed) before getting a chance to swap, so if that's the
      // case, then cancel the swap procedure
      if (aCellID === undefined || bCellID === undefined) {
        //console.warn('  !!! ABORT SWAP:', aTable, aCellID, '->', bTable, bCellID);
        usrA.cancelForceMove();
        usrB.cancelForceMove();
        return; // ABORT EARLY!!!
      }

      console.assert(aTable != bTable);
      //console.log('  SWAP:', aTable.name, aCellID, '->', bTable.name, bCellID);

      // then untrack both ...
      usrA.untrack();
      usrB.untrack();

      // now swap ...
      usrA.curTable = bTable;
      usrA.cellID = bCellID;

      usrB.curTable = aTable;
      usrB.cellID = aCellID;

      // ugh VERY klunky ... remove from freeCellIDs so that someone else
      // doesn't try to render themselves in those cells ...
      var aCellIdx = aTable.freeCellIDs.indexOf(aCellID);
      var bCellIdx = bTable.freeCellIDs.indexOf(bCellID);
      console.assert(aCellIdx >= 0);
      console.assert(bCellIdx >= 0);

      aTable.freeCellIDs.splice(aCellIdx, 1);
      bTable.freeCellIDs.splice(bCellIdx, 1);

      // FINALLY re-render in your new cells ...
      usrA.renderInCell();
      usrB.renderInCell();

    logCoEvent({type: 'swappedResurrection',
                usrA: {smallId: usrA.smallID(), table: usrA.curTable.name, cell: usrA.cellID},
                usrB: {smallId: usrB.smallID(), table: usrB.curTable.name, cell: usrB.cellID},
               });

    }, this.forceMoveDelaySecs * 1000);

    // if either user is LOCKED before the setTimeout fires, then
    // clearTimeout() will be called to cancel this queued action
    //
    // ALSO very important to unlock your partner as well ...
    usrA.prepareForForceMove(function() {
      clearTimeout(timeoutId);
      usrA.cancelForceMove();
      usrB.cancelForceMove();
      console.assert(usrA.locked !== LockedState.TempLocked);
      console.assert(usrB.locked !== LockedState.TempLocked);
    });
    usrB.prepareForForceMove(function() {
      clearTimeout(timeoutId);
      usrA.cancelForceMove();
      usrB.cancelForceMove();
      console.assert(usrA.locked !== LockedState.TempLocked);
      console.assert(usrB.locked !== LockedState.TempLocked);
    });
  }
}



enum LockedState {Unlocked,
                  Locked,    // manually locked, so this user shouldn't be moved
                  TempLocked // temporarily locked prior to an auto-move;
                             // will switch to Unlocked after a fixed timeout
                             // unless someone clicks to turn it into Locked
                  };


class User {
  sessionID: string;
  events: any[] = [];

  co: Codeopticon;

  curTable: DisplayTable;
  cellID: number;

  locked: LockedState = LockedState.Unlocked;

  // TODO: maybe optimize by keeping the SAME userMon object but
  // re-rendering in different cells as the user gets moved around
  userMon: UserMon = undefined;

  // grab with a socketio call to 'get-all-events-for-sid'
  // (try to avoid grabbing more than once for efficiency's sake)
  allEventsFromServer: any[] = undefined;

  undoFuncs = []; // call all of these functions when you lock or untrack

  constructor(sessionID: string, co: Codeopticon, startingTable: DisplayTable) {
    this.sessionID = sessionID;
    this.co = co;

    this.co.sidToUser[this.sessionID] = this;

    this.curTable = startingTable;
    this.cellID = undefined;

    logCoEvent({type: 'userConnect',
                sid: this.sessionID,
                smallId: this.smallID()});

    this.co.renderUser(this); // yes, weird indirect call
  }

  smallID() : number {
    return co.getSmallID(this.sessionID);
  }

  // this is a super weird interface since you should first call
  // setTimeout to prepare for force move and then pass in f as a
  // function to undo the setTimeout's prep
  prepareForForceMove(f) {
    this.templock();
    this.undoFuncs.push(f);
  }

  cancelForceMove() {
    // if we've manually locked it, then don't bother; only change if TempLocked
    if (this.locked === LockedState.TempLocked) {
      this.unlock();
    }
  }

  // assumes that this.curTable has a free cell in which to render
  // yourself. always call from the this.co.renderUser wrapper; never
  // call directly
  findFreeCellAndRender() {
    console.assert(this.cellID === undefined);
    console.assert(this.curTable.freeCellIDs.length > 0);

    this.cellID = this.curTable.freeCellIDs.shift();

    this.renderInCell();
  }

  // assumes this.cellID is already properly defined
  renderInCell() {
    console.assert(this.cellID !== undefined);

    this.curTable.cellIDtoUser[this.cellID] = this;
    this.curTable.domRoot
      .find('#c' + this.cellID + ' .cellHeader')
      .prepend('Learner ' + this.smallID() + ' <div class="stats"/> ')
      .show(); // un-hide it!

    this.undoFuncs = []; // clear
    this.unlock();

    $.each(this.events, (i, e) => {
      this.displayEventFoDebugging(e);
      this.handlePossibleChatEvent(e);
      this.handlePossibleDisconnectEvent(e);
    });

    var userMonRoot = this.curTable.domRoot.find('#c' + this.cellID + ' .cellUserMonParent');

    // TODO: look into keeping a single UserMon and simply re-using it,
    // using jQuery detach() to detach and reattach it to different
    // cells, keeping all relevant event handlers intact. The current
    // approach is pretty wasteful and un-optimized since a new UserMon
    // object is created and re-rendered whenever a User gets moved
    this.userMon = new UserMon(userMonRoot, this.smallID(), '300px', '250px' /*'300px'*/);
    this.userMon.addEventsLst(this.events);

    var chatboxRoot = this.curTable.domRoot.find('#c' + this.cellID + ' .cellChatBox');
    chatboxRoot.show();
  }

  getCellDom() : JQuery {
    // safety:
    if (this.curTable === undefined || this.cellID === undefined) {
      return null;
    } else {
      return this.curTable.domRoot.find('#c' + this.cellID);
    }
  }

  setLock(ls: LockedState) {
    var d = this.getCellDom();
    if (ls === LockedState.Locked) {
      console.assert(this.locked !== LockedState.Locked); // don't double-lock
      while (this.undoFuncs.length > 0) {
        var f = this.undoFuncs.pop();
        f(); // call it!
      }
      console.assert(this.undoFuncs.length === 0);

      // set border color at the VERY END after running undoFuncs
      if (d) {
        d.css('border', '2px solid ' + lockedBorderColor);
      }
    } else if (ls === LockedState.TempLocked) {
      console.assert(this.locked !== LockedState.Locked); // don't double-lock
      if (d) {
        d.css('border', '2px solid ' + warningBorderColor);
      }
    } else {
      console.assert(ls === LockedState.Unlocked);
      if (d) {
        d.css('border', '2px solid ' + baseBorderColor);
      }
    }

    this.locked = ls;
  }

  lock() {
    this.setLock(LockedState.Locked);
  }

  unlock() {
    this.setLock(LockedState.Unlocked);
  }

  templock() {
    this.setLock(LockedState.TempLocked);
  }

  manuallyToggleLock() {
    if (this.locked === LockedState.Locked) {
      this.unlock();
    } else {
      // even if you're now in TempLocked, still turn it into a real lock ...
      this.lock();
    }

    logCoEvent({type: 'manuallyToggleLock',
                smallId: this.smallID(),
                table: this.curTable.name,
                cell: this.cellID,
                lockedState: this.locked});
  }

  untrack() {
    var cid = this.cellID;
    if (cid === undefined) {
      return; // don't double-untrack
    }

    this.unlock(); // clear all locks!

    while (this.undoFuncs.length > 0) {
      var f = this.undoFuncs.pop();
      f(); // call it!
    }
    console.assert(this.undoFuncs.length === 0);

    var cell = this.curTable.domRoot.find('#c' + cid);
    console.assert(cid !== undefined);

    // special behavior for younginTable since we want to keep it as
    // compact as possible, so remove all unused cells ASAP
    if (this.curTable.name === 'younginTable') {
      delete this.curTable.cellIDtoUser[cid];
      cell.remove();
    } else {
      // otherwise leave the cell intact but remove the user from it:

      this.curTable.freeCellIDs.push(cid);
      // sort so that we always start filling up the lowest-numbered cells first
      this.curTable.freeCellIDs.sort();
      delete this.curTable.cellIDtoUser[cid];
      this.curTable.initCell(cell);
    }

    this.cellID = undefined;
    this.curTable = undefined;
  }

  addEvent(obj) {
    obj.observerTime = new Date(); // when did we receive this event?
    this.events.push(obj);
    this.displayEventFoDebugging(obj);
    this.handlePossibleChatEvent(obj);
    this.handlePossibleDisconnectEvent(obj);

    this.userMon.addEvent(obj);
  }

  displayEventFoDebugging(obj) {
    return; // comment this out to enable DEBUGGING PRINTOUTS

    var me = this;

    var cell = this.curTable.domRoot.find('#c' + this.cellID);
    var debugEventsLst = cell.find('.debugEventsLst');
    var root = debugEventsLst.find('ol');

    if (obj.eventType === 'opt-client-event') {
      if (obj.data.type === 'editCode') {
        root.append('<li><code>' + obj.data.delta.d + '</code></li>');
      } else if (obj.data.type === 'updateAppDisplay') {
        root.append('<li>' + obj.data.mode + ' mode</li>');
        // TODO: grab obj.data.appState.code for latest code
      } else if (obj.data.type === 'updateOutput') {
        root.append('<li>' + 'Step ' + obj.data.step + '</li>');
      } else if (obj.data.type === 'doneExecutingCode') {
        root.append('<li>executed</li>');
        // TODO: grab obj.data.appState.code for latest code
      } else {
        root.append('<li>[misc] ' + obj.data.type + '</li>');
      }
    } else if (obj.eventType === 'opt-client-disconnect') {
      root.append('<li>' + obj.eventType + ' ' + (obj.killed ? ' KILLED' : '') + '</li>');
    } else {
      root.append('<li>' + obj.eventType + '</li>');
    }

    debugEventsLst.scrollTop(debugEventsLst.prop('scrollHeight')); // scroll down to bottom
  }

  handlePossibleChatEvent(obj) {
    if (obj.eventType === 'opt-client-event' &&
        obj.data.type === 'opt-client-chat') {
      //console.log('opt-client-chat', obj.data.text);
      // TODO: holy shit, what a hack!!! clean this up!!!
      var myCb = this.curTable.cellIDtoChatbox[this.cellID];
      myCb.chatbox("showContent");
      myCb.chatbox("option", "boxManager").addMsg('Learner', obj.data.text);

      if (myCb.chatbox("isVisible")) {
        imSound.play();
      }

      logCoEvent({type: 'chatLearner',
                  text: obj.data.text,
                  smallId: this.smallID(),
                  table: this.curTable.name,
                  cell: this.cellID});
    }
  }

  handlePossibleDisconnectEvent(obj) {
    var cell = this.curTable.domRoot.find('#c' + this.cellID);

    if (obj.eventType === 'opt-client-disconnect') {

      logCoEvent({type: 'userDisconnect',
                  sid: this.sessionID,
                  smallId: this.smallID(),
                  table: this.curTable.name,
                  cell: this.cellID});

      // always immediately untrack and nuke it!
      this.untrack();

      // don't just untrack it; really nuke any record of this user
      delete this.co.sidToUser[this.sessionID];
    }
  }

  // compute activity stats
  getMsSinceLastEvent(curTime: Date) : number {
    if (this.events.length === 0) {
      return Infinity;
    } else {
      var lastEvt = _.last(this.events);
      var timeSinceLastEvt : number = Number(curTime) - Number(lastEvt.observerTime);
      console.assert(timeSinceLastEvt >= 0);
      return timeSinceLastEvt;
    }
  }

  getNumEventsInLastNSec(curTime: Date, nSec: number): number {
    var earliestTime = Number(curTime) - (1000 * nSec);
    return _.filter(this.events, function(e) {return (e.observerTime >= earliestTime);}).length;
  }

  getNumEventsPerSec(curTime: Date): number {
    var oldestEvtTime = _.first(this.events).observerTime;
    var deltaMs : number = Number(curTime) - Number(oldestEvtTime);
    console.assert(deltaMs >= 0);
    return this.events.length / deltaMs * 1000;
  }

  // weighted average num events per second, biasing toward more
  // recent events since we care more about those
  // (NB: the *exact* number isn't as important as relative comparisions;
  // we just want a metric to note who has more recent events so that we
  // can compare the RELATIVE activity levels of multiple users)
  getNumExpWeightedEventsPerSec(curTime: Date): number {
    var msDiffs = _.map(this.events, function(e) {return Number(curTime) - Number(e.observerTime);});
    var oldestDeltaMs = _.first(msDiffs);

    // tunable parameter, remember x is in milliseconds, so scale by 1/1000
    // to get anything reasonable.
    // the higher the lambda, the more "youth-biased" you are, since
    // you're preferring more recent events
    var lambda = WEPS_LAMBDA_PARAM;

    var weightedMsDiffs = _.map(msDiffs, function(x) {
      // use a simple exponential decay function
      return Math.exp(-1 * lambda * x);
    });

    // weighted number of events per second
    return (_.reduce(weightedMsDiffs, function(a:any, b:any) {return a+b;}, 0) / oldestDeltaMs) * 1000;
  }


  renderStats() {
    console.assert(this.curTable !== undefined && this.cellID !== undefined);
    var curTime = new Date();

    var secSinceLastEvt = (this.getMsSinceLastEvent(curTime) / 1000).toFixed(2);
    var eventsPerSec = this.getNumEventsPerSec(curTime).toFixed(2);
    var weightedEPS = this.getNumExpWeightedEventsPerSec(curTime).toFixed(2);
    var nRecentEvts = this.getNumEventsInLastNSec(curTime, 30);

    var statsStr = 'SSLE: ' + secSinceLastEvt + '<br/>EPS: ' + eventsPerSec + '<br/>WEPS: ' + weightedEPS + '<br/>E30: ' + nRecentEvts;

    this.curTable.domRoot
      .find('#c' + this.cellID + ' .stats')
      .html(statsStr);
  }

  sendChatToUser(myCb, msg) {
    myCb.chatbox("option", "boxManager").addMsg('Me', msg);
    //console.log('send', this.sessionID, msg);
    if (!isCannedMode) {
      socket.emit('opt-codeopticon-observer-chat', {targetSid: this.sessionID, text: msg});
    }
    logCoEvent({type: 'chatTutor',
                text: msg,
                smallId: this.smallID(),
                table: this.curTable.name,
                cell: this.cellID});
  }
}

class DisplayTable {
  tableWidth: number;
  maxCells: number;

  domRoot: JQuery;

  curCellNum: number;
  freeCellIDs: number[]; // what table cells have already been created but are unoccupied?
  cellIDtoUser: {[cid: number]: User;};

  cellIDtoChatbox: {[cid: number]: JQuery;};

  name: string; // for debugging only

  constructor(name, domRoot: JQuery, tableWidth, maxCells=undefined) {
    this.name = name;
    this.domRoot = domRoot;
    this.tableWidth = tableWidth;
    this.maxCells = maxCells;
    this.curCellNum = 0;
    this.freeCellIDs = [];
    this.cellIDtoUser = {};
    this.cellIDtoChatbox = {};
  }

  numFreeCells() : number {
    if (this.maxCells === undefined) {
      return Infinity;
    } else {
      var ret = this.maxCells - _.size(this.cellIDtoUser);
      console.assert(ret >= 0);
      return ret;
    }
  }

  untrackCell(tdCell) {
    var cid = tdCell.attr('id'); // 'id' is something like 'c12', and we want the *number* 12
    cid = Number(cid.substr(1));
    var u = this.cellIDtoUser[cid];
    if (u !== undefined) { // maybe there's no user there
      logCoEvent({type: 'manualUntrack',
                  smallId: u.smallID(),
                  table: u.curTable.name,
                  cell: u.cellID});

      u.untrack();
    }
  }

  toggleLockCell(tdCell) {
    var cid = tdCell.attr('id'); // 'id' is something like 'c12', and we want the *number* 12
    cid = Number(cid.substr(1));
    var u = this.cellIDtoUser[cid];
    if (u !== undefined) { // maybe there's no user there
      u.manuallyToggleLock();
    }
  }

  initCell(cell) {
    var me = this;
    cell.empty();
    cell.append($('<div>').attr('class', 'cellHeader').append('<span class="statusSpan"></span><button class="untrackBtn">untrack</button>'));
    cell.append($('<div>').attr('class', 'cellUserMonParent'));
    cell.append($('<div>').attr('class', 'cellChatBoxDummy')); // should be a sibling of cellChatBox
    cell.append($('<div>').attr('class', 'cellChatBox')); //.attr('id', 'chatdiv_' + this.name + '_' + cell.attr('id')));
    cell.append($('<div>').attr('class', 'debugEventsLst').append($('<ol>')).hide() /* hide debugging events for now */);
    cell.find('.untrackBtn').unbind('click').click(function() {
      me.untrackCell($(this).closest('td'));
    });

    var cid = cell.attr('id'); // 'id' is something like 'c12', and we want the *number* 12
    cid = Number(cid.substr(1));

    var myCb = cell.find('.cellChatBoxDummy').chatbox({id: "Me",
                                       parentDiv: cell.find('.cellChatBox'), // $("#special_footer"),
                                       title: "Chat",
                                       width: 288, /* almost 300px */
                                       chatInputOnTop: true, /* VERY IMPORTANT or else major UI bugs will arise!!!!!! */
                                       messageSent: (id, user, msg) => {
                                         var u = me.cellIDtoUser[cid];
                                         if (u !== undefined) { // maybe there's no user there
                                           u.sendChatToUser(myCb, msg);
                                         } else {
                                           myCb.chatbox("option", "boxManager").addMsg(id, '[ERROR: no user in current cell]');
                                         }
                                       },
                                       chatboxToggled: function(isVisible) {
                                         // lock the cell when you're starting
                                         // to chat so that it doesn't move!!!
                                         if (isVisible) {
                                           var u = me.cellIDtoUser[cid];
                                           if (u !== undefined) { // maybe there's no user there
                                             if (u.locked !== LockedState.Locked) {
                                               u.lock();
                                             }
                                             logCoEvent({type: 'chatboxOpen',
                                                         smallId: u.smallID(),
                                                         table: u.curTable.name,
                                                         cell: u.cellID});
                                           }
                                         } else {
                                           var u = me.cellIDtoUser[cid];
                                           if (u !== undefined) {
                                             logCoEvent({type: 'chatboxClose',
                                                         smallId: u.smallID(),
                                                         table: u.curTable.name,
                                                         cell: u.cellID});
                                           }
                                         }
                                       },
                                     });
    this.cellIDtoChatbox[cid] = myCb;
    cell.find('.cellChatBox .ui-chatbox-titlebar').click(); // click once to start it MINIMIZED

    // click header to lock/unlock
    cell.find('.cellHeader').unbind('click').click(function() {
      me.toggleLockCell($(this).closest('td'))
    }).children().click((e) => {e.stopPropagation(); return false;}); // stop propagation on children
    // http://stackoverflow.com/questions/2457246/jquery-click-function-exclude-children

    cell.css('border', '2px solid ' + baseBorderColor);

    // hide all widgets until a user populates the cell
    cell.find('.cellHeader').hide();
    cell.find('.cellChatBox').hide();

    console.assert(_.size(this.cellIDtoUser) <= this.curCellNum);
  }

  // returns true if successful, false otherwise
  addCell() : boolean {
    if (this.maxCells !== undefined /* optional bound */ &&
        this.curCellNum >= this.maxCells) {
      return false;
    }

    var tbl = this.domRoot;
    if (this.curCellNum % this.tableWidth === 0) {
      tbl.append($('<tr>'));
    }

    tbl.find('tr:last').append($('<td>').attr('id', 'c' + this.curCellNum));

    var curCell = tbl.find('td:last');
    this.initCell(curCell);

    this.freeCellIDs.push(this.curCellNum);

    this.curCellNum++;
    return true;
  }

  // return a list of stats objects for each user
  // if excludeLocked is true, then DON'T grab stats for 'locked' users
  // so that, say, they're not eligible for moving to other table cells
  getAllUserStats(excludeLocked=true) {
    var ret : UserStat[] = [];
    var curTime = new Date();
    $.each(this.cellIDtoUser, function(k: number, u: User) {
      if (excludeLocked && (u.locked !== LockedState.Unlocked)) {
        // this returns early when u.locked is either Locked or TempLocked
        return;
      }

      var SSLE = u.getMsSinceLastEvent(curTime) / 1000;
      var EPS = u.getNumEventsPerSec(curTime);
      var WEPS = u.getNumExpWeightedEventsPerSec(curTime);
      var E15 = u.getNumEventsInLastNSec(curTime, 15);
      var E30 = u.getNumEventsInLastNSec(curTime, 30);
      var E60 = u.getNumEventsInLastNSec(curTime, 60);

      var elt = {user: u,
                 SSLE: SSLE,
                 EPS: EPS,
                 WEPS: WEPS,
                 E15: E15,
                 E30: E30,
                 E60: E60};
      ret.push(elt);
    });

    return ret;
  }
}

var socket; // nasty global

var coSessionName;
var allCoEvents = [];

var imSound = new Audio('alert-06.wav');

$(document).ready(function() {
  //console.log('hallo');

  if (isCannedMode) {
    socket = io('http://104.237.139.253:5001/codeopticon-observer'); // DEBUG
  } else {
    socket = io('http://104.237.139.253:5000/codeopticon-observer'); // PRODUCTION
  }

  // initialize these after the entire page finishes loading so that the
  // respective DOM elements already exist ...
  co = new Codeopticon('coRoot', socket);

  socket.on('connect', function() {
    coSessionName = socket.id;
    console.log(coSessionName + ' ' + (isCannedMode ? 'CANNED' : 'LIVE'));
    $("#footer").html(coSessionName + ' ' + (isCannedMode ? 'CANNED' : 'LIVE'));
  });

  /* for testing ...
  socket.emit('get-all-events-for-sid', {sid: 'QzaHoLowhRzxwkNIANM2'});

  socket.on('all-events-for-sid', function(msg) {
    console.log(msg);
  });
  */
});
