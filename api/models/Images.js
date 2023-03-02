module.exports = {
  attributes: {
    currentExtension:  { type: 'string', required: true },
    originalExtension :  { type: 'string', required: true },
    originalFilenameLower :  { type: 'string', required: true },
    filename: { type: 'string', required: true },
    originalFilename: { type: 'string', required: true },
    exifTimestamp : { type : 'number', required: true },
    fullPath :  { type: 'string', required: true },
    taskIds: { type: 'json', columnType : "array" },
    gtComplete : { type : 'boolean' , defaultsTo : false}
  },

  // definitely would be better done as part of direct query on Images :(
  filterByLabels: async function(imageList, labels) {
    if (!labels || !labels.length) return imageList;
    let imagesWithLabels = [];
    for (const image of imageList) {
      let annots = await Annotations.find({
        imageId : image.id,
      });
      annots = annots || [];
      let gts = await GroundTruths.find({
        imageId : image.id,
      });
      gts = gts || [];
      if (!annots.length && !gts.length) continue;

      let found = false;
      // bummer, label is within boundingBoxes
      checkImageAnnot: for (const annot of annots) {
        // finding just one is good enough, cuz this is an "or" search
        for (const bbox of annot.boundingBoxes) {
          if (labels.indexOf(bbox.label) > -1) {
            imagesWithLabels.push(image);
            found = true;
            break checkImageAnnot;
          }
        }
      }
      if (!found) {  // lets try GT as well
        checkImageGT: for (const gt of gts) {
          // finding just one is good enough, cuz this is an "or" search
          for (const bbox of gt.boundingBoxes) {
            if (labels.indexOf(bbox.label) > -1) {
              imagesWithLabels.push(image);
              break checkImageGT;
            }
          }
        }
      }
    }
    return imagesWithLabels;
  },

  filterByWic: async function(imageList, wicMin, wicMax) {
    // return imageList;
    if (!wicMin && !wicMax) return imageList;    
    let result = [];    
    for (const image of imageList) {
    let imagesWithWic = await Annotations.find({
      imageId : image.id,
    });
    imagesWithWic = imagesWithWic || [];
    if (!imagesWithWic.length) continue;

    wicMin = wicMin || 0;
    wicMax = wicMax || 1;

    for(const wic of imagesWithWic) {
      if(wic.wicConfidence >= wicMin && wic.wicConfidence <= wicMax) {
        result.push(image);
        break;
      }
    }  
  }
    return result;
  }

};
