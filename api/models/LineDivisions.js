module.exports = {
  attributes: {
    taskId: { type: 'string', required: true },
    imageLeftId: { type: 'string', required: true },
    imageRightId: { type: 'string', required: true },
    sequencedPairId :  { type: 'string', required: true },
    userId: { type: 'string', required: true},
    topX: { type: 'number', required: true},
    bottomX: { type: 'number', required: true}
  }
};
