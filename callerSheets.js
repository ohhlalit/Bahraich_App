
/**
 * Returns an array for the Caller Sheet SideBar. This is a universal function for all sheets and simply takes the 'type' of the caller sheet list to be returned
 * @param {String} type - Type of caller sheet list that is to be returned (this would be generally be selected by the user from ther sidebar) eg: pending, done for today etc.
 * @param {integer} reverse - If specified, the list of babies displaying in the sidebar would be in the reverse order
 * @returns Array
 */
function getCaseListForCallerSheets(type, reverse, testing) {
  if (type == "") 
    return [] //For blank selection return empty list of options and skip the code
  
  let dataArray 
  if(testing) {
    dataArray = getData("PHONE_HOME_TESTING")[2]
    appendTwinData_(dataArray)
  }
  else
    dataArray = getData("PHONE_HOME")[2]

  let [, submittedCase] = getData("MANAGER_PHONE_CALL_SUBMISSIONS")
  // filtering out the all babies caller sheet entries
  let submittedCases = {}
  for (const key in submittedCase) {
    if (submittedCase[key].caller_sheet != "CALLER_SHEET_ALL_BABIES") {
      submittedCases[key] = submittedCase[key]
    }
  }
  
  let filteredData
  console.log(dataArray.length)

  //Set filterDate to be today
  let filterDate = new Date()
  filterDate.setHours(0,0,0,0)
  filterDate = filterDate.valueOf()

  switch(type) {
    case "Pending":
    filteredData = cs_getPending(dataArray, submittedCases, filterDate)
    break
    case "Special Calls":
    filteredData = cs_getSpecialCalls(dataArray, submittedCases, filterDate)
    break
  case "Special: Done for Today":
    filteredData = cs_getSpecialDoneForfilterDate(dataArray, submittedCases, filterDate)
    break
  case "Special: Call back (Incomplete)":
    filteredData = cs_getSpecialCallBackIncomplete(dataArray, submittedCases, filterDate)
    break
  case "Special: Call back (No data yet)":
    filteredData = cs_getSpecialCallBackNoData(dataArray, submittedCases, filterDate)
    break
  case "Done for Today":
    filteredData = cs_getDoneForToday(dataArray, submittedCases, filterDate)
    break
  case "Call back: No data yet":
    filteredData = cs_getCallBackNoData(dataArray, submittedCases, filterDate)
    break
  case "Call back: Incomplete":
    filteredData = cs_getCallBackIncomplete(dataArray, submittedCases, filterDate)
    break
  case "Exit Calls":
    filteredData = cs_getExitCalls(dataArray, submittedCases, filterDate)
    break
  case "All":
    filteredData = dataArray
    break
  case "Dead Babies":
    let [,,diedInData] = getData("DIED_IN_ASMC")
    let [,,diedOutData] = getData("DIED_OUT_ASMC")
    filteredData = [...diedInData, ...diedOutData]
    break
  }
  
  console.log("Length of data:", filteredData.length)
  
  filteredData.sort((a,b) => b.twin_id - a.twin_id)
  for(let i=0; i<filteredData.length; i++) {
    filteredData[i]["listType"] = type
    if(testing) {
      let numBabies = filteredData[i].case_obj_array.length
      for(let j=0; j<numBabies; j++)
        filteredData[i].case_obj_array[j]["listType"] = type
    }
  }
    
  if(reverse)
    return filteredData.reverse()
  else
    return filteredData
}

/**
 * To be run when a case is selected in the caller sheet sidebar
 * @param {String} callerSheet - Name of Caller Sheet in standard convention
 * @param {*} selectedCase - To be passed from the sidebar
 */
function onSelectingCaseInCallerSheet(callerSheet, selectedCase) {
  let rowNums = getCallerSheetData(callerSheet, 1) // Specify second option as 1 to get row numbers only
  //Clear form while keeping the staff name intact
  clearCallerSheetForm(callerSheet,1)
  //Prefill the details of the baby
  cs_initialAutoFill_(selectedCase,callerSheet,rowNums)
}

/**
 * To be run when a form is filled ans "Save Data" is clicked in the sidebar
 * @param {String} callerSheet - Name of Caller Sheet in standard convention
 * @param {*} selectedCase - To be passed from the sidebar
 */
function saveCallerSheetData(callerSheet, selectedCase, testing) {

  //DBR
  let dbr = ""
  if(testing){
    dbr = "_TESTING"
  }
  //Check if a save is in progress; Wait 3 minutes, if it isn't complete in 3 minutes, give error
  let startTime = new Date()
  if(testing != 1) {
    while (getEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS")) {
      console.log("Entered while loop")
      let currentTime = new Date()
      if(currentTime - startTime > 1000*60*0.1) 
        throw "Another save has been running for more than 2 minutes. Please check with another caller if their save is completed. If not, check with Manager"
      else
        continue
    }

    setEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS",true)
  }

  let [indices,,,submittedData] = getData("MANAGER_PHONE_CALL_SUBMISSIONS"+dbr,)

  let data = cs_parseCallerSheetData(indices, callerSheet, selectedCase, testing)
  let validityCheck = cs_isSaveValid(data, indices)
  
  if(validityCheck.isValid) {
  
    //See where to export row; if it is already present then overwrite the existing row
    let destRow = -2
    let overwritingIncomplete = false
    for(let i=0; i<submittedData.length; i++) {
      if(String(submittedData[i][indices.id_no]) == String(data[indices.id_no]) && submittedData[i][indices.caller_sheet] != "CALLER_SHEET_ALL_BABIES") {
        destRow = MANAGER_PHONE_CALL_SUBMISSIONS_HEADER_INDEX + i + 2
        break
      }
      if(String(submittedData[i][indices.id_no]) == String(data[indices.id_no]) && submittedData[i][indices.caller_sheet] == "CALLER_SHEET_ALL_BABIES" && callerSheet == "CALLER_SHEET_ALL_BABIES") {
        if(submittedData[i][indices.result_of_call] == "Incomplete"){
          destRow = MANAGER_PHONE_CALL_SUBMISSIONS_HEADER_INDEX + i + 2 // only overwrite if it was an incomplete call for all babies caller sheet
          overwritingIncomplete = true
          break
        }else{
          destRow = -2
          break
        }
      }
    }
    if(callerSheet == "CALLER_SHEET_ALL_BABIES" && !overwritingIncomplete){
      destRow = -2
    }
    console.log(`Entering Caller Form Data in rowNum: ${destRow}`)
    insertData("MANAGER_PHONE_CALL_SUBMISSIONS"+dbr,destRow,[data],indices,1,indices,1)
    clearCallerSheetForm(callerSheet,1)
    if (testing != 1)
      setEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS",false)
  }
  else {
    if (testing !=1)
      setEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS",false)
    throw validityCheck.error
  }
  

  

  //Insert data with the overwrite option turned on; If the row is not to be replaced it would be inserted at the top and overwrite would be ignored automatically (see insertData(..))
}

function cs_parseCallerSheetData(indices, callerSheet, selectedCase, testing, callerSheetData) {
  
  if(callerSheetData == undefined)
    callerSheetData = getCallerSheetData(callerSheet)
  console.log(callerSheetData)

  //Eventually need to add Grad Babies Caller Sheet functions here also; They will have slightly different questions, so the RHS for some variables would change
  let data = []
  data[indices.id_no] = callerSheetData.case_id.toString().trim()
  data[indices.flagged] = callerSheetData.flag
  data[indices.staff] = callerSheetData.staff
  data[indices.result_of_call] = callerSheetData.call_status
  data[indices.mother_health] = callerSheetData.ma_ki_tabiyat_kaisi_hai
  data[indices.weight] = callerSheetData.weight
  data[indices.temp] = callerSheetData.tapman
  data[indices.how_is_the_baby_currently_feeding] = callerSheetData.kya_aap_bacche_ko_maa_ka_dudh_pila_rahe_hain_ya_upar_ka_dudh_ya_dono_maa_ka_aur_upar_ka
  data[indices.method_of_feeding_bm] = callerSheetData.method_of_feeding_breastmilk
  data[indices.if_bf_min_per_feed] = callerSheetData.if_bf_minutes_per_feed
  data[indices.if_bf_feeds_per_24_hr] = callerSheetData.if_bf_feeds_per_24_hr
  data[indices.ml_mother_reports_per_feed] = callerSheetData.ml_mother_reports_per_feed
  data[indices.no_of_feeds_mother_reports_per_24h] = callerSheetData.no_of_feeds_mother_reports_per_24h
  data[indices.ml_required_for_one_feed_based_on_weight] = callerSheetData.ml_required_for_one_feed_based_on_weight
  data[indices.feeding_upar_ka_dudh] = callerSheetData.feeding_upar_ka_dudh
  data[indices.fever] = callerSheetData.fever_no_yes
  data[indices.jaundice] = callerSheetData.jaundice
  data[indices.pees_less_than_4_times] = callerSheetData.pees_less_than_4_times
  data[indices.breathing_problems] = callerSheetData.breathing_problems
  data[indices.baby_care_items] = callerSheetData.pata_kar_lijiye_ki_unke_paas_kaunse_kaunse_saman_hai_aur_update_kar_lijiye_baby_care_items
  data[indices.phone_numbers] = callerSheetData.phone_number_kya_is_bacche_ke_liye_koi_aur_phone_number_hai
  data[indices.notes] = "Notes:\n" + callerSheetData.notes +"Baby Health:\n" + callerSheetData.bachcha_kaisa_hai
  data[indices.advice_given_if_any] = callerSheetData.advice
  
  //Set date
  let dt
  let dataEntryDate
  if (callerSheetData.data_entry_date != "")
    dt = new Date(callerSheetData.data_entry_date)
  else
    dt = callerSheetData.data_entry_date
  
  
  data[indices.date] = dt
  
  console.log("Computing follow up")
  let followUp = callerSheetData.date_to_follow_up
  let dateFollowUp
  if (followUp == "") {
    dateFollowUp = ""
    console.log("Empty follow up")
  }
  else if (followUp == "Death") {
    dateFollowUp = "Dead"
    console.log("No followup - Baby Died")
  }
  else if (followUp == "In Hospital") {
    dateFollowUp = "in hospital"
    console.log("No followup - Baby In Hospital")
  }
  else {
    let addDays = 0
    if (followUp == "Tomorrow") addDays = 1
    if (followUp == "Day after Tomorrow") addDays = 2
    if (followUp == "In Three Days") addDays = 3
    if (followUp == "In Five Days") addDays = 5
    if (followUp == "In One Week") addDays = 7
    if (followUp == "In One Month") addDays = 30

    if (data[indices.date] != "") {
      dateFollowUp = new Date(data[indices.date].toString())
      dateFollowUp.setDate(data[indices.date].getDate() + addDays)
      dateFollowUp.setHours(0,0,0,0)
    }
    else
      dateFollowUp = followUp //Leave it as is so that there isn't a missing follow up error when only date is missing
  }

  console.log(`Computed Follow up is ${dateFollowUp}`)
  data[indices.date_to_follow_up] = dateFollowUp
  data[indices.status] = callerSheetData.status_of_baby
  
  //static variable
  data[indices.twin_id] = selectedCase.twin_id
  data[indices.mother] = selectedCase.mother
  data[indices.father] = selectedCase.father
  let bday = new Date(selectedCase.birthday)
  bday.setHours(0,0,0,0)
  data[indices.birthday] = bday
  data[indices.female] = selectedCase.female
  data[indices.initial_weight] = selectedCase.initial_weight
  
  let ga
  let ca
  let ca_weeks
  let ca_days
  if(testing) {
    let ga_weeks = selectedCase.ga_weeks
    let ga_days = selectedCase.ga_days || 0

    const numDays = (dt.valueOf() - bday) / (1000*60*60*24)
    ca_weeks = Math.floor(numDays/7) + ga_weeks
    
    ca_days = (numDays%7) + ga_days
    if(ca_days > 7) {
      ca_weeks = ca_weeks + 1
      ca_days = ca_days - 7
    }
    data[indices.ca_weeks] = ca_weeks
    data[indices.ca_days] = Math.floor(ca_days)
  }

  else {
    ga = selectedCase.ga
    ca = ga + Math.round((dt - bday)/(1000*60*60*24*7))
    data[indices.ga] = ga
    data[indices.ca] = ca
  }

  
  if(selectedCase.listType) {
    if (selectedCase.listType.indexOf("Special")>-1) 
      data[indices.type] ="Special Call"
    else 
      data[indices.type] ="Phone"
  }
  else 
    data[indices.type] ="Phone"

  //data[indices.ga_days] =
  data[indices.caller_sheet] = callerSheet //if condition needed here to convert it into proper string.

  return data
  
}

function cs_isSaveValid(data, indices) {
  console.log(indices)
  //check if incorrect baby is selected
  const callStatus = data[indices.result_of_call]
  if (callStatus == "Incorrect Baby" | callStatus == "No update for baby" | callStatus == "Home Visit (Did Not Call)") 
    return {"isValid": 1, "error": ""} //Allow partial submission with incorrect baby

  const required_attributes = ["result_of_call", "date_to_follow_up", "status", "staff","id_no", "date","phone_number_kya_is_bacche_ke_liye_koi_aur_phone_number_hai"]
  const name_attributes = ["Call Status", "Date to Follow Up", "Baby Status", "Staff", "Case Id", "Data Entry Date"]
  
  let missing_variables = []
  
  for(let i=0; i< required_attributes.length; i++) {
    if(indices[required_attributes[i]] != undefined) {
      if (data[indices[required_attributes[i]]] == undefined || data[indices[required_attributes[i]]] == "") 
        missing_variables.push(name_attributes[i])
    }
  }

  let error_message = ""
  let valid
  if (missing_variables.length === 0) 
    valid = 1
  else { //Create custome error message
    valid = 0
    let errors = missing_variables.join(", ")
    lastComma = errors.lastIndexOf(",")
    if (lastComma > -1) errors = errors.substring(0, lastComma) + " &" + errors.substring(lastComma+1, errors.length)
    error_message = "Please fill " + errors
  }

  return {"isValid": valid, "error": error_message}
}


/**
 * Clears the form of the given caller sheet
 * 
 * @param {String} callerSheet - Name of the caller sheet in standard convention in which the froma has to be cleared
 * @param {*} keepStaff - Whether or not the Staff name has to be retained (usually when clearing upon case selection it should be retained but when sheet is opened it should be deleted)
 */
function clearCallerSheetForm(callerSheet, keepStaff, dbr) {
  

  let tab = getTab_(callerSheet+"_FORM")
  
  //The assumption this code makes is data is next to the header column.
  const headerCol = eval(callerSheet+"_FORM_HEADER_INDEX") + 1
  let rowNums 
  if(dbr)
    rowNums = cs_getCallerSheetData_(callerSheet,1)
  else
    rowNums = getCallerSheetData(callerSheet, 1)

  const minMaxValues = getMinAndMaxValuesInDict(rowNums)
  const firstRow = minMaxValues.minVal
  const lastRow = minMaxValues.maxVal
  const numRows = lastRow - firstRow + 1 
  let staff
  //If we want to keep staff read that information first
  if (keepStaff)
    staff = tab.getRange(rowNums.staff,headerCol+1,1,1).getValue()
  
  let numCols = 1
  if(dbr)
    numCols = 3
  //Clear everything in the sheet
  tab.getRange(firstRow,headerCol+1,numRows,numCols).clearContent()
  
  //Write back the staff information
  if (keepStaff) {
    if(dbr)
      tab.getRange(rowNums.staff,headerCol+1,1,3).setValues([[staff,staff,staff]])
    else
      tab.getRange(rowNums.staff,headerCol+1,1,1).setValue(staff)
  }
    

  console.log('Form Cleared')
}



function getCallerSheetData(tabName,rowNumsOnly) {
  let tab = getTab_(tabName + "_FORM") // Get the sheet using getTab_ function
  let values = tab.getDataRange().getValues()
  let headerColIndex = eval(tabName+"_FORM_HEADER_INDEX")
  let headers = []
  let data = []

  // Iterate through each row of the values array
  for (let i = 0; i < values.length; i++) {
    let row = values[i]
    // Push the second column value to the headers array
    headers.push(row[headerColIndex])
    // Push the third column value to the data array
    data.push(row[headerColIndex+1])
  }

  let sheetData = {}
  let rowNums = {}

  for (let i = 1; i < headers.length; i++) { //counter starting from 1 as first row is empty.
    let header = parseColumn_(headers[i])
    let value = data[i]
    sheetData[header] = value
    rowNums[header]= i + 1
  }
  if(rowNumsOnly) 
    return rowNums
  
  return sheetData
}


function cs_resetEditProgress() {
  resetEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS")
}


function onSelectingCaseInCallerSheet_dbr(callerSheet, selectedCase) {
  
  let rowNums = cs_getCallerSheetData_(callerSheet, 1) // Specify second option as 1 to get row numbers only
  
  if(callerSheet.includes("GRAD"))
    onlyPhoneHome = 0
  else
    onlyPhoneHome = 1
  let allData = getMergedDataForSideBar_dbr(onlyPhoneHome)
  appendTwinData_(allData)
  let filterData = allData.filter(element => element.id_no == selectedCase.id_no)
  let caseData = filterData[0]
  
  //Add list type and reason for call that is to be used later when saving
  let callingListData
  if(caseData.case_obj_array.length > 1)
    callingListData = getData("CALLING_LIST")[1]

  for(let i=0; i<caseData.case_obj_array.length; i++) {
    const id = caseData.case_obj_array[i].id_no
    caseData.case_obj_array[i]["listType"] = selectedCase.list_type

    if(callingListData == undefined)
      caseData.case_obj_array[i]["reason_for_call"] = selectedCase.reason_for_call
    else {
      if(callingListData[id]) {
        const typ = callingListData[id].list_type
        if(typ.includes("Priority") || typ.includes("OPD"))
          caseData.case_obj_array[i]["reason_for_call"] = callingListData[id].reason_for_call
        else
          caseData.case_obj_array[i]["reason_for_call"] = "Baby not in Priority or OPD List"
      }
      else
        caseData.case_obj_array[i]["reason_for_call"] = "Baby not in Calling List"
    }
  }


  selectedCase = caseData
  //Prefill the details of the baby
  cs_initialAutoFill_dbr_(selectedCase,callerSheet,rowNums)
  console.log("Auto Fill Complete")
  return selectedCase
}

function cs_initialAutoFill_dbr_(selectedCaseObj,callerSheet,rowNums) {
  
  const headerCol = eval(callerSheet+"_FORM_HEADER_INDEX") + 1
  const minMaxValues = getMinAndMaxValuesInDict(rowNums)
  const firstRow = minMaxValues.minVal
  const lastRow = minMaxValues.maxVal
  const numRows = lastRow - firstRow + 1 

  let tab = getTab_(callerSheet+"_FORM")
  let staff = tab.getRange(rowNums.staff,headerCol+1,1,1).getValue()
  
  let autoFillData = []
  for(let i=0; i<numRows; i++)
    autoFillData.push(["", "", ""])
  
  //Adjust by firstRow because we start inserting from the firstRow; So if firstRow = 3, the first element goes in index 0; (3-firstRow)
  let [indices,,,data] = getData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING")

  for(let k=0; k<selectedCaseObj.case_obj_array.length; k++) { //Iterate over all twin elements, if any
    let selectedCase = selectedCaseObj.case_obj_array[k]
  
    if(selectedCaseObj.case_obj_array.length == 1)
      autoFillData[rowNums.baby_order - firstRow][k] = "Single Baby"
    else {
      let babyOrder = ""
      if (k==0)
        babyOrder = "First Baby"
      if (k==1)
        babyOrder = "Second Baby"
      if (k==2)
        babyOrder = "Third Baby"

      autoFillData[rowNums.baby_order - firstRow][k] = babyOrder
    }

    autoFillData[rowNums.case_id - firstRow][k] = selectedCase.id_no
    autoFillData[rowNums.reason_for_call - firstRow][k] = selectedCase.reason_for_call
    autoFillData[rowNums.female - firstRow][k] = selectedCase.female
    autoFillData[rowNums.initial_weight - firstRow][k] = selectedCase.initial_weight
    autoFillData[rowNums.twin_status - firstRow][k] = selectedCase.twin_status
    autoFillData[rowNums.phone_number_kya_is_bacche_ke_liye_koi_aur_phone_number_hai - firstRow][k] = selectedCase.phone_numbers
    autoFillData[rowNums.staff - firstRow][k] = staff
    
    if (callerSheet == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_GRAD")
      autoFillData[rowNums.date_to_follow_up - firstRow][k] = "Graduated"
    else {
      autoFillData[rowNums.pata_kar_lijiye_ki_unke_paas_kaunse_kaunse_saman_hai_aur_update_kar_lijiye_baby_care_items - firstRow][k] = selectedCase.last_baby_care_items
    }

    let dt = new Date()
    autoFillData[rowNums.data_entry_date - firstRow][k] = dt //Set to today's date with time
    
    console.log("Populated Case Attributes in Form", k)
    console.log(autoFillData)
    //Data from the last filled form (if any)
    for(let i=0; i<data.length; i++){

      if(data[i][indices.id_no] == selectedCase.id_no && (data[i][indices.caller_sheet] != "CALLER_SHEET_DB_RESTRUCTURE_TESTING_ALL" || (data[i][indices.caller_sheet] == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_ALL" && data[i][indices.result_of_call] == "Incomplete"))) { 
        // to overwrite the exact row 
        autoFillData[rowNums.phone_number_kya_is_bacche_ke_liye_koi_aur_phone_number_hai - firstRow][k] = [data[i][indices.phone_numbers]]
        autoFillData[rowNums.kya_aap_bacche_ko_maa_ka_dudh_pila_rahe_hain_ya_upar_ka_dudh_ya_dono_maa_ka_aur_upar_ka - firstRow][k] = [data[i][indices.how_is_the_baby_currently_feeding]]
        autoFillData[rowNums.weight - firstRow][k] = [data[i][indices.weight]]
        autoFillData[rowNums.tapman - firstRow][k] = [data[i][indices.temp]]
        autoFillData[rowNums.fever_no_yes - firstRow][k] = [data[i][indices.fever]]

        autoFillData[rowNums.breathing_problems - firstRow][k] = [data[i][indices.breathing_problems]]
        autoFillData[rowNums.ma_ki_tabiyat_kaisi_hai - firstRow][k] = [data[i][indices.mother_health]]
        
        let combined_notes = data[i][indices.notes]
        let baby_index = combined_notes.indexOf("Baby Health:")
        let baby_health = combined_notes.substring(baby_index+13, combined_notes.length)
        autoFillData[rowNums.bachcha_kaisa_hai - firstRow][k] = [baby_health]
        let notes = combined_notes.substring(7,baby_index)
        autoFillData[rowNums.notes - firstRow][k] = [notes]
        autoFillData[rowNums.advice - firstRow][k] = [data[i][indices.advice_given_if_any]]

        autoFillData[rowNums.date_to_follow_up - firstRow][k] = [cs_getDateToFollowUp_(data[i], indices)]
        autoFillData[rowNums.call_status - firstRow][k] = [data[i][indices.result_of_call]]
        autoFillData[rowNums.status_of_baby - firstRow][k] = [data[i][indices.status]]

        if(callerSheet != "CALLER_SHEET_DB_RESTRUCTURE_TESTING_GRAD") {
          autoFillData[rowNums.pata_kar_lijiye_ki_unke_paas_kaunse_kaunse_saman_hai_aur_update_kar_lijiye_baby_care_items - firstRow][k] = [data[i][indices.baby_care_items]]
          autoFillData[rowNums.method_of_feeding_breastmilk - firstRow][k] = [data[i][indices.method_of_feeding_bm]]
          autoFillData[rowNums.if_bf_minutes_per_feed - firstRow][k] = [data[i][indices.if_bf_min_per_feed]]
          autoFillData[rowNums.if_bf_feeds_per_24_hr - firstRow][k] = [data[i][indices.if_bf_feeds_per_24_hr]]
          autoFillData[rowNums.ml_mother_reports_per_feed - firstRow][k] = [data[i][indices.ml_mother_reports_per_feed]]
          autoFillData[rowNums.no_of_feeds_mother_reports_per_24h - firstRow][k] = [data[i][indices.no_of_feeds_mother_reports_per_24h]]
          autoFillData[rowNums.ml_required_for_one_feed_based_on_weight - firstRow][k] = [data[i][indices.ml_required_for_one_feed_based_on_weight]]
          autoFillData[rowNums.feeding_upar_ka_dudh - firstRow][k] = [data[i][indices.feeding_upar_ka_dudh]]
          autoFillData[rowNums.jaundice - firstRow][k] = [data[i][indices.jaundice]]
          autoFillData[rowNums.pees_less_than_4_times - firstRow][k] = [data[i][indices.pees_less_than_4_times]]
        }

      }
    }
  }


  tab.getRange(firstRow,headerCol+1,numRows,3).setValues(autoFillData)
  console.log("Populated Data from last filled form")

  //Fill the Case History of the Baby
  cs_fillCaseHistory_(selectedCaseObj, callerSheet)
}

function cs_fillCaseHistory_(selectedCaseObj, callerSheet) {
  
  let destIndices = getIndices(callerSheet +"_CASE_HISTORY")
  
  //Get a Blank Row
  let blankRow = []
  let firstLastCol = getMinAndMaxValuesInDict(destIndices)
  blankRow[firstLastCol.maxVal] = ""
  
  //Get a mother-father name row
  

  let orderKey = [{column:destIndices.date,ascending:true,blanksAtBottom:true},
                  {column:destIndices.type_of_form,ascending:'custom',blanksAtBottom:true, sortArray:["intake","reintake","casesheet","exit"]}]  

  let allData = [] //Stores Data to be printed in Case History
  
  for(let i=0; i<selectedCaseObj.case_obj_array.length; i++) {
    
    if(i > 0)
      allData.push(blankRow)

    let selectedCase = selectedCaseObj.case_obj_array[i]
    let motherNameRow = [...blankRow]
    motherNameRow[firstLastCol.minVal] = `${selectedCase.mother} - ${selectedCase.father}`
    allData.push(motherNameRow)
    
    let inHospHistory = selectedCase.in_hospital_case_history
    let inHospIndices = selectedCase.in_hospital_indices

    inHospIndices["mothers_health__goals_and_medicines"] = inHospIndices.goals_and_medicines
    delete inHospIndices["goals_and_medicines"]

    inHospHistory = reArrangeData_(inHospHistory,inHospIndices,destIndices)
    
    let phHistory = selectedCase.ph_case_history || selectedCase.archive_case_history
    let phIndices = selectedCase.ph_indices || selectedCase.archive_indices
    
    phIndices["type_of_form"] = phIndices.type
    delete phIndices["type"]
    phIndices["how_is_the_baby_feeding"] = phIndices.how_is_the_baby_currently_feeding
    delete phIndices["how_is_the_baby_currently_feeding"]
    phIndices["mothers_health__goals_and_medicines"] = phIndices.mother_health
    delete phIndices["mother_health"]

    phHistory = reArrangeData_(phHistory,phIndices,destIndices)

    let data = [...inHospHistory, ...phHistory]
    data = sortData(fixDisplayFormat_(data,destIndices),orderKey)
    data = deduplicateCasehistory_(data,destIndices)
    allData = [...allData, ...data]
  }
  groupCallerHistory_(callerSheet +"_CASE_HISTORY", allData, destIndices)

}

function deduplicateCasehistory_(data,destIndices) {

  let deDuplicatedData = []
  deDuplicatedData.push(data[0])
  for(let i=1; i<data.length; i++) {

    const typ = data[i][destIndices.type_of_form]
    const prevTyp = data[i-1][destIndices.type_of_form]

    const notes = data[i][destIndices.notes]
    const prevNotes = data[i-1][destIndices.notes]

    if(typ.includes("xit") && prevTyp.includes("xit") && notes == prevNotes)
      continue
    else
      deDuplicatedData.push(data[i])

  }

  return deDuplicatedData
}
function groupCallerHistory_(tabName,data, destIndices) {

  let tab = getTab_(tabName)

  let separatorTypes = ["intake", "exit", "reintake", undefined] //undefined is for the blank row that we insert to separate twin babies
  let separatorColors = {"intake"  : ['darkBlue', 'lightBlue'],
                         "exit"    : ['darkYellow', 'lightYellow'],
                        "reintake" : ['darkBlue', 'lightBlue'],
                        "blank"    : ['white', 'white']}

  let separatorIndices = []
  let colors = []  //Stores colors for all the cells of Case History (excluding title)
   //Stores indices of the rows that need to be bold
  
  let blankRow = []
  blankRow[data[0].length - 1] = ""

  
  //nameRows.push(allData.length - 1)
  let typeIndex = destIndices.type_of_form
  let sepTyp = []

  const rowAdjustment = eval(tabName + "_HEADER_INDEX") + 2
  let boldRows = []
  

  for(let i=0; i<data.length; i++) {
    const typ = data[i][typeIndex]
    
    if(typ == undefined | typ == "")
      boldRows.push(i+rowAdjustment)
    else if(typ.includes("home"))
      boldRows.push(i+rowAdjustment)

    if(typ == "exit" | typ == "reintake") { //Insert blank row above exit or reintake rows
      data = [...data.slice(0,i), ...[blankRow], ...data.slice(i)] 
      separatorIndices.push(i) //ith row now is a blank row, which is a separator
      sepTyp.push("blank")
      i = i+1
    }

    if(separatorTypes.indexOf(typ) > -1) {
      separatorIndices.push(i)
      if(typ == undefined)
        sepTyp.push("blank")
      else
        sepTyp.push(typ)
    }

    
  }

  updateDataRows(tabName, data, destIndices)
  console.log("Populated Case History")
  
  //Bold Rows
  changeFontType_(boldRows, "bold", tab, data[0].length)

  let groupsExist = 0
  console.log(separatorIndices)
  if(separatorIndices[separatorIndices.length-1] != data.length -1)
    separatorIndices.push(data.length)
  console.log(separatorIndices)
  
  console.log(sepTyp)
  for(let i=0; i<separatorIndices.length-1; i++) {
    console.log(`Separator type: ${sepTyp[i]} at value i: ${i}`)
    colors = [...colors, ...getColorRows_(separatorColors[sepTyp[i]][0],data[0].length,1)]
    
    if(separatorIndices[i+1] > separatorIndices[i] + 1) {
      colors = [...colors, ...getColorRows_(separatorColors[sepTyp[i]][1],data[0].length,separatorIndices[i+1]-separatorIndices[i] - 1)]
      console.log(`At indices: ${separatorIndices[i]}, the length of colors is ${colors.length}`)
    }
    
    const startRow = separatorIndices[i] + rowAdjustment + 1
    const endRow = separatorIndices[i+1] + rowAdjustment - 1
    if(endRow < startRow)
      continue
    const rangeVal = `${startRow}:${endRow}`
    console.log(rangeVal)
    let range = tab.getRange(rangeVal)
    range.shiftRowGroupDepth(1)
    groupsExist = 1
  }
  
  if(colors.length < data.length) { //When there is a single row in the last group
    i = separatorIndices.length-1
    colors = [...colors, ...getColorRows_(separatorColors[sepTyp[i]][0],data[0].length,1)]
  }

  tab.getRange(rowAdjustment,1,data.length, data[0].length).setBackgrounds(colors)
  if(groupsExist) {
    tab.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE)
    tab.collapseAllRowGroups()
    console.log("Collapsed All Groups")
  }
}

function saveCallerSheetData_dbr(callerSheet, selectedCaseObj) {
  
  
  //Check if a save is in progress; Wait 3 minutes, if it isn't complete in 3 minutes, give error
  
  let startTime = new Date()
  while (getEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING")) {
    console.log("Entered while loop")
    let waitTime = 2 //Wait time in minutes
    let currentTime = new Date()

    if(currentTime - startTime > 1000*60*waitTime) 
      throw `Another save has been running for more than ${waitTime} minutes. Please check with another caller if their save is completed. If not, check with Manager`
    else
      continue
  }
  setEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING",true)


  let [indices,,,submittedData] = getData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING")

  let callerSheetData = cs_getCallerSheetData_(callerSheet)
  let numCols = selectedCaseObj.case_obj_array.length

  //Check validity of the different columns; only columns with a valid id must be filled
  let emptyCol = cs_isColEmpty_(numCols, callerSheetData)
  if(emptyCol.isValid) {

    //Save them one by one using the existing save data function
    let callResults = {}
    for(let k=1; k<=numCols; k++) {
      let data = cs_parseCallerSheetData(indices, callerSheet, selectedCaseObj.case_obj_array[k-1], 1, callerSheetData[k])
      let validityCheck = cs_isSaveValid(data, indices)
      
      if(validityCheck.isValid) {
      
        //See where to export row; if it is already present then overwrite the existing row
        let destRow = -2
        let overwritingIncomplete = false
        for(let i=0; i<submittedData.length; i++) {
          if(String(submittedData[i][indices.id_no]) == String(data[indices.id_no]) && submittedData[i][indices.caller_sheet] != "CALLER_SHEET_DB_RESTRUCTURE_TESTING_ALL") {
            destRow = MANAGER_PHONE_CALL_SUBMISSIONS_TESTING_HEADER_INDEX + i + 2
            break
          }
          if(String(submittedData[i][indices.id_no]) == String(data[indices.id_no]) && submittedData[i][indices.caller_sheet] == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_ALL" && callerSheet == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_ALL") {
            if(submittedData[i][indices.result_of_call] == "Incomplete"){
              destRow = MANAGER_PHONE_CALL_SUBMISSIONS_HEADER_INDEX + i + 2 // only overwrite if it was an incomplete call for all babies caller sheet
              overwritingIncomplete = true
              break
            }
            else{
              destRow = -2
              break
            }
          }
        }

        if(callerSheet == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_ALL" && !overwritingIncomplete){
          destRow = -2
        }

        console.log(`Entering Caller Form Data in rowNum: ${destRow}`)
        insertData("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING",destRow,[data],indices,1,indices,1)

        
        callResults[data[indices.id_no]] = data[indices.result_of_call]
        
      }
      else {
        setEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING",false)
        throw validityCheck.error
      }
    }
    cs_saveUpdatedGroup_(callResults)
    setEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING",false)
    clearCallerSheetForm(callerSheet,1,1)
  }
  
  else {
    setEditInProgress("MANAGER_PHONE_CALL_SUBMISSIONS_TESTING",false)
    throw emptyCol.error
  }
}

function cs_saveUpdatedGroup_(callResults) {
  
  let [indices,,,callList] = getData("CALLING_LIST")
  for(let i=0; i<callList.length; i++) {
    const id = String(callList[i][indices.id_no])
    if(Object.keys(callResults).indexOf(id) > -1)
      callList[i][indices.group] = cs_getUpdatedGroup_(callResults[id], callList[i][indices.group])
  }
  updateDataRows("CALLING_LIST",callList,indices)
}

function cs_getUpdatedGroup_(callResult, currentGroup) {
  let resultGroupMapping = {'Call back (No Data)' : ["No Answer", "Not Connecting", "No Incoming", "Switched Off","Exit Call: No Answer", "Exit Call: Not Connecting", "Exit Call: No Incoming", "Exit Call: Switched Off"],
                            'Call back (Incomplete)' : ["Incomplete", "Exit Call: Incomplete"],
                            'Done for Today': ["Complete", "Exit Call: Complete"],
                            'Home Visit (Did Not Call)': ["Home Visit (Did Not Call)"],
                            'Notes only - no call': ["notes only - no call"]}
  
  for(const [group, results] of Object.entries(resultGroupMapping)) {
    if(results.indexOf(callResult) > -1) {
      currentGroup = group
      break
    }
  }
  return currentGroup
}

function cs_getCallerSheetData_(callerSheet,rowNumsOnly) {
  let tab = getTab_(callerSheet + "_FORM") // Get the sheet using getTab_ function
  let values = tab.getDataRange().getValues()
  let headerColIndex = eval(callerSheet + "_FORM_HEADER_INDEX")
  
  let data = {1: {}, 2: {}, 3: {}}
  let rowNums = {}
  // Iterate through each row of the values array
  for (let i = 1; i < values.length; i++) { //counter starting from 1 as first row is empty.
    let row = values[i]
    let header = parseColumn_(row[headerColIndex]) // Extract the header
    rowNums[header]= i + 1
    // Add the corresponding values from the next three subsequent columns
    for(let j=1; j<=3; j++)
      data[j][header] = row[headerColIndex+j]
  }

  if(rowNumsOnly) 
    return rowNums
  console.log(data)
  return data
}


function cs_isColEmpty_(numCols, data) {
  
  let res = {'isValid' : 1, 'error' : ""}

  for(let i=numCols+1; i<=3; i++) { //If there is a single baby; columns 2 and 3 must be empty; if there are 2, then 3rd must be empty
    let colData = data[i]
    for(const [key,value] of Object.entries(colData))
      if(String(value).trim() != "" && value != undefined) {
        res.error = res.error + ` '${value}' for '${key}' in Column: ${i}`
        res.isValid = 0
      }
  }
  if(res.error.length > 0)
    res.error = "Found data:" + res.error + ". Please only enter data in columns with a valid ID only."
  return res
}

function generateCallingList(noUpdate) {
  
  //Set filterDate to be today
  let filterDate = new Date()
  filterDate.setHours(23,59,59,0)
  filterDate = filterDate.valueOf()

  let dataArray = getData("PHONE_HOME_TESTING")[2]
  let basicInfo = getData("STATIC")[1]

  let allCalls = []
  let indices = getIndices("CALLING_LIST")
  
  let addedIDs = []

  //Add Priority Calls
  let priorityCalls = getData("PRIORITY_CALLS_ACTIVE_DBR")[2]
  
  let numPriority = cs_addDataToList_(allCalls,indices,addedIDs,priorityCalls,"Priority Calls")
  console.log("No. of Priority calls added:", numPriority)
  
  //Add OPD Visits
  let OPDCalls = getData("OPD_VISITS_ACTIVE_DBR")[2]
  let numOPD = cs_addDataToList_(allCalls,indices,addedIDs,OPDCalls,"OPD Calls")
  console.log("No. of OPD calls added:", numOPD)

  //Add Pending Calls
  let pendingCalls = dataArray.filter(element =>
    (addedIDs.indexOf(String(element.id_no)) == -1 &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up != "" &&
    (!element.type.includes('Special Call') || element.type.includes('=> Phone')) &&
    (!element.type.includes('xit') || element.type.includes('Call')) && (!element.type.includes("reIntake"))))
  
  let numPending = cs_addDataToList_(allCalls,indices,addedIDs,pendingCalls,"Pending Calls")
  console.log("No. of Pending calls added:", numPending)

  //Add Exit Calls
  let exitCalls = dataArray.filter(element =>
    (addedIDs.indexOf(String(element.id_no)) == -1 &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up != "" &&
    (!element.type.includes('Special Call') || element.type.includes('=> Phone')) &&
    element.type.includes('xit') && !element.type.includes('Call')))
  
  console.log("No. of Exit calls found:", exitCalls.length)
  console.log("Exit Calls", exitCalls)
  let numExit = cs_addDataToList_(allCalls,indices,addedIDs,exitCalls,"Exit Calls")
  console.log("No. of Exit calls added:", numExit)

  //Add Special Calls
  let specialCalls = dataArray.filter(element =>
    (addedIDs.indexOf(String(element.id_no)) == -1 &&
    element.date_to_follow_up <= filterDate && element.date_to_follow_up != "" &&
    element.type.includes('Special Call') && !element.type.includes('=> Phone') &&
    (!element.type.includes('xit') || element.type.includes('Call')) && !element.type.includes("reIntake")))
  
  let numSpecial = cs_addDataToList_(allCalls,indices,addedIDs,specialCalls,"Special Calls")
  console.log("No. of Special calls added:", numSpecial)

  //Not on Any List
  let notOnListCalls = dataArray.filter(element => addedIDs.indexOf(String(element.id_no)) == -1)
  let notOnList = cs_addDataToList_(allCalls,indices,addedIDs,notOnListCalls,"Not on List")
  console.log("No. of Not on List calls added:", notOnList)

  //Add other attributes
  let customAttrs = ["list_type","group","days_overdue", "reason_for_call"]
  for(let i=0; i<allCalls.length; i++) {
    let caseData = basicInfo[String(allCalls[i][indices.id_no])]
    if(caseData == undefined) {
      console.warn(`Couldn't find data for ${String(allCalls[i][indices.id_no])}`)
      // console.log(i)
      // console.log(allCalls[i])
      // console.log(indices)
    }
    for(const [attr,pos] of Object.entries(indices)) {
      if(customAttrs.indexOf(attr) == -1 )
        allCalls[i][pos] = caseData[attr] || ""
    }

    allCalls[i][indices.group] = "Yet to Call"
    
    let caData = computeCA_(allCalls[i][indices.ga_days],allCalls[i][indices.ga_weeks],allCalls[i][indices.birthday])
    allCalls[i][indices.ca_weeks] = caData.caWeeks 
    allCalls[i][indices.ca_days] = caData.caDays

  }

  //Sort Data to prioritize calls
  let orderKey = [{column: indices.list_type, ascending: 'custom', blanksAtBottom: false,sortArray:["Priority Calls","OPD Calls","Pending Calls","Special Calls","Exit Calls", "Not on List"]},
                  {column: indices.days_overdue, ascending: false, blanksAtBottom: false},
                  {column: indices.initial_weight, ascending: true, blanksAtBottom: true}]
  allCalls = sortData(allCalls,orderKey)
  
  //Split Groups
  cs_splitCalls_(allCalls,indices, {'Priority Calls': {numGroups:2, numElements: numPriority}, 'Pending Calls': {numGroups:3, numElements: numPending}})
  
  fixDisplayFormat_(allCalls,indices)
  if(noUpdate)
    return allCalls
  else
    updateDataRows("CALLING_LIST",allCalls,indices,1)
}

    function cs_addDataToList_(allCalls,indices, addedIDs, callsData, listType) {
      
      let filterDate = new Date()
      filterDate.setHours(23,59,59,0)
      filterDate = filterDate.valueOf()

      let numCallsAdded = 0
      for(const callData of callsData) {
        const daysOverdue = (filterDate - callData.date_to_follow_up)/(1000*60*60*24) || ""
        if(daysOverdue < 0)
          continue
        const id = String(callData.id_no)
        addedIDs.push(id)
        
        let row = []
        row[indices.id_no] = id
        row[indices.days_overdue] = daysOverdue
        row[indices.list_type] = listType
        

        let reasonForCall = ""
        if(listType == "Priority Calls")
          reasonForCall = callData.reason_for_priority_call
        if(listType == "OPD Calls")
          reasonForCall = callData.reason_for_opd_visit
        
        row[indices.reason_for_call] = reasonForCall
        allCalls.push(row)

        numCallsAdded = numCallsAdded + 1
      }

      return numCallsAdded
    }

  function cs_splitCalls_(allCalls, indices, splitDict) {
    
    for(const listType of Object.keys(splitDict)) {
      
      splitDict[listType]['currentCount'] = 0
      splitDict[listType]['lowerLimit'] = []
      splitDict[listType]['upperLimit'] = []

      const numGroups = splitDict[listType].numGroups
      const numElements = splitDict[listType].numElements
      
      for(let j=1; j<=numGroups; j++) {
        splitDict[listType].lowerLimit.push((j-1) * (numElements / numGroups))
        splitDict[listType].upperLimit.push((j) * (numElements / numGroups))
      }
    }
    console.log(splitDict)
    for(let call of allCalls) {
      const listType = call[indices.list_type]
      if(splitDict[listType] != undefined) {
        
        for(let j=1; j<=splitDict[listType].numGroups; j++) {
          if(splitDict[listType].lowerLimit[j-1] <= splitDict[listType].currentCount & splitDict[listType].currentCount < splitDict[listType].upperLimit[j-1])
            call[indices.list_type] =   `${call[indices.list_type]} ${j}`
        }
        splitDict[listType].currentCount = splitDict[listType].currentCount + 1
      }
    }

  }


function getCallingList_dbr(type, list, callerSheet) {
  
  let resultList = []
  
  if(type == "" | list == "")
    return []
  
  if (list == "All") {
    let cases = getData("STATIC")[2]
    cases = cases.filter(element => element.current_status.includes("phone/home"))
    return cases
  }

  if (list == "Graduated") {
    let cases = getData("STATIC")[2]
    cases = cases.filter(element => element.current_status.includes("Grad"))
    console.log("Total number of cases:", cases.length)
    return cases
  }
  
  let [indices,,callList,rawData] = getData("CALLING_LIST")

  
  //Sort the list in the order of the sheet
  for(let i=0; i<rawData.length; i++) {
    const id = String(rawData[i][indices.id_no])
    for(let j=0; j<callList.length; j++) {
      if(String(callList[j].id_no) == id) {
        resultList.push(callList[j])
        break
      }
    }
  }
  console.log("Compiled result list:", resultList.length)
  
  if(list == "Done for Today" || list == "Home Visit (Did Not Call)" || list == "Notes only - no call") //For done for today, make sure regular caller sheets don't get special calls/not on list data
    if(callerSheet == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_1" | callerSheet == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_2" | callerSheet == "CALLER_SHEET_DB_RESTRUCTURE_TESTING_3") 
      resultList = resultList.filter(element => element.list_type != "Special Calls" &&  element.list_type != "Not on List" && element.group == list)
    else
      resultList = resultList.filter(element => element.group == list)
  else if (list == "All Babies")
    resultList = resultList // Pass back all babies
  else
    resultList = resultList.filter(element => element.group == type && element.list_type == list)
    
  return resultList
}


function changeFontType_(rows,typ, tab, numCols) {

  let rowClusters = getRowClusters(rows)
  let startingRows = rowClusters.startingRows
  let numberOfRows = rowClusters.numberOfRows
  
  for(let i=0; i<startingRows.length; i++)
    tab.getRange(startingRows[i],1,numberOfRows[i],numCols).setFontWeight(typ)
}

function cs_getDateToFollowUp_(row, indices) {

  let entryDate = row[indices.date]
  entryDate.setHours(0,0,0,0)

  let dtFollowUp = row[indices.date_to_follow_up]
  let followUpResponse
  
  if (dtFollowUp == "")
    followUpResponse = ""
  else if (dtFollowUp == "Dead")
    followUpResponse = "Death"
  else if (dtFollowUp == "in hospital")
    followUpResponse = "In Hospital"

  else if (entryDate != "") {
    let addedDays = (dtFollowUp.valueOf() - entryDate.valueOf())/(1000*60*60*24)
    
    if (addedDays == 1)
      followUpResponse = "Tomorrow"
    if (addedDays == 2)
      followUpResponse = "Day after Tomorrow"
    if (addedDays == 3)
      followUpResponse = "In Three Days"
    if (addedDays == 5)
      followUpResponse = "In Five Days"
    if (addedDays == 7)
      followUpResponse = "In One Week" 
  }

  else
    followUpResponse = dtFollowUp

  return followUpResponse

}

function refreshCallingList() {

  let updatedCalls = generateCallingList(1)
  let [indices,currentCalls] = getData("CALLING_LIST")
  let additionalExitCalls = []
  for(let i=0; i<updatedCalls.length; i++) {
    const id = updatedCalls[i][indices.id_no]
    if(currentCalls[id] == undefined && updatedCalls[i][indices.list_type] == "Exit Calls")
      additionalExitCalls.push(updatedCalls[i])
  }

  if(additionalExitCalls)
    insertData("CALLING_LIST",-1,additionalExitCalls,indices)

}