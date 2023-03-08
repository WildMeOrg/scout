/*
 * Form Handling:
 * Stop all forms from submitting,
 * Gather the inputs
 * validate the inputs,
 * show errors as needed,
 * send to backend,
 * show backend errors as needed,
 * On success, take success action
 *
*/

window.tagsList = [
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
];

const minimumImageHeight = 650;
window.imageHeight = minimumImageHeight;

window.sleepTimeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.debugAnnotations = async () =>{
  const annotations = window.anno.getAnnotations();
  if(annotations.length){
    console.log(annotations[0].target.selector.value);
  }

  await sleepTimeout(250);
  await window.debugAnnotations();
}

$( document ).ready( async () => {  

$('form.handleable').each(function(index) {

  $(this).submit(async function(e){

    // Stop from submitting
    e.preventDefault();

    // Remove all the previous validation that may exist on the form already.
    $('input, select, textarea').each((i,obj) =>{
      $(obj).removeClass('is-invalid');
    });
    $('div.invalid-feedback').each((i,obj) =>{
      $(obj).remove();
    });
    $('.formError').hide();

    // Gather the inputs
    const formData = new FormData(this);
    const formValues = {};
    for (const pair of formData.entries()) {
        if (pair[0] == 'filterLabels') {
          formValues.filterLabels = (pair[1].length && pair[1].split(',')) || [];
        } else if (pair[0] == 'tagIds') {
          if (!formValues.tagIds) formValues.tagIds = [];
          formValues.tagIds.push(pair[1]);
        } else {
          formValues[pair[0]] = pair[1];
        }
    }


    // Send to backend
    const action = $(this).attr('action');
    let method = $(this).attr('data-form-method');
    if(!method){
      method = 'POST';
    }
    const response = await fetch(
      action,
      {
        method: method,
        body: JSON.stringify(formValues),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (response.ok) {
      // Take the action specified on the forms sucess attribute
      const onSuccessType = $(this).attr('data-onSuccessType');
      const onSuccessValue = $(this).attr('data-onSuccessValue');

      if(onSuccessType == 'redirect'){
        window.location.href=onSuccessValue;
      }

      // @TODO could be more types life "refresh or others"
    } else {

      // Show the errors
      let data = await response.json();
      if(typeof(data.errorsObject) !== 'undefined'){
        $('.formError').show();

        for (const key in data.errorsObject) {
          let value = data.errorsObject[key];
          console.log("Show error on: ",key,value);
          $('#'+key).addClass('is-invalid');
          $(`<div class="invalid-feedback">${value}</div>`).insertAfter('#'+key);
        }
      }


    }

  });

});

/*
 * Handle the Logout functionality
 *
 */

 $('#logoutButton').on('click', async (e) => {
   e.preventDefault();
   console.log("Logout button was clicked");
   // Make a request to the backend to delete the session
   const response = await fetch(
     '/api/sessions',
     {
       method: 'DELETE'
     },
   );

   if (response.ok) {

     window.location.href="/";

   } else {

     window.location.href="/500";

   }

 });


/*
 * If on a success=true page, show any success alerts
 *
 */
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const success = urlParams.get('success');
if(success){
  $('.pageSuccessAlert[data-successType="'+success+'"]').show();
}

// Turn task list buttons into links
$('#taskTableBody').on('click', 'button.task-list-button-outbound', function(e){
  e.preventDefault();
  console.log($(this));
  let isDisabled = typeof($(this).attr('disabled')) !== 'undefined' ? true : false;
  let link = $(this).attr('data-link');
  console.log("DDDD",isDisabled,link);
  if(!isDisabled){
    window.location.href=link;
  }
});

$('#taskTableBody').on('click', 'button.taskDeletionTrigger', function(e){
  e.preventDefault();
  displayName = $(this).attr('data-task-displayName');
  taskId = $(this).attr('data-task-id');
  console.log("deletion",taskId,displayName);
  $('#modalQuestion').attr('data-modal-taskDisplayName',displayName);
  $('#modalQuestion').attr('data-modal-taskId',taskId);
  $('#taskDisplayNameBlurb').text(displayName);
  $("#taskDeletionModal").modal('show');

});

$('button#previousTaskPage').on('click',async (e) => {
  e.preventDefault();

  // Set new page value
  let currentPage = parseInt($('#pageNumber').val());
  let newValue = currentPage - 1;
  $('#pageNumber').val(newValue);

  // Submit task filters
  await submitTaskFilters();
  return;
});

$('button#nextTaskPage').on('click',async (e) => {
  e.preventDefault();

  // Set new page value
  let currentPage = parseInt($('#pageNumber').val());
  let newValue = currentPage + 1;
  $('#pageNumber').val(newValue);

  // Submit task filters
  await submitTaskFilters();
  return;
});


$('button#taskFilterButton').on('click',async (e) => {
  e.preventDefault();
  console.log('click task filter button');
  await submitTaskFilters();
  return;
});


// Export buttons
$('#exportAnnotations').on('click', async (e) =>{
  await initExport('annotations');
});

$('#exportImages').on('click', async (e) =>{
  await initExport('images');
});

const initExport = async (type) => {
  // Gather the filters
  let filters = getTaskFilters();

  // Make the POST request to get the export ID
  let exportData = {
    'type' : type,
    'filters' : filters
  };
  const response = await fetch(
    '/api/exports',
    {
      method: 'POST',
      body: JSON.stringify(exportData),
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    console.log("Error trying to create export");
    return;
  }
  let res = await response.json();
  let exportId = res.id;
  // Redirect to the exports URL (which should poll if in progress, then refresh itself when done)
  window.location.href="/exports/"+exportId;
};


// Get task filters
const getTaskFilters = () => {
  // Gather the fields
  let filters = {};

  // Name
  let searchValue = $('#searchInput').val();
  if(searchValue.trim().length){
    filters.name = searchValue.trim();
  }

  // StartDate
  let startDateValue = $('#startDate').val();
  if(startDateValue.trim().length){
    filters.startDate = startDateValue.trim();
  }

  // EndDate
  let endDateValue = $('#endDate').val();
  if(endDateValue.trim().length){
    filters.endDate = endDateValue.trim();
  }

  // Randomized (order)
  let randomizedValue = $('#randomized').val();
  if(randomizedValue.length){
    filters.randomized = randomizedValue;
  }

  // Assignee
  let assigneeValue = $('#assigneeInput').val();
  if(assigneeValue.length){
    filters.assignee = assigneeValue;
  }

  // Phase
  let phaseValue = $('#phaseInput').val();
  if(phaseValue.length){
    filters.phase = phaseValue;
  }

  // Page
  let pageValue = $('#pageNumber').val();
  if(pageValue.trim().length){
    filters.page = pageValue.trim();
  }

    let tagsValue = $('#tags').val();
    if (tagsValue && tagsValue.length) {
        filters.tags = tagsValue;
    }

  return filters;
};


// Process submission
const submitTaskFilters = async () => {

  const filters = getTaskFilters();


  // Send the request
  let action = '/api/tasks?'+ new URLSearchParams(filters);
  const response = await fetch(
    action,
    {
      method: 'GET'
    },
  );

  if (!response.ok) {
    console.log("Error applying filters");
    return;
  }

  let res = await response.json();

  // Update the table
  $('#taskTableBody').empty();
  for(const task of res.tasks){
    let rowHTML = await getTaskRow(task);
    $('#taskTableBody').append(rowHTML);

  }

  // Update the pagination
  // use the itemsPerPage and page key on the response
  let totalCount = res.taskCount;
  let start = ((res.page - 1) * res.itemsPerPage) + 1;
  let end = res.page * res.itemsPerPage;
  if(end > totalCount){
    end = totalCount;
  }
  $('#taskList-start').text(start);
  $('#taskList-end').text(end);
  $('#taskList-total').text(totalCount);

  // Update previous and next
  previousDisabled = false;
  if(start == 1){
    previousDisabled = true;
  }
  $('#previousTaskPage').attr('disabled',previousDisabled);

  nextDisabled = false;
  if(totalCount == end){
    nextDisabled = true;
  }
  $('#nextTaskPage').attr('disabled',nextDisabled);


  return;
};


if(window.data.pageName == 'taskList'){
  if(window.data.userRole == 'user'){
    // select themselves
    $('#assigneeInput').val([window.data.userId])
    // select unfinished annotations (ns = not start, as = annotation started)
    $('#phaseInput').val(['ns','as']);

  }
  submitTaskFilters();

}

window.getTagName = function(tagId) {
    let tname = 'UNKNOWN TAG';
    for (const tag of (window.data.availableTags || [])) {
        if (tag.id == tagId) tname = tag.name;
    }
    return tname;
}

let getTaskRow = async (task) => {
  let disabledAdditions = {
    'annotation': task.iCanAnnotate ? '' : 'disabled',
    'groundTruth': task.iCanGroundTruth ? '' : 'disabled',
    'division': task.iCanDivide ? '' : 'disabled',
    'deletion': task.iCanDelete ? '' : 'disabled',
  }

    let tagDiv = '<div class="task-tags"><b>Tags:</b> ';

    for (const tagId of (task.tagIds || [])) {
        tagDiv += '<div data-id="' + tagId + '" class="task-tag">' + window.getTagName(tagId) + '</div>';
    }

  let template = `
  <tr id="task-row-${task.id}" style="position: relative; height: 5em;">
    <th scope="row">${task.displayName}</th>
    <td style="text-transform: capitalize">${task.orientation}</td>
    <td>${task.randomized == false ? 'seq' : 'rnd'}</td>
    <td>${task.assigneeDiplayName}</td>
    <td>${new Date(task.createdAt).toISOString().split('T')[0]}</td>
    <td>${Math.floor(task.progressAnnotation * 100)}</td>
    <td>${Math.floor(task.progressGroundTruth * 100)}</td>
    <td>${Math.floor(task.progressLineDivision * 100)}</td>
    <td class="text-end">
      <button id="annotate-${task.id}" data-link="/annotations/${task.id}/new" ${disabledAdditions.annotation} class="task-list-button-outbound btn btn-sm btn-secondary">
        Annotate
      </button>
    `;

    if(window.data.userRole == 'admin') {



      template+=`
        <button id="gt-${task.id}" data-link="/ground-truths/${task.id}/new" ${disabledAdditions.groundTruth}   class="task-list-button-outbound btn btn-sm btn-secondary">
          Ground Truth
        </button>
        <button id="division-${task.id}" data-link="/line-divisions/${task.id}/new" ${disabledAdditions.division} class="task-list-button-outbound btn btn-sm btn-secondary">
          Division Lines
        </button>
        <button id="del-${task.id}" data-task-displayName="${task.displayName}" ${disabledAdditions.deletion} data-task-id="${task.id}" class="btn btn-sm btn-secondary taskDeletionTrigger">
          Delete
        </button>
        <button id="prev-${task.id}" data-link="/tasks/images-preview/${task.id}" class="task-list-button-outbound btn btn-sm btn-secondary">
            Images
        </button>
        `;

        tagDiv += ' <div class="tag-edit-div"><select></select><input placeholder="Enter new tag" /><button class="tag-save-button btn btn-sm btn-secondary">Save</button></div><button class="tag-edit-button btn btn-sm btn-secondary" onClick="return openEditTag(this);"><i class="bi-pencil"></i></button>';
    }

    tagDiv += '</div>';

    template+=`
${tagDiv}
        </td>
      </tr>
      `;
  return template;
};


$('button#taskResetButton').on('click', async (e) =>{
  e.preventDefault();
  // Clear all fields

  $('#searchInput').val('');
  $('#startDate').val(null);
  $('#endDate').val(null);
  $('#assigneeInput').val(null);
  $('#phaseInput').val(null);
  $('#randomized').val(null);
  $('#tags').val(null);

  // Reset pageNumber to 1
  $('#pageNumber').val(1);

  if(window.data.userRole == 'user'){
    // select themselves
    $('#assigneeInput').val([window.data.userId])
    // select unfinished annotations (ns = not start, as = annotation started)
    $('#phaseInput').val(['ns','as']);

  }


  // Run the task filters again (empty, to get all results)
  await submitTaskFilters();

  return;
});

$('button#clearSearchInput').on('click',function(e){
  e.preventDefault();
  $('#searchInput').val('');

});



 $('#tasksPage .datepicker').datepicker();


// Handle image selection modal
$("form#imageSelectionForm input").on("input", async (e) => {
  await imageSelectionFormChange();
});
$("form#imageSelectionForm select").on("input", async (e) => {
  await imageSelectionFormChange();
});

$("form#imageSelectionForm input#taskNamesDataList").on("input", async (e) => {
  await populateTaskNamesDataList();
});

// Handle the task deletion modal
$("input#retypeTaskName").on("input", async (e) => {
  let val = $('input#retypeTaskName').val();
  let compare = $('#modalQuestion').attr('data-modal-taskDisplayName');
  if(val.toLowerCase() == compare.toLowerCase()){
    $("#deletionConfirmButton").attr('disabled',false);
  } else {
    $("#deletionConfirmButton").attr('disabled',true);
  }
});

// Do the deletion
$('#deletionConfirmButton').on('click', async (e) => {
  const taskId = $('#modalQuestion').attr('data-modal-taskId');
  if(taskId.length > 0){
    console.log('Deleting',taskId)
  }
  const response = await fetch(
    '/api/tasks/'+taskId,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    console.log("Error trying to delete this task");
    return;
  } else {
    window.location.href="/tasks/?success=delete"
  }
});


const removeTagIdFromTask = async (tagId, taskId) => {
    console.log('taskId=%o tagId=%o', taskId, tagId);
    const response = await fetch('/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({taskId: taskId, tagId: tagId, remove: true}),
        headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
}

const addTagIdToTask = async (tagId, taskId) => {
    console.log('taskId=%o tagId=%o', taskId, tagId);
    const response = await fetch('/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({taskId: taskId, tagId: tagId}),
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return {success: false};
    return {
        success: true,
        name: window.getTagName(tagId),
        id: tagId
    };
}
const addNewTagToTask = async (newTagName, taskId) => {
    const response = await fetch('/api/tags', {
        method: 'POST',
        body: JSON.stringify({taskId: taskId, name: newTagName}),
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return {success: false};
    let res = await response.json();
    console.log('taskId=%o newTagName=%o => %o', taskId, newTagName, res);
    window.data.availableTags.push(res);
    return {
        success: true,
        name: newTagName,
        id: res.id
    };
}

window.openEditTag = function(el) {
    $('.tag-edit-div').hide();
    $('i.bi-x').remove();
    let isOpen = el.dataset.open;
    $('.tag-edit-button').each(function() { delete this.dataset.open; });
    if (isOpen) return;
    el.dataset.open = true;

    $(el).parent().find('.tag-edit-div').css('display', 'inline-block');
    let hasTags = [];
    $(el).parent().find('.task-tag').each(function() {
        hasTags.push(this.dataset.id);
        let rmButton = $('<i class="bi-x task-tag-rm"></i>');
        rmButton.on('click', async (ev) => {
            let tagId = ev.currentTarget.parentElement.dataset.id;
            let taskId = ev.currentTarget.parentElement.parentElement.parentElement.parentElement.id.substring(9);
            const success = await removeTagIdFromTask(tagId, taskId);
            if (success) {
                ev.currentTarget.parentElement.remove();
                window.openEditTag($(el.parentElement.parentElement).find('i')[0]);  //closes edit div
            } else {
                alert('error removing tag');
            }
        });
        rmButton.appendTo(this);
    });

    let tagOptions = '<option value="">Choose tag</option>';
    let numOptions = 0;
    for (const tag of window.data.availableTags) {
        if (hasTags.indexOf(tag.id) > -1) continue;
        numOptions++;
        tagOptions += '<option value="' + tag.id + '">' + tag.name + '</option>';
    }
    if (numOptions) {
        $(el).parent().find('.tag-edit-div select').show().html(tagOptions);
    } else {
        $(el).parent().find('.tag-edit-div select').hide();
    }

}

const populateTaskNamesDataList = async () => {
  let query = $('input#taskNamesDataList').val();

  let action = '/api/tasks?'+ new URLSearchParams({'name' : query});
  const response = await fetch(
    action,
    {
      method: 'GET'
    },
  );

  if (response.ok) {
    let res = await response.json();
    $('#sourceTask').empty();
    for(const task of res.tasks){
      let opt = `<option value="${task.displayName}" />`;
      $('#sourceTask').append(opt)
    }
  }

}

window.imageSelectionFormUnsavedInputs = null;
window.imageSelectionFormSavedInputs = {};
window.imageSelectionFormUnsavedCount = 0;
window.imageSelectionFormSavedCount = 0;
const imageSelectionFormChange = async () => {
  let labels = [];
  const formData = new FormData(document.getElementById('imageSelectionForm'));
  const formValues = {};
  for (const pair of formData.entries()) {
      if (pair[0] == 'labels') {
        labels.push(pair[1]);
      } else {
        formValues[pair[0]] = pair[1];
      }
  }
  
  window.imageSelectionFormUnsavedInputs = formValues;
  window.imageSelectionFormUnsavedInputs.labels = labels.slice();  // $#@* javascript
  let sp = new URLSearchParams(formValues);
  while (labels.length) {
    sp.append('labels', labels.shift());
  }
  let action = '/api/images?'+ sp;
  const response = await fetch(
    action,
    {
      method: 'GET'
    },
  );

  if (response.ok) {
    let res = await response.json();
    let count = res.imageCount;
    window.imageSelectionFormUnsavedCount = count;
    $('#filteredImageCountModal').text(count);
  }

}

  //Get all labels from database
  const getAllLabels = async () => {
    let action = '/api/labels?';
    const responseLL = await fetch(
      action,
      {
        method: 'GET'
      },
    );
    if (!responseLL.ok) {
      console.log("Error applying filters");
      return;
    }
    let res = await responseLL.json();
    window.tagsList = res;
    return res;
  }

  //Update window.tagsList
  window.tagsList = await getAllLabels();
  
  //Insert new label to database
  const createLabel = async (data) => {
      let label = {};
      label.name = data.name;  
      label.hotKey = data.hotKey;
      //ml labels will stay ml, otherwise source will be ll(lab lead)  
      label.source = data.source == "ml" ? "ml" : "ll";
      //Insert data to db
      let action = '/api/labels?'+ new URLSearchParams(label);    
      // console.log(action);
      const response = await fetch(
        action,
        {
          method: 'POST'
        },
      );
       return response; 
  }

  //Delete label row from page
  const deleteRow = (row) => {
    row.parent().parent().remove();
  }

  //Delete label from database
  const deleteLabel = async (id) => {
    let action = '/api/labels/'+ id;
    const response = await fetch(
      action,
      {
        method: 'DELETE'
      },
    );            
  }

  //Display label row on page
  const displayLabel = (label) => {     
  const labels = `<div class="individualLabel">
                      <div class="labelDisplay">
                          <span style="font-size: 16px; font-weight: 600" >${label.name}</span> 
                          <span style="font-size: 16px">${label.hotKey}</span>
                      </div>
                      <div class="buttons">
                        <button class="btn btn-primary editButton">Edit</button>
                        ${label.source == "ml" ? "" : "<button class='btn btn-primary deleteButton'>Delete</button> "}
                                              
                      </div>
                  </div>`;
        $('#labelsList').append(labels);
    return;
  };  

  //Create a new row and append it to labelsList
  const createLabelRow = async () => {  
    // console.log("creating new row")
    const labels = `<div class="individualLabel">
                          <div class="label">
                          <input type="text" id = "labelInput">
                              <select class ="selectHotKey" id="selectHotKey">
                                <option></option>                                                        
                              </select>
                          </div>
                          <div class="buttons">
                            <button class="btn btn-primary saveButton">Save</button>
                            <button class="btn btn-primary deleteButton">Delete</button>
                          </div>
                      </div>`;
    $('#labelsList').append(labels);    
  }

  //Get all labels from db and display
  const getAllAndDisplay = async () => {
    labelsList.innerHTML = "";
    const data = await getAllLabels();
    data.forEach(item => {
    const labels = `<div class="individualLabel">
                    <div class="labelDisplay">
                        <span style="font-size: 16px; font-weight: 600" data-label-id = ${item.id}>${item.name}</span> 
                        <span style="font-size: 16px">${item.hotKey ? item.hotKey : "no hot key"}</span>
                    </div>
                    <div class="buttons">
                      <button class="btn btn-primary editButton">Edit</button>
                      ${item.source == "ml" ? "" : '<button class="btn btn-primary deleteButton">Delete</button>'}
                      
                    </div>
                </div>`;

    $('#labelsList').append(labels);
    });
  }

  //Generate options
  const getOptions = async () => {
    const allOptions = [];
    let count = 0;
    while(count<10) {
      allOptions.push(count);
      allOptions.push("shft+"+count);
      count++;
    }    
    return allOptions;    
  }


  const updateLabel = async (data) => {
    let label = {};
    label.name = data.name;  
    label.hotKey = data.hotKey;  
    label.source = data.source == "ml" ? "ml" : "ll";
    let action = '/api/labels?'+ new URLSearchParams(label);    
    const response = await fetch(
      action,
      {
        method: 'POST'
      },
    );
       return response; 
  }


  const onButtonClicked = async() => {
    await createLabelRow();
    const labelsList = document.getElementById("labelsList");
    //Let the page focus on the botton of label list where the new row is inserted
    labelsList.scrollTop = labelsList.scrollHeight - labelsList.clientHeight;
    //Get options and append to selector
    const allOptions = await getOptions();
    const selectors = document.querySelectorAll("#selectHotKey");
    const lastSelector = selectors[selectors.length-1]
    allOptions.forEach(data => {
      const option1 = document.createElement('option');
      option1.textContent = data;
      lastSelector.appendChild(option1);
    });
    return;
  }      

  const labelEditModal = document.getElementById("labelEditModal");  

  if(labelEditModal) {
    labelEditModal.addEventListener('show.bs.modal', () => {
      const button = document.getElementById('addNewLabel');
      button.addEventListener('click', onButtonClicked);
    });
    
    labelEditModal.addEventListener('hidden.bs.modal', () => {
      const button = document.getElementById('addNewLabel');
      button.removeEventListener('click', onButtonClicked);
    });
  } 

  window.tagsList.forEach(data => {
    if(data.hotKey) {
      let hotKey = `<span class = "hotKeySpan">${data.name.length>13 ? data.name.slice(0,12)+"..." : data.name} <i>${data.hotKey}</i></span>`;
      $('#hotKeyBox').append(hotKey)
    }      
  })  

  //Event listener for the "Label" button on task page, entrypoint for label manager too
  $('#editLabelButton').on('click', async (e) => {
    e.preventDefault();    
    $("#labelEditModal").modal('show');
    // get data from db
    await getAllAndDisplay();       
    
    //event listener for delegation save button
    const labelsList = document.getElementById('labelsList'); 
    labelsList.addEventListener('click', async event => {
      
    if (event.target.matches('.saveButton')) { 
      //Get the labelLists div
      const parent = event.target.parentNode.parentNode;
      //Get the label span/input
      const label = parent.children[0].children[0];      
      
      let labelName = "";
      let source = "";

      const mySelect = document.getElementById("selectHotKey");
      //Get selected hot key
      const selectedOption = mySelect.options[mySelect.selectedIndex] ? mySelect.options[mySelect.selectedIndex].textContent : "";            
      //Get id
      const id = label.getAttribute("data-label-id");      
      const option = selectedOption ? selectedOption : ""
      //Check if this hot key is already used, if yes show alert, else continue to save
      const all = await getAllLabels();
      if(selectedOption !== "" && all.find(data => data.hotKey == selectedOption)) {
          alert("Hot key alreay in use");          
      }else {
        //If record in db
        if(id) {
          labelName = label.innerText;           
          all.forEach( data => {
            if(data.name == labelName) {
              source = data.source;
            }
          })           
          
          //Update db
          await updateLabel({name: labelName, hotKey: option, source: source})
        //Not in db, create new record
        }else {
          labelName = label.value;
          const allLabelNames = [];
          window.tagsList.forEach(data => allLabelNames.push(data.name));          

          //Check label name 
          if(!allLabelNames.find(data => data == labelName) && labelName.trim()) {
            await createLabel({name: labelName, hotKey: option, source: "ll"})
          }else {
            alert("Label name invalid");
          }                        
        } 
        await getAllAndDisplay();
      }     
    }
});
   
    //event listener for delegation edit button    
    labelsList.addEventListener('click', async e => {
    if (e.target.matches('.editButton')) {
      
      //Create a new selector
      const newSelect = document.createElement('select');
      newSelect.setAttribute('id', "selectHotKey");
      newSelect.setAttribute('required', '')
       
      //Create a new save button
      const newSave = document.createElement('button');
      newSave.textContent = "Save"
      newSave.className = 'btn btn-primary saveButton';
      const parent = e.target.parentNode.parentNode;
      console.log(parent);
      const leftDiv = parent.children[0];
      const rightDiv = parent.children[1];
      //Replace the old hot key with a selector
      leftDiv.children[1].replaceWith(newSelect);
      //Replace the edit button with a save button
      e.target.replaceWith(newSave);      

      //Get options and insert to selector
      const allOptions = await getOptions();
      const selector = document.querySelector("#selectHotKey");
      const option1 = document.createElement('option');
      option1.textContent = "";
      selector.appendChild(option1)
      allOptions.forEach(data => {
        const option1 = document.createElement('option');
        option1.textContent = data;
        selector.appendChild(option1);
      });
    }

});

    //event listener for delegation delete button
    labelsList.addEventListener('click', async e => {
      if (e.target.matches('.deleteButton')) { 
        deleteRow($(e.target));
        const id = e.target.parentNode.parentNode.children[0].children[0].getAttribute("data-label-id")
        //If in db, delete the row and record in db
        if(id) {
          deleteLabel(id);
          deleteRow($(e.target));
        } else {
          deleteRow($(e.target));
        }
    }

})            

   })

$("#imageSelectionForm .bootstrap-datepicker").datepicker({

}).on("change", async () => {
  await imageSelectionFormChange();
});

$('#imageSelectionModalTrigger').on('click',(e) =>{
  e.preventDefault();
  $("#imageSelectionModal").modal('show');

  // Set the saved values in the modal
  $('#originalFilenameLower').val($('#filterName').val());
  $('#taskNamesDataList').val($('#filterSource').val());
  $('#startDate').val($('#filterDateStart').val());
  $('#endDate').val($('#filterDateEnd').val());
  $('#subsetStart').val($('#filterSubsetStart').val());
  $('#subsetEnd').val($('#filterSubsetEnd').val());
  $('#labels').val($('#filterLabels').val().split(','));
  $('#wicMin').val($('#filterWicMin').val());
  $('#wicMax').val($('#filterWicMax').val());
  $('#filteredImageCountModal').text($('#filteredImageCount').val());

});

$('#imageSelectionFormSubmit').on('click',(e) => {
  e.preventDefault();
  
  // Save the state of the form and filtered result
  window.imageSelectionFormSavedCount = window.imageSelectionFormUnsavedCount;
  window.imageSelectionFormSavedInputs = window.imageSelectionFormUnsavedInputs;
  
  // Set hidden inputs
  $('#filterName').val(window.imageSelectionFormSavedInputs.originalFilenameLower || '');
  $('#filterSource').val(window.imageSelectionFormSavedInputs.sourceTask || '');
  $('#filterDateStart').val(window.imageSelectionFormSavedInputs.startDate || '');
  $('#filterDateEnd').val(window.imageSelectionFormSavedInputs.endDate || '');
  $('#filterSubsetStart').val(window.imageSelectionFormSavedInputs.subsetStart || '');
  $('#filterSubsetEnd').val(window.imageSelectionFormSavedInputs.subsetEnd || '');
  $('#filterLabels').val(window.imageSelectionFormSavedInputs.labels || '');
  $('#filterWicMin').val(window.imageSelectionFormSavedInputs.wicMin || '');
  $('#filterWicMax').val(window.imageSelectionFormSavedInputs.wicMax || '');
  // Set filtered count value
  $('#totalFilteredImages').text(window.imageSelectionFormSavedCount || 0);
  $('#filteredImageCount').val(window.imageSelectionFormSavedCount || 0);

  // Close the modal
  $('#imageSelectionModal').modal('hide');
});



// Poppers
$('[data-toggle="popover"]').popover({'html':true});


/*
 *
 *
 * Annotations
 *
 *
 */


if(window.data.pageName == 'annotations'){


  setTimeout( async () => {
    await simpleBoxes.debug()
    window.sbHandle1 = await simpleBoxes.initHandle('imageToAnnotate',[],false);


    if(window.data.existingAnnotations && window.data.existingAnnotations.boundingBoxes.length){
      simpleBoxes.loadBoxes(window.sbHandle1.id,window.data.existingAnnotations.boundingBoxes);
    }

  },500);

// Bind zoom in
$('#annotationZoomIn').on('click',(e) =>{
  e.preventDefault();
  let newHeight = window.imageHeight * 1.1;
  if(newHeight >= 10000){
    newHeight = 10000;
    // Disable zoom in button
  }
  window.imageHeight = newHeight;
  $('#imageToAnnotate').css('height',newHeight+'px');
  simpleBoxes.zoom(window.sbHandle1.id);
});

// Bind zoom out
$('#annotationZoomOut').on('click',(e) =>{
  e.preventDefault();
  let newHeight = window.imageHeight / 1.1;

  if(newHeight < minimumImageHeight){
    newHeight = minimumImageHeight;

    // Disable zoom out button
  }
  window.imageHeight = newHeight;
  $('#imageToAnnotate').css('height',newHeight+'px');
  simpleBoxes.zoom(window.sbHandle1.id);
});

// Bind back button
$('#annotationBackButton').on('click',(e)=>{
  e.preventDefault();
  window.location.href="/annotations/"+window.data.taskId+"/new?back=true";
});

// Bind done button
$('#annotationDoneButton').on('click',async (e)=>{
  e.preventDefault();

  // Get all the annotations

  const annotationsObject = await simpleBoxes.getAllBoxes(window.sbHandle1.id);
  let annotationsArray = [];
  for(index in annotationsObject){
    annotationsArray.push(annotationsObject[index]);
  }

  // Parse them
  errorMessage = false;
  for(const annotation of annotationsArray){
    if(!errorMessage){

      if(!annotation.label || !annotation.label.length){
        errorMessage = 'Please select a label for all of your boxes.';
      } else {
        let label = annotation.label;
        const allLabelNames = [];
        window.tagsList.forEach(tag => allLabelNames.push(tag.name));
        if(allLabelNames.indexOf(label) < 0){
          errorMessage = 'One of your tags, ('+label+'), is not recognized. Please choose your tags from the available drop-down.';
        }
      }
    }
  }
  if(errorMessage){
    alert(errorMessage)
    return;
  }

  // If there are pre-existing annotations for this image, delete them before continuing
  if(typeof(window.data.existingAnnotations) !== 'undefined' && typeof(window.data.existingAnnotations.id) == 'string'){
    console.log("Deleting existing annotations");
    const response = await fetch(
      '/api/annotations/'+window.data.existingAnnotations.id,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      console.log("Error trying to delete the previous annotation");
    }
  }

  // Send new annotations
  let boxesCount = annotationsArray.length;
  if(boxesCount > 0){
    // Send annotations to API to create new annotation
    // console.log("Creating annotation with ",boxesCount," boxes");

    let submissionData = {
      'queuedImageId' : window.data.queuedImageId,
      'boxes' : annotationsArray
    };
    const response = await fetch(
      '/api/annotations',
      {
        method: 'POST',
        body: JSON.stringify(submissionData),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      console.log("Error trying to create annotation");
      return;
    }

  } else {
    console.log('Not creating any annotations, just skipping');
  }

  // Update this queued image that it is done
  console.log('Updating this queuedImage that it is done');
  let updateData = {
    'annotationComplete' : true
  };
  const response = await fetch(
    '/api/queuedimages/'+window.data.queuedImageId,
    {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    console.log("Error trying to updated this queuedImage as being annotated");
    return;
  } else {
    window.location.href = '/annotations/'+window.data.taskId+'/new';
  }

  });

}

/*
 *
 *
 * Ground Truthing
 *
 *
 */

 if(window.data.pageName == 'gt'){


setTimeout( async () => {

   await simpleBoxes.debug()
   window.sbHandleLeft = await simpleBoxes.initHandle('imageToGroundTruth',[],false);
   // Draw main boxes (if any)
   if(window.data.chosenAnnotations && window.data.chosenAnnotations.boundingBoxes.length){
     await simpleBoxes.loadBoxes(window.sbHandleLeft.id,window.data.chosenAnnotations.boundingBoxes);
   }

},500);

 // Bind zoom in
 $('.gtZoomIn').on('click',(e) =>{
   e.preventDefault();
   let newHeight = window.imageHeight * 1.1;
   if(newHeight >= 10000){
     newHeight = 10000;
     // Disable zoom in button
   }
   window.imageHeight = newHeight;
   $('#imageToGroundTruth').css('height',newHeight+'px');
   $('#imageComparison').css('height',newHeight+'px');
   window.syncPan();
   simpleBoxes.zoom(window.sbHandleLeft.id);
   if(typeof(window.sbHandleRight) !== 'undefined'){
     simpleBoxes.zoom(window.sbHandleRight.id);
   }

 });

 // Bind zoom out
 $('.gtZoomOut').on('click',(e) =>{
   e.preventDefault();
   let newHeight = window.imageHeight / 1.1;

   if(newHeight < minimumImageHeight){
     newHeight = minimumImageHeight;

   }
   window.imageHeight = newHeight;
   $('#imageToGroundTruth').css('height',newHeight+'px');
   $('#imageComparison').css('height',newHeight+'px');
   window.syncPan();
   simpleBoxes.zoom(window.sbHandleLeft.id);
   if(typeof(window.sbHandleRight) !== 'undefined'){
     simpleBoxes.zoom(window.sbHandleRight.id);
   }
 });

 // Bind sidebar open / close
 $('#gtOpenSidebar').on('click',(e) =>{
   $('#sidebar-opened').show();
   $('#sidebar-closed').hide();
   $('#gtColumnRight').show();
   $('#gtColumnLeft').css('width','49.8%').css('float','left').css('text-align','right');

   //When clicking at the button, toggle the height of images
   $('#imageToGroundTruth').removeClass("imageToGroundTruth");
   $('#imageToGroundTruth').addClass("imageToGroundTruthCompare");    
   $('#scrollBoxLeft').removeClass("groundTruthInnerWrapper");
   $('#scrollBoxLeft').addClass("groundTruthInnerWrapperCompare");

   window.syncPan();
   simpleBoxes.zoom(window.sbHandleLeft.id);
   if(typeof(window.sbHandleRight) !== 'undefined'){
     simpleBoxes.zoom(window.sbHandleRight.id);
   }

 });

 $('#gtCloseSidebar').on('click', async (e) =>{
   $('#sidebar-opened').hide();
   $('#sidebar-closed').show();
   $('#gtColumnRight').hide();
    $('#gtColumnLeft').css('width','100%').css('float','clear').css('text-align','center');

    //When clicking at the button, toggle the height of images
    $('#imageToGroundTruth').removeClass("imageToGroundTruthCompare");
    $('#imageToGroundTruth').addClass("imageToGroundTruth");
    $('#scrollBoxLeft').removeClass("groundTruthInnerWrapperCompare");
    $('#scrollBoxLeft').addClass("groundTruthInnerWrapper");

    await window.wipeComparisonBoxes();

    $('#referenceTaskDropdown').val('');
 });



   window.syncPan = () => {
     // Sync the panning and scrolling between the images
      let topSync =  $('#imageToGroundTruth').offset().top;
      $('#imageComparison').offset({ top : topSync });
      $('#scrollBoxRight canvas').offset({ top : topSync });
      //$('#scrollBoxRight i.labelBoxTrigger').offset({ top : topSync });


      if($('#imageComparison').width() >= $('#gtColumnRight').width()){
        let xDiff = $('#gtColumnRight').offset().left - $('#gtColumnLeft').offset().left;
        leftSync = $('#imageToGroundTruth').offset().left + xDiff;
        $('#imageComparison').offset({ left : leftSync });
        $('#scrollBoxRight canvas').offset({ left : leftSync });
      } else {
        $('#imageComparison').css('left','initial');
        //$('#scrollBoxRight i.labelBoxTrigger').css('left','initial');
      }


   };


   // When the dropdown changes, change the comparison image, and load the boxes
   $('#referenceTaskDropdown').on('input', async(e) => {

     let refTaskId = $('#referenceTaskDropdown').val();
     window.wipeComparisonBoxes();
     for(const comp of window.data.comparisonTasks){
       if(refTaskId == comp.id && typeof(comp.annotationData) !== 'undefined' && typeof(comp.annotationData.boundingBoxes) !== 'undefined'){
         console.log(comp);
         let boxes = comp.annotationData.boundingBoxes;
         if(boxes.length > 0){
           window.drawComparisonBoxes(boxes);
         }
       }

     }
     console.log('ref task changed')
   });


   window.wipeComparisonBoxes = async () => {
     //await simpleBoxes.wipeCanvas(window.sbHandleRight.id);
   };

   window.RighttXStart = 0;
   window.RightYStart = 0;
   window.svgXStart = 0;
   window.svgYStart = 0;
   window.drawComparisonBoxes = async (boxes) => {

    if(typeof(window.sbHandleRight) == 'undefined'){
      window.sbHandleRight = await simpleBoxes.initHandle('imageComparison',[],true);
    }
   await simpleBoxes.loadBoxes(window.sbHandleRight.id,boxes);



   };


  $('#scrollBoxLeft').on('scroll', async (e) => {
    window.syncPan();
    simpleBoxes.zoom(window.sbHandleLeft.id);
    if(typeof(window.sbHandleRight) !== 'undefined'){
      simpleBoxes.zoom(window.sbHandleRight.id);
    }
  });


 // Bind back button
 $('.gtBackButton').on('click',(e)=>{
   e.preventDefault();
   window.location.href="/ground-truths/"+window.data.taskId+"/new?back=true";
 });


 // Bind done buttons
 $('.gtDoneButton').on('click',async (e)=>{
   e.preventDefault();

   // Get all the annotations
   let annotationsArray = [];
   if (window.sbHandleLeft) {
     const annotationsObject = await simpleBoxes.getAllBoxes(window.sbHandleLeft.id);
     for(index in annotationsObject){
       annotationsArray.push(annotationsObject[index]);
     }
   }

   // Parse them
   errorMessage = false;
   for(const annotation of annotationsArray){
     if(!errorMessage){

       if(!annotation.label || !annotation.label.length){
         errorMessage = 'Please select a label for all of your boxes.';
       } else {
         let label = annotation.label;
         const allLabelNames = [];
        window.tagsList.forEach(tag => allLabelNames.push(tag.name));
         if(allLabelNames.indexOf(label) < 0){
           errorMessage = 'One of your tags, ('+label+'), is not recognized. Please choose your tags from the available drop-down.';
         }
       }
     }
   }
   if(errorMessage){
     alert(errorMessage)
     return;
   }

   // If there are pre-existing ground-truths for this image, delete them before continuing
   if(typeof(window.data.existingGroundTruths) !== 'undefined' && typeof(window.data.existingGroundTruths.id) == 'string'){
     console.log("Deleting existing ground truths");
     const response = await fetch(
       '/api/groundtruths/'+window.data.existingGroundTruths.id,
       {
         method: 'DELETE',
         headers: { 'Content-Type': 'application/json' },
       }
     );

     if (!response.ok) {
       console.log("Error trying to delete the previous ground-truth");
     }
   }

   // Send new ground truths
   let boxesCount = annotationsArray.length;
   if(boxesCount > 0){
     // Send annotations to API to create new annotation
     console.log("Creating ground truth with ",boxesCount," boxes");

     let submissionData = {
       'imageId' : window.data.imageId,
       'boxes' : annotationsArray,
       'taskId' : window.data.taskId
     };
     const response = await fetch(
       '/api/ground-truths',
       {
         method: 'POST',
         body: JSON.stringify(submissionData),
         headers: { 'Content-Type': 'application/json' },
       },
     );

     if (!response.ok) {
       console.log("Error trying to create ground truth");
       return;
     }

   } else {
     console.log('Not creating any ground truths, just skipping');
   }

   // Update this image that it is done
   console.log('Updating this image that it is done');
   let updateData = {
     'gtComplete' : true,
     'taskId' : window.data.taskId
   };
   const response = await fetch(
     '/api/images/'+window.data.imageId,
     {
       method: 'PUT',
       body: JSON.stringify(updateData),
       headers: { 'Content-Type': 'application/json' },
     }
   );

   if (!response.ok) {
     console.log("Error trying to update this image as being ground truthed");
     return;
   } else {
     window.location.href = '/ground-truths/'+window.data.taskId+'/new';
   }

   });

 }


if(window.data.pageName == 'division'){

  // Set slider width
  $('.form-range').css('width',$('#imageToLineDraw').width()+'px')

  // Back
  $('#divisionBack').on('click',(e) => {
    e.preventDefault();
    window.location.href="/line-divisions/"+window.data.taskId+"/new?back=true";
  });


  $('#lineOpener').on('click',(e) => {
    e.preventDefault();
    window.openLineTool();
  });

  $('#lineCloser').on('click',(e) => {
    e.preventDefault();
    window.closeLineTool();

  });



  $('#divisionDone').on('click', async (e) => {
    e.preventDefault();

    // If there are pre-existing line divisions for this pair, delete them before continuing
    if(typeof(window.data.existingLineDivisions) !== 'undefined' && typeof(window.data.existingLineDivisions.id) == 'string'){
      console.log("Deleting existing line divisions");
      const response = await fetch(
        '/api/linedivisions/'+window.data.existingLineDivisions.id,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        console.log("Error trying to delete the previous line-divisions");
      }
    }


    // Get the sliders
    let sliders = window.getSliderValues();

    // If the sliders are on, send the data to create a new line-division
    if(sliders){
      let submissionData = {
        topX : sliders.top,
        bottomX : sliders.bottom,
        taskId : window.data.taskId,
        sequencedPairId : window.data.sequencedPairId,
        imageLeftId : window.data.imageLeftId,
        imageRightId : window.data.imageRightId,
      };
      const response = await fetch(
        '/api/line-divisions',
        {
          method: 'POST',
          body: JSON.stringify(submissionData),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) {
        console.log("Error trying to create line division");
        return;
      }
    } else {
      console.log('Not creating any line-divisions, just skipping');
    }

    // Update this sequenced-paid that it is done
    console.log('Updating this sequenced pair that it is done');
    let updateData = {
      'divisionComplete' : true,
      'taskId' : window.data.taskId
    };
    const response = await fetch(
      '/api/sequenced-pairs/'+window.data.sequencedPairId,
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      console.log("Error trying to update this sequencedPairId as being divided");
      return;
    } else {
      window.location.href = '/line-divisions/'+window.data.taskId+'/new';
    }




  });

  window.openLineTool = () => {
    $('#lineOpenerWrapper').hide();
    $('#lineCloserWrapper').show();
    $('.form-range').css('visibility','initial');
    $('.form-range').css('width',$('#imageToLineDraw').width()+'px');
    window.resizeBox();

  };

  window.closeLineTool = () => {
    $('#lineCloserWrapper').hide();
    $('#lineOpenerWrapper').show();
    window.draw.clear();
    $('.form-range').css('visibility','hidden');
  };

  $('#topSlider').on('input',(e) => {
    window.resizeBox();
  });

  $('#bottomSlider').on('input',(e) => {
    window.resizeBox();
  });

window.resizeBox = () =>{
  let imgWidth = $('#imageToLineDraw').width();
  let topSlider = $('#topSlider').val();
  let topX = ((100 - parseInt(topSlider)) / 100) * imgWidth;
  let bottomSlider = $('#bottomSlider').val();
  let bottomX = ((100 - parseInt(bottomSlider)) / 100) * imgWidth;
  window.drawShaded(topX,bottomX);
};

window.draw = {
  clear : () => {}
};
window.drawShaded = (topX, bottomX) => {
    window.draw.clear();
    let maxWidth = topX > bottomX ? topX : bottomX;
    let point1 = topX > bottomX ? 0 : bottomX - topX;
    let point2 = maxWidth;
    let point3 = maxWidth;
    let point4 = bottomX > topX ? 0 : topX - bottomX;

    const lineDivisionImageHeight = 455;
    window.draw = SVG().addTo('#ldBoxLeft').size(maxWidth, lineDivisionImageHeight);
    let coords = `${point1},0 ${point2},0 ${point3},${lineDivisionImageHeight} ${point4}, ${lineDivisionImageHeight}`;

    var polygon = draw.polygon(coords);
    polygon.fill('rgba(255, 0, 102,0.6)');
    $('svg').css('width',maxWidth+'px');
  };


window.getSliderValues = () =>{
  if(!($('svg polygon').is(':visible'))){
    return false;
  }
  let topVal = parseInt($('#topSlider').val());
  let bottomVal = parseInt($('#bottomSlider').val());
  let top = topVal > 0 ? topVal / 100 : 0;
  let bottom = bottomVal > 0 ? bottomVal / 100 : 0;
  let returnValues = {
    top : top,
    bottom : bottom
  }
  return returnValues;
};



window.loadPreviousDivision = () => {
  if(typeof(window.data.existingLineDivisions) !== 'undefined' && typeof(window.data.existingLineDivisions.topX) !== 'undefined'){
    window.openLineTool();
    $('#topSlider').val(window.data.existingLineDivisions.topX * 100);
    $('#bottomSlider').val(window.data.existingLineDivisions.bottomX * 100);
    window.resizeBox();
  }
};
window.loadPreviousDivision();


}

window.getExportProgress = async () => {

  // Send the request
  let action = '/api/exports/'+window.data.exportData.id
  const response = await fetch(
    action,
    {
      method: 'GET'
    },
  );

  if (!response.ok) {
    console.log("Error getting export progress");
    return;
  }
  let res = await response.json();
  return res.progress;
}

window.updateExportProgress = async () => {
  let progress = await window.getExportProgress();
  if(progress == 1){
    window.location.reload();
  } else {
    if(progress < 0.05){
      progress = 0.05;
    }
  }

  let barValue = progress * 100;
  $('#exportProgressBar').attr('aria-valuenow',barValue).css('width',barValue+'%');
};



if(window.data.pageName == 'export'){

  if(window.data.exportData.progress < 1){
    let interval = 250;
    setInterval( async () =>{
      await window.updateExportProgress();
    },interval);
  }

};


    $('.tag-save-button').on('click', async (ev) => {
        let el = ev.currentTarget;
        let taskId = el.parentElement.parentElement.parentElement.parentElement.id.substring(9);
        let addNewValue = $(el.parentElement).find('input').val();
        let addTagId = $(el.parentElement).find('select').val();
console.log('addNewVal = %o | addTagId = %o', addNewValue, addTagId);
        if (!addNewValue && !addTagId) return;
        let res = null;
        if (addNewValue) {
            res = await addNewTagToTask(addNewValue, taskId);
        } else {
            res = await addTagIdToTask(addTagId, taskId);
        }
console.log('res => %o', res);
        if (res.success) {
            $('.tag-edit-div input').val('');
            $('.tag-edit-div select').val('');
            window.openEditTag($(el.parentElement.parentElement).find('i')[0]);  //closes edit div
            $(el.parentElement).before('<div data-id="' + res.id + '" class="task-tag">' + res.name + '</div>');
        } else {
            alert(res.error || 'Problem saving tag');
        }
    });


});


window.convertAnnotationsToW3c = (box) => {
  if(!box.x || !box.y || !box.w || !box.h || !box.label){
    return false;
  }
  let timeLabel = 'box-'+Date.now();
  let xyString = 'xywh=pixel:'+box.x+','+box.y+','+box.w+','+box.h;
  let converted = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: timeLabel,
    type: 'Annotation',
    body: [{
      purpose : 'tagging',
      type: 'TextualBody',
      value: box.label
    }],
    target: {
      selector: {
        type: 'FragmentSelector',
        conformsTo: 'http://www.w3.org/TR/media-frags/',
        value : xyString
      }
    }
  };
  return converted;
};

window.imagePreviewModalImageId = null;
window.imagePreviewsUpdateButtons = function() {
    let numImages = $('.imagePreviewWrapper img').length;
    let numSelected = $('.imagePreviewWrapper input:checked').length;
    if (numImages == numSelected) {
        $('#imagesPreviewSelectAll').html('De-select All');
    } else {
        $('#imagesPreviewSelectAll').html('Select All');
    }
    if (numSelected) {
        $('#imagesPreviewDelete').prop('disabled', false).html('Delete ' + numSelected + ' Image' + (numSelected == 1 ? '' : 's'));
    } else {
        $('#imagesPreviewDelete').prop('disabled', true).html('Delete Images');
    }
};

$('.imagePreviewWrapper input').on('click', function(ev) {
    ev.stopPropagation();
    imagePreviewsUpdateButtons();
});

$('.imagePreviewWrapper').on('click', function(ev) {
    ev.stopPropagation();
    let imageId = ev.currentTarget.id.substring(14);
    window.imagePreviewModalImageId = imageId;
    $('#imagePreviewModal .modal-body img').prop('src', '/uploads/' + imageId);
    $('#imagePreviewModal').modal('show');
});

$('#imagesPreviewSelectAll').on('click', function(ev) {
    let numImages = $('.imagePreviewWrapper img').length;
    let numSelected = $('.imagePreviewWrapper input:checked').length;
    if (numImages == numSelected) {
        $('.imagePreviewWrapper input').prop('checked', false);
    } else {
        $('.imagePreviewWrapper input').prop('checked', true);
    }
    imagePreviewsUpdateButtons();
});

$('#imagesPreviewDelete').on('click', async function(ev) {
    let selected = $('.imagePreviewWrapper input:checked');
    if (!selected.length) return;
    let imageIds = [];
    for (let i = 0 ; i < selected.length ; i++) {
        imageIds.push(selected[i].parentElement.id.substring(14));
    }
    const results = await imagesDelete(imageIds);
    if (!results || !results.success) {
        alert('error deleting');
        return;
    }
    imagesDeleteComplete(results);
    imagePreviewsUpdateButtons();
});

window.imagePreviewModalSelect = function() {
    if (!imagePreviewModalImageId) return;
    $('#image-preview-' + imagePreviewModalImageId + ' input').prop('checked', true);
    imagePreviewsUpdateButtons();
    $('#imagePreviewModal').modal('hide');
}

window.imagePreviewModalDelete = async function() {
    if (!imagePreviewModalImageId) return;
    const results = await imagesDelete([imagePreviewModalImageId]);
    if (!results || !results.success) {
        alert('error deleting');
        return;
    }
    imagesDeleteComplete(results);
    imagePreviewsUpdateButtons();
    $('#imagePreviewModal').modal('hide');
}

window.imagesDeleteComplete = function(results) {
    if (!results || !results.imageIds) return;
    for (const id of results.imageIds) {
        $('#image-preview-' + id).remove();
    }
}

window.imagesDelete = async (imageIds) => {
    const response = await fetch(
        '/api/images',
        {
            method: 'DELETE',
            body: JSON.stringify({ imageIds: imageIds }),
            headers: { 'Content-Type': 'application/json' }
        }
    );
    if (!response.ok) {
        alert('error!');
        console.log('response => %o', response);
        return;
    }
    return {
        success: true,
        imageIds: imageIds
    };
}


