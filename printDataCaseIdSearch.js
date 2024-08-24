function printDataCaseIdSearch(caseData, sheetName) {

// let allData = getMergedDataForSideBar_dbr()
// for(let i=0; i<allData.length; i++) {
//   if(allData[i].id_no == caseData.id_no) {
//     caseData = allData[i]
//     break
//   }
// }

//Get Hospital Data and Indices
let hospData = caseData.in_hospital_case_history
let hospIndices = caseData.in_hospital_indices
console.log(Object.keys(caseData))
hospData = fixDisplayFormat_(hospData, hospIndices)

//Get Phone Home Data and Indices
let phType = caseData.phone_home_source_sheet //Check if the type of the sheet is phone/home or graduate
let phData = caseData[`${phType}_case_history`]
let phIndices = caseData[`${phType}_indices`]
phData = fixDisplayFormat_(phData, phIndices)

//Get Address Data and Indices
let addData = caseData.address_case_history
let addIndices = caseData.address_indices
console.log("Phone Home Type:", phType)
updateDataRows(sheetName+"_IN_HOSPITAL",hospData,hospIndices,1)
updateDataRows(sheetName+"_PHONE_HOME",phData,phIndices,1) 
updateDataRows(sheetName+"_ADDRESS",addData,addIndices,1)

let[,managerCallById,] = getData("MANAGER_PHONE_CALL_SUBMISSIONS")
let inValidCallStatus = ["No Answer","Not Connecting","No Incoming","Switched Off","Exit Call: No Answer","Exit Call: Not Connecting","Exit Call: No Incoming","Exit Call: Switched Off","Incorrect Baby"]
if(managerCallById[`${caseData.id_no}`] && (!inValidCallStatus.includes(managerCallById[`${caseData.id_no}`].result_of_call))){
  insertData(sheetName+"_PHONE_HOME",-1,managerCallById[`${caseData.id_no}`].case_history,managerCallById[`${caseData.id_no}`].indices,1)
}

}


function changeHeaderRowsCaseSearch(){
  for(let i=1; i<=13; i++) {
    let sheetName = "CASE_SEARCH_"+i
    console.log(sheetName)
    getTab_(sheetName+"_PHONE_HOME").getRange("A1").setValue("Phone and Home Records")
    getTab_(sheetName+"_IN_HOSPITAL").getRange("A1").setValue("Hospital Records")
  }
}
