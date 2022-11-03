module.exports = {
  attributes: {
    taskId: { type: 'string', required: true },
    imageLeftId: { type: 'string', required: true },
    imageRightId: { type: 'string', required: true },
    divisionComplete :  { type: 'boolean', defaultsTo: false },
    index: { type: 'number', required: true}
  }
};
