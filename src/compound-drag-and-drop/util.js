const isParent = n => n.isParent();
const isChild = n => n.isChild();

const getBounds = n => n.boundingBox({ includeOverlays: false });
const getBoundsTuple = n => ({ node: n, bb: getBounds(n) });

const removeParent = n => n.move({ parent: null });
const setParent = (n, parent) => n.move({ parent: parent.id() });
const freshRef = n => n.cy().getElementById(n.id());

const boundsOverlap = (bb1, bb2) => {
  // case: one bb to right of other
  if( bb1.x1 > bb2.x2 ){ return false; }
  if( bb2.x1 > bb1.x2 ){ return false; }

  // case: one bb to left of other
  if( bb1.x2 < bb2.x1 ){ return false; }
  if( bb2.x2 < bb1.x1 ){ return false; }

  // case: one bb above other
  if( bb1.y2 < bb2.y1 ){ return false; }
  if( bb2.y2 < bb1.y1 ){ return false; }

  // case: one bb below other
  if( bb1.y1 > bb2.y2 ){ return false; }
  if( bb2.y1 > bb1.y2 ){ return false; }

  // otherwise, must have some overlap
  return true;
};

module.exports = {
  isParent, isChild,
  getBoundsTuple, boundsOverlap, getBounds,
  removeParent, setParent, freshRef
 };