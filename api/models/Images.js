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
    gtComplete : { type : 'boolean' , defaultsTo : false},
    // default to invalid values. setting these to optional
    // is the same as defaulting to 0, which breaks filtering 
    gpsLatitude: { type: 'number', defaultsTo: 999 },
    gpsLongitude: { type: 'number', defaultsTo: 999 },
  },

  // definitely would be better done as part of direct query on Images :(
    filterByLabels: async function (imageList, labels) {
      if (!labels || !labels.length) return imageList;
    
      // get all image IDs
      const imageIds = imageList.map(image => image.id);
    
      // lookup Annotations and GroundTruths
      const [annots, gts] = await Promise.all([
        Annotations.find({ imageId: imageIds }),
        GroundTruths.find({ imageId: imageIds }),
      ]);
    
    
      const annotMap = annots.reduce((map, annot) => {
        if (!map[annot.imageId]) map[annot.imageId] = [];
        map[annot.imageId].push(annot);
        return map;
      }, {});
    
      const gtMap = gts.reduce((map, gt) => {
        if (!map[gt.imageId]) map[gt.imageId] = [];
        map[gt.imageId].push(gt);
        return map;
      }, {});
    
      // filter images
      const imagesWithLabels = [];
      for (const image of imageList) {
        const annotsForImage = annotMap[image.id] || [];
        const gtsForImage = gtMap[image.id] || [];
    
        let found = false;
    
        // check Annotations
        for (const annot of annotsForImage) {
          if (annot.boundingBoxes.some(bbox => labels.includes(bbox.label))) {
            imagesWithLabels.push(image);
            found = true;
            break;
          }
        }
    
        // check GroundTruths
        if (!found) {
          for (const gt of gtsForImage) {
            if (gt.boundingBoxes.some(bbox => labels.includes(bbox.label))) {
              imagesWithLabels.push(image);
              break;
            }
          }
        }
      }
    
      return imagesWithLabels;
    },

  // Helper to add a GPS filters to an existing query object
  addGpsQueryFilter: function(latMin, latMax, longMin, longMax, query) {
    if(latMin !== undefined){
      const latMinF = parseFloat(latMin);
      if(!Number.isNaN(latMinF)) {
        query.gpsLatitude = {
          '>=' : latMinF,
          '!=' : 999
        };
      }
    }
    if(latMax !== undefined){
      const latMaxF = parseFloat(latMax);
      if(!Number.isNaN(latMaxF)) {
        if(typeof(query.gpsLatitude) == 'undefined'){
          query.gpsLatitude = {'!=' : 999};
        }
        query.gpsLatitude['<='] = latMaxF;
      }
    }
    if(longMin !== undefined){
      const longMinF = parseFloat(longMin);
      if(!Number.isNaN(longMinF)) {
        query.gpsLongitude = {
          '>=' : longMinF,
          '!=' : 999
        };
      }
    }
    if(longMax !== undefined){
      const longMaxF = parseFloat(longMax);
      if(!Number.isNaN(longMaxF)) {
        if(typeof(query.gpsLongitude) == 'undefined'){
          query.gpsLongitude = {'!=' : 999};
        }
        query.gpsLongitude['<='] = longMaxF;
      }
    }
  },

  hasGpsLocation: function(image) {
    if(image.gpsLatitude !== 999 && image.gpsLongitude!==999){
      return true;
    }
    return false;
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

    const imageIds = imageList.map(data => data.id);                
    const annotations = await Annotations.find({
      imageId: { in: imageIds},
      wicConfidence: { ">=": wicMin, "<=": wicMax}
    });

    const imageIdSet = new Set(annotations.map(annotation => annotation.imageId));
    const result = imageList.filter(image => imageIdSet.has(image.id));

    return result;
  }

};
