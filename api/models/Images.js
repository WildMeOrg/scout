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


    deleteCascade: async function(id) {
        let image = await Images.findOne({id: id});
        if (!image) return;

        // all these things reference Images, so must be also deleted where appropriate
        console.info('deleting associated objects for imageId=%s', id);
        await QueuedImages.deleteForImage(id);
        await Annotations.deleteForImage(id);
        await GroundTruths.deleteForImage(id);
        await LineDivisions.deleteForImage(id);
        await SequencedPairs.deleteForImage(id);


        console.info('deleting actual image id=%s', id);
        let deletedImage = await Images.destroyOne({id: id});

        // tasks (list) are linked within Image, so that will be gone automatically
        //  confirmed 2023-02-27 that Tasks with *no images* can be left alone so no cascade needed to delete Task
        //  but we do need to update the various counts on those tasks affected
        for (const taskId of image.taskIds){
            console.info('- recalculating for imageId=%s taskId=%o', id, taskId);
            await sails.helpers.recalculatePercentages('imageCount',taskId);
            await sails.helpers.recalculatePercentages('gt',taskId);
            await sails.helpers.recalculatePercentages('annotations',taskId);
            await sails.helpers.recalculatePercentages('ld',taskId);
        }
        return image;
    },  
    
    
  filterByWic: async function(imageList, wicMin, wicMax) {
    if (wicMin === -99999999 && wicMax === 99999999) return imageList;    
    let result = [];  
    const set = new Set();
    for (const image of imageList) {       
      let imagesWithWic = await Annotations.find({
        imageId : image.id,
      });
      imagesWithWic = imagesWithWic || [];
      if (!imagesWithWic.length) continue;  
      for(const wic of imagesWithWic) {
        if (wic.wicConfidence >= wicMin && wic.wicConfidence <= wicMax) {
            if(!set.has(image.id)) {
              result.push(image);
              set.add(image.id);
            }
            break;        
          }     
        }   
      }
    return result;
  }


};
