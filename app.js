/*
 * Entry file
 * Contains the setup CLI interface, and which it suppresses logs and starts the web application
 *
 */

// Dependencies
const {resolve} = require("path");
const fs = require('fs');
const readlineSync = require('readline-sync');
const cluster = require('cluster');
const os = require('os');
const workers = {};
const workerConfigs = {};
const workerSleep = 1000;
const gm = require('gm');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const csvString = require("csv-string")
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const moment = require('moment');
const uuid = require('uuid');


// Config
const pathToDir = resolve('/tmp/scout-tmp/')+'/';
const settings = {
  'imageDirectory' : null,
  'hiddenDirectory' : '.scout-hidden',
  'tmpDirectory' : pathToDir,
  'db' : 'scout-db-'+Date.now()
};

const neededSubDirs = [
  'unprocessedImages',
  'queuedImages',
  'config',
  'password',
  'json',
  'logs'
];
const settingsFileName = pathToDir+'config/settings.json';
const lineSeparator = '----------------------------';




const repl = async () => {

  // Only run the REPL if the settings file cannot be found or if an override is preset
  let override = typeof(process.env.ENV_OVERRIDE) !== 'undefined' ? true : false;
  if (!override && fs.existsSync(settingsFileName)){
      return;
  }

  console.log('Welcome to Scout');
  console.log(lineSeparator);

  const imageDirectoryQuestion = `Please create a directory on your NAS where you would like to upload your images. Then, enter the absolute path to that directory here. If you are uploading images to several sub-directories, please only list the parent folder. Eg: /nas/images/ or /nas/\n`;
  settings.imageDirectory = readlineSync.question(imageDirectoryQuestion);
  console.log(lineSeparator);
  return;

};

// Create the tmp directories we'll need
const writeableDir = async () =>{

  if (!fs.existsSync(pathToDir)){
      fs.mkdirSync(pathToDir);
  }

  for (const subDir of neededSubDirs) {
    let fullPath = pathToDir+subDir+'/';
    if (!fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath);
    }
  }

  return;

};

const passwordToken = async () => {
  const passwordOverride = randGen(10);
  console.log("Your password override token is: "+passwordOverride);
  console.log(lineSeparator);
  console.log('\n\n');
  let data = {
    'token' :  passwordOverride,
    'created' : Date.now()
  };
  let str = JSON.stringify(data);
  let fileName = pathToDir+'password/token.json';

  // If file already exists, unlink it
  if (fs.existsSync(fileName)){
      fs.unlinkSync(fileName);
  }

  fs.writeFileSync(fileName, str);

  return;
};

const saveSettings = async () => {
  let str = JSON.stringify(settings);

  // Only write the file if it doesn't already exist
  if (!fs.existsSync(settingsFileName)){
      fs.writeFileSync(settingsFileName, str);
  }

};

const randGen = (length) => {
    let result           = '';
    let characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}


const validateSettings = async () => {
  console.log('Validating your settings...');
  console.log('\n');

  // If the settings are only saved to disk, retrieve them
  settingsObject = settings;
  if(!settingsObject.imageDirectory){
    let settingsFile = fs.readFileSync(settingsFileName);
    settingsObject = JSON.parse(settingsFile);
  }


  // Try to reach NAS directory
  try {
   let pathToImageDir = resolve(settingsObject.imageDirectory);
   let pathToHiddenDir = resolve(settingsObject.imageDirectory+'/'+settingsObject.hiddenDirectory);
   let pathToUnusedDir = pathToHiddenDir+'/unused/';
   let pathToImagesDir = pathToHiddenDir+'/images/';
   let pathToExportsDir = pathToHiddenDir+'/exports/';
   fs.accessSync(pathToImageDir, fs.constants.W_OK);
   if (!fs.existsSync(pathToHiddenDir)){
       fs.mkdirSync(pathToHiddenDir);
   }
   if (!fs.existsSync(pathToUnusedDir)){
       fs.mkdirSync(pathToUnusedDir);
   }
   if (!fs.existsSync(pathToImagesDir)){
       fs.mkdirSync(pathToImagesDir);
   }
   if (!fs.existsSync(pathToExportsDir)){
       fs.mkdirSync(pathToExportsDir);
   }


   console.log('Your settings have been validated');
   console.log(lineSeparator);
   console.log('\n\n');
  }
  catch (err) {
   console.log("Sorry, the location you specified isn't accessible.");
   let wipeSettings  = readlineSync.question('Would you like to restart the installation process? (Type YES or NO). If you type yes, any previous data may be lost.');
   if(wipeSettings.toLowerCase() == 'yes'){
     if (fs.existsSync(settingsFileName)){
         fs.unlinkSync(settingsFileName);
     }
     console.log('Ok, your previous settings have been deleted. Please restart Scout now.');
     process.exit(0);
   } else {
     console.log('Ok, please check to make sure your NAS is plugged in and properly mounted, then restart Scout. The application will now exit.');
     process.exit(0);
   }
  }
  return;
};



const suppressLogs = async () =>{

  // If an IP hasn't been set, then keep logs running
  if(typeof(process.env.ENV_IP) == 'undefined'){
    //return;
  }

  console.log = function() {};
  console.debug = function() {};
  console.error = function() {};

  return;
};


const startSails = async () =>{

  process.chdir(__dirname);
  var sails;
  var rc;
  sails = require('sails');
  rc = require('sails/accessible/rc');

  // Start server
  sails.lift(rc('sails'));

  return;

};


const startWorkers = async () => {
  var Sails = require('sails').constructor;
  var sailsApp = new Sails();

  sailsApp.load({
    log: {
      level: 'error'
    }
  }, async (err) => {
    if (err) throw(err)
    // Go through workers and start each one
    for(const key in workers){
      let worker = workers[key];
       worker();
    }
  });
};

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const showUrl = async () =>{

  ip = 'localhost';
  if(typeof(process.env.ENV_IP) !== 'undefined'){
    ip = process.env.ENV_IP;
  }
  const port = '1337';
  console.log(`Your Scout Server is now running.`);
  console.log(`Please open a Chrome browser and navigate to http://${ip}:${port}`)
  console.log(lineSeparator);
  console.log('\n\n');

  return;

};

const init = async () => {

  if(cluster.isMaster){
    // If we're on the master thread, start sails as normal then fork
    await writeableDir();
    await repl();
    await saveSettings();
    await validateSettings();
    await showUrl();
    await passwordToken();
    await suppressLogs();
    await startSails();
    cluster.fork();

  } else {
    // If we're not on the master thread, start the background workers
    await startWorkers();
  }


};

init();

/*
 * Workers Start Here
 *
 */
 workers.imageIngestion = async () => {


   settingsObject = settings;
   if(!settingsObject.imageDirectory){
     let settingsFile = fs.readFileSync(settingsFileName);
     settingsObject = JSON.parse(settingsFile);
   }

  let ingestionDir = resolve(sails.config.settings.imageDirectory);

  // Check for any images in the ingestion directory, ignore hidden files
  list = await fs.promises.readdir(ingestionDir);
  list = list.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));
  list = list.filter((str) => { return str.indexOf('.error') === -1; });


  // If none found, update DB on ingestion status, and wait before trying again.
  if(list.length == 0){
    await updateWorkerStatus('imageIngestion',{'statusBoolean' : false});
    await timeout(workerSleep);
    return await workers.imageIngestion();
  } else {
    await updateWorkerStatus('imageIngestion',{'statusBoolean' : true});
  }

  // Grab random image
  randomElement = list[Math.floor(Math.random() * list.length)];

  // Pull exif data
  const exifData = await parseExif(ingestionDir+'/'+randomElement);
  if(typeof(exifData.timestamp) !== 'number' || exifData.timestamp == 0){

    await sails.helpers.logError("COULD NOT PARSE EXIF",randomElement);
    let renamed = randomElement+'.error';
    let oldFullPath = resolve(ingestionDir+'/'+randomElement);
    let renamedFullPath = resolve(ingestionDir+'/'+renamed);
    await fs.promises.copyFile(oldFullPath,renamedFullPath);
    await fs.promises.unlink(oldFullPath);

    return await workers.imageIngestion();

  }

  // Check filetype
  filename = (randomElement.substr(0, randomElement.indexOf('.'))).replace('/','');
  ext = (randomElement.slice(randomElement.lastIndexOf('.') + 1)).toLowerCase();
  tempPath = false;
  if(ext == 'arw'){
    // Transform to jpg, move to tmp directory, get full path of new file
    tempPath = await convertToJpg(ingestionDir+'/'+randomElement,filename);

    // Move the old file to unused directory on NAS
    let newLocationUnused = resolve(settingsObject.imageDirectory+'/'+settingsObject.hiddenDirectory+'/unused/'+randomElement);
    await fs.promises.copyFile(ingestionDir+'/'+randomElement,newLocationUnused);
    await fs.promises.unlink(ingestionDir+'/'+randomElement);


  }
  if ((ext == 'jpg') || (ext == 'jpeg')) {
    // move to tmp directory, adding small .jpg extension, get full path of new file
    tempPath = settingsObject.tmpDirectory+'unprocessedImages/'+filename+'.jpg';
    await fs.promises.copyFile(ingestionDir+'/'+randomElement,tempPath);
    await fs.promises.unlink(ingestionDir+'/'+randomElement);
  }

  // Move to hidden directory under new name
  const finalFilename = Date.now()+'.jpg'
  const finalLocation = resolve(settingsObject.imageDirectory+'/'+settingsObject.hiddenDirectory+'/images/'+finalFilename);
  await fs.promises.copyFile(tempPath,finalLocation);
  await fs.promises.unlink(tempPath);

  // Insert into DB
  let imageMeta = {
    originalFilenameLower : filename.toLowerCase(),
    originalFilename : filename,
    filename : finalFilename,
    exifTimestamp : exifData.timestamp,
    fullPath : finalLocation,
    currentExtension : 'jpg',
    originalExtension : ext,
    gpsLatitude : exifData.gpsLatitude,
    gpsLongitude : exifData.gpsLongitude
  };

  let newImage = await Images.create(imageMeta).fetch();
  if(!newImage){
    throw Error('Unknown error occured');
  }

  // Try again immediately
  return await workers.imageIngestion();

 };

 workers.csvQueuer = async () => {

   // Look for export items whose isQueued value is set to false
   let exports = await Exports.find({
     where : {
       isQueued : false
     },
     limit : 1
   });

   if(!exports.length){
     await timeout(workerSleep);
     return await workers.csvQueuer();
   }

   let exportData = exports[0];

   // Run the saved filter against the Tasks db to get the task ids
   // @TODO consolidate with the logic in the api-tasks-get.js controller

    let query = {};

    // Name

    if(exportData.filters.name && exportData.filters.name.length && exportData.filters.name.trim().length){
      let name = exportData.filters.name.toLowerCase().trim();
      query.name = { startsWith : name };
    }

    // Date created - start
    if(exportData.filters.startDate){
      let start = Date.parse(exportData.filters.startDate);
      query.createdAt = { '>=': start };
    }

    // Date created - end
    if(exportData.filters.endDate){
      let end = Date.parse(exportData.filters.endDate) + (1000 * 60 * 60 * 24);
      if(typeof(query.createdAt) == 'undefined'){
        query.createdAt = {};
      }
      query.createdAt['<='] = end;
    }

    // Assignee (multiselect)
    if(exportData.filters.assignee && exportData.filters.assignee.length){
      query.assignee = exportData.filters.assignee;
    }

    // Tags (multiselect)
    if(exportData.filters.tags && exportData.filters.tags.length){
      query.tagIds = exportData.filters.tags;
    }
   
    // Phase (multiselect)
    if(exportData.filters.phase && exportData.filters.phase.length){
        let arr = exportData.filters.phase
        let phase = {};
        for(const item of arr){
          phase[item] = true;
        }

        query.or = []

      // Annotation
      if(phase.ns == true){
        let obj = {
          progressAnnotation : 0
        };
        query.or.push(obj);
      }
      if(phase.as == true){
        let obj = {
          progressAnnotation : {
            '>' : 0,
            '<' : 1
          }
        };
        query.or.push(obj);
      }
      if(phase.af == true){
        let obj = {
          progressAnnotation : 1
        };
        query.or.push(obj);
      }
      // GT

      if(phase.gs == true){
        let obj = {
          progressGroundTruth : {
            '>' : 0,
            '<' : 1
          }
        };
        query.or.push(obj);
      }
      if(phase.gf == true){
        let obj = {
          progressGroundTruth : 1
        };
        query.or.push(obj);
      }

      // Line division
      if(phase.ds == true){
        let obj = {
          progressAnnotation : {
            '>' : 0,
            '<' : 1
          }
        };
        query.or.push(obj);
      }
      if(phase.df == true){
        let obj = {
          progressGroundTruth : 1
        };
        query.or.push(obj);
      }
    }

    let tasks = await Tasks.find({where : query});

   // Create a new queued item for each task, referencing this export
   for(const task of tasks){
     let queueItem = {
       exportId : exportData.id,
       taskId : task.id,
       type : exportData.type
     };
     let newPiece = await QueuedExportPieces.create(queueItem).fetch();
     if(!newPiece){
       throw Error('Unknown error occured');
     }
   }

   // Update the export item with isqueued = true
   let updatedExportItem = await Exports.updateOne({ id: exportData.id })
   .set({
     isQueued:true
   });

   // Send to recalc as needed (in case there were zero)
   await sails.helpers.recalculatePercentages('exports',exportData.id);

   return await workers.csvQueuer();

 };

 const getAnnotationsExportData = async(taskId) => {
   let arr = [];

   let imageCache = {};
   let imageDimensionsCache = {};
   let userCache = {};
   let lineDivisionCache = {};

   // Get the task data
   let tasks = await Tasks.find({id : taskId});
   let taskData = tasks[0];

   let sampleFields = {
     'Task Name' : taskData.displayName,
     'Task ID' : taskData.id,
     'Image Filename' : '',
     'Image ID' : '',
     'Box X' : '',
     'Box Y' : '',
     'Box W' : '',
     'Box H' : '',
     'Label' : '',
     'Label Confidence' : '',
     'Assignee' : '',
     'Timestamp' : '',
     'Is Ground Truth' : 'FALSE',
     'Excluded By Line' : ''
   };

   // Get all the annotations and GTs for this task
   let annots = await Annotations.find({taskId : taskData.id});
   let gts = await GroundTruths.find({taskId : taskData.id});
   let combinedArr = annots.concat(gts);

   for(const record of combinedArr){
     record.boundingBoxes = typeof(record.boundingBoxes) == 'object' && record.boundingBoxes instanceof Array ? record.boundingBoxes : [];
     for(const box of record.boundingBoxes){

       let isGt = typeof(record.wicConfidence) == 'undefined' ? true : false;

       fields = Object.assign({}, sampleFields);

       fields['Assignee'] = isGt ? record.username : taskData.assigneeDiplayName;

       fields['Image ID'] = record.imageId;

       let images = await Images.find({id : record.imageId});
       image = false;
       if(images.length){
         image = images[0];
         fields['Image Filename'] = image.originalFilename+'.'+image.originalExtension;
       }

       fields['Timestamp'] = record.createdAt;

       fields['Is Ground Truth'] = isGt ? 'true' : 'false';

       fields['Box X'] = typeof(box.x) !== 'undefined' ? box.x : '';
       fields['Box Y'] = typeof(box.y) !== 'undefined' ? box.y : '';
       fields['Box W'] = typeof(box.w) !== 'undefined' ? box.w : '';
       fields['Box H'] = typeof(box.h) !== 'undefined' ? box.h : '';
       fields['Label'] = typeof(box.label) !== 'undefined' ? box.label : '';
       fields['Label Confidence'] = typeof(box.labelConfidence) !== 'undefined' ? box.labelConfidence : '';

       if(image){
          fields['Excluded By Line'] = await isExcludedByLine(box,image,taskData.id);
       }


       arr.push(fields);
     }
   }

   return arr;
 };

 const isExcludedByLine = async(box,imageData,taskId) => {


   let x = typeof(box.x) !== 'undefined' ? parseFloat(box.x): false;
   let y = typeof(box.y) !== 'undefined' ? parseFloat(box.y) : false;
   let w = typeof(box.w) !== 'undefined' ? parseFloat(box.w) : false;
   let h = typeof(box.h) !== 'undefined' ? parseFloat(box.h) : false;
   if(x === false || y === false || w === false || h == false){
     return '';
   }

   // Get the sequenced pair where this image existed within this task
   let pair = await SequencedPairs.count({imageLeftId : imageData.id, taskId : taskId});
   if(!pair){
     return '';
   }
   // Get the line division for this image, for this particular task

   let lds = await LineDivisions.find({imageLeftId : imageData.id, taskId : taskId});
   if(!lds.length){
     return 'FALSE';
   }

  let ldData = lds[0];
  let topX = ldData.topX;
  let bottomX = ldData.bottomX;



   // Get the image height and width
   let dimensions;
   let imgWidth;
   let imgHeight;
      
   try {
     dimensions = await sizeOf(imageData.fullPath);
   } catch (e) {
     console.log("error with image: ", e);
   } finally {
     imgWidth = (dimensions && dimensions.width) || '';
     imgHeight = (dimensions && dimensions.height) || '';
   } 

   let isExcluded = isExcludedCalculation(imgWidth,imgHeight,x,y,w,h,topX,bottomX);
   return isExcluded ? 'TRUE' : 'FALSE';

 }

 const isExcludedCalculation = (imgWidth,imgHeight,x,y,w,h,topX,bottomX) => {
   isExcluded = false;
   let topSliderCoordinate = [topX * imgWidth,imgHeight];
   let bottomSliderCoordinate = [bottomX * imgWidth,0];
   let boxCenter = [x + w/2, (imgHeight - y) - h/2];
   // Get the slope
   let xDifference = topSliderCoordinate[0] - bottomSliderCoordinate[0];
   if(xDifference == 0){
     // Line is straight up and down
     if(topSliderCoordinate[0] < boxCenter[0]){
       isExcluded = 'TRUE';
     }
   } else {
     // Line has a slope
     let slope = (topSliderCoordinate[1] - bottomSliderCoordinate[1]) / xDifference;
     // Get the y intercept
     let yIntercept = topSliderCoordinate[1] - (slope * topSliderCoordinate[0]);

     // Solve for X
     let solvedX = (boxCenter[1] - yIntercept) / slope;

     // If X is less than the box's X then the line is to the left of it, which means our tool is shading the area to the right of the line and the box is in the shaded (excluded) area
     if(solvedX < boxCenter[0]){
       isExcluded = 'TRUE';
     }
   }

   return isExcluded;

 }

 const getImagesExportData = async(taskId) => {

  let arr = [];

  let sampleFields = {
    'Task Name' : '',
    'Task ID' : '',
    'Image Filename' : '',
    'Date Exif' : '',
    'GPS Lat Exif' : '',
    'GPS Long Exif' : '',
    'Image ID' : '',
    'Image Height' : '',
    'Image Width' : '',
    'WIC Confidence' : '',
    'Ground Truth Status' : '',
    'Exclusion Side' : 'right',
    'Inclusion Top X Fraction' : '',
    'Inclusion Bottom X Fraction' : '',
  };

  // Get the task data
  let tasks = await Tasks.find({id : taskId});
  let taskData = tasks[0];

  // Get all images in a task
  let images = await Images.find({taskIds : [taskData.id]});
  for(const image of images){

    // Get image height and width
    let dimensions;
    let imgWidth;
    let imgHeight;
        
    try {
      dimensions = await sizeOf(image.fullPath);
    } catch (e) {
      console.log("error with image: ", e);
    } finally {
      imgWidth = (dimensions && dimensions.width) || '';
      imgHeight = (dimensions && dimensions.height) || '';
    } 

    fields = Object.assign({}, sampleFields);

    fields['Task Name'] = taskData.displayName;

    fields['Task ID'] = taskData.id;

    fields['Image Filename'] = image.originalFilename+'.'+image.originalExtension;

    fields['Date Exif'] = new Date(image.exifTimestamp).toLocaleDateString();

    if (image.gpsLatitude && image.gpsLongitude) {
      fields['GPS Lat Exif'] = image.gpsLatitude;
      fields['GPS Long Exif'] = image.gpsLongitude;
    }
    fields['Image ID'] = image.id;
    fields['Image Height'] = imgHeight;
    fields['Image Width'] = imgWidth;
    

    if(taskData.taskType == 'ml'){
      // Look up the annotation for that image in that task
      let annots = await Annotations.find({taskId : taskData.id, imageId : image.id});
      if(annots.length){
        let annot = annots[0];
        if(typeof(annot.wicConfidence) !== 'undefined'){
          fields['WIC Confidence'] = typeof(annot.wicConfidence) == 'number' ? annot.wicConfidence.toString() : '';
        }

      }
    }

    fields['Ground Truth Status'] = image.gtComplete ? 'true' : 'false';

    //Get a line division for this task where this image was the left side image
    let divisions = await LineDivisions.find({taskId : taskData.id, imageLeftId : image.id});
    if(divisions.length){
      let div = divisions[0];
      fields['Inclusion Top X Fraction'] = typeof(div.topX) == 'number' ? div.topX.toString() : '';
      fields['Inclusion Bottom X Fraction'] = typeof(div.bottomX) == 'number' ? div.bottomX.toString() : '';
    }
    arr.push(fields);
  }


  return arr;
 };

 workers.csvProcessor = async () => {

   // Grab from queue
   let queueItems = await QueuedExportPieces.find({'where' : {processingComplete : false}});
   if(!queueItems.length){
     await timeout(workerSleep);
     return await workers.csvProcessor();
   }

   // Send to either the annotations-csv creator or the images-csv creator, get the data back
   let queueItemData = queueItems[0];

   // Get the export
   let exportsData = await Exports.find({id : queueItemData.exportId});
   if(!exportsData.length){
     throw('Can not find the export');
   }
   let exportData = exportsData[0];

   partialData = false;
   if(queueItemData.type == 'annotations'){
     partialData = await getAnnotationsExportData(queueItemData.taskId);
   }
   if(queueItemData.type == 'images'){
     partialData = await getImagesExportData(queueItemData.taskId);
   }

   // Go through the data and create a CSV out of it
   // Save the file to disk at the fullPath specified (append)
   await appendCsv(exportData.fullPath,partialData);

  // Update processed = true in queue
  let updatedPiece = await QueuedExportPieces.updateOne({ id: queueItemData.id })
  .set({
    processingComplete:true
  });

   // Kick off the recalc
   await sails.helpers.recalculatePercentages('exports',exportData.id);

   return await workers.csvProcessor();
 };

 workers.mlDummyProcessor = async () => {

   // Find any tasks assigned to me where the annotation is not complete
   let foundTasks = await Tasks.find({
     where : {
       taskType : 'ml',
       assignee : 'ml-dummy',
       progressAnnotation : {
         '<' : 1
       }
     },
     limit : 1
   });

   if(!foundTasks.length){
     await updateWorkerStatus('mlDummyProcessor',{'statusBoolean' : false});
     await timeout(workerSleep);
     return await workers.mlDummyProcessor();
   }

   taskData = foundTasks[0];
   // Find any queuedImages for this task where annotation is set to false
   let queuedImages = await QueuedImages.find({
     where : {
       taskId : taskData.id,
       annotationComplete : false
     },
     limit : 1
   });

   if(!queuedImages.length){
     await sails.helpers.recalculatePercentages('annotations',taskData.id);
     await timeout(workerSleep);
     return await workers.mlDummyProcessor();
   }

   let queuedImage = queuedImages[0];
   let imageToAnnotate = queuedImage.imageId;

   let annotation = await makeFakeAnnotations();

   // Insert each new annotation into the database

   let annotData = annotation;
   annotData.taskId = taskData.id;
   annotData.imageId = queuedImage.imageId;
   annotData.queuedImageId = queuedImage.id;
   annotData.assigneeType = taskData.taskType;
   annotData.assigneeDiplayName = taskData.assigneeDiplayName;
   annotData.assignee = taskData.assignee;

   let newAnnotation = await Annotations.create(annotData).fetch();
   if(!newAnnotation){
     throw Error('Unknown error occured');
   }


   // Mark this queuedImage as annotation-complete
   let updatedQueuedImage = await QueuedImages.updateOne({ id: queuedImage.id })
   .set({
     annotationComplete:true
   });

   // Recalculate percentages for this task
   await sails.helpers.recalculatePercentages('annotations',taskData.id);
   return await workers.mlDummyProcessor();

 };

const appendCsv = async(path,data) => {

  if(!(fs.existsSync(path))){
    // Create the file and write the first row
    content = [];
    for(key in data[0]){
      content.push(key);
    }
    let str = csvString.stringify(content);
    await fs.promises.writeFile(path,str);
  }

  // Append all your rows
  for(const row of data){
    let str = await parseRowToStr(row);
    await fs.promises.appendFile(path,str);
  }

  return;
};

const parseRowToStr = async(row) =>{
  let content = [];
  for(key in row){
    content.push(row[key]);

  }
  let str = csvString.stringify(content);
  return str;
}

 const makeFakeAnnotations = async () => {

   // WIC
   rand1 = getRand(100);
   if(rand1 < 35){
     rand1 = 0;
   }
   let wicConfidence = rand1;

   // Localizers
   boundingBoxes = [];
   if(wicConfidence > 0){
     // Make a few boxes
     let stop = getRand(10);
     let animals = [
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
     ]

     for (let i = 0; i < stop; i++) {
       let bb = {
         x : getRand(4000),
         y : getRand(4000),
         w : getRand(1000),
         h : getRand(1000),
         label : animals[getRand(animals.length - 1)],
         labelConfidence : getRand(100) / 100,
       };
       boundingBoxes.push(bb);
     }

   }

   let returnData = {
     'boundingBoxes' : boundingBoxes,
     'wicConfidence' : wicConfidence
   };

   await timeout(1000);
   return returnData;

 };

 const getRand = (max) => {
  return Math.floor(Math.random() * max);
}

const invokeMl = async (fullPath,configName) => {
  returnData = [];
  returnData[0] = {};
  returnData[1] = {};
  returnData[2] = {};
  let jsonFileName = Date.now();
  //let jsonFileName = 'package';
  let pathToJson = pathToDir+'json/'+jsonFileName+'.json';
  let command;
  command = 'scoutbot pipeline --config="'+configName+'" "'+fullPath+'" --output="'+pathToJson+'"';
  
  try {
    const { stdout, stderr } = await exec(command);
    returnData[1] = stdout;
    returnData[2] = stderr;
  } catch (e) {
    returnData[2] = e;
  }
  jsonData = {};
  if(fs.existsSync(pathToJson)){
    let jsonBuffer = fs.readFileSync(pathToJson);
    try{
      jsonData = JSON.parse(jsonBuffer);
      returnData[0] = jsonData;
    } catch (e) {}
  }
  return returnData;
};

 workers.mlProcessor = async () => {

   // Find any tasks assigned to me where the annotation is not complete
   let foundTasks = await Tasks.find({
     where : {
       taskType : 'ml',
       assignee : ['ml-v1','ml-v2', 'ml-v3', 'ml-v3-cls'],
       progressAnnotation : {
         '<' : 1
       }
     },
     limit : 1
   });

   if(!foundTasks.length){
     await updateWorkerStatus('mlProcessor',{'statusBoolean' : false});
     await timeout(workerSleep);
     return await workers.mlProcessor();
   }

   taskData = foundTasks[0];
   // Find any queuedImages for this task where annotation is set to false
   let queuedImages = await QueuedImages.find({
     where : {
       taskId : taskData.id,
       annotationComplete : false
     },
     limit : 1
   });

   if(!queuedImages.length){
     await sails.helpers.recalculatePercentages('annotations',taskData.id);
     await timeout(workerSleep);
     return await workers.mlProcessor();
   }

   let queuedImage = queuedImages[0];
   let imageToAnnotate = queuedImage.imageId;

   let matchingImages = await Images.find({id : imageToAnnotate});
   let imageData = matchingImages[0];

   let configInvocationName;
    if (taskData.assignee == 'ml-v1') {
        configInvocationName = 'phase1';
    } else if (taskData.assignee == 'ml-v2') {
        configInvocationName = 'mvp';
    } else if (taskData.assignee == 'ml-v3') {
        configInvocationName = 'v3';
    } else if (taskData.assignee == 'ml-v3-cls') {
        configInvocationName = 'v3-cls';
    }

   let annotationsArr = await invokeMl(imageData.fullPath,configInvocationName);
   parsedAnnotations = annotationsArr[0];

   if(typeof(parsedAnnotations[imageData.fullPath]) == 'object' && typeof(parsedAnnotations[imageData.fullPath].wic) == 'number' && typeof(parsedAnnotations[imageData.fullPath].loc) == 'object' && parsedAnnotations[imageData.fullPath].loc instanceof Array){
     let annotData = {
       taskId : taskData.id,
       imageId : queuedImage.imageId,
       queuedImageId : queuedImage.id,
       assigneeType : taskData.taskType,
       assigneeDiplayName : taskData.assigneeDiplayName,
       assignee : taskData.assignee,
       wicConfidence : parsedAnnotations[imageData.fullPath].wic,
       boundingBoxes : []
     }
     for(const box of parsedAnnotations[imageData.fullPath].loc){

       // This is to convert 'phase1' tags to a format that is compatible with 'mvp'
       if(box.l == 'elephant_savanna'){
         box.l = 'elephant'
       }

       let newBox = {
        id : "box-"+uuid.v4(),
         x : box.x,
         y : box.y,
         w : box.w,
         h : box.h,
         label : box.l,
         labelConfidence : box.c
       };
       annotData.boundingBoxes.push(newBox);
     }

     let newAnnotation = await Annotations.create(annotData).fetch();
     if(!newAnnotation){
       throw Error('Unknown error occured');
     }
   } else {
     await sails.helpers.logError("Could not process output from Scoutbot ML Worker",JSON.stringify(annotationsArr[2]));
   }


   // Mark this queuedImage as annotation-complete
   let updateData = {
     annotationComplete : true
   };
   let updatedQueuedImage = await QueuedImages.updateOne({ id: queuedImage.id })
   .set(updateData);

   // Recalculate percentages for this task
   await sails.helpers.recalculatePercentages('annotations',taskData.id);
   return await workers.mlProcessor();


 };

 workers.taskQueuer = async () => {

   // Find an unqueued task
   let unQueuedTasks = await UnQueuedTasks.find({where : {}, limit : 1});
   if(!unQueuedTasks.length){
     await updateWorkerStatus('taskQueuer',{'statusBoolean' : false});
     await timeout(workerSleep);
     return await workers.taskQueuer();
   }

   await updateWorkerStatus('taskQueuer',{'statusBoolean' : true});

   // Hold the data in memory, delete the task
   let taskData = unQueuedTasks[0];
   let destroyedRecords = await UnQueuedTasks.destroy({where: {id : taskData.id}}).fetch();

   //Find all images matching the filter
   // @TODO consolidate this logic into a helper and have this worker share with with the api-images-count controller
    overrideToZero = false;

    let originalFilenameLower = taskData.filterName.toLowerCase().trim();

    let query = {};
    if(!originalFilenameLower.includes("*")) {      
      query.originalFilenameLower = {
        contains: originalFilenameLower
      };
    }  
    else {
      query.originalFilenameLower = {
        like: originalFilenameLower.replaceAll("*","%")
      };
    }

    if(taskData.filterSource){
      let matchingTasks = await Tasks.find({where : {displayName : taskData.filterSource}, limit : 1})

      if(matchingTasks.length > 0){
        let taskId = matchingTasks[0].id;
        query.taskIds = [taskId];
      } else {
        overrideToZero = true;
      }

    }

    if(taskData.filterDateStart){
      let start = Date.parse(taskData.filterDateStar);
      query.exifTimestamp = { '>=': start };
    }

    if(taskData.filterDateEnd){
      let end = Date.parse(taskData.filterDateEnd);
      if(typeof(query.exifTimestamp) == 'undefined'){
        query.exifTimestamp = {};
      }
      query.exifTimestamp = { '<=': end };
    }

    let cmd = {
      where : query,
      sort : 'exifTimestamp ASC'
    };
    skip = 0
    if(taskData.filterSubsetStart && taskData.filterSubsetEnd > 1){
      skip = taskData.filterSubsetStart - 1;
      cmd.skip = skip;
    }


    if(taskData.filterSubsetEnd){
      let limit = taskData.filterSubsetEnd - skip > 0 ? taskData.filterSubsetEnd - skip: 0;
      cmd.limit = limit;

    }

    imageCount = 0;
    if(overrideToZero){
      return await workers.taskQueuer();
    }

    let imagesFound = await Images.find(cmd);
    if(imagesFound.length == 0){
      return await workers.taskQueuer();
    }
    imagesFound = await Images.filterByLabels(imagesFound, taskData.filterLabels);
    imagesFound = await Images.filterByWic(imagesFound, taskData.filterWicMin, taskData.filterWicMax);

    // Update the task itself with imageCount
    let updatedTask = await Tasks.updateOne({ id: taskData.taskId })
    .set({
      imageCount:imagesFound.length
    });

    if (!updatedTask) {
      throw Error('Unknown error occured');
    }


    // For each image:
    for(const image of imagesFound){
      // Insert a new association into QueuedImages
      let queuedImageData = {
        taskId : taskData.taskId,
        imageId : image.id
      };
      let newQueuedImage = await QueuedImages.create(queuedImageData).fetch();
      if(!newQueuedImage){
        throw Error('Unknown error occured');
      }

      //Update the image object to include the task in the taskIds array
      let taskIds = typeof(image.taskIds) !== 'undefined' && image.taskIds instanceof Array ? image.taskIds : [];
      if(taskIds.indexOf(taskData.taskId) < 0){
        taskIds.push(taskData.taskId);
        let updatedImage = await Images.updateOne({ id: image.id })
        .set({
          taskIds:taskIds
        });

        if (!updatedTask) {
          throw Error('Unknown error occured');
        }
      }
    }
    return await workers.taskQueuer();




 };



 workers.taskSequencer = async () => {

   // Try to find any tasks where ground truthing is done, but sequencing is not
   let tasks = await Tasks.find({where : {progressGroundTruth : 1, sequencingComplete : {'!=' : true}}, limit : 1});
   if(!tasks.length){
     await updateWorkerStatus('taskSequencer',{'statusBoolean' : false});
     await timeout(workerSleep);
     return await workers.taskSequencer();
   }

    // Get the task
   let taskData = tasks[0];

   // Get all images that are associated with this task, (since they're all GT'd), sort according to left/right
   let timestampSort = taskData.orientation == 'left' ? 'ASC' : 'DESC';
   let images = await Images.find({where : {taskIds : [taskData.id]}, sort : 'exifTimestamp '+timestampSort});

   // Go through each image, checking to see if it has a ground-truth associated with it (use count)
   for(const image of images){
     let gt = await GroundTruths.count({imageId : image.id});
     if(gt){
       image.hasBoxes = true;
     }
   }

   // Go through and form pairs of images
   let pairs = [];

   counter = 0;
   lastOne = -5;
   for(const image of images){
     if(image.hasBoxes){
         if(counter - lastOne == 1){
           pairs.push([lastOne,counter]);
         }
         lastOne = counter;
     }
     counter++;
  }

   // Insert the pairs into the divisionPairs collection. TaskIn, leftImageId, rightImageId, sortNumber (index)
   index = 1;
   for(const pair of pairs){
     let obj = {
       taskId : taskData.id,
       imageLeftId : images[pair[0]].id,
       imageRightId : images[pair[1]].id,
       divisionComplete : false,
       index : index
     };
     let newPair = await SequencedPairs.create(obj).fetch();
     if(!newPair){
       throw Error('Unknown error occured');
     }
     index++;
   }

   // Update task as sequencingComplete
   let updateData = {
     sequencingComplete:true
   };
   if(!pairs.length){
     progressLineDivision : 1
   }
   let updatedTask = await Tasks.updateOne({ id: taskData.id })
   .set(updateData);

   return await workers.taskSequencer();
 };


const updateWorkerStatus = async(workerName,data) => {

  // Check to make sure a worker exists for this worker name. If not, create one.
  let matchingWorker = await Workers.find({where : {name : workerName},limit: 1});
  if(!matchingWorker.length){
    let newWorker = await Workers.create({'name' : workerName}).fetch();
    if(!newWorker){
      throw Error('Unknown error occured');
    }
  }

  // Update the worker with the new data
  let updatedWorker = await Workers.updateOne({ name: workerName })
  .set(data);

  return;

}

const convertToJpg = async (path,filename) => {
    let newPath = settings.tmpDirectory+'unprocessedImages/'+filename+'.jpg';
    return new Promise((resolve, reject) => {
       gm(path).write(newPath, (err) => {
         if(err){
           console.log(`Conversion error: ${err}`);
           reject(err);
         } else {
           resolve(newPath)
         }
       });
    });
};


// Recursive brute force through exif

const getPossibleTimestampsRecursive = async (obj) =>{
  let arr = [];
  for(key in obj){
    let val = obj[key];
    if(typeof(val) == 'object'){
      arr = await getPossibleTimestampsRecursive(val);
    } else {


      let mom1 = moment(val, true).toDate();
      let mom2 = moment(val,'YYYY:MM:DD HH:mm:ss', true).toDate();

      let parsedDate1 = Date.parse(mom1);
      let parsedDate2 = Date.parse(mom2);

      let numDate1 = parseInt(parsedDate1);
      let numDate2 = parseInt(parsedDate2);

      if(numDate1 > 1280000000000 && numDate1 < Date.now()){
        arr.push(numDate1);
      }

      if(numDate2 > 1280000000000 && numDate2 < Date.now()){
        arr.push(numDate2);
      }

    }
  }
  return arr;
}

const parseLocation = (data) => {
  const undefLocation = {
    latitude: undefined,
    longitude: undefined
  }
  const latitudeStr = data?.['Profile-EXIF']?.['GPS Latitude'];
  const longitudeStr = data?.['Profile-EXIF']?.['GPS Longitude'];
  const longRef = data?.['Profile-EXIF']?.["GPS Longitude Ref"];
  const latRef = data?.['Profile-EXIF']?.["GPS Latitude Ref"];

  // Missing exif data
  if (!latitudeStr || !longitudeStr) {
    return undefLocation;
  }

  // GPS coordinates are formatted as rationals for degrees, minutes, and seconds
  // E.g. GPS Latitude: '33/1,23/1,4831/100'
  function stringToDecimal(gpsString) {
    function fractionToDecimal(fraction) {
      const [numerator, denominator] = fraction.split('/').map(Number);
      return numerator / denominator;
    }
    const parts = gpsString.split(',');
    return fractionToDecimal(parts[0]) + // degrees
      fractionToDecimal(parts[1]) / 60 + // minutes
      fractionToDecimal(parts[2]) / 3600; //seconds
  }

  try {
    let latDecimal = stringToDecimal(latitudeStr);
    if (latRef.toLowerCase().startsWith("s")) {
      latDecimal = -1 * latDecimal;
    }

    let longDecimal = stringToDecimal(longitudeStr);

    if (longRef.toLowerCase().startsWith("w")) {
      latDecimal = -1 * longDecimal;
    }
    return {
      latitude: Number.parseFloat(latDecimal).toFixed(6),
      longitude: Number.parseFloat(longDecimal).toFixed(6)
    }
  } catch {
    console.log("EXIF location data exists but failed to parse")
  } 
  return undefLocation;
}

const parseExif = async (path) => {
  return new Promise((resolve, reject) => {
     gm(path).identify( async (err,data) => {
       if(err){
         console.log(`Identify error: ${err}`);
         return resolve({});
       } else {

         possibleTimestamps = [];
         // Brute force recursively through to find one that works
         let newPossibilities = await getPossibleTimestampsRecursive(data);
         possibleTimestamps = possibleTimestamps.concat(newPossibilities);

         // Get the lowest timestamp that isn't 1970
         timestamp = false;
         for(const ts of possibleTimestamps){
           if(!timestamp){
             timestamp = ts;
           } else {
             if(ts < timestamp){
               timestamp = ts;
             }
           }
         }
         const {latitude, longitude} = parseLocation(data);
         let usefulData = {
           timestamp : timestamp,
           gpsLatitude : latitude,
           gpsLongitude : longitude
         };
         resolve(usefulData)
       }
     });
  });
 };
