/**
 * Performs relevant actions for babies who have been reviewed and put on the "action" list by managers
 */

function graduateActions(user, dbr) {
  let suff= "_DBR"

  let [gradSuggIndices,,, data] = getData("GRAD_SUGGESTIONS"+suff)
  let actionableData = groupBy_(data, gradSuggIndices.moved_to_grad_tab_in_lbw_tracking)['true']
  
  if (actionableData == undefined) 
    throw "No Baby Selected"

  let groupedByStatus = groupBy_(actionableData, gradSuggIndices.grad_status)
  let existingStatuses = Object.keys(groupedByStatus)

  let mergedBabyData = getMergedData(0, dbr) //0 because we don't want to include graduate data

  //Call Appropriate function for the statuses found
  let resolvedIDs = []
  let limitsReachedIds = []
  while(existingStatuses.length != 0) {
    const status = existingStatuses.pop()
    console.log("Performing Actions for Status: "+ status)
    let ids = getColumn_(groupedByStatus[status], gradSuggIndices.id_no, 1)
  
    switch (status) {
      case "1" :
        resolvedIDs = [...resolvedIDs, ...ids]
        //graduateBabies_(ids, mergedBabyData, dbr)
        break
      case "2":
        graduateWtPendingBabies_(ids, mergedBabyData, dbr)
        break
      case "2a":
        updateLastRowColumnsById_("GRAD_SUGGESTIONS"+suff,ids,["moved_to_grad_tab_in_lbw_tracking"],["FALSE"]) //Simply change checkmark to false
        break
      case "2b":
        resolvedIDs = [...resolvedIDs, ...ids]
        break
      case "3":
        updateLastRowColumnsById_("GRAD_SUGGESTIONS"+suff,ids,["moved_to_grad_tab_in_lbw_tracking"],["FALSE"]) //Simply change checkmark to false
        break
      case "4":
        putOnHomeVisit_(ids, mergedBabyData, dbr)
        break
      case "4a":
        updateLastRowColumnsById_("GRAD_SUGGESTIONS"+suff,ids,["moved_to_grad_tab_in_lbw_tracking"],["FALSE"]) //Simply change checkmark to false
        break
      case "4b":
        resolvedIDs = [...resolvedIDs, ...ids]
        break
      case "5":
        limitsReachedIds = [...ids]
        updateLastRowColumnsById_("PHONE_HOME_TESTING",ids,["date_to_follow_up"],["limit"])
        //limitsReached_(ids, mergedBabyData, dbr)
        break
    }
  }

  if(limitsReachedIds.length > 0)
    moveBabies_dbr(limitsReachedIds,"Grad - limits","Grad Actions",user)
  
  if (resolvedIDs.length > 0) {
    //Move from phone/home to Graduate
    console.log("Resolved Ids:", resolvedIDs)
    moveBabies_dbr(resolvedIDs,"Graduated","Grad Actions",user)
  }
  sortGradSuggestions(dbr)
}

/**
 * Performs actions for babies whose grad status is 1 = grad
 * 
 * @param {Array} ids
 * @param {Dictionary} gradSuggIndices
 * @param (Dictionary) mergedBabyData
 */

// function graduateBabies_(ids, mergedBabyData, dbr) {
//   let [dataIndices, dataArray,,notFoundIDs] = filterSingleRowData_(mergedBabyData,ids)
//   if (notFoundIDs.length > 0)
//     throw "Cannot complete action. These IDs not found in LBW sheet : " + notFoundIDs
  
//   let [updatedDataArray, updatedDataIndices] = updateLastRowColumns_(dataArray,dataIndices,["reason_for_pickup"],["grad"])
  
//   if(dbr)
//     insertData("SUPPLIES_RETURN_ACTIVE_DBR",2,updatedDataArray,updatedDataIndices,1)//Can add destination columns if needed
//   else
//     insertData("SUPPLIES_RETURN_ACTIVE",2,updatedDataArray,updatedDataIndices,1)//Can add destination columns if needed
// }

/**
 * Performs actions for babies whose grad status is 2 = grad weight pending
 
 * @param {Array} ids
 * @param {Dictionary} gradSuggIndices
 * @param (Dictionary) mergedBabyData
 */

function graduateWtPendingBabies_(ids, mergedBabyData, dbr) {
  let [dataIndices, dataArray,,notFoundIDs] = filterSingleRowData_(mergedBabyData,ids)
  if (notFoundIDs.length > 0)
    throw "Cannot complete action. These IDs not found in LBW sheet : " + notFoundIDs
  
  let [updatedDataArray, updatedDataIndices] = updateLastRowColumns_(dataArray,dataIndices,["reason_for_pickup","बिना_कपरे_का_वजन"],["grad wt pending", "yes"])
  
  if(dbr) {
    insertData("SUPPLIES_RETURN_ACTIVE_DBR",2,updatedDataArray,updatedDataIndices,1)//Can add destination columns if needed
    updateLastRowColumnsById_("PHONE_HOME_TESTING",ids,["date_to_follow_up"],["grad wt pending"])
    
    updateLastRowColumnsById_("GRAD_SUGGESTIONS_DBR",ids,["moved_to_grad_tab_in_lbw_tracking", "grad_status"],["FALSE","2a"])
  }
  else {
    insertData("SUPPLIES_RETURN_ACTIVE",2,updatedDataArray,updatedDataIndices,1)//Can add destination columns if needed
    updateLastRowColumnsById_("PHONE_HOME",ids,["date_to_follow_up"],["grad wt pending"])
    
    updateLastRowColumnsById_("GRAD_SUGGESTIONS",ids,["moved_to_grad_tab_in_lbw_tracking", "grad_status"],["FALSE","2a"])
  }
}


/**
 * Performs actions for babies whose grad status is 4 = home visit needed
 
 * @param {Array} ids
 * @param {Dictionary} gradSuggIndices
 * @param (Dictionary) mergedBabyData
 */

function putOnHomeVisit_(ids, mergedBabyData, dbr) {
  let idArray = [...ids]
  let suff = ""
  if(dbr)
    suff = "_DBR" 

  updateLastRowColumnsById_("GRAD_SUGGESTIONS"+suff,ids,["moved_to_grad_tab_in_lbw_tracking", "grad_status"],["FALSE","4a"])

  //Get Home-visit data
  let hvDataById = getData("HOME_VISIT_ACTIVE"+suff)[1]
  let hvIDs = Object.keys(hvDataById)

  let existingIDs = []
  let newIDs = []
  for(let i=0; i<idArray.length; i++) {
    if (hvIDs.indexOf(idArray[i]) > -1)
      existingIDs.push(idArray[i]) 
    else
      newIDs.push(idArray[i])
  }
  
  
  if (newIDs.length > 0) { //Insert new IDs in Home Visit Active Tab
    console.log("Inserting Rows for the following IDs:")
    console.log(newIDs)
    
    let [dataIndices, dataArray,,notFoundIDs] = filterSingleRowData_(mergedBabyData,newIDs)
    if (notFoundIDs.length > 0)
      throw "Cannot complete action. These IDs not found in LBW sheet : " + notFoundIDs
    
    insertData("HOME_VISIT_ACTIVE"+suff,2,dataArray,dataIndices,1)//Can add destination columns if needed
  }

  //Change category to 7 for all IDs (existing and new)
  console.log("changing Category only for the following IDs:")
  console.log(idArray)
  updateLastRowColumnsById_("HOME_VISIT_ACTIVE"+suff,idArray,["category"],["7"],1) 

}


/**
 * Performs actions for babies whose grad status is 5 = limits reached
 
 * @param {Array} ids
 * @param {Dictionary} gradSuggIndices
 * @param (Dictionary) mergedBabyData
 */

// function limitsReached_(ids, mergedBabyData, dbr) {
  
//   let [filteredCasesById] = filterCasesById_(mergedBabyData,ids) 
//   let [idsWithScale] = filterByCaseAttributeValues_(filteredCasesById,"last_baby_care_items","scale",1)
//   let [idsWithBreastPump] = filterByCaseAttributeValues_(filteredCasesById,"last_baby_care_items","breast",1)
//   let idsWithSupplies = getArrayUnion_(idsWithScale, idsWithBreastPump)
//   let [dataIndices, dataArray,,notFoundIDs] = filterSingleRowData_(mergedBabyData,ids)
//   if (notFoundIDs.length > 0){
//     throw "Cannot complete action. These IDs not found in LBW sheet : " + notFoundIDs
//   }
  
//   [dataIndices, dataArray,,notFoundIDs] = filterSingleRowData_(mergedBabyData,idsWithSupplies)
//   let [updatedDataArray, updatedDataIndices] = updateLastRowColumns_(dataArray,dataIndices,["reason_for_pickup"],["limit"])
  
//   if(dbr) {
//     insertData("SUPPLIES_RETURN_ACTIVE_DBR",2,updatedDataArray,updatedDataIndices,1)//Can add destination columns if needed
//     updateLastRowColumnsById_("PHONE_HOME_TESTING",ids,["date_to_follow_up"],["limit"])
//   }
//   else {
//     insertData("SUPPLIES_RETURN_ACTIVE",2,updatedDataArray,updatedDataIndices,1)//Can add destination columns if needed
//     updateLastRowColumnsById_("PHONE_HOME",ids,["date_to_follow_up"],["limit"])
//   }
// }


function sortGradSuggestions(dbr) {
  console.log("Sorting Grad Suggestions Tab by Grad Status");
  let suff = ""
  if (dbr) 
    suff = "_DBR"

  let [gradSuggIndices, , , data] = getData("GRAD_SUGGESTIONS" + suff)
  let groupedByStatus = groupBy_(data, gradSuggIndices.grad_status)
  let sortedData = []
  let orderStatus = ["", "1", "2", "2a", "2b", "3", "4", "4a", "4b", "5"]
  let existingStatus = Object.keys(groupedByStatus);

  // Filter out statuses not in the specified sequence
  let nonSequentialStatus = existingStatus.filter(
    (status) => orderStatus.indexOf(status) === -1
  );

  // Add rows with non-sequential status to the end of the sortedData
  for (let i = 0; i < nonSequentialStatus.length; i++) {
    sortedData = [...sortedData, ...groupedByStatus[nonSequentialStatus[i]]];
    delete groupedByStatus[nonSequentialStatus[i]];
  }

  // Add rows with statuses in the specified sequence to sortedData
  for (let i = 0; i < orderStatus.length; i++) {
    if (groupedByStatus[orderStatus[i]]) {
      sortedData = [...sortedData, ...groupedByStatus[orderStatus[i]]];
      delete groupedByStatus[orderStatus[i]];
    }
  }

  // If there are any remaining statuses, add them to the end of sortedData
  let remainingStatus = Object.keys(groupedByStatus);
  for (let i = 0; i < remainingStatus.length; i++) {
    sortedData = [...sortedData, ...groupedByStatus[remainingStatus[i]]];
  }

  updateDataRows("GRAD_SUGGESTIONS" + suff, sortedData, gradSuggIndices, 1);
}

