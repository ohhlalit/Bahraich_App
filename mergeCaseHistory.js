/**
 * Given two case objects (a dictionary object with case_history and respective indices field), it merges them together to produce a merged case object with the union of the indices of both the objects. It uses 'date' as the matching field. In case multiple date rows are present in the objects, it matches the first one and moves on.
 * 
 * @param {Dict} primaryCases - The primary data in caseById format (second return parameter of getData(..)). This would serve as the primary data. So if two rows with the same date are found. Data from this source will take precedence for conflicting (non blank) columns
 * @param {Dict} primaryIndices - Indices of the primary data source (first return parameter of getData(..))
 * @param {Dict} secondaryCases - The secondary data in caseById format (second return parameter of getData(..)). This would serve as the secondary data. So if two rows with the same date are found. Data from this source will be OVERWRITTEN for conflicting columns
 * @param {Dict} secondaryIndices - Indices of the secondary data source (second return parameter of getData(..))
 * @param {Array} idArray - This is the array of ids for which the merge must be performed. If omitted, a merge would be performed for all ids
 *  
 * @return {Array} - A 2-dimensional array of the merged case history
 */
function mergeCaseHistoryData(primaryCases, primaryIndices, secondaryCases, secondaryIndices, idArray) {
 
  let mergedIndices = mergeIndices_(primaryIndices, secondaryIndices)

  let ids = getArrayUnion_(Object.keys(primaryCases), Object.keys(secondaryCases)) //Get a unique list of all ids in both datasets
  if(idArray === undefined)
    idArray = ids
  
  console.log(`Merging data for ${idArray.length} ids`)
  let mergedDataById = {}

  for(let i=0; i<ids.length; i++) {
    let id = ids[i]
    if(idArray.indexOf(id) != -1) { //If idArray is provided then current id must be present in it
      console.log("Merging Data for ID =>", id)
      let caseHistory
      let print = 0

      caseHistory = mergeCaseData_(primaryCases[id], secondaryCases[id], mergedIndices, print)
      mergedDataById[id] = {}
      mergedDataById[id]['case_history'] = caseHistory
      mergedDataById[id]['indices'] = mergedIndices
    }
  }

  // let mergedIds = Object.keys(mergedDataById)
  // let caseHistoryData = []
  // for(let i=0; i<mergedIds.length; i++)
  //   caseHistoryData = [...caseHistoryData, mergedDataById[mergedIds[i]].case_history]
  
  console.log(`Found and merged data for ${Object.keys(mergedDataById).length} ids out of the requested  ${idArray.length} ids`)
  return [mergedIndices, mergedDataById]
}

/**
 * Returns a dictionary with the merged indices. Only to be used with mergeCaseHistoryData
 */

function mergeIndices_(primaryIndices, secondaryIndices) {
  primaryIndices = Object.keys(primaryIndices)
  secondaryIndices = Object.keys(secondaryIndices)
  // console.log("Primary Indices:", primaryIndices)
  // console.log("Secondary Indices:", secondaryIndices)
  let indices = {}
  let index = 0
  for(let i=0; i<primaryIndices.length; i++)
    indices[primaryIndices[i]] = index++
  for(let i=0; i<secondaryIndices.length; i++){
    if(indices[secondaryIndices[i]] == undefined)
    indices[secondaryIndices[i]] = index++ //If undefined, take the value of the second
  }

  // console.log("Merged Indices ==> ", indices)
  return indices
}

/**
 * Returns merged case history data. Only to be used with mergeCaseHistoryData. Uses date as the merging field
 */
function mergeCaseData_(primaryCaseObj, secondaryCaseObj, mergedIndices, print) {
  
  let field = "date"

  let primaryIndex = 0
  let secondaryIndex = 0

  //Initialise the case histories
  let primaryCaseHistory
  let secondaryCaseHistory

  let primaryIndices
  let secondaryIndices

  if (primaryCaseObj == undefined & secondaryCaseObj == undefined)
    throw "Cannot merge case histories. Both case histories are missing."
  
  if(primaryCaseObj == undefined)
    primaryCaseHistory = ""
  else {
    primaryCaseHistory = primaryCaseObj.case_history
    primaryIndices = primaryCaseObj.indices
  }
  
  if(secondaryCaseObj == undefined)
    secondaryCaseHistory = ""
  else {
    secondaryCaseHistory = secondaryCaseObj.case_history
    secondaryIndices = secondaryCaseObj.indices
  }
  
  let mergedCaseHistory = []

  if(print) console.log(`Primary Data is of length ${primaryCaseHistory.length} while secondary of ${secondaryCaseHistory.length}`)
  //The loop runs until both case histories are exhausted. If one is undefined, it will simply return the other case history rearrange per the new merged indices
  let lastFieldVal //To merge with the last row
  while(primaryIndex < primaryCaseHistory.length | secondaryIndex < secondaryCaseHistory.length){

    let row = []

    let primaryRow = primaryCaseHistory[primaryIndex]
    let secondaryRow = secondaryCaseHistory[secondaryIndex]
    if(print) console.log("Primary row =>", primaryRow)
    if(print) console.log("Secondary row =>", secondaryRow)
    if (primaryRow == undefined & secondaryRow == undefined)
      throw "Cannot merge. Both rows are undefined. Please Check"
    else if(primaryRow == undefined) {
      row = reArrangeRow_(secondaryRow, secondaryIndices, mergedIndices)
      secondaryIndex++
    }
    else if(secondaryRow == undefined) {
      row = reArrangeRow_(primaryRow, primaryIndices, mergedIndices)
      primaryIndex++
    }
    else {
      let primaryFieldVal = primaryRow[primaryIndices[field]].valueOf()
      let secondaryFieldVal = secondaryRow[secondaryIndices[field]].valueOf()
      if(String(primaryFieldVal).trim() == "" | String(secondaryFieldVal).trim() == "") {
        if (String(primaryFieldVal).trim() == "" & String(secondaryFieldVal).trim() != "")
          row = reArrangeRow_(secondaryRow, secondaryIndices, mergedIndices)
        else if (String(primaryFieldVal).trim() != "" & String(secondaryFieldVal).trim() == "")
          row = reArrangeRow_(primaryRow, primaryIndices, mergedIndices)
        //If both are blank, just move forward
        primaryIndex++
        secondaryIndex++
      }
      else if(primaryFieldVal == secondaryFieldVal){
        if(print) console.log("Merging rows when date is:", primaryRow[primaryIndices[field]])
        row = mergeCaseRow_(primaryRow, secondaryRow, primaryIndices, secondaryIndices, mergedIndices)
        primaryIndex++
        secondaryIndex++
      }
      else if (primaryFieldVal < secondaryFieldVal) {
        if(print) console.log(`Keeping primary with primary value: ${primaryRow[primaryIndices[field]]} and secondary value: ${secondaryRow[secondaryIndices[field]]}`)
        row = reArrangeRow_(primaryRow, primaryIndices, mergedIndices)
        primaryIndex++
      }
      else {
        if(print) console.log(`Keeping secondary with primary value: ${primaryRow[primaryIndices[field]]} and secondary value: ${secondaryRow[secondaryIndices[field]]}`)
        row = reArrangeRow_(secondaryRow, secondaryIndices, mergedIndices)
        secondaryIndex++
      }
    }
    if(row[mergedIndices[field]].valueOf() == lastFieldVal)
      mergedCaseHistory[mergedCaseHistory.length-1] = mergeCaseRow_(row,mergedCaseHistory[mergedCaseHistory.length-1],mergedIndices,mergedIndices,mergedIndices)
    else
      mergedCaseHistory.push(row)
    lastFieldVal = row[mergedIndices[field]].valueOf()

  }
  if(print) console.log(`A total of ${mergedCaseHistory.length} rows found`)
  return mergedCaseHistory
}

/**
 * Merges case row data for the given two rows. To be used only with mergeCaseData_(...)
 */
function mergeCaseRow_(primaryRow, secondaryRow, primaryIndices, secondaryIndices, mergedIndices) {

  let masterKeys = Object.keys(mergedIndices)

  let row = []
  for(let i=0; i<masterKeys.length; i++){
    let masterKey = masterKeys[i]
    //Enter value from primary row. If it is undefined (or blank) enter the value from secondary row
    if (primaryRow[primaryIndices[masterKey]] != undefined & primaryRow[primaryIndices[masterKey]] != '')
      row[mergedIndices[masterKey]] = primaryRow[primaryIndices[masterKey]] 
    else if (secondaryRow[secondaryIndices[masterKey]] != undefined & secondaryRow[secondaryIndices[masterKey]] != '') 
      row[mergedIndices[masterKey]] = secondaryRow[secondaryIndices[masterKey]]
    else
      row[mergedIndices[masterKey]] = ''

  }

  return row
}

/**
 * Rearranges a row to match the provided new indices
 */

function reArrangeRow_(rowData, oldIndices, newIndices) {

  let keys = Object.keys(newIndices)

  let row = []
  for(let i=0; i<keys.length; i++){
    let key = keys[i]
    //If the new key is missing (undefined), substitute with a blank
    if(rowData[oldIndices[key]] != undefined & rowData[oldIndices[key]] != '')
      row[newIndices[key]] = rowData[oldIndices[key]]
    else
      row[newIndices[key]] = ''
  }

  return row
}