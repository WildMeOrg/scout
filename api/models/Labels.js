const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = {
  attributes: {
    name: { type: 'string', required: true, unique: true },
    hotKey: { type: 'string' },
    source: {type: 'string', } // ml or lab lead
  },

  getAllLabels: async function() {
    let labels = await Labels.find({});
    return labels;
  },

  /**
   * Synchronize labels with scoutbot get_classes
  */
  addMlLabelsAndReturnAllLabels: async function () {
    try {
      const checkCommand = `command -v scoutbot`;
      const { stdout: checkScoutbot } = await exec(checkCommand);
  
      if (!checkScoutbot.trim()) {
        console.warn('Scoutbot command is not available in this environment. Skipping label synchronization.');
        return { success: false, message: 'Scoutbot command not found. Label synchronization skipped.' };
      }
  
      // Fetch all existing labels from the database
      const existingLabels = await Labels.find({});
      const existingLabelNames = existingLabels.map(label => label.name);
  
      const getClassesCommand = `scoutbot get_classes`;
      const { stdout: classesStdout } = await exec(getClassesCommand);
  
      const cleanedJson = classesStdout
        .replace(/'/g, '"') 
        .replace(/,\s*]/, ']') 
        .trim();
  
      const returnData = JSON.parse(cleanedJson).sort();
  
      // Filter out already existing labels
      const newLabels = returnData.filter(className => !existingLabelNames.includes(className));
  
      // Insert new labels into the database
      for (const label of newLabels) {
        await Labels.create({ name: label, source: 'ml' });
      }
        
      return { success: true, message: 'Label synchronization completed.', labels: await Labels.find() };
    } catch (error) {
      console.error('Error synchronizing labels:', error.message);
      return { success: false, message: `Error: ${error.message}` };
    }
  },
  

  /**
   * Create predefined ML labels
   */
  createMLLabel: async function() {
    let newLabel = {};
    [
      'buffalo',
      'camel',
      'canoe',
      'car',
      'cow',
      'crocodile',
      'eland',
      'elephant',
      'gazelle_grants',
      'gazelle_thomsons',
      'gerenuk',
      'giant_forest_hog',
      'giraffe',
      'goat',
      'hartebeest',
      'hippo',
      'impala',
      'kob',
      'kudu',
      'motorcycle',
      'oribi',
      'oryx',
      'ostrich',
      'roof_grass',
      'roof_mabati',
      'sheep',
      'topi',
      'vehicle',
      'warthog',
      'waterbuck',
      'white_bones',
      'wildebeest',
      'zebra'
    ].forEach(async data => {newLabel = await Labels.create({ name: data, source: "ml" }).fetch()})
    return newLabel;
  }
};
