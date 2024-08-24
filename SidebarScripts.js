
/**
 * 
 * @param {Boolean} onlyPhoneHome - Indicates if only phone/home data should be used (in-hospital + phone/home cases)
 * @param {Boolean} includeGradOnly - Requires that onlyPhoneHome be set to 1/TRUE. Is this is also set to TRUE/1 only graduate baby date is included with phone/home (and not refusal/unreachable etc.)
 * @returns 
 */
// function getMergedDataForSideBar(onlyPhoneHome, includeGradOnly) {

//   let [,inHospData,,] = getData("IN_HOSPITAL")
//   let hospIDS = Object.keys(inHospData)
  

//   let [,addData,,] = getData("ADDRESS")
//   addData = addAddress_(addData)
//   let addIDS = Object.keys(addData)

//   let [,phData,,] = getData("PHONE_HOME")
//   let phSources = ["ph"]

//   let inHospDiedData
//   // let gradData
//   // let unreachableData
//   // let refusalData
//   // let diedInAsmcData
//   // let diedOutAsmcData
//   // let dontFollowData
    
//   if(onlyPhoneHome != 1) {
//     if(includeGradOnly != 1) {
//     let inHospitalDiedData = getData("DIED_IN_ASMC")
//     inHospDiedData = inHospitalDiedData[1]
//     hospIDS = [...hospIDS, ...Object.keys(inHospDiedData)]
//     }
    
//     var [,gradData,,] = getData("GRADUATE")
//     phSources = ["ph", "grad"]
//     if(includeGradOnly != 1) {
//       var [,unreachableData,,] = getData("UNREACHABLE")
//       var [,refusalData,,] = getData("REFUSAL")
//       var [,diedInAsmcData,,] = getData("PHONE_HOME_DIED_IN_ASMC")
//       var [,diedOutAsmcData,,] = getData("DIED_OUT_ASMC")
//       var [,dontFollowData,,] = getData("DO_NOT_FOLLOW")
//       var [,dontFollowMeetCriteriaData,,] = getData("DO_NOT_FOLLOW_MEET_CRITERIA")

//       phSources = ["ph", "grad", "unreachable", "refusal", "diedInAsmc", "diedOutAsmc", "dontFollow", "dontFollowMeetCriteria"]
//     }
//   }
  
  
  
//   let basicAttrsInHosp = ["id_no", "twin_id", "mother", "father", "birthday", "initial_weight","ga_weeks", "place_of_birth", "is_the_baby_inborn"]
//   let basicAttrsPhHome = ["phone_numbers"]
//   let casesData = []
//   let phHomeIDsNotFound = []
//   let addressIDsNotFound = []
//   let gradIDsNotFound = []

  
//   for(let i=0; i<hospIDS.length; i++) {
//     let id = hospIDS[i]
//     let caseData = {}
//     let hospData = inHospData[id] || inHospDiedData[id] //If in hospital data is undefined, it implies the id is from inHospDied, so it assigns that as hospital data
    
//     if(inHospData[id] == undefined)
//       caseData["in_hospital_source"] = "died"
//     else
//       caseData["in_hospital_source"] = "inHospital"
    
//     //Add basic attributes to the case data for the baby
//     for(let j=0; j<basicAttrsInHosp.length; j++)
//       caseData[basicAttrsInHosp[j]] = hospData[basicAttrsInHosp[j]].valueOf()
    
//     //Get In Hospital case history and indices
//     caseData["in_hospital_case_history"] = getValue_(hospData["case_history"])
//     caseData["in_hospital_indices"] = hospData["indices"]
    
//     //Add Phone Home case history and indices
//     let foundPhoneHomeData = 0
//     for(let j=0; j<phSources.length; j++) { //Loop through all different sources in order
//       let src = phSources[j]
//       let phoneHomeData = eval(src+"Data") //Set phoneHomeData pointer to whichever is the current source
//       let phoneHomeIDS = Object.keys(phoneHomeData)
//       caseData["phone_home_source_sheet"] = src
//       if(phoneHomeIDS.indexOf(id) > -1) {
//         caseData[`${src}_case_history`] = getValue_(phoneHomeData[id]["case_history"])
//         caseData[`${src}_indices`] = phoneHomeData[id]["indices"]
//         for(let k=0; k<basicAttrsPhHome.length; k++)
//           caseData[basicAttrsPhHome[k]] = phoneHomeData[id][basicAttrsPhHome[k]].valueOf()
//         foundPhoneHomeData = 1
//         break //When a single source containing data is found, break from loop (Assumes there should be no duplication of phone home ids)
//       }
//     }

//     //If no phone home data is found, set the case history and indices to reflect that
//     if(foundPhoneHomeData == 0) {
//       caseData[`${caseData["phone_home_source_sheet"]}_case_history`] = [["No Out of Hospital Data Found"]]
//       caseData[`${caseData["phone_home_source_sheet"]}_indices`] = {"id_no":0}  
//     }
    
    
//     //Add Address case history and indices
//     if(addIDS.indexOf(id) > -1) {
//       caseData["address_case_history"] = getValue_(addData[id]["case_history"])
//       caseData["address_indices"] = addData[id]["indices"]
//       caseData["address"] = addData[id]["address"]
//       caseData["block"] = addData[id]["block"]
//     }
//     else {
//       caseData["address_case_history"] = [["No Address Data Found"]]
//       caseData["address_indices"] = {"id_no": 0}
//       caseData["address"] = "Not Found"
//       caseData["block"] = "Not Found"
//       addressIDsNotFound.push(id)
//     }

//     //caseData = sidebar_addDerivedAttributes_(caseData, foundPhoneHomeData)

//     casesData.push(caseData)
//   }
//   console.log(`Number of Babies loaded in the data: ${casesData.length}`)
  
//   return casesData
// }

function getMergedDataForSideBar_dbr(onlyActiveBabies) {

  let inHospData = getData("IN_HOSPITAL_TESTING")[1]
  let hospIDS = Object.keys(inHospData)
  
  let exitData = getData("EXIT")[1]
  let exitIDs = Object.keys(exitData)

  let addData = getData("ADDRESSES")[1]
  let addIDS = Object.keys(addData)

  let phData = getData("PHONE_HOME_TESTING")[1]
  let phIDs = Object.keys(phData)
  let phSources = ["ph"]

  let inHospArchiveData
    
  if(onlyActiveBabies != 1) {
    inHospArchiveData = getData("IN_HOSPITAL_ARCHIVE_TESTING")[1]
    hospIDS = [...hospIDS, ...Object.keys(inHospArchiveData)]
    
    var archiveData = getData("PHONE_HOME_ARCHIVE_TESTING")[1]
    phSources = ["ph", "archive"]
    phIDs = [...phIDs, ...Object.keys(archiveData)]
  }
  
  let basicInfoData = getData("STATIC")[1]

  let casesData = []
  let completedIDs = []

  let targetIds = getArrayUnion_(hospIDS, phIDs)
  if(targetIds.indexOf("24042502") == -1)
    console.log("ID Not Found:24042502")
  if(targetIds.indexOf("24050102") == -1)
    console.log("ID Not Found:24050102")
  for(let i=0; i<targetIds.length; i++) {
    let id = targetIds[i]

    if (basicInfoData[id] == undefined)
      throw `Cannot find ${id} in database`


    let caseData = {}
    
    //Add basic information
    for(const [attr,value] of Object.entries(basicInfoData[id])) {
      if(attr != "case_history" && attr != "indices")
        caseData[attr] = value.valueOf()
    }  
    
    //Add twin Information
    sidebar_addTwinInfo_(caseData, basicInfoData)
    
    
    let hospData 
    if(onlyActiveBabies)
      hospData = inHospData[id] //If in hospital data is undefined, it implies the id is from archive, so it assigns that as hospital data
    else
      hospData = inHospData[id] || inHospArchiveData[id] //If in hospital data is undefined, it implies the id is from archive, so it assigns that as hospital data
    

    if(hospData == undefined) {
      caseData["latest_record_date"] = ""
      caseData[`in_hospital_case_history`] = [["No In Hospital Data Found"]]
      caseData[`in_hospital_indices`] = {"id_no":0} 
      
    }
    else {
      caseData["latest_record_date"] = hospData.date
      //Get In Hospital case history and indices
      caseData["in_hospital_case_history"] = getValue_(hospData["case_history"])
      caseData["in_hospital_indices"] = hospData["indices"]

      if(inHospData[id] == undefined) { //If the in hospital data doesn't come from active, it comes from archive
        caseData["in_hospital_source"] = "archive"
        caseData["current_status"] = caseData["in_hospital_case_history"][0][caseData["in_hospital_indices"].reason_to_archive] //Temporary fix because all rows of archive doesn't have reason to archive
      }
      else {
        caseData["current_status"] = "in ASMC"
        caseData["in_hospital_source"] = "inHospital"
      }

    }
    if(id == "24050102" || id == "24042502") {
      console.log(caseData["current_status"])
      console.log(caseData["in_hospital_source"])
    }
    
    //Add Phone Home case history and indices
    let foundPhoneHomeData = 0
    for(let j=0; j<phSources.length; j++) { //Loop through all different sources in order
      let src = phSources[j]
      let phoneHomeData = eval(src+"Data") //Set phoneHomeData pointer to whichever is the current source
      caseData["phone_home_source_sheet"] = src
      if(id in phoneHomeData) {
        caseData[`${src}_case_history`] = getValue_(phoneHomeData[id]["case_history"])
        caseData[`${src}_indices`] = phoneHomeData[id]["indices"]
        
        if(src == "ph" && hospData != undefined) {
          if(phoneHomeData[id].date >= hospData.date) { //If the hospital date is greater, then baby has been re-intaked and status must stay the same (in ASMC)
            caseData.latest_record_date = phoneHomeData[id].date
            const latestCallType = String(phoneHomeData[id].type).toLowerCase()
            if(latestCallType.includes("special call") & !(latestCallType.includes("special call =>")))
              caseData["current_status"] = "phone/home active (special calls)"
            else
              caseData["current_status"] = "phone/home active"
          }
        }
        else if (caseData.current_status == undefined)
          caseData["current_status"] = phoneHomeData[id].reason_to_archive

        foundPhoneHomeData = 1
        break //When a single source containing data is found, break from loop (Assumes there should be no duplication of phone home ids)
      }
    }

    //If no phone home data is found, set the case history and indices to reflect that
    if(foundPhoneHomeData == 0) {
      caseData[`${caseData["phone_home_source_sheet"]}_case_history`] = [["No Out of Hospital Data Found"]]
      caseData[`${caseData["phone_home_source_sheet"]}_indices`] = {"id_no":0}  
    }
    
    if(id == "24050102" || id == "24042502") {
      console.log(foundPhoneHomeData)
      console.log(caseData["current_status"])
      console.log(caseData["phone_home_source_sheet"])
    }

    //Add Address case history and indices
    if(addIDS.indexOf(id) > -1) {
      caseData["address_case_history"] = getValue_(addData[id]["case_history"])
      caseData["address_indices"] = addData[id]["indices"]
      caseData["address"] = addData[id]["address"]
    }
    else {
      caseData["address_case_history"] = [["No Address Data Found"]]
      caseData["address_indices"] = {"id_no": 0}
      caseData["address"] = "Not Found"
    }

    if(exitIDs.indexOf(id) > -1)
      caseData["last_hospital_exit_status"] = exitData[id].status_of_exit || "Missing"

    caseData = sidebar_addDerivedAttributes_dbr_(caseData, foundPhoneHomeData)
    delete caseData.latest_record_date //Delete latest record date; only needed to determine CA in case baby had died

    casesData.push(caseData)
    completedIDs.push(id)
  }
  console.log(`Number of Babies loaded in the data: ${casesData.length}`)
  
  return casesData
}

function sidebar_addDerivedAttributes_dbr_(caseData, foundPhoneHomeData) {

  //CA
  let date = new Date()
  if(caseData.current_status.toLowerCase().includes("died")) //For died babies calculate CA only upto the latest record date (which ideally would be death date)
    date = caseData.latest_record_date

  let ca = computeCA_(caseData.ga_days,caseData.ga_weeks,caseData.birthday,date)
  caseData["ca_weeks"] = ca.caWeeks
  caseData["ca_days"] = ca.caDays
  caseData["pma"] = ca.caWD

  if(isNaN(caseData["ca_weeks"]))
    caseData["ca_weeks"] = "Error. Check birthday and ga"
  if(isNaN(caseData["ca_days"]))
    caseData["ca_days"] = "Error. Check birthday and ga"
  if(isNaN(caseData["ca_days"]) | isNaN(caseData["ca_weeks"]))
    caseData["pma"] = "Error. Check birthday and ga"
  
  
  //nights in kmc
  let inHospCaseHistory = caseData.in_hospital_case_history
  let inHospIndices = caseData.in_hospital_indices
  
  
  sidebar_addGACAinWDFormat_(inHospCaseHistory,inHospIndices)


  let condition = [{columnIndex: inHospIndices.type_of_form, matchArray: ["case sheet", "intake","exit","re-intake"], partialMatch: 1},
                   {columnIndex: inHospIndices.where_is_the_baby_now, matchArray: ["KMC7", "KMC10","KMC","MNCU"]}]
  caseData["nights_in_kmc"] = conditionCounter_(inHospCaseHistory, condition,allTrue=1,inHospIndices.date, caseData.id_no)

  //Total home visits
  if (foundPhoneHomeData == 0)
    caseData["total_home_visits"] = "No out of hospital data"
  else {
    const phSource = caseData.phone_home_source_sheet
    let phCaseHistory = caseData[`${phSource}_case_history`]
    let phCaseIndices = caseData[`${phSource}_indices`]
    sidebar_addGACAinWDFormat_(phCaseHistory,phCaseIndices)

    condition = [{columnIndex: phCaseIndices.type, matchArray: ["home"], partialMatch:1},
                {columnIndex: phCaseIndices.result_of_call, matchArray: ["Assessed"]}]
    caseData["total_home_visits"] = conditionCounter_(phCaseHistory, condition,allTrue=1,inHospIndices.date)

    condition = [{columnIndex: phCaseIndices.type, matchArray: ["home"], partialMatch:1}]
    caseData["attempted_home_visits"] = conditionCounter_(phCaseHistory, condition,allTrue=1,inHospIndices.date) - caseData["total_home_visits"]
  }
  //Uncomment the following statement to check if any of these added attributes is producing NaN or some other Object which is preventing sidebar from loading
  //console.log(`For id ${caseData.id_no} intake date: ${caseData.intake_date} ${caseData.ca_weeks} ${caseData.ca_days} ${caseData.nights_in_kmc} ${caseData.total_home_visits}` )
  return caseData
}

//This is the function that is being used across sidebars as of now
function getMergedDataForSideBar21(onlyPhoneHome, includeGradOnly) {
  return getMergedDataForSideBar_dbr(onlyPhoneHome)
}

/**
 * 
 * @param {Array} caseHistory 
 * @param {Dict} indices 
 * 
 * Add GA and CA (labeled as PMA) in WxD format to the provided case history. A pre-requisite is GA_weeks and GA_days must be present along with CA_weeks and CA_days
 */
function sidebar_addGACAinWDFormat_(caseHistory,indices) {
  
  let checkAttrs = ["ga_weeks","ga_days","ca_weeks","ca_days"]
  let exitVal = ""
  for(attr of checkAttrs) {
    if(!(attr in indices))
      exitVal = `Cannot compute combined GA/CA. The provided indices is missing ${attr}`
  }

  let maxVal = getMinAndMaxValuesInDict(indices).maxVal
  let inc = 1
  if(indices["ga"] == undefined) {
    indices["ga"] = maxVal + inc
    inc = inc + 1
  }
  if(indices["pma"] == undefined)
    indices["pma"] = maxVal + inc

  for(let i=0; i<caseHistory.length; i++) {
    if(exitVal == "") {
      caseHistory[i][indices.ga] = `${caseHistory[i][indices.ga_weeks]}W ${caseHistory[i][indices.ga_days]}D`
      caseHistory[i][indices.pma] = `${caseHistory[i][indices.ca_weeks]}W ${caseHistory[i][indices.ca_days]}D`
    }
    else {
      caseHistory[i][indices.ga] = exitVal
      caseHistory[i][indices.pma] = exitVal
    }
  }
}

function loadSidebar() {
  var html = HtmlService.createTemplateFromFile("caseIdSearch").evaluate()
             .setSandboxMode(HtmlService.SandboxMode.IFRAME).setTitle("Case Picker");
  SpreadsheetApp.getUi().showSidebar(html);
}
//Adding this new comment as a test

// function sidebar_addDerivedAttributes_(caseData, foundPhoneHomeData) {

//   let currentStatus = caseData.phone_home_source_sheet
//   let phData = caseData[`${currentStatus}_case_history`]
//   let phIndices = caseData[`${currentStatus}_indices`]
//   if(currentStatus == "grad"){
//     currentStatus = checkIfDiedAfterGrad(phData,phIndices)
//   }

//   if(foundPhoneHomeData == 0)
//       currentStatus = caseData.in_hospital_source
//   else {
//       const lastRow = phData[phData.length-1]
//       if(currentStatus == "ph") {
//         currentStatus = analyzePatientStatus(phData,phIndices)
//         const callType = lastRow[phIndices.type]
//         if(callType.indexOf("Special Call") > -1 & callType.indexOf("Special Call =>") == -1)
//           currentStatus = "phSpecialCall"
//       }
//   }
  
//   caseData['current_status'] = ms_getCurrentStatus_(currentStatus)

//   //Intake Date
//   let intakeDate = extractIntakeDateFromId_(String(caseData.id_no)).valueOf()
//   if(isNaN(intakeDate))
//     intakeDate = "Old ID System: Cannot infer intake date"  
//   caseData["intake_date"]= intakeDate
  
//   //CA
//   const date = new Date()
//   date.setHours(0,0,0,0)
//   const numDays = (date.valueOf() - caseData.birthday) / (1000*60*60*24)
//   caseData["ca_weeks"] = Math.floor(numDays/7) + caseData.ga_weeks
//   caseData["ca_days"] = numDays%7
//   if(isNaN(caseData["ca_weeks"]))
//     caseData["ca_weeks"] = "Error. Check birthday and ga"
//   if(isNaN(caseData["ca_days"]))
//     caseData["ca_days"] = "Error. Check birthday and ga"
  
//   //nights in kmc
//   const inHospCaseHistory = caseData.in_hospital_case_history
//   const inHospIndices = caseData.in_hospital_indices
  
//   let condition = [{columnIndex: inHospIndices.type_of_form, matchArray: ["case sheet", "intake","exit","re-intake"], partialMatch: 1},
//                    {columnIndex: inHospIndices.where_is_the_baby_now, matchArray: ["KMC7", "KMC10","KMC","MNCU"]}]
//   caseData["nights_in_kmc"] = conditionCounter_(inHospCaseHistory, condition,allTrue=1,inHospIndices.date, caseData.id_no)

//   //Total home visits
//   if (foundPhoneHomeData == 0)
//     caseData["total_home_visits"] = "No out of hospital data"
//   else {
//     const phSource = caseData.phone_home_source_sheet
//     const phCaseHistory = caseData[`${phSource}_case_history`]
//     const phCaseIndices = caseData[`${phSource}_indices`]
//     condition = [{columnIndex: phCaseIndices.type, matchArray: ["home"], partialMatch:1},
//                 {columnIndex: phCaseIndices.result_of_call, matchArray: ["Assessed"]}]
//     caseData["total_home_visits"] = conditionCounter_(phCaseHistory, condition,allTrue=1,inHospIndices.date)
//     condition = [{columnIndex: phCaseIndices.type, matchArray: ["home"], partialMatch:1}]
//     caseData["attempted_home_visits"] = conditionCounter_(phCaseHistory, condition,allTrue=1,inHospIndices.date) - caseData["total_home_visits"]
    
//   }
//   //Uncomment the following statement to check if any of these added attributes is producing NaN or some other Object which is preventing sidebar from loading
//   //console.log(`For id ${caseData.id_no} intake date: ${caseData.intake_date} ${caseData.ca_weeks} ${caseData.ca_days} ${caseData.nights_in_kmc} ${caseData.total_home_visits}` )
//   return caseData
// }

// function getMergedDataForSideBar_testing(onlyPhoneHome, includeGradOnly) {
//   //simply remove _TESTING from all getData definitions
//   let [,inHospData,,] = getData("IN_HOSPITAL_TESTING")
//   let hospIDS = Object.keys(inHospData)
  

//   let [,addData,,] = getData("ADDRESS_TESTING")
//   addData = addAddress_(addData)
//   let addIDS = Object.keys(addData)

//   let [,phData,,] = getData("PHONE_HOME_TESTING")
//   let phSources = ["ph"]

//   let inHospDiedData
//   // let gradData
//   // let unreachableData
//   // let refusalData
//   // let diedInAsmcData
//   // let diedOutAsmcData
//   // let dontFollowData
    
//   if(onlyPhoneHome != 1) {
//     if(includeGradOnly != 1) {
//     let inHospitalDiedData = getData("DIED_IN_ASMC")
//     inHospDiedData = inHospitalDiedData[1]
//     hospIDS = [...hospIDS, ...Object.keys(inHospDiedData)]
//     }
    
//     var [,gradData,,] = getData("GRADUATE")
//     phSources = ["ph", "grad"]
//     if(includeGradOnly != 1) {
//       var [,unreachableData,,] = getData("UNREACHABLE")
//       var [,refusalData,,] = getData("REFUSAL")
//       var [,diedInAsmcData,,] = getData("PHONE_HOME_DIED_IN_ASMC")
//       var [,diedOutAsmcData,,] = getData("DIED_OUT_ASMC")
//       var [,dontFollowData,,] = getData("DO_NOT_FOLLOW")

//       phSources = ["ph", "grad", "unreachable", "refusal", "diedInAsmc", "diedOutAsmc", "dontFollow"]
//     }
//   }
  
  
  
//   let basicAttrsInHosp = ["id_no", "twin_id", "mother", "father", "birthday", "initial_weight","ga_weeks", "phone_numbers"]
//   //let basicAttrsPhHome = ["phone_numbers"]
//   let casesData = []
//   let phHomeIDsNotFound = []
//   let addressIDsNotFound = []
//   let gradIDsNotFound = []

  
//   for(let i=0; i<hospIDS.length; i++) {
//     let id = hospIDS[i]
//     let caseData = {}
//     let hospData = inHospData[id] || inHospDiedData[id] //If in hospital data is undefined, it implies the id is from inHospDied, so it assigns that as hospital data
    
//     if(inHospData[id] == undefined)
//       caseData["in_hospital_source"] = "died"
//     else
//       caseData["in_hospital_source"] = "inHospital"
    
    
//     //Add basic attributes to the case data for the baby
//     for(let j=0; j<basicAttrsInHosp.length; j++)
//       caseData[basicAttrsInHosp[j]] = hospData[basicAttrsInHosp[j]].valueOf()
    
//     //Get In Hospital case history and indices
//     caseData["in_hospital_case_history"] = getValue_(hospData["case_history"])
//     caseData["in_hospital_indices"] = hospData["indices"]
    
//     //Add Phone Home case history and indices
//     let foundPhoneHomeData = 0
//     for(let j=0; j<phSources.length; j++) { //Loop through all different sources in order
//       let src = phSources[j]
//       let phoneHomeData = eval(src+"Data") //Set phoneHomeData pointer to whichever is the current source
//       let phoneHomeIDS = Object.keys(phoneHomeData)
//       caseData["phone_home_source_sheet"] = src
//       if(phoneHomeIDS.indexOf(id) > -1) {
//         caseData[`${src}_case_history`] = getValue_(phoneHomeData[id]["case_history"])
//         caseData[`${src}_indices`] = phoneHomeData[id]["indices"]
//         foundPhoneHomeData = 1
//         break //When a single source containing data is found, break from loop (Assumes there should be no duplication of phone home ids)
//       }
//     }

//     //If no phone home data is found, set the case history and indices to reflect that
//     if(foundPhoneHomeData == 0) {
//       caseData[`${caseData["phone_home_source_sheet"]}_case_history`] = [["No Out of Hospital Data Found"]]
//       caseData[`${caseData["phone_home_source_sheet"]}_indices`] = {"id_no":0}  
//     }
    
    
//     //Add Address case history and indices
//     if(addIDS.indexOf(id) > -1) {
//       caseData["address_case_history"] = getValue_(addData[id]["case_history"])
//       caseData["address_indices"] = addData[id]["indices"]
//       caseData["address"] = addData[id]["address"]
//     }
//     else {
//       caseData["address_case_history"] = [["No Address Data Found"]]
//       caseData["address_indices"] = {"id_no": 0}
//       caseData["address"] = "Not Found"
//       addressIDsNotFound.push(id)
//     }

//     caseData = sidebar_addDerivedAttributes_(caseData, foundPhoneHomeData)

//     casesData.push(caseData)
//   }
//   console.log(`Number of Babies loaded in the data: ${casesData.length}`)
  
//   return casesData
// }

function sidebar_addTwinInfo_(caseData, staticData) {

  let twinInfo = ""
  const twinId = caseData.twin_id
  if (twinId == 0)
    twinInfo = "No twins"
  else {
    let ids = Object.keys(staticData)
    let counter = 1
    for (let i=0; i<ids.length; i++) {

      if(staticData[ids[i]].twin_id == twinId)
        twinInfo = twinInfo + `Twin ${staticData[ids[i]].birth_order}: ${staticData[ids[i]].current_status}\n`
    }
  }
  twinInfo = twinInfo.substring(0,twinInfo.length-1)
  caseData["twin_status"] = twinInfo
}