module.exports = {
  attributes: {
    name: { type: 'string', required: true, unique: true },
    displayName: { type: 'string', required: true },
    assigneeDiplayName : { type: 'string', required: true },
    taskType:  { type: 'string', required: true },
    assignee: { type: 'string', required: true },
    orientation: { type: 'string', required: true},
    progressAnnotation: { type: 'number', defaultsTo : 0},
    progressGroundTruth: { type: 'number', defaultsTo : 0},
    progressLineDivision: { type: 'number', defaultsTo : 0},
    sequencingComplete : {type: 'boolean', defaultsTo : false},
    imageCount: { type: 'number', defaultsTo : 0},
    createdByUserId: { type: 'string', required: true }
  }
};
