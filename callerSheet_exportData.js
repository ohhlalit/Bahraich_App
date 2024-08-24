function callerSheet_exportData_dbr() {
  console.log("Exporting Caller Sheet Data")

  let [indices,dataById,,data] = getData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING")  
  if(Object.keys(dataById).length==0) {
    console.log("Empty Sheet. Nothing to Export")
    return
  }

  let spaceInId = checkSpacesIn2DArray(data,indices.id_no)
  if(spaceInId){
    trimColumn(MANAGER_PHONE_CALL_TESTING_SHEET,MANAGER_PHONE_CALL_SUBMISSIONS_TESTING_TAB,indices.id_no + 1)
  }
  
  //Sync phone numbers with the basic information sheet
  cs_exportToPhoneNumbers_(dataById)

  //Move Home Visit/Incorrect Baby Calls to UnApproved
  let hvIDs = filterByColumnValue(dataById,indices.result_of_call,"Home Visit (Did Not Call)")[0]
  let incorrectBabyIDs = filterByColumnValue(dataById,indices.result_of_call,"Incorrect Baby")[0]
  let unapprovedIDs = [...hvIDs, ...incorrectBabyIDs]
  if (unapprovedIDs.length > 0)
    moveData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING","MANAGER_PHONE_CALL_UNAPP_SUBMISSIONS_TESTING",unapprovedIDs,-1)
  else
    console.log(`No unapproved ids found. Proceeding to export data for ${Object.keys(dataById).length} Ids`)
  callerSheet_moveData_dbr() //Move Approved data to remaining tabs
}

function callerSheet_moveData_dbr() {
      
  let ids = getIDs("PHONE_HOME_TESTING")
  cs_exportToBabyCareItems_()
  moveData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING","PHONE_HOME_TESTING",ids,-1,1,1) //DBR Export to phone/home
  
  let [subIndices,subCasesbyID,,subData] = getData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING")
  if(subData.length > 0) { //If there is data left for archived IDs
    let [archiveIndices, archiveData] = getData("PHONE_HOME_ARCHIVE_TESTING")
    for(let i=0; i<subData.length; i++) {
      subIndices['reason_to_archive'] = subData[0].length
      subIndices['processed_timestamp'] = subData[0].length + 1
      let id = String(subData[i][subIndices.id_no])
      if(id != "" & archiveData[id] == undefined)
        throw `Cannot find ${id} in database. Please check`
      subData[i].push(archiveData[id].case_history[0][archiveIndices.reason_to_archive]) // archiveData.reason_to_archive
      subData[i].push(archiveData[id].case_history[0][archiveIndices.processed_timestamp]) // archiveData.processed_timestamp
    }
    
    let deidAfterGrad = filterByColumnValue(subCasesbyID,subIndices["status"],"Dead")[0]
    if(deidAfterGrad.length > 0){
      let [staticIndex,staticDataById,] = getData("STATIC")
      let alreadyDied = filterByColumnValue(staticDataById,staticIndex["current_status"],"Died",0,1)[0]
      deidAfterGrad = deidAfterGrad.filter(id => !alreadyDied.includes(id))
      updateLastRowColumnsById_("STATIC",deidAfterGrad,["current_status"],["died after graduation"])
    }
    archiveIndices = getIndices("PHONE_HOME_ARCHIVE_TESTING")
    insertData("PHONE_HOME_ARCHIVE_TESTING",-1,subData,subIndices,1,archiveIndices)
    clearData_("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING")
  }
}

function callerSheet_exportData() {
    console.log("Exporting Caller Sheet Data")
    let [indices,dataById,,] = getData("MANAGER_PHONE_CALL_SUBMISSIONS")
    if(Object.keys(dataById).length==0) {
      console.log("Empty Sheet. Nothing to Export")
      return
    }
    //Move Home Visit/Incorrect Baby Calls to UnApproved
    let [hvIDs,] = filterByColumnValue(dataById,indices.result_of_call,"Home Visit (Did Not Call)")
    let [incorrectBabyIDs,] = filterByColumnValue(dataById,indices.result_of_call,"Incorrect Baby")
    let unapprovedIDs = [...hvIDs, ...incorrectBabyIDs]
    if (unapprovedIDs.length > 0)
      moveData("MANAGER_PHONE_CALL_SUBMISSIONS","MANAGER_PHONE_CALL_UNAPP_SUBMISSIONS",unapprovedIDs,-1)
  
      callerSheet_moveData() //Move Approved data to remaining tabs
  }
    
  /**Exports the data to different tabs
   * 
  */
function callerSheet_moveData(dbr) {
    
    //Set order in which to export
    
    let orderedSheets = ["PHONE_HOME","GRADUATE","DIED_OUT_ASMC","UNREACHABLE","REFUSAL","DO_NOT_FOLLOW","DO_NOT_FOLLOW_MEET_CRITERIA"]
    for(let i=0; i<orderedSheets.length; i++) {
      if (getIDs("MANAGER_PHONE_CALL_SUBMISSIONS").length == 0) //Only run through the different sheets if there is something to export; Break from loop as soon as sheet is empty
        break 
      let dest = orderedSheets[i] 
      let ids = getIDs(dest)
      
      moveData("MANAGER_PHONE_CALL_SUBMISSIONS",dest,ids,-1,1,1) //Export whichever ids match with the destination
    }
  }


function cs_exportToBabyCareItems_() {

  let [indices,,,callData] = getData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING")
  let bcItemsData = getData("BABYCARE_ITEMS")[1]
  
  let bcRows = []
  for (let i = 0; i<callData.length; i++) {
    let id = String(callData[i][indices.id_no])
    if(bcItemsData[id] != undefined) {
      if(bcItemsData[id].baby_care_items == callData[i][indices.baby_care_items])
        continue
    }
    bcRows.push(callData[i])
  }
  insertData("BABYCARE_ITEMS",-1,bcRows,indices,1)
}

function cs_exportToPhoneNumbers_(dataById) {
  let [indices,,,staticData] = getData("STATIC")
  
  for (let i = 0; i<staticData.length; i++) {
    let id = String(staticData[i][indices.id_no])
    if(dataById[id] != undefined)
      staticData[i][indices.phone_numbers] = dataById[id].phone_numbers || staticData[i][indices.phone_numbers]
  }
  updateDataRows("STATIC",staticData,indices)
}

function trimColumn(spreadsheetId, sheetName, columnNumber) {
  // Open the spreadsheet by ID
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  // Get the sheet by name
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log("Sheet with name '" + sheetName + "' not found.");
    return;
  }
  
  // Get the range of the specified column
  var columnLetter = String.fromCharCode(64 + columnNumber);
  var columnRange = sheet.getRange(columnLetter + ":" + columnLetter);
  var values = columnRange.getValues();

  // Loop through each cell in the column and trim the value
  for (var i = 0; i < values.length; i++) {
    values[i][0] = values[i][0].toString().trim()
  }

  // Set the trimmed values back to the column
  columnRange.setValues(values);
}

function checkSpacesIn2DArray(array, columnNumber) {
  // Loop through each row in the 2D array
  for (var i = 0; i < array.length; i++) {
    var cellValue = array[i][columnNumber].toString();
    if (cellValue.startsWith(" ") || cellValue.endsWith(" ")) {
      return true
    }
  }
  return false
}
