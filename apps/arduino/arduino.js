/**
 * Blockly Apps: Arduino Code
 *
 * Based on the "Code" app developed by: fraser@google.com (Neil Fraser)
 *
 * @fileoverview JavaScript for ArduBlockly's Arduino Code application.
 */

'use strict';

/**
 * Create a namespace for the application.
 */
var Arduino = {};

/**
 * List of tab names.
 * @private
 */
Arduino.TABS_ = ['blocks', 'arduino', 'xml'];

Arduino.selected = 'blocks';

/**
 * Switch the visible pane when a tab is clicked.
 * @param {string} clickedName Name of tab clicked.
 */
Arduino.tabClick = function(clickedName) {
  // If the XML tab was open, save and render the content.
  if (document.getElementById('tab_xml').className == 'tabon') {
    var xmlTextarea = document.getElementById('content_xml');
    var xmlText = xmlTextarea.value;
    var xmlDom = null;
    try {
      xmlDom = Blockly.Xml.textToDom(xmlText);
    } catch (e) {
      var q =
          window.confirm(Arduino.getMsg('Code_badXml').replace('%1', e));
      if (!q) {
        // Leave the user on the XML tab.
        return;
      }
    }
    if (xmlDom) {
      Blockly.mainWorkspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xmlDom);
    }
  }

  // Deselect the button, and ensure side pannel is hidden
  Arduino.peekCode(false);

  // Deselect all tabs and hide all panes.
  for (var i = 0; i < Arduino.TABS_.length; i++) {
    var name = Arduino.TABS_[i];
    document.getElementById('tab_' + name).className = 'taboff';
    document.getElementById('content_' + name).style.display = 'none';
  }

  // Select the active tab and panel
  Arduino.selected = clickedName;
  document.getElementById('tab_' + clickedName).className = 'tabon';
  document.getElementById('content_' + clickedName).style.display = 'block';
  Arduino.renderContent();
  Blockly.fireUiEvent(window, 'resize');
};

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
Arduino.renderContent = function() {
  var content = document.getElementById('content_' + Arduino.selected);
  // Initialize the pane.
  if (content.id == 'content_xml') {
    var xmlTextarea = document.getElementById('content_xml');
    var xmlDom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    xmlTextarea.value = xmlText;
    xmlTextarea.focus();
  } else if (content.id == 'content_arduino') {
    var code = Blockly.Arduino.workspaceToCode();
    content.textContent = code;
    if (typeof prettyPrintOne == 'function') {
      code = content.innerHTML;
      code = prettyPrintOne(code, 'cpp');
      content.innerHTML = code;
    }
  }
};

/**
 * Initialize Blockly.  Called on page load.
 */
Arduino.init = function() {
  Arduino.adjustViewport();

  var container = document.getElementById('content_area');
  var onresize = function(e) {
    var bBox = Arduino.getBBox_(container);
    for (var i = 0; i < Arduino.TABS_.length; i++) {
      var el = document.getElementById('content_' + Arduino.TABS_[i]);
      el.style.top = bBox.y + 'px';
      el.style.left = bBox.x + 'px';
      // Height and width need to be set, read back, then set again to
      // compensate for scrollbars.
      el.style.height = bBox.height + 'px';
      el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
      el.style.width = bBox.width + 'px';
      el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
    }
    // Make the 'Blocks' tab line up with the toolbox.
    if (Blockly.mainWorkspace.toolbox_.width) {
      document.getElementById('tab_blocks').style.minWidth =
          (Blockly.mainWorkspace.toolbox_.width - 38) + 'px';
          // Account for the 19 pixel margin and on each side.
    }
  };
  window.addEventListener('resize', onresize, false);

  var toolbox = document.getElementById('toolbox');
  Blockly.inject(document.getElementById('content_blocks'),
      {path: '../../',
       rtl: false,
       toolbox: toolbox});

  //Arduino.loadBlocks('');

  //if ('BlocklyStorage' in window) {
  //  // Hook a save function onto unload.
  //  BlocklyStorage.backupOnUnload();
  //}

  Arduino.tabClick(Arduino.selected);
  Blockly.fireUiEvent(window, 'resize');

  // Binding buttons
  Arduino.bindClick('trashButton', Arduino.discard);
  Arduino.bindClick('runButton', Arduino.loadToArduino);
  Arduino.bindClick('peekCode',Arduino.peekCode);

  // Binding tabs
  for (var i = 0; i < Arduino.TABS_.length; i++) {
    var name = Arduino.TABS_[i];
    Arduino.bindClick('tab_' + name,
        function(name_) {return function() {Arduino.tabClick(name_);};}(name));
  }
};
window.addEventListener('load', Arduino.init);

/**
 * Fixes viewport for small screens.
 */
Arduino.adjustViewport = function() {
  var viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && screen.availWidth < 725) {
    viewport.setAttribute('content',
        'width=725, initial-scale=.35, user-scalable=no');
  }
};

/**
 * Load and execute the user's code to the Arduino.
 */
Arduino.loadToArduino = function() {
  //TODO: Add ajax function call to send string with code to Python server
};

/**
 * Discard all blocks from the workspace.
 */
Arduino.discard = function() {
  var count = Blockly.mainWorkspace.getAllBlocks().length;
  if (count < 2 ||
      window.confirm(Arduino.getMsg('Code_discard').replace('%1', count))) {
    Blockly.mainWorkspace.clear();
    window.location.hash = '';
  }
  Arduino.renderContent();
};

/**
 * Loads/unloads the side div with a code peek
 */
Arduino.peek_code = false;
Arduino.peekCode = function(visible) {
  var peek_code_button = document.getElementById('peekCode');
  var code_peek_content = document.getElementById('arduino_code_peek');
  
  if(visible == true) {
    Arduino.peek_code = false;
  } else if(visible == false) {
    Arduino.peek_code = true;
  }
  
  if(Arduino.peek_code == false) {
    Arduino.peek_code = true;
    peek_code_button.className = "notext secondary";
    Arduino.sideContent(true);
    code_peek_content.style.display = 'inline-block';
    // Regenerate arduino code and ensure every click does as well
    Arduino.renderArduinoPeekCode();
    Blockly.addChangeListener(Arduino.renderArduinoPeekCode);
  } else {
    Arduino.peek_code = false;
    peek_code_button.className = "notext";
    code_peek_content.style.display = 'none';
    Arduino.sideContent(false);
    // Remove action listeners. TODO: track listener so that first time does not
    // crashes
    //Blockly.removeChangeListener(renderArduinoPeekCode);
  }
};

/**
 * Configure the Block panel to display content on the right
 * @param {string} content_name Name of the content div
 * @param {boolean} visible Indicated if the content should be shown or hidden
 */
Arduino.sideContent = function(visible) {
  var side_content = document.getElementById('side_content');
  var block_content = document.getElementById('content_blocks');

  // Deselect all tabs and hide all panes.
  for (var i = 0; i < Arduino.TABS_.length; i++) {
    var name = Arduino.TABS_[i];
    document.getElementById('tab_' + name).className = 'taboff';
    document.getElementById('content_' + name).style.display = 'none';
  }
  
  if(visible == true) {
    // Rearrange panels for blocks and side contents
    block_content.style.display = 'inline-block';
    document.getElementById('tab_blocks').className = 'tabon';
    block_content.className = 'content content_blocks_side';
    side_content.style.display = 'inline-block';
  } else {
    // Restore to original state
    side_content.style.display = 'none';
    block_content.className = 'content content_blocks';
    // Select the active tab and panel
    document.getElementById('tab_' + Arduino.selected).className = 'tabon';
    document.getElementById('content_' + Arduino.selected).style.display = 'block';
  }

  Blockly.fireUiEvent(window, 'resize');  
  Arduino.renderContent();
};

/**
 * Updates the arduino code in the pre area based on the blocks
 */
Arduino.renderArduinoPeekCode = function() {
  var code_peak_pre = document.getElementById('arduino_pre');
  code_peak_pre.textContent = Blockly.Arduino.workspaceToCode();
  if (typeof prettyPrintOne == 'function') {
    code_peak_pre.innerHTML = prettyPrintOne(code_peak_pre.innerHTML, 'cpp');
  }
};


/**
 * Gets the message with the given key from the document.
 * @param {string} key The key of the document element.
 * @return {string} The textContent of the specified element,
 *     or an error message if the element was not found.
 */
Arduino.getMsg = function(key) {
  var element = document.getElementById(key);
  if (element) {
    var text = element.textContent;
    // Convert newline sequences.
    text = text.replace(/\\n/g, '\n');
    return text;
  } else {
    return '[Unknown message: ' + key + ']';
  }
};

/**
 * Bind a function to a button's click event.
 * On touch enabled browsers, ontouchend is treated as equivalent to onclick.
 * @param {!Element|string} el Button element or ID thereof.
 * @param {!Function} func Event handler to bind.
 */
Arduino.bindClick = function(el, func) {
  if (typeof el == 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  el.addEventListener('touchend', func, true);
};

/**
 * Compute the absolute coordinates and dimensions of an HTML or SVG element.
 * @param {!Element} element Element to match.
 * @return {!Object} Contains height, width, x, and y properties.
 * @private
 */
Arduino.getBBox_ = function(element) {
  if (element.getBBox) {
    // SVG element.
    var bBox = element.getBBox();
    var height = bBox.height;
    var width = bBox.width;
    var xy = Blockly.getAbsoluteXY_(element);
    var x = xy.x;
    var y = xy.y;
  } else {
    // HTML element.
    var height = element.offsetHeight;
    var width = element.offsetWidth;
    var x = 0;
    var y = 0;
    do {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent;
    } while (element);
  }
  return {
    height: height,
    width: width,
    x: x,
    y: y
  };
};

/**
 * Load blocks saved in session/local storage.
 * @param {string} defaultXml Text representation of default blocks.
 */
Arduino.loadBlocks = function(defaultXml) {
  try {
    var loadOnce = window.sessionStorage.loadOnceBlocks;
  } catch(e) {
    // Firefox sometimes throws a SecurityError when accessing sessionStorage.
    // Restarting Firefox fixes this, so it looks like a bug.
    var loadOnce = null;
  }
  if (loadOnce) {
    // Language switching stores the blocks during the reload.
    delete window.sessionStorage.loadOnceBlocks;
    var xml = Blockly.Xml.textToDom(loadOnce);
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
  } else if (defaultXml) {
    // Load the editor with default starting blocks.
    var xml = Blockly.Xml.textToDom(defaultXml);
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
  }
};
