module.exports = {
  attributes: {
    name: { type: 'string', required: true, unique: true },
  },

  // hard-coded (for now?)
  getMLLabelNames: async function() {
    return ['buffalo', 'camel', 'canoe', 'car', 'cow', 'crocodile', 'eland', 'elephant', 'gazelle_grants', 'gazelle_thomsons', 'gerenuk', 'giant_forest_hog', 'giraffe', 'goat', 'hartebeest', 'hippo', 'impala', 'kob', 'kudu', 'motorcycle', 'oribi', 'oryx', 'ostrich', 'roof_grass', 'roof_mabati', 'sheep', 'topi', 'vehicle', 'warthog', 'waterbuck', 'white_bones', 'wildebeest', 'zebra'];
  },

  getCustomLabelNames: async function() {
    let names = [];
    let labels = await Labels.find({});
    for (let label of labels) {
        names.push(label.name);
    }
    return names;
  },

  getAllLabelNames: async function() {
    let names1 = await Labels.getMLLabelNames();
    let names2 = await Labels.getCustomLabelNames();
    return names1.concat(names2);
  }

};
