// Copyright 2015 Interactive Computing project (https://github.com/interactivecomputing).
// All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
// except in compliance with the License. You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific language governing permissions
// and limitations under the License.
//
// custom.js
//

// RequireJS configuration to add common scripts used.
require.config({
  paths: {
    d3: '//cdnjs.cloudflare.com/ajax/libs/d3/3.5.3/d3.min',
    elem: '/static/require/element'
  }
});

// CodeCell and CodeMirror related functionality
$(function() {
  function hiddenLineFormatter(n) { return ''; }
  function stringLineFormatter(n) { return n.toString(); }

  // load CodeMirror modes
  $.getScript('/static/components/codemirror/mode/clike/clike.js');
  $.getScript('/static/components/codemirror/mode/clike/javascript.js');

  // Configure CodeMirror settings
  var cmConfig = IPython.CodeCell.options_default.cm_config;
  cmConfig.mode = 'text/javascript';
  cmConfig.indentUnit = 2;
  cmConfig.smartIndent = true;
  cmConfig.autoClearEmptyLines = true;
  cmConfig.gutter = true;
  cmConfig.fixedGutter = true;
  cmConfig.lineNumbers = true;
  cmConfig.lineNumberFormatter = hiddenLineFormatter;

  // %%json cell support
  IPython.config.cell_magic_highlight['magic_application/ld+json'] = {
    reg: [ /%%json/ ]
  };

  // %%text cell support
  IPython.config.cell_magic_highlight['magic_text/plain'] = {
    reg: [ /%%text/ ]
  };

  // %%script cell support
  IPython.config.cell_magic_highlight.magic_javascript.reg = [ /^%%script/ ];

  var codeCellProto = IPython.CodeCell.prototype;
  var originalJSONConverter = codeCellProto.toJSON;
  var originalExecuteReplyHandler = codeCellProto._handle_execute_reply;
  var originalSelectHandler = codeCellProto.select;
  var originalUnselectHandler = codeCellProto.unselect;

  // Override JSON conversion to switch the language identifier.
  codeCellProto.toJSON = function() {
    var data = originalJSONConverter.apply(this);
    data.language = 'javascript';

    return data;
  }

  // Override execute handler on code cells to copy metadata from kernel into
  // cell metadata.
  codeCellProto._handle_execute_reply = function(msg) {
    originalExecuteReplyHandler.call(this, msg);

    var metadata = msg.metadata;
    for (var n in metadata) {
      if (n.indexOf('ijava.') === 0) {
        this.metadata[n] = metadata[n];
      }
    }
  }

  // Override select and unselect handlers to toggle display of line numbers.
  codeCellProto.select = function() {
    if (originalSelectHandler.apply(this)) {
      this.code_mirror.setOption('lineNumberFormatter', stringLineFormatter);
      return true;
    }
    return false;
  }
  codeCellProto.unselect = function() {
    if (originalUnselectHandler.apply(this)) {
      this.code_mirror.setOption('lineNumberFormatter', hiddenLineFormatter);
      return true;
    }
    return false;
  }
});

// JSON display support
$(function() {
  IPython.OutputArea.display_order.push('application/json');

  IPython.OutputArea.append_map['application/json'] = function(data, md, element) {
    data = JSON.stringify(JSON.parse(data), null, 2);

    var outputElement = this.create_output_subarea(md, 'output_text', 'application/json');
    outputElement.append($('<pre/>').text(data));
    element.append(outputElement);

    return outputElement;
  }
});

// Fix completion requests to include cell text!
$(function() {
  IPython.Kernel.prototype.complete = function(line, cursor_pos, callback) {
    var callbacks;
    if (callback) {
      callbacks = { shell : { reply : callback } };
    }

    var cell = IPython.notebook.get_selected_cell();
    var cm = cell.code_mirror;
    var content = {
      cursor_pos : cm.indexFromPos(cm.getCursor()),
      text : cell.get_text(),
      line : '',
      block : ''
    };
    return this.send_shell_message('complete_request', content, callbacks);
  }
});

// Add TOC functionality
function setupOutline() {
  var markup = '<select id="tocDropDown" style="float: right"><option>Outline</option></select>';
  IPython.toolbar.element.append(markup);

  var tocDropDown = $('#tocDropDown');
  tocDropDown.change(function(e) {
    var index = tocDropDown.val();
    if (index.length === '') {
      return false;
    }

    var scrollTop = IPython.notebook.get_cell(0).element.position().top -
                    IPython.notebook.get_cell(parseInt(index)).element.position().top;
    IPython.notebook.element.animate({ scrollTop: -scrollTop }, 250, 'easeInOutCubic');

    tocDropDown.blur();
    tocDropDown.find('option').get(0).selected = true;

    return false;
  });

  function createOption(title, value, level) {
    var prefix = level > 1 ? new Array(level + 1).join('&nbsp;&nbsp;') : '';
    var text = prefix + IPython.utils.escape_html(title);

    return '<option value="' + value + '">' + text + '</option>';
  }

  function updateOutline() {
    var content = [];
    content.push(createOption('Table of Contents', '', 0));

    var cells = IPython.notebook.get_cells();
    cells.forEach(function(c, i) {
      if ((c.cell_type == 'heading') && (c.level <= 3)) {
        var cell = $(c.element);
        var header = cell.find('h' + c.level);

        // Retrieve the title and strip off the trailing paragraph marker
        var title = header.text();
        title = title.substring(-1, title.length - 1);

        if (title == 'Type Heading Here') {
          // New cells have this placeholder text in them
          return;
        }

        content.push(createOption(title, i, c.level));
      }
    });

    var markup = content.join('');
    tocDropDown.html(markup);
  }

  updateOutline();
  $([IPython.events]).on('set_dirty.Notebook', function(event, data) {
    updateOutline();
  });
  $([IPython.events]).on('command_mode.Cell', function(event, data) {
    updateOutline();
  });
}
setTimeout(setupOutline, 1000);
