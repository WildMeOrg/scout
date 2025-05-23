/*
 * Simple Boxes
 * Basic image annotation
 *
 * Dependencies: jquery
 *
 */
/*
 * API:
 *
 * All functions should be called with await
 *
 * simpleBoxes (window object) // Not a function
 * simpleBoxes.debug(on = true)
 * simpleBoxes.initHandle(imageId,allowedLabels,readOnly = false) // returns handle
 * handle.createBox(x,y,w,h,label)
 * handle.zoom()
 * handle.pan()
 * handle.resize)() // unused?
 * handle.redrawCanvas() // unused?
 * handle.redrawBoxes() // unused?
 * handle.clear() // unused?
 * handle.getBoxes (return all box objects in an array)
 * handle.wipe()
 *
 *
 *
 *    Box Objects:
 *
 *    {
 *      id : string
 *      x : 0,
 *      y : 0,
 *      w : 0,
 *      h : 0,
 *      label : 0
 *    }
 *
 *
 *
 */



 /*
  * API
  *
  */
 window.simpleBoxes = {
  _ : {
    methods : {},
    eventHandlers : {},
    handles : {},
    config : {
      debug : false
    }
  }
};

// Turns debug logging on or off
window.simpleBoxes.debug = async (on = true) => {
  sb = window.simpleBoxes._;
  sb.config.debug = on;
};


// Returns a handle that will be used for subsequent requests
window.simpleBoxes.initHandle = async (imageId,allowedLabels = [],readOnly = false) => {

  const sb = window.simpleBoxes._;

  // Is imageID a valid string?
  if(typeof(imageId) !== 'string' && imageId.trim().length !== imageId.length){
    sb.log("The imageId you passed was not a valid string");
    return false;
  }

  // Does the image exist, and exist unambiguously
  const matchingImages = $('img#'+imageId);
  const matchingImagesCount = matchingImages.length;
  let targetedImage = false;
  if(matchingImagesCount == 0){
    sb.log("Could not find an image of that ID");
    return false;
  } else {
    if(matchingImagesCount > 1){
      sb.log("There are more than one images with that ID");
      return false;
    } else {
      targetedImage = matchingImages[0];
    }
  }

  // Confirm that image does not already have a handle on it
  if(typeof(sb.handles[imageId]) !== 'undefined'){
    sb.log('The image already has a handle on it.');
    return;
  }

  
  // Get the current width and height
  const currentDimensions = await sb.methods.getCurrentImageDimensions(targetedImage);
  if(!currentDimensions){
    sb.log('Could not get the current width and height of the specified image');
  }


  // Get the actual width and height of the image
  const actualDimensions = await sb.methods.getActualImageDimensions(imageId);
  if(!actualDimensions){
    sb.log('Could not get the actual width and height of the specified image.');
    return;
  }


  // Draw a canvas over the image
  let newCanvasId = 'canvas-'+imageId;
  let newCanvas = `<canvas id="${newCanvasId}" data-image="${imageId}" class="canvasToBox" width="" height=""></canvas>`;
  $(newCanvas).insertAfter('#'+imageId);
  await sb.methods.redrawCanvas(imageId,currentDimensions);

  let newCanvasElement = document.getElementById(newCanvasId);

  // Create a handle name and store it on the global object
  let handle = {
    readOnly : readOnly,
    id : newCanvasId,
    image : {
      id : imageId,
      currentDimensions : {
        w : currentDimensions.w,
        h : currentDimensions.h
      },
      actualDimensions : {
        w : actualDimensions.w,
        h : actualDimensions.h
      }
    },
    canvas : {
      id : newCanvasId,
      dimensions : {
        w : currentDimensions.w,
        h : currentDimensions.h
      },
      element : newCanvasElement,
      ctx : newCanvasElement.getContext('2d'),
      state : {
        drag : false,
        mouseDown : false,
        activeBox : false,
        drawingBox : false,
        hoverBox : false
      }
    },
    boxes : {}
  };

  // Set the event listeners
  newCanvasElement.addEventListener('mousedown', window.simpleBoxes._.methods.handleMouseDown);
  newCanvasElement.addEventListener('mouseup',  window.simpleBoxes._.methods.handleMouseUp);
  newCanvasElement.addEventListener('mousemove',  window.simpleBoxes._.methods.handleMouseMove);

  sb.handles[newCanvasId] = handle;

  // Return
  return handle;


};

 /*
  * Internal methods
  *
  */

// Higher level methods
window.simpleBoxes._.log = (msg) => {

  const sb = window.simpleBoxes._;
  // Is debugging turned on?

  // Console log but prepend the message with a debug label
  if(sb.config.debug){
    console.log("Simple Boxes DEBUG: ",msg);
  }

  return;

};

window.simpleBoxes.wipeCanvas = async (handleId) => {
  await window.simpleBoxes._.methods.wipeCanvas(window.simpleBoxes._.handles[handleId]);
  return;
}

window.simpleBoxes.getAllBoxes = async (handleId) => {
  let boxes = await window.simpleBoxes._.methods.getAllBoxes(handleId);
  return boxes;
}


window.simpleBoxes.loadBoxes = async (handleId,boxes) => {
  await window.simpleBoxes._.methods.loadBoxes(handleId,boxes);
  return;
}

window.simpleBoxes.zoom = async (handleId,boxes) => {

  let targetedImage = $('img#'+window.simpleBoxes._.handles[handleId].image.id);
  // Get the current width and height
  const currentDimensions = await window.simpleBoxes._.methods.getCurrentImageDimensions(targetedImage);

  window.simpleBoxes._.handles[handleId].image.currentDimensions.w = currentDimensions.w;
  window.simpleBoxes._.handles[handleId].image.currentDimensions.h = currentDimensions.h;
  window.simpleBoxes._.handles[handleId].canvas.dimensions.w = currentDimensions.w;
  window.simpleBoxes._.handles[handleId].canvas.dimensions.h = currentDimensions.h;
  await window.simpleBoxes._.methods.redrawCanvas(window.simpleBoxes._.handles[handleId].image.id,currentDimensions);
  await window.simpleBoxes._.methods.redrawBoxes(window.simpleBoxes._.handles[handleId]);

  return;
}

// Lower level methods
window.simpleBoxes._.methods = {

  handleMouseDown : async (e) => {
    const sb = window.simpleBoxes._;
    const handle = sb.handles[e.target.id];
    const el = handle.canvas.element;
    const ctx = handle.canvas.ctx;
    const state = handle.canvas.state;
    if(handle.readOnly){
      return;
    }

    if(state.selectOpen){
      // If the select modal is open, close it.
      $(state.selectOpen).parent().remove();
      state.selectOpen = false;
      return;
    }

    state.mouseDown = true;
    // Clicked on something, determine if it's center or one of the corners
    // Move the correct item into state.activebox, or set activebox to false
    // Set dragtype and dragcorner
    const myX = e.clientX - $(el).offset().left + window.scrollX;
    const myY = e.clientY - $(el).offset().top + window.scrollY;   
    let overWhichBox = await window.simpleBoxes._.methods.identifyBox(handle,myX,myY);
    if(overWhichBox.box){
      state.activeBox = overWhichBox.box;
      state.dragTypeOverride = overWhichBox.dragType;
      state.dragCornerOverride = overWhichBox.dragCorner;
      state.dragStartX = myX;
      state.dragStartY = myY;

    } else {
      state.activeBox = false;
      state.dragTypeOverride = false;
      state.dragCornerOverride = false;
    }

    // Set the current drawing canvas
    window.simpleBoxes._.currentDrawingCanvasId = e.target.id;

    // watch for mouse move and mouse up outsise the canvas
    document.addEventListener('mousemove', window.simpleBoxes._.methods.globalMouseMove);
    document.addEventListener('mouseup', window.simpleBoxes._.methods.globalMouseUp);

    // Redraw
    await window.simpleBoxes._.methods.redrawBoxes(handle);

  },
  handleMouseUp : async (e) => {
    const sb = window.simpleBoxes._;
    const handle = sb.handles[e.target.id];
    const ctx = handle.canvas.ctx;
    const state = handle.canvas.state;

    if(handle.readOnly){
      return;
    }

    state.activeBox = false;
    state.dragTypeOverride = false;
    state.dragCornerOverride = false;
    state.mouseDown = false;
    state.drawingBox = false;

    // Just clicked
    state.activeBox = false;

    // Redraw
    await window.simpleBoxes._.methods.redrawBoxes(handle);
  },
  handleMouseMove : async (e) => {
    const sb = window.simpleBoxes._;
    const handle = sb.handles[e.target.id];
    const el = handle.canvas.element;
    const ctx = handle.canvas.ctx;
    const state = handle.canvas.state;

    // Figure out where cursor is    
    let myX = e.clientX - $(el).offset().left + window.scrollX;
    let myY = e.clientY - $(el).offset().top + window.scrollY;

    const canvasW = handle.canvas.dimensions.w;
    const canvasH = handle.canvas.dimensions.h;
    
    const isOutOfBounds =
      myX < 0 || myX > canvasW ||
      myY < 0 || myY > canvasH;

    //out of bounds
    if (isOutOfBounds) {
      // Clamp to edge
      myX = Math.max(0, Math.min(myX, canvasW));
      myY = Math.max(0, Math.min(myY, canvasH));
    
      if (state.drawingBox && state.activeBox) {
        const startX = state.activeBox.x;
        const startY = state.activeBox.y;
    
        const newX = Math.min(startX, myX);
        const newY = Math.min(startY, myY);
        const newW = Math.abs(myX - startX);
        const newH = Math.abs(myY - startY);
    
        state.activeBox.x = newX;
        state.activeBox.y = newY;
        state.activeBox.w = newW;
        state.activeBox.h = newH;
    
        // Save it
        const copy = Object.assign({}, state.activeBox);
        await window.simpleBoxes._.methods.saveActiveBox(handle, copy);
    
        //stop drawing
        state.drawingBox = false;
        state.mouseDown = false;
        state.activeBox = false;
    
        // Redraw
        await window.simpleBoxes._.methods.redrawBoxes(handle);
      }    
      return;
    }

    //on the canvas
    let overWhichBox = await window.simpleBoxes._.methods.identifyBox(handle,myX,myY);

    if(state.mouseDown){
      state.drag = true;
      if(overWhichBox.box){
        state.dragType = overWhichBox.dragType;
        state.dragCorner = overWhichBox.dragCorner;
      }

      if(state.activeBox){

        if(state.drawingBox){

          let newWidth = myX - state.activeBox.x;
          let newHeight = myY - state.activeBox.y;
          state.activeBox.w = newWidth;
          state.activeBox.h = newHeight;


        } else {
          // I am either dragging a box or a corner of a box
          // Adjust activebox

          if(state.dragTypeOverride == 'corner'){


              let oTL = [state.activeBox.x,state.activeBox.y];
              let oTR = [state.activeBox.x + state.activeBox.w,state.activeBox.y];
              let oBL = [state.activeBox.x,state.activeBox.y + state.activeBox.h];
              let oBR = [state.activeBox.x + state.activeBox.w,state.activeBox.y + state.activeBox.h];

              let endPoint = [myX,myY];
              let startPoint = [];
              if(state.dragCornerOverride == 'tl'){
                startPoint = oBR;
              }
              if(state.dragCornerOverride == 'tr'){
                startPoint = oBL;
              }
              if(state.dragCornerOverride == 'bl'){
                startPoint = oTR;
              }
              if(state.dragCornerOverride == 'br'){
                startPoint = oTL;
              }


              state.activeBox.x = startPoint[0] < endPoint[0] ? startPoint[0] : endPoint[0];
              state.activeBox.y = startPoint[1] < endPoint[1] ? startPoint[1] : endPoint[1];;
              state.activeBox.w = Math.abs(startPoint[0] - endPoint[0]);
              state.activeBox.h = Math.abs(startPoint[1] - endPoint[1]);

              // Now sanity check any flipping


          }

          //Disable "drag-to-move" feature for now.

          // if(state.dragTypeOverride == 'center'){
          //   let xAdjustment = myX - state.dragStartX;
          //   let yAdjustment = myY - state.dragStartY;
          //   state.activeBox.x+=xAdjustment;
          //   state.activeBox.y+=yAdjustment;
          //   state.dragStartX = myX;
          //   state.dragStartY = myY;
          // }

        }


        // Save it
        let copy = Object.assign({}, state.activeBox);
        await window.simpleBoxes._.methods.saveActiveBox(handle,copy);

        } else {
          // console.log("I am dragging on nothing, so now we create a box so I can drag it's corner")
          let newBoxId = 'box-'+Date.now();
          state.activeBox = {
            id : newBoxId,            
            x : e.clientX - $(el).offset().left + window.scrollX,
            y : e.clientY - $(el).offset().top + window.scrollY,
            w : 0,
            h : 0,
            label : null
          }
          let copy = Object.assign({}, state.activeBox);
          state.dragType = 'corner';
          state.dragCorner = 'br';
          state.drawingBox = state.activeBox;
          await window.simpleBoxes._.methods.saveActiveBox(handle,copy);
        }
      } else {

        if(!handle.readOnly){

          // Not dragging, but could be hovering
          state.drag = false;
          state.activeBox = false;
          if(!overWhichBox.box){
            state.hoverBox = false;
            state.dragType = false;
            state.dragCorner = false;
            $('#'+handle.id).css('cursor','crosshair');
          } else {
            state.hoverBox = overWhichBox.box.id;
            state.dragType = overWhichBox.dragType;
            state.dragCorner = overWhichBox.dragCorner;
            if(overWhichBox.dragType == 'corner'){
              $('#'+handle.id).css('cursor','grab');

            } 
            //Disable "drag-to-move" feature for now.
            // else {
              // $('#'+handle.id).css('cursor','move');
            // }
          }

        }



      }
      // Redraw
      await window.simpleBoxes._.methods.redrawBoxes(handle);
  },

  globalMouseMove: async (e) => {
    const handleId = window.simpleBoxes._.currentDrawingCanvasId;
    if (!handleId) return;
  
    const fakeEvent = {
      target: { id: handleId },
      clientX: e.clientX,
      clientY: e.clientY
    };
  
    await window.simpleBoxes._.methods.handleMouseMove(fakeEvent);
  },
  
  globalMouseUp: async (e) => {
    const handleId = window.simpleBoxes._.currentDrawingCanvasId;

    if (!handleId) return;
    if (e.target && e.target.classList.contains('annotationBox')) return;
    if (e.target && e.target.classList.contains('labelSelector')) return;
  
    const fakeEvent = {
      target: { id: handleId },
      clientX: e.clientX,
      clientY: e.clientY
    };
  
    await window.simpleBoxes._.methods.handleMouseUp(fakeEvent);
  },
  
  identifyBox : async(handle,x,y) => {
    let returnData = {
      box : false,
      dragType : false,
      dragCorner : false
    };
    let boxFound = false;

    // Go through each box
    for(index in handle.boxes){
      let box = handle.boxes[index];

      let reverseRatio =  handle.image.currentDimensions.w / handle.image.actualDimensions.w;

      let copy = Object.assign({}, box);
      copy.x = copy.x * reverseRatio;
      copy.y = copy.y * reverseRatio;
      copy.w = copy.w * reverseRatio;
      copy.h = copy.h * reverseRatio;

      inBox = await window.simpleBoxes._.methods.pointInBox(copy.x,copy.y,copy.w,copy.h,x,y);
      if(inBox.result){
        returnData.box = copy;
        returnData.dragType = inBox.dragType;
        returnData.dragCorner = inBox.dragCorner;
      }
      // Note: keep going through loop because later ones in the object are higher z-scores
    }

    return returnData;

  },
  getAllBoxes : async (handleId) => {
    return window.simpleBoxes._.handles[handleId].boxes;
  },
  loadBoxes : async (handleId,boxes) => {
    let boxesObject = {};
    for(const box of boxes){
      boxesObject[box.id] = box;
    }
    window.simpleBoxes._.handles[handleId].boxes = boxesObject;
    await window.simpleBoxes._.methods.redrawBoxes(window.simpleBoxes._.handles[handleId]);
    return;
  },
  pointInBox : async(boxX,boxY,boxW,boxH,x,y) => {

    let returnData = {
      result : false,
      dragType : false,
      dragCorner : false
    }

    // @TODO change logic to allow for drawing not down and to the right
    let inBox = false;
    let topLeft = [boxX,boxY];
    let bottomRight = [boxX+boxW,boxY+boxH];

    let adjTLX = bottomRight[0] < topLeft[0] ? bottomRight[0] : topLeft[0];
    let adjTLY = bottomRight[1] < topLeft[1] ? bottomRight[1] : topLeft[1];
    let adjBRX = bottomRight[0] > topLeft[0] ? bottomRight[0] : topLeft[0];
    let adjBRY = bottomRight[1] > topLeft[1] ? bottomRight[1] : topLeft[1];

    topLeft = [adjTLX,adjTLY];
    bottomRight = [adjBRX,adjBRY];

    // Is the point captured on the X axis?
    let capturedOnX = x >= topLeft[0] && x <= bottomRight[0];

    // Is the point captured on the Y axis?
    let capturedOnY = y >= topLeft[1] && y <= bottomRight[1];

    if(!capturedOnX || !capturedOnY){
      return returnData;
    }

    let distanceIntoImageX = (x - topLeft[0]) / boxW;
    let distanceIntoImageY = (y - topLeft[1]) / boxH;

    returnData.result = true;
    returnData.dragType = 'center';

    let cornerThreshold = 0.15; // 15% into the image

    // Top left
    if(distanceIntoImageX < cornerThreshold && distanceIntoImageY < cornerThreshold){
      returnData.dragType = 'corner';
      returnData.dragCorner = 'tl';
    }

    // Top Right
    if(distanceIntoImageX > (1 - cornerThreshold) && distanceIntoImageY < cornerThreshold){
      returnData.dragType = 'corner';
      returnData.dragCorner = 'tr';
    }

    // Bottom left
    if(distanceIntoImageX < cornerThreshold && distanceIntoImageY > (1 - cornerThreshold)){
      returnData.dragType = 'corner';
      returnData.dragCorner = 'bl';
    }

    // Bottom Right
    if(distanceIntoImageX > (1 - cornerThreshold) && distanceIntoImageY > (1 - cornerThreshold)){
      returnData.dragType = 'corner';
      returnData.dragCorner = 'br';
    }


    return returnData;

  },
  saveActiveBox : async(handle,copy) => {

    const ctx = handle.canvas.ctx;
    const state = handle.canvas.state;
    let box = copy;



    ratio = handle.image.actualDimensions.w / handle.image.currentDimensions.w;
    box.x = box.x * ratio;
    box.y = box.y * ratio;
    box.w = box.w * ratio;
    box.h = box.h * ratio;

    handle.boxes[box.id] = box;

  },
  removeBoxes : async () => {

  },
  removeBox : async(handleId,boxId) =>{
    delete window.simpleBoxes._.handles[handleId].boxes[boxId];
    return;
  },
  redrawBoxes : async(handle) => {
    // Wipe the canvas
    await window.simpleBoxes._.methods.wipeCanvas(handle);

    // Go through each box and draw it
    for(box in handle.boxes){
      let boxData = handle.boxes[box];
      let isHover = boxData.id == handle.canvas.state.hoverBox ? true : false;
      await window.simpleBoxes._.methods.drawIndividualBox(handle,boxData,isHover);
    }     
     // e.target.setAttribute('tabindex', '0');
    // e.target.focus();

    const allBoxes = Object.entries(await window.simpleBoxes.getAllBoxes(handle.id));
    const ids = [];
    allBoxes.forEach(data => ids.push(data[0].slice(4,)));
    //Get the latest annotation id
    const sortedId = ids.sort((a,b) => b-a)[0];
    //Get the red box, hard-coded "3" here, every annotation has 4 items: 
    //the trash can icon, the label icon, label, and the red box. They all have the same data-box-id
    //For now the red box is the 4th item of these, so hard-coded [3].
    const latestAnnotation = document.querySelectorAll(`[data-box-id = 'box-${sortedId}']`)[3];    
    if(latestAnnotation) {      
      const elementRect = latestAnnotation.getBoundingClientRect();
      const parentDiv = document.querySelector("#annotationOuterWrapper") || document.querySelector("#scrollBoxLeft");
      const parentRect = parentDiv.getBoundingClientRect();
      //If the latest annotation is out of the boundary of the container, de-focus
      if (elementRect.left < parentRect.left + 10 ||
        elementRect.right > parentRect.right - 10||
        elementRect.top < parentRect.top + 10||
        elementRect.bottom > parentRect.bottom - 10) {
        latestAnnotation.blur();
        latestAnnotation.setAttribute('tabindex', '-1');
    } else {
        latestAnnotation.setAttribute('tabindex', '0');
        latestAnnotation.focus(); 
    }
     
      
  }   
    return;
  },
  wipeCanvas : async(handle) => {
    handle.canvas.ctx.clearRect(0,0,handle.canvas.dimensions.w,handle.canvas.dimensions.h);
    let trashCans = $('i.deleteBoxTrigger');
    for(const trash of trashCans){
      trash.remove();
    }
    let labels = $('i.labelBoxTrigger');
    for(const label of labels){
      label.remove();
    }
    let labelContent = $('i.labelContent');
    for(const label of labelContent) {
      label.remove();
    }
    let divs = $('div.annotationBox');
    for(const div of divs) {
      div.remove();
    }
    return;
  },
  drawIndividualBox : async(handle,box,isHover) => {

    // Draw the box itself
    handle.canvas.ctx.fillStyle = 'rgba(255, 0, 26, 0.01)';
    if(isHover){
      handle.canvas.ctx.fillStyle = 'rgba(255, 136, 46, 0.35)';
    }

    let reverseRatio =  handle.image.currentDimensions.w / handle.image.actualDimensions.w;
    
    let copy = Object.assign({}, box);

    copy.x = copy.x * reverseRatio;
    copy.y = copy.y * reverseRatio;
    copy.w = copy.w * reverseRatio;
    copy.h = copy.h * reverseRatio;
    handle.canvas.ctx.fillRect(copy.x, copy.y, copy.w, copy.h);

    //Draw annotation box which user can select and use hot key to change label or delete
    //AnnotationBox's left and top coordinates have to be "later" than the mouse move(coly.x and copy.y), so add 2px here.
    let div = `<div 
      class="annotationBox" 
      data-handle-id="${handle.id}" 
      data-box-id="${copy.id}" 
      style="
      position: absolute;
      top: ${copy.h > 0 ? copy.y +2: copy.y + copy.h +2}px; 
      left: ${copy.w > 0 ? copy.x +2: copy.x + copy.w +2}px; 
      width: ${Math.abs(copy.w)-4}px; 
      height: ${Math.abs(copy.h)-4}px;
      border: 2px solid red;
      z-index: auto;
      ">      
        </div>`;
    
    if(!handle.readOnly){
      $(div).insertAfter('#'+handle.canvas.id);
    }

    // Draw the corners
      
    // Draw the trash can
    
    //get right edge of the image
    // if annotation box is on the right edge, move the trash can to the left of the annotation box    
    const rightEdge = handle.image.currentDimensions.w;
    let trashCanX = 0;
    if (copy.w > 0) {
      if (copy.x >= rightEdge - 30) {
        trashCanX = copy.x - 30;
      } else {
        trashCanX = copy.x;
      }
    } else {
      if (copy.x + copy.w >= rightEdge - 30) {
        trashCanX = copy.x + copy.w- 30;
      } else {                                  
        trashCanX = copy.x + copy.w;
      }
    }

    // if annotation box is on the top edge, move the trash can to the bottom of the annotation box    
    let trashCanY = 0;

    if(copy.h > 0){
      if(copy.y <= 20){
        trashCanY = copy.y + copy.h + 15;
      }else {
        trashCanY = copy.y;
      }
    } else {
      if(copy.y + copy.h <= 20){
        trashCanY = copy.y + 15;
      }else {
        trashCanY = copy.y + copy.h;
      }
    }     

    trashCanY-=20;

    let trashCanString = `<i class="bi bi-trash3-fill deleteBoxTrigger trashIcon" data-handle-id="${handle.id}" data-box-id="${copy.id}" style="top: ${trashCanY}px; left: ${trashCanX}px"></i>`;

    if(!handle.readOnly){
      $(trashCanString).insertAfter('#'+handle.canvas.id);

    }

    // Draw the label trigger
    let labelX = trashCanX + 20;
    let labelY = trashCanY;

    let labelString = `
<i class="bi bi-tag-fill labelBoxTrigger tagIcon" data-handle-id="${handle.id}" data-box-id="${copy.id}" style="top: ${labelY}px; left: ${labelX}px"></i>
`;

    if(!handle.readOnly){
      $(labelString).insertAfter('#'+handle.canvas.id);   
    } 

    //Draw the label
 
    let labelContentX = labelX + 20;
    let labelContentY = labelY;
    let currentLabel = window.simpleBoxes._.handles[handle.id].boxes[copy.id].label;
    let finalLabel = "";
    //Get active label from session
    const activeLabel = sessionStorage.getItem("active-label");
    if(currentLabel) {
      finalLabel = currentLabel;
    }else {
      if(activeLabel) {
        finalLabel = activeLabel;
        //Save the label
        window.simpleBoxes._.handles[handle.id].boxes[copy.id].label = activeLabel;
      }
    }

    let labelContentString = "";
    if(document.querySelector("#scrollBoxLeft") && handle.readOnly) {
      const offsetLeft = document.querySelector("#scrollBoxLeft").scrollLeft;
      const offsetTop = document.querySelector("#scrollBoxLeft").scrollTop;

      labelContentString = `
      <i class="bi labelContent tagIcon" 
        data-handle-id="${handle.id}" 
        data-box-id="${copy.id}" 
        style="
        top: ${labelContentY - offsetTop }px; 
        left: ${copy.x - offsetLeft}px; 
        width: ${(currentLabel || activeLabel).length * 10}px !important
        ">${finalLabel }
        </i>    
      `; 
    }else {
      labelContentString = `
      <i class="bi labelContent tagIcon" 
        data-handle-id="${handle.id}" 
        data-box-id="${copy.id}" 
        style="
        top: ${labelContentY}px;
        left: ${labelContentX}px;
        width: ${(currentLabel || activeLabel).length * 10}px !important
        ">${finalLabel }
        </i>    
      `;
    }
 

    $(labelContentString).insertAfter('#'+handle.canvas.id);

    if ($("#toggle-switch").is(":checked")) {
      $('i.labelContent').css("display", "block");
      $('i.labelBoxTrigger').css("display", "block");
      $('i.deleteBoxTrigger ').css("display", "block");
    } else {
      $('i.labelContent').css("display", "none");
      $('i.labelBoxTrigger').css("display", "none");  
      $('i.deleteBoxTrigger ').css("display", "none");   
    }

    return;
  },
  redrawCanvas : async (imageId,dimensions) => {

    let sel = 'canvas[data-image="'+imageId+'"]';
    let h = dimensions.h+'px';
    let w = dimensions.w+'px';
    $(sel).attr('height',h);
    $(sel).attr('width',w);
    $(sel).css('height',h);
    $(sel).css('width',w);

    return;
  },

  getActualImageDimensions : async (img) => {

    let image = document.querySelector('#'+img);

    // Get natural width and height
    let actualHeight = image.naturalHeight;
    let actualWidth = image.naturalWidth;

    if(!actualHeight || !actualWidth){
      return false;
    } else {
      let dimensions = {
        w : actualWidth,
        h : actualHeight
      };
      return dimensions;
    }


  },

  getCurrentImageDimensions : async (img) => {

    // Get the current width and height
    let currentHeight = $(img).height();
    let currentWidth = $(img).width();

    if(!currentHeight || !currentWidth){
      return false;
    } else {
      let dimensions = {
        w : currentWidth,
        h : currentHeight
      };
      return dimensions;
    }

  }

};



 /*
  * Event Handlers
  *
  */



$( document ).ready(function() { 

  if(document.querySelector("#unset-active-hotkey-switch") && sessionStorage.getItem("active-label")) {
    document.querySelector("#unset-active-hotkey-switch").checked = true;
  }

  const toggleSwitchSession = sessionStorage.getItem("toggle-switch");
  document.querySelector("#toggle-switch").checked = toggleSwitchSession === "false" ? false : true;

  const mousemove = async (e, handleId) => {
    e.preventDefault();
    const fakeEvent = {
      target: {id: handleId},
      clientX: e.clientX,
      clientY: e.clientY
    }
    await window.simpleBoxes._.methods.handleMouseMove(fakeEvent);
  }

  const mouseup = async (e, handleId) => {
    e.preventDefault();
    const fakeEvent = {
      target: {id: handleId},
      clientX: e.clientX,
      clientY: e.clientY
    }
    await window.simpleBoxes._.methods.handleMouseUp(fakeEvent);
  }

  // Trash cans
  $('body').on('mousedown','i.deleteBoxTrigger', async (e) => {
    e.preventDefault();
    let handleId = $(e.target).attr('data-handle-id');
    let boxId = $(e.target).attr('data-box-id');
    await window.simpleBoxes._.methods.removeBox(handleId,boxId);
    await window.simpleBoxes._.methods.redrawBoxes(window.simpleBoxes._.handles[handleId]);
  });

 $('body').on('mousemove mouseup', 'i.deleteBoxTrigger, i.labelBoxTrigger, i.labelContent', async (e) => {
    let handleId = $(e.target).attr('data-handle-id');
    if (e.type === 'mousemove') {
        await mousemove(e, handleId);
    } else if (e.type === 'mouseup') {
        await mouseup(e, handleId);
    } 
});


  // Labeler
  $('body').on('mousedown','i.labelBoxTrigger', async (e) => {
    e.preventDefault();
    let boxId = $(e.target).attr('data-box-id');
    let handleId = $(e.target).attr('data-handle-id');
    $('.labelSelectorWrapper[data-box-id="'+boxId+'"]').removeClass('closed');
    let selectedLabel = window.simpleBoxes._.handles[handleId].boxes[boxId].label;
    window.simpleBoxes._.handles[handleId].canvas.state.selectOpen = `.labelSelector[data-box-id="${boxId}"]`;
    let labelY = $(e.target).css('top');
    let labelX = $(e.target).css('left');
    let labelStr = `

    <div class="labelSelectorWrapper" data-handle-id="${handleId}" data-box-id="${boxId}"  style="top: ${labelY}; left: ${labelX}">
      <select class="labelSelector" data-handle-id="${handleId}" data-box-id="${boxId}">
        <option value="">Select a Label</option>
`;    


    const allLabelNames = [];
    window.tagsList.forEach(data => allLabelNames.push(data.name));

    for(const allowedLabel of allLabelNames){
      let selectedStr = allowedLabel == selectedLabel ? 'selected' : '';

      labelStr+=`<option ${selectedStr} value="${allowedLabel}">${allowedLabel}</option>`
    }


    labelStr+=`

          </select>
        </div>

        `;
        $(labelStr).insertAfter('canvas#'+handleId);

      });

  const saveAndClose = async (select) => {
    let val = select.selectedOptions[0].value;
    let boxId = select.getAttribute('data-box-id');
    let handleId = select.getAttribute('data-handle-id');

    // Save that selection
    window.simpleBoxes._.handles[handleId].boxes[boxId].label = val;
    let allBoxes = await window.simpleBoxes.getAllBoxes(handleId);

    // Close it
    select.parentNode.remove();
    window.simpleBoxes._.handles[handleId].canvas.state.selectOpen = false;
    }   

  // When press down DEL button, delete the focused annotation
  document.addEventListener('keydown', async function(event) {
    if (event.keyCode === 46) {
      const focusedBox = document.querySelector('.annotationBox:focus');
      if(focusedBox) {
        let handleId = focusedBox.getAttribute('data-handle-id');
        let boxId = focusedBox.getAttribute('data-box-id');
        await window.simpleBoxes._.methods.removeBox(handleId,boxId);
        await window.simpleBoxes._.methods.redrawBoxes(window.simpleBoxes._.handles[handleId]);    
      }        
    } else {
      await boxKeyDownEvent(event);
    }    
  });   
  
  const pair = [];
    [0,1,2,3,4,5,6,7,8,9].forEach(data => {
      pair.push({key: data.toString(), keyCode: data.toString().charCodeAt(0)});      
    });

  const boxKeyDownEvent = async (e, handleId, boxId) => {
        
    const isShiftPressed = e.shiftKey;
    const keycode = e.keyCode;
    let label = "";
    for(let i = 0; i < pair.length; i++) {          
      // Detect keys pressed down
      if (isShiftPressed && keycode === pair[i].keyCode) {
        document.querySelector("#unset-active-hotkey-switch").checked = true;
        label = window.tagsList.find(l => l.hotKey === `shft+${pair[i].key}`);         
      }else if (keycode === pair[i].keyCode) {
        document.querySelector("#unset-active-hotkey-switch").checked = true;
        label = window.tagsList.find(l => l.hotKey === pair[i].key);
      }
      //Get active label from session and update page
      if(label && document.querySelector("#activeLabel")) {    
        document.querySelector("#activeLabel").innerHTML = label.name;
        sessionStorage.setItem("active-label", label.name);
        
            } 
      //Update focused annotation's label
      if(label && handleId && boxId) {
        window.simpleBoxes._.handles[handleId].boxes[boxId].label = label.name;        
        await window.simpleBoxes._.methods.redrawBoxes(window.simpleBoxes._.handles[handleId]);
      }  
    }
  }

  $('body').on('mousedown', 'div.annotationBox', async (e) => {
    // let boxId = $(e.target).attr('data-box-id');
    // let handleId = $(e.target).attr('data-handle-id');
    // const currentBox = document.querySelectorAll(`[data-box-id = ${boxId}]`)[3];  
    // currentBox.setAttribute('tabindex', '0');
    // currentBox.focus();
    e.target.setAttribute('tabindex', '0');
    e.target.focus();
  });

  $('body').on('mousemove', 'div.annotationBox', async (e) => {
    let handleId = $(e.target).attr('data-handle-id');
    await mousemove(e, handleId);
  });

  $('body').on('mouseup', 'div.annotationBox', async (e) => {
    let boxId = $(e.target).attr('data-box-id');
    let handleId = $(e.target).attr('data-handle-id');
    await mouseup(e, handleId);
    const currentBox = document.querySelectorAll(`[data-box-id = ${boxId}]`)[3];  
    currentBox.setAttribute('tabindex', '0');
    currentBox.focus();
  });


  $('body').on('keydown', 'div.annotationBox', async (e) => {
    let boxId = $(e.target).attr('data-box-id');
    let handleId = $(e.target).attr('data-handle-id');
    if($(e.target).attr('tabindex') === '0') {
      await boxKeyDownEvent(e, handleId, boxId);
       }    
  });


  $('body').on('input','select.labelSelector',async (e) =>{
    e.preventDefault();
    let val = $(e.target).val();
    let boxId = $(e.target).attr('data-box-id');
    let handleId = $(e.target).attr('data-handle-id');
    // Save that selection
    window.simpleBoxes._.handles[handleId].boxes[boxId].label = val;
    let allBoxes = await window.simpleBoxes.getAllBoxes(handleId);
    // Close it
    $(e.target).parent().remove();
    window.simpleBoxes._.handles[handleId].canvas.state.selectOpen = false;

  });

  //Toggle to show/hide labels
  $("body").on("change", "#toggle-switch", async (e) => {
    sessionStorage.setItem("toggle-switch", e.target.checked);
    if ($("#toggle-switch").is(":checked")) {
      $('i.labelContent').css("display", "block");
      $('i.labelBoxTrigger').css("display", "block");
      $('i.deleteBoxTrigger ').css("display", "block");
    } else {
      $('i.labelContent').css("display", "none");
      $('i.labelBoxTrigger').css("display", "none");  
      $('i.deleteBoxTrigger ').css("display", "none");   
    }
  });

  // toggle to set/unsset active hotkey
  $("body").on("change", "#unset-active-hotkey-switch", async (e) => {
    if ($("#unset-active-hotkey-switch").is(":checked")) {
    }else {
      document.querySelector("#activeLabel").innerHTML = "None";
      sessionStorage.setItem("active-label", "");
    }
  });

  $('body').on('change', '.gridswitch', async (e) => {      
      const gridOverlays = document.querySelectorAll('.gridOverlay');
      if (e.target.checked) {
        gridOverlays.forEach(gridOverlay => {
          gridOverlay.style.display = 'block';
      });
      } else {
        gridOverlays.forEach(gridOverlay => {
          gridOverlay.style.display = 'none';
      }); 
      }   
  });

  // resize of source image

  // Pan and zoom of source image

  // Scroll up and down sizde by side source image
});
