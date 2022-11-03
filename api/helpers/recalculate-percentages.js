module.exports = {


  friendlyName: 'Recalculate stats',


  description: '',


  inputs: {
    type : {
      type : 'string'
    },
    taskId : {
      type : 'string'
    }

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {
      let type = inputs.type;
      let taskId = inputs.taskId;

      // Annotations
      if(type == 'annotations'){

        // Count the total queued images for this task
        let queuedImagesCount = await QueuedImages.count({
            taskId : taskId
        });

        // Count the number where annotations is complete
        let completedQueuedImages = await QueuedImages.count({
            taskId : taskId,
            annotationComplete : true
        });

        // Create the decimal, round to 2 places
        if(queuedImagesCount > 0){
           let dec = (Math.floor((completedQueuedImages / queuedImagesCount) * 100)) / 100;
           // Update the DB
           let updatedTask = await Tasks.updateOne({ id: taskId })
           .set({
             progressAnnotation: dec
           });
        } else {
          // Note: This is the case where a task was just created but the unqueued items havent been queued yet
        }

      }

      // Ground truth

      if(type == 'gt'){

        // Count the total queued images for this task
        let imagesCount = await QueuedImages.count({
            taskId : taskId
        });

        // Count the number where gt is complete
        let groundTruthedImages = await Images.count({
            taskIds : [taskId],
            gtComplete : true
        });

        // Create the decimal, round to 2 places
        if(imagesCount > 0){
           let dec = (Math.floor((groundTruthedImages / imagesCount) * 100)) / 100;
           // Update the DB
           let updatedTask = await Tasks.updateOne({ id: taskId })
           .set({
             progressGroundTruth: dec
           });
        } else {
          // Note: This is the case where a GT was just created but the unqueued items havent been queued yet
        }

      }

      // Line Division
      if(type == 'ld'){

        // Count the total sequenced pairs for this task
        let pairsCount = await SequencedPairs.count({
            taskId : taskId
        });

        // Count the number where ld is complete
        let dividedPairs = await SequencedPairs.count({
            taskId : taskId,
            divisionComplete : true
        });

        // Create the decimal, round to 2 places
        if(pairsCount > 0){
           let dec = (Math.floor((dividedPairs / pairsCount) * 100)) / 100;
           // Update the DB
           let updatedTask = await Tasks.updateOne({ id: taskId })
           .set({
             progressLineDivision: dec
           });
        } else {
          // Note: This is the case where GT was just finished but the sequencedpair items havent been queued yet
        }

      }

      // Line Division
      if(type == 'exports'){

        // Count the total queuedExportPieces for this export
        let piecesCount = await QueuedExportPieces.count({
            exportId : taskId
        });

        // Count the number where processing is complete
        let processedPieces = await QueuedExportPieces.count({
            exportId : taskId,
            processingComplete : true
        });

        // Create the decimal, round to 2 places
        if(piecesCount > 0){
           let dec = (Math.floor((processedPieces / piecesCount) * 100)) / 100;
           // Update the DB
           let updatedExport = await Exports.updateOne({ id: taskId })
           .set({
             progress: dec
           });
        } else {
          // Note: This is the case where an export was just created but the QueuedExportPieces items havent been queued yet
        }

      }

      return exits.success({});


  }


};
