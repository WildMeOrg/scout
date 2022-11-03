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
  }
};
