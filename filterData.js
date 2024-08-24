/**
 * Splits the provided casesById into casesById for ids that are in the provided array and casesByID that isn't in the provided array
 * Also provides an array with leftover ids which may not have been present in the provided data at all
 * Return order : [casesInArray, casesNotInArray, notFoundIds]
 * 
 * @param {Dictionary} casesById
 * @param {Array} idArr
 * @return{Array}
 */
function filterCasesById_(casesById, idArr){
  console.log("Filtering Cases By Id Data")
  console.log("Splitting Data by IDs : " + idArr)

  let idArray = [...idArr]
  let casesInArrayById = {}
  let casesNotInArrayById = {}
  
  let ids = Object.keys(casesById)
  for(let i=0; i<ids.length; i++) {
    const id = ids[i]
    const caseObj = casesById[id]

    //If the id is part of idArray then move this id, else keep   
    if (idArray.indexOf(id) > -1) {
      //console.log("Filtering ID: " + id)
      casesInArrayById[id] = caseObj
      idArray.splice(idArray.indexOf(id),1)
    }
    else  
      casesNotInArrayById[id] = caseObj
  }
  
  console.log("Total Babies in Data:" + (ids.length))
  console.log("Babies corresponding to provided IDs :" + Object.keys(casesInArrayById).length)
  console.log("Rows NOT corresponding to provided IDs :" + Object.keys(casesNotInArrayById).length)

  return [casesInArrayById, casesNotInArrayById, idArray]
}



/**
 * Combines case history data into 2-D data for ids that are in the provided array and data that isn't in the provided array
 * Also provides an array with leftover ids which may not have been present in the provided data at all
 * Return order - [dataInArray, dataNotInArray, idsNotInArray]
 * 
 * @param {Dictionary} casesById - Source data to be filtered
 * @param {Array} idArr - ids to be filtered on. If not provided, simply returns appended case history of all present ids
 * @return{Array}
 */
function filterCaseHistoryData_(casesById, idArr){
  let idArray
  if(idArr == undefined){
    console.log("Generating Case History Data for all present Ids")
    idArray = Object.keys(casesById)
  }
  else {
    console.log("Filtering Case History Data")
    console.log("Splitting Data by IDs : " + idArr)
    idArray = [...idArr]
  }

  
  let dataInArray = []
  let dataNotInArray = []

  
  let ids = Object.keys(casesById)
  for(let i=0; i<ids.length; i++) {
    const id = ids[i]
    const caseData = casesById[id].case_history

    //If the id is part of idArray then move this id, else keep   
    if (idArray.indexOf(id) > -1) {
      //console.log("Filtering ID: " + id)
      dataInArray = [...dataInArray, ...caseData]
      idArray.splice(idArray.indexOf(id),1)
    }
    else  
      dataNotInArray = [...dataNotInArray, ...caseData]
  }
  
  console.log("Total Rows in Data:" + (dataInArray.length + dataNotInArray.length))
  console.log("Rows corresponding to provided IDs :" + dataInArray.length)
  console.log("Rows NOT corresponding to provided IDs :" + dataNotInArray.length)

  return [dataInArray, dataNotInArray, idArray]
}

/**
 * Splits the provided single row case data by ID (this would be soemthing like what is returned from getMergedData()) into two 2-D arrays: one with the IDs contained in the provided ID array and the other not contained in the ID array.
 * Also, provides a dictionary of indices referencing which column data is at what index in the returned data arrays
 * An array of IDs that were not found in the array is also provided
 * Return order - [dataIndices, dataInArray, dataNotInArray, idsNotFound]
 * 
 * @param (Dictionary) flatDataById
 * @param {Array} idArr
 * @return {Array}
 */
function filterSingleRowData_ (singleRowDataById, idArr) {
  console.log("Filtering Single Row Data")
  console.log("Splitting Data by IDs : " + idArr)
  
  let idArray = [...idArr]
  let dataInArray = []
  let dataNotInArray = []
  let dataIndices = {}
  let numCols = -1
  const ids = Object.keys(singleRowDataById)
  
  for(let i=0; i<ids.length; i++) {
    const id = ids[i]
    
    let row = []

    const rowData = singleRowDataById[id]
    const cols = Object.keys(rowData)

    for(let j=0; j<cols.length;j++) {
      const col = cols[j]
      const val = rowData[col]
      
      if(dataIndices[col] == undefined) //Assign an index for any new column
        dataIndices[col] = ++numCols //Starts with 0 and keeps incrementing
      
      row[dataIndices[col]] = val
    }

    if(idArray.indexOf(id) > -1) {
      console.log("Filtering ID: " + id)
      dataInArray.push(row)
      idArray.splice(idArray.indexOf(id),1)
    }
    else
      dataNotInArray.push(row)
  }
  
  console.log("Total IDs in Data:" + (dataInArray.length + dataNotInArray.length))
  console.log("Total IDs corresponding to provided IDs :" + dataInArray.length)
  console.log("Total IDs not corresponding to provided IDs :" + dataNotInArray.length)

  dataInArray = balance2dArray_(dataInArray)
  dataNotInArray = balance2dArray_(dataNotInArray)
  return [dataIndices, dataInArray, dataNotInArray, idArray]
}
/**
 * Find ids that contain the provided value in the provided column index (it doesn't use the name of the column but index, so must use the respective indices). 
 * The value to be matched can be looked throughout all rows of the case history or just the last row. The match can be specified to be exact or partial.
 * Also returns the ids that do not match the criteria.
 * Return order - [matchingIds, notMatchingIds]
 * 
 * @param {Dictionary} casesById
 * @param {colIndex} integer
 * @param {matchValue} anything
 * @param {lastRow} integer
 */
function filterByColumnValue(casesById, colIndex, matchValue, lastRow, partialMatch) {

  console.log(`Filtering by matching column index ${colIndex} to ${matchValue} with partial match turned to ${partialMatch}`)
  matchValue = String(matchValue) //Convert to string to ensure match works properly
  let matchingIds = []
  let nonMatchingIds = []
  
  let ids = Object.keys(casesById)

  for(let i=0; i<ids.length; i++) {
    let id = ids[i]

    let caseData = casesById[id].case_history
    let flagFound = 0
    for(let j = caseData.length-1; j>=0; j--) {

      let colValue = String(caseData[j][colIndex]) //Convert to string to ensure match works properly
      
      if(colValue == matchValue | (partialMatch == 1 & colValue.indexOf(matchValue) > -1)) {
        matchingIds.push(id)
        flagFound = 1
        break
      }

      if(lastRow == 1)
        break
    }
    if (flagFound == 0)
      nonMatchingIds.push(id)
  }

  return [matchingIds, nonMatchingIds]

}

/**
 * Returns the IDs that equal the column value for the provided column and those that don't. It can check for both just lastRow values as well as any value for the ID
 * 
 * @param {Dictionary} casesById
 * @param {colName} string
 * @param {matchValue} anything
 * @param {lastRow} integer
 */
function filterByCaseAttributeValues_(casesById, colName, matchValue, partialMatch) {
  partialMatch = partialMatch || 0
  console.log(`Filtering by matching ${colName} to ${matchValue} with partial match turned to ${partialMatch}`)
  let matchingIds = []
  let nonMatchingIds = []

  let ids = Object.keys(casesById)

  for(let i=0; i<ids.length; i++) {
    const id = String(ids[i])
    let colValue = casesById[id][colName]
    if(colValue == matchValue | (partialMatch == 1 & colValue.indexOf(matchValue) > -1))
      matchingIds.push(id)
    else
      nonMatchingIds.push(id)
  }
  console.log("Matches found for Ids:", matchingIds)
  console.log("Matches NOT found for Ids:", nonMatchingIds)
  return [matchingIds, nonMatchingIds]
}