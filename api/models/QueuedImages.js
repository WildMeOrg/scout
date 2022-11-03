module.exports = {
  attributes: {
    imageId: { type: 'string', required: true },
    taskId: { type: 'string', required: true },
    annotationComplete : {type : 'boolean', defaultsTo: false},
    annotationError:  { type: 'string' }
  }
};
