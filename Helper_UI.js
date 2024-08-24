
/**
 * Groups rows in the given tab by ID and gets the expand button to the bottom row.
 * 
 * @param {String} tabname - The name of the tab in standard convention
 */

function groupRows_(tabName){
  
  
  const tab = getTab_(tabName)
  let [indices,,,data] = getData(tabName)
  
  let [firstRowIndices, lastRowIndices] = getFirstAndLastRowIndices_(data, indices.id_no)
  let rowAdjustment = eval(tabName + "_HEADER_INDEX") + 2 //+1 for index to row and another +1 to move from header to data

  
  for(let i=0; i<firstRowIndices.length;i++) {
    //Group and hide all rows except last row (that is where the expand sign will come)
    if(firstRowIndices[i] == lastRowIndices[i])
      continue
    const rangeVal = `${firstRowIndices[i] + rowAdjustment}:${lastRowIndices[i] - 1 + rowAdjustment}`
    console.log(rangeVal)
    let range = tab.getRange(rangeVal)
    range.shiftRowGroupDepth(1)
  }
  
  tab.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.AFTER)
  tab.collapseAllRowGroups()
  
}


function getGroupStatus_(tabname, lastIndices,firstRowIndices){
  

  let tab = getTab_(tabname)
  
  let collapseStatuses = []
  for(let i=0; i<lastIndices.length; i++){
    if(firstRowIndices[i]!=lastIndices[i]){
      collapseStatuses.push(tab.getRowGroup(lastIndices[i] + eval(tabname + "_HEADER_INDEX") + 2,1).isCollapsed())
    }else if(firstRowIndices[i]==lastIndices[i]){
      collapseStatuses.push("No row group")
    }
    
  }
  return collapseStatuses
}

function restoreGroupStatuses_(tabname, lastIndices, collapseStatuses, firstRowIndices) {
  
  let tab = getTab_(tabname)

  for(let i=0; i<lastIndices.length; i++) {
    let group
    let collapseStatus = collapseStatuses[i]
    if(firstRowIndices[i]!=lastIndices[i]){
      group = tab.getRowGroup(lastIndices[i] + eval(tabname + "_HEADER_INDEX") + 2,1)
    }
    if(!collapseStatus && collapseStatus == "No row group")
      group.expand()
  }
}

/**
 * This function returns the range of the required column (starting from the first row of data to the last) as the Range object.
 * Primarily used ot set data validation/conditional formatting rules.
 * 
 * @param {String} tabname  - Name of the tab in standard convention
 * @param {Number} colIndex - Index of the column (use the indices from getIndices or getData to extract this)
 * @returns - Range Object of SpreadsheetApp.sheet class
 */
function getColumnRange(tabname, colIndex) {
  const tab = getTab_(tabname)
  const headerRow = eval(tabname+"_HEADER_INDEX") + 1
  const firstRow = headerRow + 1
  const lastRow = tab.getLastRow()
  const numRows = lastRow - firstRow + 1
  const range = tab.getRange(firstRow,colIndex+1,numRows,1) //Gives the column range object
  
  return range
}


/**
 * Change names of tabs in any sheet
 */
function changeCaseIdSearchName() {

  for(let i=12; i<=13; i++)
    getTab_(`CASE_SEARCH_${i}_PHONE_HOME`).setName("out of hospital")
}

/**
 * This function updates the IDs that would be displayed in the specified form. The form sheet should ahve a pending ids tab which would serve as the master id. 
 * Any already submitted form ids would be removed form the the list of available IDs. If no ids are left, the form would be closed for submission
 * @param {String} formName - Name of the form in classic convention
 */
function updateFormIDs(formName) {
  
  //Get pending IDs
  let [,pendingDataById] = getData(formName + "_PENDING_IDS")
  let pendingIDs = Object.keys(pendingDataById)

  //Get any unprocessed filled IDs
  let filledIds = convertIdMotherFatherToId_(getIDs(formName + "_FORM_RESPONSES"))
  
  //Remove any already filled IDs from the pending IDS
  let unfilledIds = []
  for(let i=0; i<pendingIDs.length; i++) {
    const pendingId = pendingIDs[i]
    if (filledIds.indexOf(pendingId) == -1) {
      const pendingObj = pendingDataById[pendingId]
      const pendingIdMotherFather = `${pendingObj.id_no}:${pendingObj.mother}:${pendingObj.father}` //Convert any pending id to pending id: mother: father format
      unfilledIds.push(pendingIdMotherFather)
    }
  }

  //Change the choices in the form
  console.log("Accessing Form")
  let form = FormApp.openById(eval(formName + "_FORM"))
  console.log("Accessed Form")
  if(unfilledIds.length > 0) { //Change list of IDs if there are any open IDs
      form.setAcceptingResponses(true)
      let items = form.getItems()
  
      for(let i=0; i<items.length; i++) { //Loop over all questions to find the ID No question
      let item = items[i]
      if(item.getTitle() == "ID No") //Change possible IDs
          item.asMultipleChoiceItem().setChoiceValues(unfilledIds)
      }
      console.log("New Ids:", unfilledIds)  
  }
  else //Close form to submissions if no IDs left
      form.setAcceptingResponses(false)
}
/**
 * Changes if the specified form would accept responses (true) or stop accepting responses (false)
 * @param {String} formName - Name of the form in classic convention (see parameters file)
 * @param {Boolean} status - Can either be true (if want to accept new submissions) or false (if don't want to accept new submissions)
 */
function changeFormAcceptingResponses(formName, status) {
  let form = FormApp.openById(eval(formName + "_FORM"))
  form.setAcceptingResponses(status)
}

function convertIdMotherFatherToId_(idMotherFatherArray) {

  for(let i=0; i<idMotherFatherArray.length; i++) {
    let idMF = idMotherFatherArray[i]
    const lastIndex = idMF.indexOf(":")
    let id
    if(lastIndex == -1)
      id = idMF
    else
      id = idMF.substring(0,lastIndex)
    idMotherFatherArray[i] = id
  }

  return idMotherFatherArray
}

function sendEmail(userEmailsArray, subject, body) {
  let userEmails = userEmailsArray.join(',')
  MailApp.sendEmail({to: userEmails, 
    subject: subject, 
    htmlBody: body})
}
