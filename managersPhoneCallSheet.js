function managersSheet_updateCallType(ids, type, dbr) {

  let suff = ""
  if(dbr)
    suff = "_TESTING"

  let [phIndices,phCases,,phRawData] = getData("PHONE_HOME"+suff)
  let [callerSheetIndices,callerSheetCases,,callerSheetRawData] = getData("MANAGER_PHONE_CALL_SUBMISSIONS"+suff)

  let phOrderedIds = getOrderedIds_(phRawData,phIndices.id_no)
  let callerSheetOrderedIds = getOrderedIds_(callerSheetRawData,callerSheetIndices.id_no)

  for(let i=0; i< ids.length; i++) {
    id = String(ids[i])
    let phData = phCases[id]
    let callerSheetData = callerSheetCases[id]
    
    if(phData == undefined && callerSheetData == undefined)
      throw `Cannot find ${id} in either phone/home or in the Managers Phone Call Sheet. Please Check.`
    else if (callerSheetData != undefined) {
      if(phData != undefined) {
        if(phData.date > callerSheetData.date) {
          console.log(`Updating ${id} call type in phone/home to ${type}`)
          phData = ms_changeCallType_(phData,type,phIndices)
        }
        else {
          console.log(`Updating ${id} call type in phone/home to ${type}`)
          callerSheetData = ms_changeCallType_(callerSheetData,type,callerSheetIndices)
        }
      }
    }
    else {
      console.log(`Updating ${id} call type in phone/home to ${type}`)
      phData = ms_changeCallType_(phData,type,phIndices)
    }
    
    if(phData != undefined)
      phCases[id] = phData
    if(callerSheetData != undefined)
      callerSheetCases[id] = callerSheetData
  }
  
  updateDataRowWithCasesById("PHONE_HOME"+suff,phCases,phIndices,1,phOrderedIds)
  updateDataRowWithCasesById("MANAGER_PHONE_CALL_SUBMISSIONS"+suff,callerSheetCases,callerSheetIndices,1,callerSheetOrderedIds)

  //Inefficient updating of current status
  addCurrentStatusToStatic()

}


function ms_changeCallType_(caseData,type, indices) {
  
  let currType = caseData.type
  let newType
  const index = currType.indexOf("=>")
  if (index > -1) 
    newType = currType.substring(0,index+2) + type 
  else 
    newType = currType + " => " + type
  
  caseData.type = newType
  caseData.case_history[caseData.case_history.length-1][indices.type] = newType

  return caseData
}

function moveBabies_dbr(ids,reason, action, user) {
  
  console.log(`Moving IDS: ${ids} to ${reason} because of action ${action} initiated by ${user}`)
  let activePh = "PHONE_HOME_TESTING"
  let activeInHosp = "IN_HOSPITAL_TESTING"
  let archivePh = "PHONE_HOME_ARCHIVE_TESTING"
  let archiveInHosp = "IN_HOSPITAL_ARCHIVE_TESTING"
  
  //IF baby is being archived then do the following
  if(reason != "Active") {
    //Get merged data
    let basicInfo = getData("STATIC")[1]
    
    if(reason == "DNF Does NOT Meets Criteria") {
      if(checkCriteriaIsNotMet_(ids,basicInfo))
        return //End code
    }

    
    //Use merged data to make entry in process monitoring
    let tabMapping = {"DNF Does NOT Meets Criteria": "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA",
                    "DNF Meets Criteria": "DO_NOT_FOLLOW_MEET_CRITERIA",
                    "Graduated": "GRADUATED",
                    "Grad - limits": "GRADUATED",
                    "Died in ASMC": "DEATH",
                    "Died out of ASMC": "DEATH",
                    "Unreachable": "UNREACHABLE",
                    "Refusal": "REFUSAL"}
    makePMEntry(tabMapping[reason],basicInfo,ids,action, user)

    //Get supplies back
    console.log("Check if family has a scale/breast pump")
    getSuppliesBack_dbr_(reason,ids,basicInfo)
    
    //Archive HV Active, Priority Calls, OPD Visits, Grad Suggestions
    moveData("HOME_VISIT_ACTIVE_DBR","HOME_VISIT_RESOLVED_DBR",ids,-2,1,1)
    moveData("PRIORITY_CALLS_ACTIVE_DBR","PRIORITY_CALLS_RESOLVED_DBR",ids,-2,1,1)
    moveData("OPD_VISITS_ACTIVE_DBR","OPD_VISITS_RESOLVED_DBR",ids,-2,1,1) 
    moveData("GRAD_SUGGESTIONS_DBR","GRAD_RESOLVED_DBR",ids,-2,1,1) 
    
    archiveCasesWithTimeStamp(activePh,archivePh,ids,reason)
    archiveCasesWithTimeStamp(activeInHosp,archiveInHosp,ids, reason)
  }
  else{ //Simply bring back the data
    archiveCasesWithTimeStamp(archivePh,activePh,ids)
    archiveCasesWithTimeStamp(archiveInHosp,activeInHosp,ids)
    moveData("SUPPLIES_RETURN_ACTIVE_DBR","SUPPLIES_RETURN_RESOLVED_DBR",ids,-1,1,1)
  }

  //Update current status (inefficient way)
  addCurrentStatusToStatic()

}


/**
 * Inserts row in supplies return active to get scale back based on the following logic. 
 * Fort he provided ids, checks if last baby care items has the word "scale". If it does, inserts a row in supplies return active to get scale back
 * It does this for tabs other than 'unreachable', because if a family is unreachable the scale canno be returned anyway
 * Only designed to work as a helper function to moveFromPhoneHomeToOthers
 */
function getSuppliesBack_dbr_(reason, ids, mergedBabyData) {
  
  if(reason.toLowerCase() != "unreachable") { //Add Supplies Return Active
    
    //Get babies who have a scale
    let [filteredCasesById] = filterCasesById_(mergedBabyData,ids) 
    let [idsWithScale] = filterByCaseAttributeValues_(filteredCasesById,"last_baby_care_items","scale",1)
    let [idsWithBreastPump] = filterByCaseAttributeValues_(filteredCasesById,"last_baby_care_items","breast",1)
    let idsWithSupplies = getArrayUnion_(idsWithScale, idsWithBreastPump)
    
    if(idsWithSupplies.length>0) { //Insert new rows for these babies in supplies return active
      console.log("Scale/Breast pump found. Entering a row in Supplies Return Active")
      let [dataIndices, dataArray] = filterSingleRowData_(mergedBabyData,idsWithSupplies)
      let [updatedDataArray, updatedDataIndices] = updateLastRowColumns_(dataArray,dataIndices,["reason_for_pickup"],[reason])
      insertData("SUPPLIES_RETURN_ACTIVE_DBR",2,updatedDataArray,updatedDataIndices,1)
    }
  }
}


function checkCriteriaIsNotMet_(ids,basicInfo) {

  let mergedDataById = getMergedDataForSideBar_dbr(1)

  let errors = []
  for(let i=0; i<ids.length; i++) {
    const basicData = basicInfo[ids[i]]
    const ga = basicData.ga_weeks
    let caseData
    for(let j=0; j<mergedDataById.length; j++) {
      if(ids[i] == mergedDataById[j].id_no) {
        caseData = mergedDataById[j]
        break
      }
    }
    if(caseData == undefined)
      throw `Cannot find ${ids[i]} in dataset`
    const phSource = caseData["phone_home_source_sheet"]
    const phCaseData = caseData[`${phSource}_case_history`]
    const phIndices = caseData[`${phSource}_indices`]
    const inHospData = caseData["in_hospital_case_history"]
    const inHospIndices = caseData["in_hospital_indices"]

    const weightData = ms_getWeightData_(phCaseData,phIndices,inHospData,inHospIndices)    
    const lastWeight = weightData.lastWeightData.weight != -1 ? weightData.lastWeightData.weight : row[indices.initial_weight]

    const criteriaWeight = 1800
    const criteriaGA = 36
    if(lastWeight < criteriaWeight)
      errors.push(`The last recorded weight for the baby ${ids[i]} is ${lastWeight} which is less than criteria weight of ${criteriaWeight}`)
    if(ga < 36)
      errors.push(`The GA for the baby ${ids[i]} is ${ga} weeks which is less than criteria GA of ${criteriaGA}.`)
  }

  if(errors.length > 0) {
    errors = errors.join("\n")
    errors = `${errors}\nPlease update the baby's weight and/or GA and then move the baby to Do Not Follow - Does not Meet Criteria`
    let ui = SpreadsheetApp.getUi()
    ui.alert("GA/Weight Matches Criteria", errors, ui.ButtonSet.OK)
    return true
  }
  else
    return false
}