/**
 * Moves data from Phone/home to the provided tabName (should be either UNREACHABLE, DO_NOT_FOLLOW, or, REFUSAL or DIED_IN_ASMC)
 */
function moveFromPhoneHomeToOthers(ids, tabName, user, missingIDOk) {
  
  if (tabName != "UNREACHABLE" & tabName != "DO_NOT_FOLLOW" & tabName != "REFUSAL" & tabName != "PHONE_HOME_DIED_IN_ASMC" & tabName != "DIED_OUT_ASMC" & tabName != "DO_NOT_FOLLOW_MEET_CRITERIA" ) //This function is defined for only these tabs
    throw "Please run this function only for one of these three tabs: Unreachable, Refusal, Do Not Follow and Died in/out ASMC"
  
  let mergedBabyData = getMergedData()

  
  //Create PM Entry (only for non dead babies; for dead babies; the entries should be created already)
  if(tabName == "UNREACHABLE" | tabName == "DO_NOT_FOLLOW" | tabName == "REFUSAL" | tabName == "DO_NOT_FOLLOW_MEET_CRITERIA"){
    if(tabName == "DO_NOT_FOLLOW"){
      tabName = "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA"
    }
    makePMEntry(tabName,mergedBabyData,ids,"Move Action from Manager's Phone Call Sheet" , user)
  
  }
  //Move from Phone/Home
  if(tabName == "DO_NOT_FOLLOW_DOES_NOT_MEET_CRITERIA"){
    tabName = "DO_NOT_FOLLOW"
  }
  //Check if family has a scale and if they do, insert a row in supplies return active to get the scale back
  console.log("Check if family has a scale/breast pump")
  getSuppliesBack_(tabName, ids, mergedBabyData)

  moveData("PHONE_HOME",tabName,ids,-1,1,missingIDOk)

  //Archive HV Active, Priority Calls, OPD Visits
  moveData("HOME_VISIT_ACTIVE","HOME_VISIT_RESOLVED",ids,-1,1,1)
  moveData("PRIORITY_CALLS_ACTIVE","PRIORITY_CALLS_RESOLVED",ids,-1,1,1)
  moveData("OPD_VISITS_ACTIVE","OPD_VISITS_RESOLVED",ids,-1,1,1) 

}

/**
 * Inserts row in supplies return active to get scale back based on the following logic. 
 * Fort he provided ids, checks if last baby care items has the word "scale". If it does, inserts a row in supplies return active to get scale back
 * It does this for tabs other than 'unreachable', because if a family is unreachable the scale canno be returned anyway
 * Only designed to work as a helper function to moveFromPhoneHomeToOthers
 */
function getSuppliesBack_(tabName, ids, mergedBabyData) {
  
  tabName = tabName.replaceAll("_", "").toLowerCase()
  if(tabName != "unreachable") { //Add Supplies Return Active
    
    //Get babies who have a scale
    let [filteredCasesById] = filterCasesById_(mergedBabyData,ids) 
    let [idsWithScale] = filterByCaseAttributeValues_(filteredCasesById,"last_baby_care_items","scale",1)
    let [idsWithBreastPump] = filterByCaseAttributeValues_(filteredCasesById,"last_baby_care_items","breast",1)
    let idsWithSupplies = getArrayUnion_(idsWithScale, idsWithBreastPump)
    
    if(idsWithSupplies.length>0) { //Insert new rows for these babies in supplies return active
      console.log("Scale/Breast pump found. Entering a row in Supplies Return Active")
      let [dataIndices, dataArray] = filterSingleRowData_(mergedBabyData,idsWithSupplies)
      let [updatedDataArray, updatedDataIndices] = updateLastRowColumns_(dataArray,dataIndices,["reason_for_pickup"],[`moved to ${tabName}`])
      insertData("SUPPLIES_RETURN_ACTIVE",2,updatedDataArray,updatedDataIndices,1)
    }
  }

}