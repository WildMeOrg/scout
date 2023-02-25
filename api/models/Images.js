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
      if (!annots || !annots.length) continue;
      // bummer, label is within boundingBoxes
      checkImage: for (const annot of annots) {
        // finding just one is good enough, cuz this is an "or" search
        for (const bbox of annot.boundingBoxes) {
          if (labels.indexOf(bbox.label) > -1) {
            imagesWithLabels.push(image);
            break checkImage;
          }
        }
      }
    }
    return imagesWithLabels;
  }

};
