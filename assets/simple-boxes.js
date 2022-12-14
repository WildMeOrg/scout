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

    //console.log("mousedown",e.target.id,e.clientX,e.clientY);
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

    const myX = e.clientX - $(el).offset().left;
    const myY = e.clientY - $(el).offset().top;
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

    // Redraw
    await window.simpleBoxes._.methods.redrawBoxes(handle);

  },
  handleMouseUp : async (e) => {
    //console.log("mouseup",e.target.id,e.clientX,e.clientY);
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
    //console.log("mousemove",e.target.id,e.clientX,e.clientY);
    const sb = window.simpleBoxes._;
    const handle = sb.handles[e.target.id];
    const el = handle.canvas.element;
    const ctx = handle.canvas.ctx;
    const state = handle.canvas.state;
    // Figure out where cursor is
    const myX = e.clientX - $(el).offset().left;
    const myY = e.clientY - $(el).offset().top;
    let overWhichBox = await window.simpleBoxes._.methods.identifyBox(handle,myX,myY);

    if(state.mouseDown){
      // Dragging
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

          if(state.dragTypeOverride == 'center'){
            let xAdjustment = myX - state.dragStartX;
            let yAdjustment = myY - state.dragStartY;
            state.activeBox.x+=xAdjustment;
            state.activeBox.y+=yAdjustment;
            state.dragStartX = myX;
            state.dragStartY = myY;
          }

        }


        // Save it
        let copy = Object.assign({}, state.activeBox);
        await window.simpleBoxes._.methods.saveActiveBox(handle,copy);

        } else {
          // I am dragging on nothing, so now we create a box so I can drag it's corner
          let newBoxId = 'box-'+Date.now();
          state.activeBox = {
            id : newBoxId,
            x : e.clientX - $(el).offset().left,
            y : e.clientY - $(el).offset().top,
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

            } else {
              $('#'+handle.id).css('cursor','move');
            }
          }

        }



      }
      // Redraw
      await window.simpleBoxes._.methods.redrawBoxes(handle);
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
    console.log("REDRAW",handle.id);
    // Wipe the canvas
    await window.simpleBoxes._.methods.wipeCanvas(handle);

    // Go through each box and draw it
    for(box in handle.boxes){
      let boxData = handle.boxes[box];
      let isHover = boxData.id == handle.canvas.state.hoverBox ? true : false;
      await window.simpleBoxes._.methods.drawIndividualBox(handle,boxData,isHover);
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
    return;
  },
  drawIndividualBox : async(handle,box,isHover) => {

    // Draw the box itself
    handle.canvas.ctx.fillStyle = 'rgba(255, 0, 26, 0.35)';
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



    // Draw the trash can
    let trashCanX = copy.w > 0 ? copy.x : copy.x + copy.w;
    trashCanX+=15;
    let trashCanY = copy.h > 0 ? copy.y : copy.y + copy.h;
    trashCanY+=15;

    let trashCanString = `<i class="bi bi-trash3-fill deleteBoxTrigger trashIcon" data-handle-id="${handle.id}" data-box-id="${copy.id}" style="top: ${trashCanY}px; left: ${trashCanX}px"></i>`;

    if(!handle.readOnly){
      $(trashCanString).insertAfter('#'+handle.canvas.id);

    }


    // Draw the corners

    // Draw the label trigger
    let labelX = trashCanX + 30;
    let labelY = trashCanY;


    let labelString = `
<i class="bi bi-tag-fill labelBoxTrigger tagIcon" data-handle-id="${handle.id}" data-box-id="${copy.id}" style="top: ${labelY}px; left: ${labelX}px"></i>

`;
    $(labelString).insertAfter('#'+handle.canvas.id);

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

  // Trash cans
  $('body').on('click','i.deleteBoxTrigger', async (e) => {
    e.preventDefault();
    let handleId = $(e.target).attr('data-handle-id');
    let boxId = $(e.target).attr('data-box-id');
    await window.simpleBoxes._.methods.removeBox(handleId,boxId);
    await window.simpleBoxes._.methods.redrawBoxes(window.simpleBoxes._.handles[handleId]);
  });

  // Labeler
  $('body').on('click','i.labelBoxTrigger', async (e) => {
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

for(const allowedLabel of window.tagsList){
  let selectedStr = allowedLabel == selectedLabel ? 'selected' : '';

  labelStr+=`<option ${selectedStr} value="${allowedLabel}">${allowedLabel}</option>`
}


labelStr+=`

      </select>
    </div>

    `;
    $(labelStr).insertAfter('canvas#'+handleId);

  });

  $('body').on('input','select.labelSelector',async (e) =>{
    e.preventDefault();
    let val = $(e.target).val();
    let boxId = $(e.target).attr('data-box-id');
    let handleId = $(e.target).attr('data-handle-id');
    // Save that selection
    window.simpleBoxes._.handles[handleId].boxes[boxId].label = val;


    // Close it
    $(e.target).parent().remove();
    window.simpleBoxes._.handles[handleId].canvas.state.selectOpen = false;

  });

  // resize of source image

  // Pan and zoom of source image

  // Scroll up and down sizde by side source image
});
