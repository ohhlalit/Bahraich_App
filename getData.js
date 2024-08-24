/**
 * Gets Data from the given tab. Data is returned in an array with four variables.
 * First one is a dictionary of indices. Second, is another dictionary with baby IDs being key and third is the array version of the cases dictionary (with no keys) and last is the raw data without the headers
 * 
 * @param {string} name
 * @return {Array} datastructure
 */
function getData(name, indicesOnly) {
  console.log("Getting Data for : " + name)
  let tab = getTab_(name)
  console.log(tab.getName())
  const headerRow = eval(name + "_HEADER_INDEX")
  let header
  let sheet_data
  let data
  if(indicesOnly)
    header = tab.getRange(`${headerRow+1}:${headerRow+1}`).getValues()[0]
  else {
    sheet_data = tab.getDataRange().getValues()
    header = sheet_data[headerRow]
    data = sheet_data.slice(headerRow+1)
  }
  let indices = getIndices_(header)
  indices = adjustHindiHeader_(indices, name)
  if(indicesOnly)
    return indices
  let casesById = getCasesGroupedById_(data, indices)
  if(name=="IN_HOSPITAL_TESTING" | name == "PHONE_HOME_TESTING" | name=="IN_HOSPITAL_ARCHIVE_TESTING" | name == "PHONE_HOME_ARCHIVE_TESTING")
    addStaticData_(casesById, indices)
  
  if(name == "IN_HOSPITAL_TESTING" | name == "IN_HOSPITAL_ARCHIVE_TESTING")
    addIntakeData_(casesById, indices)
  let caseArray = getCaseArray_(casesById, indices)
  
  return [indices, casesById, caseArray, data] //Return data in all formats
}

/**
 * Function to get Indices. Essnetially uses getData function but makes the calling a little cleaner
 * @param {String} name - Name of the tab in standard convention
 * @returns - Dictionary containing Indices of the given tab
 */
function getIndices(name) {
  return getData(name, 1)
}
/**
 * Returns last row merged data from in hospital, phone/home and address tabs in LBW tracking in a dictionary format with baby IDs being keys
 * 
 * @param {boolean} includeGradData - If set to true (or 1) Data from Graduate tab is also included
 * @return {Dictionary}
 */
function getMergedData(includeGradData,dbr){

  if(dbr)
    return getMergedData_dbr(includeGradData)

  if (includeGradData)
    console.log("Merging data from phone/home, graduate, in_hospital and address (in that order)")
  else
    console.log("Merging data from phone/home, in_hospital and address (in that order)")
  
  let [phIndices, phData] = getData("PHONE_HOME")
  let [, inHospData] = getData("IN_HOSPITAL")
  let [, addressData] = getData("ADDRESS")
  let mergedData
  if(includeGradData) {
    let [, gradData] = getData("GRADUATE")
    console.log("Merging Phone/home data with Graduate data (technically appending as both of these must have non overlapping IDs")
    mergedData = mergeData_(phData, gradData)
  }
  else
    mergedData = phData

  console.log("Merging Phone Data and In Hospital Data")
  mergedData = mergeData_(mergedData, inHospData)
  console.log("Merging merged Phone Data and In Hospital Data with Address Data")
  mergedData = mergeData_(mergedData, addressData)
  mergedData = addAddressToMergedData_(mergedData)
  mergedData = addLastHVDate_(mergedData, phData, phIndices.type, phIndices.date)
  mergedData = addLastObsCol_(mergedData, phData,"baby_care_items",phIndices.baby_care_items)
  console.log("Finished getting merged data")
  return mergedData
}

function getMergedData_dbr(includeGradData){

  if (includeGradData)
    console.log("Merging data from phone/home, archive, in_hospital (in that order) (DBR")
  else
    console.log("Merging data from phone/home, in_hospital (in that order) (DBR)")
  
  let [phIndices, phData] = getData("PHONE_HOME_TESTING")
  let [, inHospData] = getData("IN_HOSPITAL_TESTING")
  
  let mergedData
  if(includeGradData) {
    console.log("Merging Phone/home data with Graduate data (technically appending as both of these must have non overlapping IDs")
    mergedData = mergeData_(phData, getData("PHONE_HOME_ARCHIVE_TESTING")[1])
    mergedData = mergeData_(mergedData, getData("IN_HOSPITAL_ARCHIVE_TESTING")[1])
  }
  else
    mergedData = phData

  console.log("Merging Phone Data and In Hospital Data")
  mergedData = mergeData_(mergedData, inHospData)
  console.log("Merging merged Phone Data and In Hospital Data with Address Data")
  mergedData = addLastHVDate_(mergedData, phData, phIndices.type, phIndices.date)
  
  console.log("Finished getting merged data (DBR)")
  return mergedData
}

/**
 * Converts given casesById data into an a 2-D array with just the last rows
 * 
 * @param {Dictionary} casesById - data in cases by id format
 * 
 * @return {Array} - Second element of the array is the last row data in a 2D array format. First element is the corresponding indices.
 */

function getLastRowData_(casesById, lastRowPos) {
  let data = []
  let ids = Object.keys(casesById)
  lastRowPos = lastRowPos || 0 //If last row position is not specified, assume it would be the actual last row (therefore adjustment is 0)
  for(let i=0; i<ids.length; i++) {
    const caseData = casesById[ids[i]].case_history
    const row = getElement_(caseData[caseData.length-1+lastRowPos])
    data.push(row)
  }

  const indices = getElement_(casesById[ids[0]].indices)

  return [indices, data]
}
/**
 * Converts a given header into a dictionary with header titles as keys and column index as value.
 * The header titles are converted to lower case with spaces replaced by "_" and brackets removed
 * 
 * @param {Array} header
 * @return {Dictionary}
 */
function getIndices_(header) {
  let indices = {}
  
  for(let i=0; i<header.length; i++) {
    let column = header[i]
    
    if (column == "") 
      continue
    
    else {
      let index = parseColumn_(column)
      if (indices[index] == undefined)
        indices[index] = i
      else
        console.error(`The column titled "${column}" is repeated. Please ensure all column titles are unique`)
    }
  }
  console.log("Total No. of Columns in the given sheet : " + Object.keys(indices).length)
  return indices
}

/**
 * Replaces some hindi column titles to have consistency across sheets
 * 
 * @param {Dictionary} indices
 * @param {String} name
 * @return {Dictionary}
 */

function adjustHindiHeader_(indices, name) {
  
  if(name.includes("CASE_SEARCH")) {
    indices["pma"] = indices['pma_date_of_entry']
    delete indices['pma_date_of_entry']
  }

  if(name.includes("SUPPLIES_RETURN")) {
    indices["mother"] = indices['माता_का_नाम']
    delete indices['माता_का_नाम']
    indices["father"] = indices['पिता_का_नाम']
    delete indices['पिता_का_नाम']
    indices["address"] = indices['पता']
    delete indices['पता']
  }
  
  else if(name.includes("FORMULA")) {
    indices["delivery_date"] = indices['तारीख_डिलीवरी_हुई']
    delete indices['तारीख_डिलीवरी_हुई']
    indices["which_formula"] = indices['कौन_सा_फार्मूला']
    delete indices['कौन_सा_फार्मूला']
    indices["mother"] = indices['माता_का_नाम']
    delete indices['माता_का_नाम']
    indices["father"] = indices['पिता_का_नाम']
    delete indices['पिता_का_नाम']
  }

  else if(name.includes("COMPLIMENTARY_FEEDING")) {
    indices["mother"] = indices['माता_का_नाम']
    delete indices['माता_का_नाम']
    indices["father"] = indices['पिता_का_नाम']
    delete indices['पिता_का_नाम']
  }
  
  // if(name.includes("DBR") && !(name.includes("DOCTORS_REPORT"))) {
  //   if(indices["ga"] == undefined & indices["ga_weeks"] != undefined)
  //     indices["ga"] = indices["ga_weeks"]
  //   if(indices["ca"] == undefined & indices["ca_weeks"] != undefined)
  //     indices["ca"] = indices["ca_weeks"]
  // }
  return indices
}
/**
 * Parses a given column title into an appropriate dicitonary name that can be references in the code later
 * Primarily removes special characters, converts the tittle to snake case (all lower case with spaces replaced by underscore)
 * 
 * @param {string} column
 * @return {string}
 */
function parseColumn_(column) {

  column = column.toLowerCase() //Convert to Lower Case

  const removeCharacters = ["\n","’","<",">", "?", "/","\"", "(", ")", "[", "]",".", ";", "\'", ",",":", "'","%", "`"] //Special Characters to be removed
  
  //Remove any information after brackets (not required to produce unique column names (expectedly))
  let brace_start = column.indexOf("(")
  if(brace_start != -1 & column.slice(0,2) != "ga") { //Don't remove bracket information for ga. Currently it has ga (weeks) and ga (days)
    let brace_end = column.indexOf(")")
    if (brace_end - brace_start > 17) //Allow bracketed information if not detailed, less than 13 characters (primarily to remove notes description)
      column = column.slice(0,brace_start) + column.slice(brace_end+1) 
  }

  for(let i = 0; i<removeCharacters.length; i++) { //Remove characters
    column = column.replaceAll(removeCharacters[i], "")
  }

  column = column.trim() //Remove trailing spaces
  column = column.replaceAll(" ", "_") //Convert to snake case
  
  return column
}


/**
 * Groups the given data into a dictionary with ID No of the baby being keys
 * Each dictionary contains a dictionary with different information corresponding to the baby
 * 
 * The different elements that can be accessed directly are: All last row variables; the entire case history, keys (to be used for the 2D array)
 * 
 * @param {Array} data
 * @param {Dictionary} indices
 * @return {Dictionary}
 */

function getCasesGroupedById_(data, indices) {

  let cases = {}
  for (let i=0; i<data.length; i++) {
    
    let id = data[i][indices.id_no]
    if (cases[id] == undefined){    
      cases[id] = getCaseById_(data, indices, id, i)
    }
  }
  console.log("Total No. of Unique Babies in the given sheet : " + Object.keys(cases).length)
  return cases
}

/**
 * Returns the dictionary containing information and the last occuring index (as determined by date) for the given baby ID
 * 
 * @param {Array} data
 * @param {Dictionary} indices
 * @param {number} id
 * @param {number} startingIndex
 * @return {Dictionary}
 */
function getCaseById_(data, indices, id, startingIndex) {
  
  let caseData = {}
  let caseHistory = []

  for(let i=startingIndex; i<data.length; i++){ //Store sorted case history for the baby
    let currentId = data[i][indices.id_no]
    if (currentId == id) { //Only store information if the id equals the given id
      caseHistory.push(data[i])
    }
  }
  caseHistory = caseHistory.sort((a,b)=> a[indices.date] - b[indices.date]) //Sort on date
  caseData.case_history = caseHistory
  
  //Enter information for the last row
  let lastIndex = caseHistory.length-1
  keys = Object.keys(indices)
  for(let i=0; i< keys.length;i++) {
    let key = keys[i]
    caseData[key] = caseHistory[lastIndex][indices[key]]
  }

  //Enter indices as a key
  caseData["indices"] = getElement_(indices)

  return caseData
}


/**
 * Converts the given dictionary of cases (with baby id being keys) into an array for HTML use as lists
 * To avoid any HTML problem all data is converted to primitive type (values). This change majorly applies to how dates are handled.
 * It also attaches the indices map to each case for future use if any particular case is used and it's history is needed
 * 
 * @param {Dictionary} cases
 * @return {Array}
 */

function getCaseArray_(cases) {

  keys = Object.keys(cases)
  let caseArray = []
  for(let i=0; i<keys.length;i++) {
    let caseData = getElement_(cases[keys[i]], 1)
    caseData.case_history = getValue_(caseData.case_history)
    const attributes = Object.keys(caseData)
    for(let j=0; j<attributes.length; j++) {
      if (attributes[j] != "case_history")
        caseData[attributes[j]] = caseData[attributes[j]].valueOf()
    }
    
    caseArray.push(caseData)
  }
  for (let i = 0; i < caseArray.length; i++) {
    if (isNaN(caseArray[i].date_to_follow_up)) {
      caseArray[i].date_to_follow_up = ""
    }
  }
  
  return caseArray
}

/**
 * Merges data for two given datasets with IDs being keys for them
 * Keeps the union of IDs for both dataset. If same column exists in both datasets, the one from master takes precedence
 * 
 * @param {Dictionary} masterData
 * @param {Dictionary} secondaryData
 * @param {Dictionary}
 */

function mergeData_(masterData, secondaryData) {
  
  const ids_master = Object.keys(masterData)
  const ids_secondary = Object.keys(secondaryData)
  const ids = [...new Set([...ids_master, ...ids_secondary])]

  let mergedData ={}
  let addedKeys = []
  for(let i=0; i<ids.length;i++) {
    let id = ids[i]
    let masterRow = masterData[id]
    let secondaryRow = secondaryData[id]
    let row = {}
    if (masterRow != undefined) {
      const keys = Object.keys(masterRow)
      for(let j=0; j<keys.length; j++) //Go over all entries in primary and add all
        row[keys[j]] = masterRow[keys[j]]
      }

    if (secondaryRow != undefined) {
      const keys = Object.keys(secondaryRow)
      for(let j=0; j<keys.length; j++) { //Go over all entries in secondary and add whichever is not already present (data for the same column from master takes precedence)
        if(row[keys[j]] == undefined) {
          row[keys[j]] = secondaryRow[keys[j]]
          if(addedKeys.indexOf(keys[j]) == -1) //Store whichever keys were added from the secondary data
            addedKeys.push(keys[j])
        }
      }
    }

    delete row.case_history //Remove case history as it is not relevant with merged data
    delete row.indices
    mergedData[id] = row
  }
  console.log("Added these keys from secondary to master data : " + addedKeys)
  return mergedData
}

function getIDs(name) {
  console.log("Getting IDs for", name)
  let [,dataById,,] = getData(name)
  let ids = Object.keys(dataById)
  return ids
}


/**
 * Add static data to the casesById for Hospital/Phone-home tabs to make them similar to the past version
 * @param {Dictionary} casesById - caseById
 * @param {Dictionary} indices - Inidces of the casesById passed
 */
function addStaticData_(casesById, indices) {

  let [staticIndices,staticCasesById] = getData("STATIC")
  
  for (let [id, caseData] of Object.entries(casesById)) {
    let staticData = staticCasesById[id]
    if(staticData == undefined) {
      console.log("Cannot find data for:", id)
      continue
    }
    for(staticAttribute in staticIndices) {
      if (caseData.indices[staticAttribute] == undefined) {
        caseData[staticAttribute] = staticData[staticAttribute]
        let caseHistory = caseData.case_history
        indices[staticAttribute] = caseHistory[0].length
        caseData.indices[staticAttribute] = caseHistory[0].length
        for(let i=0; i<caseHistory.length; i++)
          caseHistory[i].push(staticData[staticAttribute])
        caseData.case_history = caseHistory
      }
    }
  }

}

function addIntakeData_(casesById, indices) {

  let [intakeIndices,intakeCasesById] = getData("INTAKE")
  
  for (let [id, caseData] of Object.entries(casesById)) {
      let intakeData = intakeCasesById[id]
      if(intakeData == undefined) {
        console.log("Cannot find data for:", id)
        continue
      }

      let caseHistory = caseData.case_history
      for(let i=0; i<caseHistory.length; i++) {
        if (String(caseHistory[i][indices.type_of_form]).toLowerCase() == "intake") {
          for(intakeAttribute in intakeIndices) {
            if (caseData.indices[intakeAttribute] == undefined) {
              indices[intakeAttribute] = caseHistory[0].length
              caseData.indices[intakeAttribute] = caseHistory[0].length
              caseHistory[i].push(intakeData[intakeAttribute])
            }
          }
        }
        break
      }
      caseData.case_history = caseHistory
  }
}

/**
 * The function adds information for the twins if any of the baby to the baby object. It adds two attributes to each element: number_twins, and case_obj_array.
 * The case_obj_array contains all the case objects for the twins. If there are no twins it would contain the current object itself only.
 * @param {Array} dataArray - An Array of Baby Objects
 */
function appendTwinData_(dataArray) {

  for(let i=0; i<dataArray.length; i++) {
    let dataObj = dataArray[i]
    let twinObjects = []
    twinObjects.push(getElement_(dataObj)) //Add itself to the twin objects array
    if(dataObj.twin_id) {
      for(let j=0; j<dataArray.length; j++) {
        if(i == j)
          continue
        const currentObj = dataArray[j]
        if(dataObj.twin_id == currentObj.twin_id)
          twinObjects.push(currentObj)
      }
    }

    if(twinObjects.length == 1)
      dataObj["case_obj_array"] = twinObjects
    else {
      dataObj["case_obj_array"] = []   
      for(let i=0; i<twinObjects.length; i++)
        dataObj["case_obj_array"][twinObjects[i].birth_order - 1] = twinObjects[i]
    }

    dataObj["number_twins"] = dataObj.case_obj_array.length
  }
}