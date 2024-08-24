
function getGradSuggestions_dbr() {
  graduateSuggestions_(1)
}
function graduateSuggestions_(dbr) {
  //Identify babies that need to be suggested for graduation: Insert them into Grad Suggestion tab
  console.log("Updating graduate suggestions")
  
  let suff = ""
  let suff2 = ""
  if(dbr) {
    suff = "_DBR"
    suff2 = "_TESTING"
  }
  
  let [phIndices,phCases] = getData("PHONE_HOME"+suff2)
  
  if(dbr)
    addGACAinWDFormat_caseObj_(phIndices,phCases)

  let gradIDs = getIDs("GRAD_SUGGESTIONS"+suff)
  let phIds = Object.keys(phCases)
  let gradSuggestionIDs = []
  for(let i = 0; i<phIds.length; i++) {
    let id = phIds[i]
    let corr_age 
    if(dbr)
      corr_age = phCases[id].ca_weeks
    else
      corr_age = phCases[id].ca
    if (corr_age >=44 & gradIDs.indexOf(id) == -1) {
      console.log("Suggesting graduation for ID: "+ id)
      gradSuggestionIDs.push(id)
    }
  }
  if(gradSuggestionIDs.length > 0) {
    console.log("Total No. of babies being suggested for graduation:", gradSuggestionIDs.length)
    console.log(Object.keys(phCases).length)
    let [filteredCases] = filterCasesById_(phCases,gradSuggestionIDs)
    console.log(Object.keys(phCases).length)
    let [lastRowIndices, lastRowData] = getLastRowData_(filteredCases)
    lastRowData = fixDisplayFormat_(lastRowData,lastRowIndices)
    insertData("GRAD_SUGGESTIONS"+suff,-2,lastRowData,lastRowIndices,1)
  }
  updateGradSuggestions(phIndices,phCases,dbr)
}

function updateGradSuggestions(phIndices, phCases, dbr) {
  let suff = ""
  let suff2 = ""
  if(dbr) {
    suff = "_DBR"
    suff2 = "_TESTING"
  }
  
  if(phIndices == undefined) {
    let phData = getData("PHONE_HOME"+suff2)
    phIndices = phData[0]
    phCases = phData[1]
  }

  updateGradSuggestionData_(phIndices, phCases, dbr)
    
}

function updateGradSuggestionData_(phIndices, phCases, dbr) {
  let suff = ""
  let suff2 = ""
  if(dbr) {
    suff = "_DBR"
    suff2 = "_TESTING"
    phIndices["ga"] = phIndices["ga_weeks"]
    phIndices["ca"] = phIndices["ca_weeks"]
  }

  let [gradSuggIndices,,,gradSuggData] = getData("GRAD_SUGGESTIONS"+suff)
  
  let [inHospIndices, inHospCases] = getData("IN_HOSPITAL"+suff2)
  let notFoundIDs = []
  for(let i=0; i<gradSuggData.length; i++) {
    let id = gradSuggData[i][gradSuggIndices.id_no]
    let phBabyObj = phCases[id]
    let inHospObj = inHospCases[id]
    if(inHospObj == null)
      throw `Cannot update data. ID: ${id} not found in In-Hospital Tab`
    if (phBabyObj == null)
      notFoundIDs.push(id)
    else {
      gradSuggData[i][gradSuggIndices.initial_weight] = inHospObj.initial_weight
      gradSuggData[i][gradSuggIndices.date_baby_reached_44w] = gradSuggData[i][gradSuggIndices.date_baby_reached_44w] || phBabyObj.date
      gradSuggData[i][gradSuggIndices.last_data_entry_date] = phBabyObj.date
      gradSuggData[i][gradSuggIndices.last_staff_reviewed] = gradSuggData[i][gradSuggIndices.last_staff_reviewed] || "Automatic"
      gradSuggData[i][gradSuggIndices.ca] = phBabyObj.ca
      let weightsData = gs_getWeightData_(phBabyObj.case_history,phIndices,inHospObj.case_history,inHospIndices)
      gradSuggData[i][gradSuggIndices.last_weight_date] = weightsData.lastWeightData.date
      gradSuggData[i][gradSuggIndices.last_weight] = weightsData.lastWeightData.weight
      gradSuggData[i][gradSuggIndices.is_this_weight_in_the_last_two_weeks] = phBabyObj.date - weightsData.lastWeightData.date <= 14*(24*60*60*1000)
      let weightGainData = gs_getWeightGainData_(weightsData)
      gradSuggData[i][gradSuggIndices.gmkgday_between_birth_and_4_weeks_ca] = weightGainData.bw_birth_and_44W
      gradSuggData[i][gradSuggIndices.gmday_between_0_and_4_weeks_ca] = weightGainData.bw_40W_and_44W 
      gradSuggData[i][gradSuggIndices.last_recorded_notes] = gs_getLastNotes_(phBabyObj.case_history, phIndices)
    }
  }
  updateDataRows("GRAD_SUGGESTIONS"+suff,gradSuggData)

  if(notFoundIDs.length > 0)
    throw `Cannot Find IDs ${notFoundIDs} in Phone/Home. Updated the rest`
}


function gs_getWeightData_(caseHistory, indices, inHospCaseHistory, inHospIndices) { //Get both last recorded weight data and closest to CA 40W weight data
  
  let lastWeightData = {date: -1, weight: -1}
  let last40WData = {date: -1, weight: -1}
  let ca_val_close = 0

  for(i=caseHistory.length-1; i>=0; i--) {
    let weight = caseHistory[i][indices.weight]
    let ca_val = caseHistory[i][indices.ca]
    let dt = new Date(caseHistory[i][indices.date])
    let source = caseHistory[i][indices.type]

    if (weight > 0 && lastWeightData.weight == -1) { //Only updates the first value found
      lastWeightData.date = dt
      lastWeightData.weight = weight
      lastWeightData.source = source
    }

    if (weight > 0 && 40-ca_val < 40-ca_val_close && ca_val <= 40){
      ca_val_close = ca_val
      last40WData.date  = dt
      last40WData.weight  = weight
      last40WData.source = source
    }
  }
  
  let initialWeightData = {'date': inHospCaseHistory[0][inHospIndices.date],
                           'weight': inHospCaseHistory[0][inHospIndices.initial_weight]}

  return {'lastWeightData': lastWeightData, 'last40WData': last40WData, 'initialWeightData': initialWeightData}
}

function gs_getWeightGainData_(weightsData) {

  let lastWeightDate = weightsData.lastWeightData.date
  let last40WDate = weightsData.last40WData.date
  let initialWeightDate = weightsData.initialWeightData.date

  let lastWeight = weightsData.lastWeightData.weight
  let last40WWeight = weightsData.last40WData.weight
  let initialWeight = weightsData.initialWeightData.weight

  let weightGain
  if(lastWeight > 0 & last40WWeight > 0) {
    daysDiff = (lastWeightDate - last40WDate) / (1000*60*60*24) // Raw date difference is in milliseconds. 
    weightDiff = lastWeight - last40WWeight

    
    if (daysDiff > 0) 
      weightGain = weightDiff/daysDiff
    else 
      weightGain = "Last Weight and Last 40W Weight are from same date"
  }

  else {
    if(lastWeight <= 0) 
      weightGain = "Last Weight Not Found"
    else  
      weightGain = "Last 40W Weight Not Found"
  }
  
  let initialWeightGain
  if(initialWeight > 0 & lastWeight > 0) {
    initialDaysDiff = (lastWeightDate - initialWeightDate) / (1000*60*60*24) // Raw date difference is in milliseconds. 
    initialWeightDiff = lastWeight - initialWeight

    if (initialDaysDiff > 0) 
      initialWeightGain = (initialWeightDiff/(initialWeight/1000))/initialDaysDiff
    else 
      initialWeightGain = "Last Weight and Initial Weight are from same date"
  }

  else {
    if (initialWeight <= 0) 
      initialWeightGain = "Initial Weight Not Found"
    else 
      initialWeightGain = "Last Weight Not Found"
  }  
  
  return {'bw_birth_and_44W': initialWeightGain, 'bw_40W_and_44W': weightGain}
}


function gs_getLastNotes_(caseHistory, indices) {

  let notes
  let tempNotes
  const defaultNote = "Notes:\nBaby Health:\n"
  for(i=caseHistory.length-1; i>=0; i--) {

    tempNotes = caseHistory[i][indices.notes]
    
    if(tempNotes == defaultNote | tempNotes == "") 
      continue
    else {
      notes = tempNotes
      break
    }
  }
  return notes
}

