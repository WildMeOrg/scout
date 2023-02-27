module.exports = {
  attributes: {
    taskId: { type: 'string', required: true },
    imageId: { type: 'string', required: true },
    queuedImageId :  { type: 'string', required: true },
    assigneeType: { type: 'string', required: true},
    assigneeDiplayName: { type: 'string', required: true},
    assignee: { type: 'string', required: true},
    wicConfidence: { type: 'number'},
    boundingBoxes : { type: 'json', columnType : "array" }
  }
};
