module.exports = {
  attributes: {
    name: { type: 'string', required: true, unique: true },
    hotKey: { type: 'string', unique: true },
    source: {type: 'string', } // ml or lab lead
  },

  // hard-coded (for now?)
  getMLLabels: async function() {
    return [
      {name: 'buffalo', hotKey: 'ctrl + 1', source: "ml"}, 
      {name: 'camel',source: "ml"}, 
      {name: 'canoe',source: "ml"},
      {name: 'car',source: "ml"}, 
      {name: 'cow',source: "ml"},
      {name: 'crocodile',source: "ml"},
      {name: 'eland',source: "ml"}, 
      {name: 'elephant',source: "ml"}, 
      {name: 'gazelle_grants',source: "ml"}, 
      {name: 'gazelle_thomsons',source: "ml"}, 
      {name: 'gerenuk',source: "ml"}, 
      {name: 'giant_forest_hog',source: "ml"}, 
      {name: 'giraffe'}, 
      {name: 'goat'}, 
      {name: 'hartebeest'}, 
      {name: 'hippo', hotKey: 'ctrl + 2'}, 
      {name: 'impala'}, 
      {name: 'kob'}, 
      {name: 'kudu'}, 
      {name: 'motorcycle'}, 
      {name: 'oribi'}, 
      {name: 'oryx'}, 
      {name: 'ostrich'}, 
      {name: 'roof_grass'}, 
      {name: 'roof_mabati'}, 
      {name: 'sheep'}, 
      {name: 'topi'}, 
      {name: 'vehicle'}, 
      {name: 'warthog'}, 
      {name: 'waterbuck'}, 
      {name: 'white_bones', hotKey: 'shft + 5'}, 
      {name: 'wildebeest'}, 
      {name: 'zebra'}
    ];
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
