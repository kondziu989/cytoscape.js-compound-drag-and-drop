const assign = require('../assign');
const defaults = require('./defaults');
const toggle = require('./toggle');
const listeners = require('./listeners');
const preview = require('./preview');
const split = require('./split');
const join = require('./join');

const DragAndDrop = function(cy, options){
  this.cy = cy;
  this.options = assign({}, defaults, options);
  this.listeners = [];
  this.enabled = true;

  this.addListeners();
};

const destroy = function(){
  this.removeListeners();
};

[
  toggle,
  listeners,
  preview,
  split,
  join,
  { destroy }
].forEach(def => {
  assign(DragAndDrop.prototype, def);
});

module.exports = function(options){
  let cy = this;

  return new DragAndDrop(cy, options);
};
