const {
  isParent, isChild, isOnlyChild,
  getBounds, getBoundsTuple, boundsOverlap, expandBounds, getBoundsCopy,
  setParent, removeParent, isParentOf
} = require('./util');

const addListener = function(event, selector, callback){
  this.listeners.push({ event, selector, callback });

  if( selector == null ){
    this.cy.on(event, callback);
  } else {
    this.cy.on(event, selector, callback);
  }
};

const addListeners = function(){
  const { options, cy } = this;

  const isMultiplySelected = n => n.selected() && cy.elements('node:selected').length > 1;
  const canBeGrabbed = n => !isMultiplySelected(n) && options.grabbedNode(n);
  const canBeDropTarget = n => !n.same(this.grabbedNode) && options.dropTarget(n) && !isParentOf(this.grabbedNode, n);
  const canBeDropSibling = n => isChild(n) && !n.same(this.grabbedNode) && !isParentOf(this.grabbedNode, n) && options.dropSibling(n);
  const canPullFromParent = n => isChild(n);
  const canBeInBoundsTuple = n => (canBeDropTarget(n) || canBeDropSibling(n)) && !n.same(this.dropTarget);
  const updateBoundsTuples = () => this.boundsTuples = cy.nodes(canBeInBoundsTuple).map(getBoundsTuple);

  const reset = () => {
    this.grabbedNode.removeClass('cdnd-grabbed-node');
    this.dropTarget.removeClass('cdnd-drop-target');
    this.dropSibling.removeClass('cdnd-drop-sibling');

    this.grabbedNode = cy.collection();
    this.dropTarget = cy.collection();
    this.dropSibling = cy.collection();
    this.dropTargetBounds = null;
    this.boundsTuples = [];
    this.inGesture = false;
  };

  this.addListener('grab', 'node', e => {
    const node = e.target;

    if( !this.enabled || !canBeGrabbed(node) ){ return; }

    this.inGesture = true;
    this.grabbedNode = node;
    this.dropTarget = cy.collection();
    this.dropSibling = cy.collection();

    if( canPullFromParent(node) ){
      this.dropTarget = node.parent();
      this.dropTargetBounds = getBoundsCopy(this.dropTarget);
    }

    updateBoundsTuples();

    this.grabbedNode.addClass('cdnd-grabbed-node');
    this.dropTarget.addClass('cdnd-drop-target');

    node.emit('cdndgrab');
  });

  this.addListener('add', 'node', e => {
    if( !this.inGesture || !this.enabled  ){ return; }

    const newNode = e.target;

    if( canBeInBoundsTuple(newNode) ){
      this.boundsTuples.push( getBoundsTuple(newNode) );
    }
  });

  this.addListener('remove', 'node', e => {
    if( !this.inGesture || !this.enabled ){ return; }

    const rmedNode = e.target;
    const rmedIsTarget = rmedNode.same(this.dropTarget);
    const rmedIsSibling  = rmedNode.same(this.dropSibling);
    const rmedIsGrabbed = rmedNode.same(this.grabbedNode);

    // try to clean things up if one of the drop nodes is removed
    if( rmedIsTarget || rmedIsSibling || rmedIsGrabbed ){
      if( rmedIsGrabbed ){
        reset();
      } else {
        this.dropTarget = cy.collection();
        this.dropSibling = cy.collection();

        updateBoundsTuples();
      }
    }
  });

  this.addListener('drag', 'node', () => {
    if( !this.inGesture || !this.enabled ){ return; }

    if( this.dropTarget.nonempty() ){ // already in a parent
      const bb = expandBounds( getBounds(this.grabbedNode), options.outThreshold );
      let parent = this.dropTarget;
      let sibling = this.dropSibling;
      const rmFromParent = !boundsOverlap(this.dropTargetBounds, bb);
      // const grabbedIsOnlyChild = isOnlyChild(this.grabbedNode);


      if( rmFromParent ){
        removeParent(this.grabbedNode);
        removeParent(this.dropSibling);

        this.dropTarget.removeClass('cdnd-drop-target');
        this.dropSibling.removeClass('cdnd-drop-sibling');

        // if(
        //   this.dropSibling.nonempty() // remove extension-created parents on out
        //   || grabbedIsOnlyChild // remove empty parents
        // ){
        //   this.dropTarget.remove();
        // }

        this.dropTarget = cy.collection();
        this.dropSibling = cy.collection();
        this.dropTargetBounds = null;

        updateBoundsTuples();

        this.grabbedNode.emit('cdndout', [parent, sibling]);
      }

      const tupleOverlaps = t => !t.node.removed() && boundsOverlap(bb, t.bb) && isChild(t.node);
      const overlappingNodes = this.boundsTuples.filter(tupleOverlaps).map(t => t.node);


      if( overlappingNodes.length > 0 ) { // potential parent
        // const overlappingParents = overlappingNodes.filter(isParent);

        parent.removeClass('cdnd-drop-target')
        sibling = cy.collection();
        parent = overlappingNodes[0]; // TODO maybe use a metric here to select which one

        parent.addClass('cdnd-drop-target parent');
        sibling.addClass('cdnd-drop-sibling');

        setParent(sibling, parent);

        this.dropTargetBounds = getBoundsCopy(parent);

        setParent(this.grabbedNode, parent);

        this.dropTarget = parent;
        this.dropSibling = sibling;

        this.grabbedNode.emit('cdndover', [parent, sibling]);
      }
    } else { // not in a parent


      const bb = expandBounds( getBounds(this.grabbedNode), options.overThreshold );
      const tupleOverlaps = t => !t.node.removed() && boundsOverlap(bb, t.bb);
      const overlappingNodes = this.boundsTuples.filter(tupleOverlaps).map(t => t.node);

      // if( overlappingNodes.length > 0 ){ // potential parent
      //   // const overlappingParents = overlappingNodes.filter(isParent);
      //   const overlappingParents = overlappingNodes.filter(isParent);
      //   let parent, sibling;
      //
      //   if( overlappingParents.length > 0 ){
      //     sibling = cy.collection();
      //     parent = overlappingParents[0]; // TODO maybe use a metric here to select which one
      //   } else {
      //     sibling = overlappingNodes[0]; // TODO maybe use a metric here to select which one
      //     parent = cy.add( options.newParentNode(this.grabbedNode, sibling) );
      //   }

        if( overlappingNodes.length > 0 ){ // potential parent
        // const overlappingParents = overlappingNodes.filter(isParent);
        let parent, sibling;

          sibling = cy.collection();
          parent = overlappingNodes[0]; // TODO maybe use a metric here to select which one

        parent.addClass('cdnd-drop-target parent');
        sibling.addClass('cdnd-drop-sibling');

        setParent(sibling, parent);

        this.dropTargetBounds = getBoundsCopy(parent);

        setParent(this.grabbedNode, parent);

        this.dropTarget = parent;
        this.dropSibling = sibling;

        this.grabbedNode.emit('cdndover', [parent, sibling]);
      }

    }
  });

  this.addListener('free', 'node', () => {
    if( !this.inGesture || !this.enabled ){ return; }

    const { grabbedNode, dropTarget, dropSibling } = this;

    reset();

    grabbedNode.emit('cdnddrop', [dropTarget, dropSibling]);
  });
};

const removeListeners = function(){
  const { cy } = this;

  this.listeners.forEach(lis => {
    const { event, selector, callback } = lis;

    if( selector == null ){
      cy.removeListener(event, callback);
    } else {
      cy.removeListener(event, selector, callback);
    }
  });

  this.listeners = [];
};

module.exports = { addListener, addListeners, removeListeners };
