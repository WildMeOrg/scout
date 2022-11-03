module.exports = {
  attributes: {
    exportId: { type: 'string', required: true },
    taskId: { type: 'string', required: true },
    processingComplete :  { type: 'boolean', defaultsTo: false },
    type: { type: 'string', required: true },
  }
};
