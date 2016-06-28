// Leftover code for annotation bubbles deleted from ../pytutor.ts

// Annotation bubbles

var qtipShared = {
  show: {
    ready: true, // show on document.ready instead of on mouseenter
    delay: 0,
    event: null,
    effect: function() {$(this).show();}, // don't do any fancy fading because it screws up with scrolling
  },
  hide: {
    fixed: true,
    event: null,
    effect: function() {$(this).hide();}, // don't do any fancy fading because it screws up with scrolling
  },
  style: {
    classes: 'ui-tooltip-pgbootstrap', // my own customized version of the bootstrap style
  },
};


// a speech bubble annotation to attach to:
//   'codeline' - a line of code
//   'frame'    - a stack frame
//   'variable' - a variable within a stack frame
//   'object'   - an object on the heap
// (as determined by the 'type' param)
//
// domID is the ID of the element to attach to (without the leading '#' sign)
function AnnotationBubble(parentViz, type, domID) {
  this.parentViz = parentViz;

  this.domID = domID;
  this.hashID = '#' + domID;

  this.type = type;

  if (type == 'codeline') {
    this.my = 'left center';
    this.at = 'right center';
  }
  else if (type == 'frame') {
    this.my = 'right center';
    this.at = 'left center';
  }
  else if (type == 'variable') {
    this.my = 'right center';
    this.at = 'left center';
  }
  else if (type == 'object') {
    this.my = 'bottom left';
    this.at = 'top center';
  }
  else {
    assert(false);
  }

  // possible states:
  //   'invisible'
  //   'edit'
  //   'view'
  //   'minimized'
  //   'stub'
  this.state = 'invisible';

  this.text = ''; // the actual contents of the annotation bubble

  this.qtipHidden = false; // is there a qtip object present but hidden? (TODO: kinda confusing)
}

AnnotationBubble.prototype.showStub = function() {
  assert(this.state == 'invisible' || this.state == 'edit');
  assert(this.text == '');

  var myBubble = this; // to avoid name clashes with 'this' in inner scopes

  // destroy then create a new tip:
  this.destroyQTip();
  $(this.hashID).qtip($.extend({}, qtipShared, {
    content: ' ',
    id: this.domID,
    position: {
      my: this.my,
      at: this.at,
      adjust: {
        x: (myBubble.type == 'codeline' ? -6 : 0), // shift codeline tips over a bit for aesthetics
      },
      effect: null, // disable all cutesy animations
    },
    style: {
      classes: 'ui-tooltip-pgbootstrap ui-tooltip-pgbootstrap-stub'
    }
  }));


  $(this.qTipID())
    .unbind('click') // unbind all old handlers
    .click(function() {
      myBubble.showEditor();
    });

  this.state = 'stub';
}

AnnotationBubble.prototype.showEditor = function() {
  assert(this.state == 'stub' || this.state == 'view' || this.state == 'minimized');

  var myBubble = this; // to avoid name clashes with 'this' in inner scopes

  var ta = '<textarea class="bubbleInputText">' + this.text + '</textarea>';

  // destroy then create a new tip:
  this.destroyQTip();
  $(this.hashID).qtip($.extend({}, qtipShared, {
    content: ta,
    id: this.domID,
    position: {
      my: this.my,
      at: this.at,
      adjust: {
        x: (myBubble.type == 'codeline' ? -6 : 0), // shift codeline tips over a bit for aesthetics
      },
      effect: null, // disable all cutesy animations
    }
  }));

  
  $(this.qTipContentID()).find('textarea.bubbleInputText')
    // set handler when the textarea loses focus
    .blur(function() {
      myBubble.text = $(this).val().trim(); // strip all leading and trailing spaces

      if (myBubble.text) {
        myBubble.showViewer();
      }
      else {
        myBubble.showStub();
      }
    })
    .focus(); // grab focus so that the user can start typing right away!

  this.state = 'edit';
}


AnnotationBubble.prototype.bindViewerClickHandler = function() {
  var myBubble = this;

  $(this.qTipID())
    .unbind('click') // unbind all old handlers
    .click(function() {
      if (myBubble.parentViz.editAnnotationMode) {
        myBubble.showEditor();
      }
      else {
        myBubble.minimizeViewer();
      }
    });
}

AnnotationBubble.prototype.showViewer = function() {
  assert(this.state == 'edit' || this.state == 'invisible');
  assert(this.text); // must be non-empty!

  var myBubble = this;
  // destroy then create a new tip:
  this.destroyQTip();
  $(this.hashID).qtip($.extend({}, qtipShared, {
    content: htmlsanitize(this.text), // help prevent HTML/JS injection attacks
    id: this.domID,
    position: {
      my: this.my,
      at: this.at,
      adjust: {
        x: (myBubble.type == 'codeline' ? -6 : 0), // shift codeline tips over a bit for aesthetics
      },
      effect: null, // disable all cutesy animations
    }
  }));

  this.bindViewerClickHandler();
  this.state = 'view';
}


AnnotationBubble.prototype.minimizeViewer = function() {
  assert(this.state == 'view');

  var myBubble = this;

  $(this.hashID).qtip('option', 'content.text', ' '); //hack to "minimize" its size

  $(this.qTipID())
    .unbind('click') // unbind all old handlers
    .click(function() {
      if (myBubble.parentViz.editAnnotationMode) {
        myBubble.showEditor();
      }
      else {
        myBubble.restoreViewer();
      }
    });

  this.state = 'minimized';
}

AnnotationBubble.prototype.restoreViewer = function() {
  assert(this.state == 'minimized');
  $(this.hashID).qtip('option', 'content.text', htmlsanitize(this.text)); // help prevent HTML/JS injection attacks
  this.bindViewerClickHandler();
  this.state = 'view';
}

// NB: actually DESTROYS the QTip object
AnnotationBubble.prototype.makeInvisible = function() {
  assert(this.state == 'stub' || this.state == 'edit');
  this.destroyQTip();
  this.state = 'invisible';
}


AnnotationBubble.prototype.destroyQTip = function() {
  $(this.hashID).qtip('destroy');
}

AnnotationBubble.prototype.qTipContentID = function() {
  return '#ui-tooltip-' + this.domID + '-content';
}

AnnotationBubble.prototype.qTipID = function() {
  return '#ui-tooltip-' + this.domID;
}


AnnotationBubble.prototype.enterEditMode = function() {
  assert(this.parentViz.editAnnotationMode);
  if (this.state == 'invisible') {
    this.showStub();

    if (this.type == 'codeline') {
      this.redrawCodelineBubble();
    }
  }
}

AnnotationBubble.prototype.enterViewMode = function() {
  assert(!this.parentViz.editAnnotationMode);
  if (this.state == 'stub') {
    this.makeInvisible();
  }
  else if (this.state == 'edit') {
    this.text = $(this.qTipContentID()).find('textarea.bubbleInputText').val().trim(); // strip all leading and trailing spaces

    if (this.text) {
      this.showViewer();

      if (this.type == 'codeline') {
        this.redrawCodelineBubble();
      }
    }
    else {
      this.makeInvisible();
    }
  }
  else if (this.state == 'invisible') {
    // this happens when, say, you first enter View Mode
    if (this.text) {
      this.showViewer();

      if (this.type == 'codeline') {
        this.redrawCodelineBubble();
      }
    }
  }
}

AnnotationBubble.prototype.preseedText = function(txt) {
  assert(this.state == 'invisible');
  this.text = txt;
}

AnnotationBubble.prototype.redrawCodelineBubble = function() {
  assert(this.type == 'codeline');

  if (isOutputLineVisibleForBubbles(this.domID)) {
    if (this.qtipHidden) {
      $(this.hashID).qtip('show');
    }
    else {
      $(this.hashID).qtip('reposition');
    }

    this.qtipHidden = false;
  }
  else {
    $(this.hashID).qtip('hide');
    this.qtipHidden = true;
  }
}

AnnotationBubble.prototype.redrawBubble = function() {
  $(this.hashID).qtip('reposition');
}
