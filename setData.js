
function updateColumnsById_(casesById, indices, idArray, colArray, valueArray, missIdOk) {
  console.log("Updating Columns : " + colArray + " with values : " + valueArray + " for IDs : " + idArray)
  
  if (colArray.length != valueArray.length) 
    throw "Cannot Add Columns: Please provide same number of columns and values"
  
  let ids = Object.keys(casesById)
  for(let i=0; i<idArray.length; i++) {
    let id = idArray[i]
    if(ids.indexOf(id) > -1) {
      let caseHistory = casesById[id].case_history
      for(let j=0; j<colArray.length; j++) {
        let index = indices[colArray[j]]
        if (index == undefined)
          throw `Cannot update values. Column :${colArray[j]} not found in indices`
        for(let k=0; k<caseHistory.length; k++)
          casesById[id].case_history[k][index] = valueArray[j]
        casesById[id][colArray[j]] = valueArray[j]
      }
    }
    else if(missIdOk != 1)
      throw `Cannot update. Id: ${id} not found in data`
  }
  return casesById
}




/**
 * Updates the provided columns with the provided values for the last row of the given IDs in the provided tab
 * 
 * @param {string} name
 * @param {Array} idArray
 * @param {Array} colArray
 * @param {Array} valueArray
 * @return {void}
 */

function updateLastRowColumnsById_(name, idArray, colArray, valueArray, missIdOk) {
  console.log("Updating Columns : " + colArray + " with values : " + valueArray + " for the last Rows of IDs : " + idArray + " in tab : " + name)
  
  let [indices, casesById] = getData(name)
  let [dataToChange, dataToNotChange, idsNotFound] = filterCaseHistoryData_(casesById,idArray)

  if(idsNotFound.length > 0) {
    if (missIdOk != 1)
      throw "Cannot Update Data in : " + name + ". The following IDs not found : " + idsNotFound
    else 
      console.log("Updating IDs. The Follwing IDs not found: " + idsNotFound)
  }
  let [updatedData] = updateLastRowColumns_(dataToChange,indices,colArray,valueArray)
  
  updatedData = [...updatedData,...dataToNotChange]
  let error = checkArrayColumnConsistency(updatedData)
  if(error == "error"){
    throw `updateLastRowColumnsById_ failed for ${name}. due to unconsistent columns, check column names`
  }
  
  updateDataRows(name,updatedData,indices,1)
  // clearData_(name)
  // insertData(name, -1, updatedData)
  console.log("Updated Data for " + name)
}


/**
 * Returns data and indices with an updated value of the provided columns in the last row. If provided column doesn't exist then it adds the column and returns it with values inserted in last row
 * Required id_no to be one of the columns
 * @param {Array} data
 * @param {Dictionary} indices
 * @param {Array} newCols
 * @param {Array} colValues
 * @return {Array} [data, indices] returned
 */

function updateLastRowColumns_(dataArr, dataIndices, colArray, valueArray){
  
  if (colArray.length != valueArray.length) throw "Cannot Add Columns: Please provide same number of columns and values"
  if (dataArr == undefined) {
    console.log("No data to update")
    return [[],{}]
  }
  if (dataArr.length == 0) {
    console.log("No data to update")
    return [[],{}]
  }
  

  console.log("Updating Columns : " + colArray + " with : " + valueArray + " respectively")
  
  let indices = JSON.parse(JSON.stringify(dataIndices)) //Create deep copy to not affect original indices
  let dataArray =[...dataArr]
  let numIndices = dataArray[0].length
  
  let [,lastRowIndices] = getFirstAndLastRowIndices_(dataArray, indices.id_no) //Only need last row indices

  for(let i=0; i<colArray.length; i++) {
    const col = colArray[i]
    if (indices[col] == undefined)
      indices[col] = ++numIndices //Add Column
    
    for(let j=0; j<lastRowIndices.length;j++) {
      const index = lastRowIndices[j]
      dataArray[index][indices[col]] = valueArray[i]
    }
  }
  
  dataArray = balance2dArray_(dataArray) //If columns were added the array would be unbalanced, so balancing for that
  return [dataArray, indices]
}


/**
 * Updates the data for the given tab with the given data
 * Assumes data is concordant with the existing format
 * 
 * @param {string} name
 * @param {Array} data
 * @return {void}
 */

function updateDataRows(name, data, dataIndices, force) {
  console.log("Updating Data for " + name)
  if(force && name.includes("IN_HOSPITAL"))
    complete2DArray(data,dataIndices)
  if(checkArrayColumnConsistency(data)) //Check if all rows in data have the same number of columns. If not throw error
    throw `Update failed for ${name}. due to inconsistent row lengths. If you were adding data/modifying columns, check that all rows have column added to them.`
  
  clearData_(name)
  if (dataIndices == undefined)
    insertData(name, -1, data)
  else
    insertData(name, -1, data, dataIndices, force)
  console.log("Updated Data for " + name)
}

//Updates files
function updateDataRowWithCasesById(name,casesByID,dataIndices,force,orderedIds) {

  console.log("Getting case history data")
  let [data] = filterCaseHistoryData_(casesByID)
  
  //Ensure the sort is maintained is orderedIds are provided
  if(orderedIds != undefined && orderedIds.length > 0) {
    let orderKey = [{column: dataIndices.id_no, ascending: 'custom', blanksAtBottom: true, sortArray: orderedIds}]
    data = sortData(data,orderKey)
  }

  updateDataRows(name,data,dataIndices,force)

}

/**
 * Adds the given data in the destination starting from the row index provided. If an index of -1 is provided, then data would be added at the bottom
 * If data indices are provided program will attempt match indices with destination indices. An error would be produced in case of a mismatch
 * However, if the force option is set to 1, the program will bypass the mismatch and would set the data in the destination inserting data only for columns that exist in both data and destination
 * 
 * @param {string} destName
 * @param {Array} data
 * @param {integer} rowNum - If -1, inserted at bottom and if -2 inserted at top
 * @param {Dictionary} dataIndices
 * @param {Integer} force
 * @param {Dictionary} destIndices
 * @param {integer} overwrite - If set to 1, no rows are inserted and data overwrites the provided rowNum. Ignores if rowNum is -1 or -2
 * @return {void}
 */

function insertData(destName, rowNum, data, dataIndices, force, destIndices, overwrite) {

  //Ignore the overwrite option if row number is -1 or -2
  if (rowNum < 0)
    overwrite = 0
  
  if (data.length == 0) {
    console.log("No data. Skipping Insert")
    return
  }
  
  let errorCode = 0
  
  //If data indices are provided, match indices between source and destination
  //If there is a mismatch, check if force option is provided, if so, rearrange data and then proceed with setting data
  if (dataIndices != undefined) {
    if (destIndices == undefined) 
      destIndices = getData(destName,1)
    
    errorCode = matchIndices_(dataIndices, destIndices)
    
    //Force option not provided and there is error in match. Stop and throw error
    if (force == 1) {
      if(errorCode != 0) {
        data = reArrangeData_(data, dataIndices, destIndices)
      }
    }
    else {
      if(errorCode == 1) {
        throw ("Cannot Set Data: Unequal Number of Columns")
      }
      if(errorCode == 2) {
        throw ("Cannot Set Data: Column Headers don't match")
      }
    }
  }

  //Add data
  destTab = getTab_(destName)
  
  //Remove any filters if they exist
  let filter = destTab.getFilter()
  if(filter != null)
    filter.remove()
  const startCol = 1
  
  
  if(rowNum == -1) {
    rowNum = destTab.getLastRow() + 1
    //Add check for if the row exists, if not add a row and then proceed
  }
  
  if(rowNum == -2)
    rowNum = eval(destName +"_HEADER_INDEX") + 2
  
  console.log("Inserting Data in " + destName + " at Row " + rowNum)

    
  //Check if rows can be inserted. If there is row out of bounds error, add extra row and then proceed
  if (overwrite != 1) {
    try {
      destTab.insertRowsBefore(rowNum, data.length)
    } catch (e) {
      console.log(e.message)
      if (e.message == "Those rows are out of bounds.") {
        console.log("Error Caused --> " + e)
        console.log("Inserting blank row to resolve")
        destTab.insertRowAfter(rowNum-1)
        console.log("Clearing any carryover content from the inserted row")
        destTab.getRange(`${rowNum}:${rowNum}`).clearContent()
        
        console.log("Inserting rows for data entry")
        destTab.insertRowsBefore(rowNum, data.length)
      }
      else
        throw e
    }
  }
  //Format sheet
  console.log("Length:", data[0].length)
  console.log("Rows:", data.length)
  destTab.getRange(rowNum, startCol, data.length, data[0].length).setValues(data)
  //Format sheet
  console.log("Added " + data.length + " rows of data in " + destName + " starting from Row " + rowNum + " and column " + startCol)
}



/**
 * Matches the two given indices. If indices don't match, returns either an error code 1, implying the number of columns don't match or code 2, implying the number of columns are the same but the columns themselves are different
 * 
 * @param {Dictionary} indices1
 * @param {Dictionary} indices2
 * @return {Integer}
 */

function matchIndices_(indices1, indices2) {
  let errorCode = 0

  keys1 = Object.keys(indices1)
  keys2 = Object.keys(indices2)
  if (keys1.length != keys2.length) 
    errorCode = 1 
  for(let i=0; i<keys1.length;i++) {
    if (indices1[keys1[i]] != indices2[keys2[i]]) {
      //console.log(`Mismatch between ${keys1[i]}:${indices1[keys1[i]]} and ${keys2[i]}:${indices2[keys2[i]]}`) 
      errorCode = 2
    } 
  }
  return errorCode
}

/**
 * Returns rearranged data to conform to destination format containing only the provided columns
 * If columns are not provided then data is rranged to get as many destination columns as are contained in the data
 * 
 * @param (Array) data
 * @param {Dictionary} dataIndices
 * @param {Dictionary} destIndices
 * @param {Array} cols
 * @return {Array}
 */
function reArrangeData_(data, dataIndices, destIndices, cols) {
  if (cols == undefined) 
    cols = Object.keys(destIndices)
  let skippedDataCols = Object.keys(dataIndices)
  let reArrangedData = []
  let skippedCols = []
  
  for(let i=0; i<data.length; i++) {
    let dataRow = []
    for(let j=0; j<cols.length; j++) {
      const col = cols[j]
      
      let val
      if(dataIndices[col] == undefined) {
        if (i == 0) 
          skippedCols.push(col)
        val = ""
      }
      else
        val = data[i][dataIndices[col]]
      
      let destIndex = destIndices[col]  
      //If any row doesn't have that particular column, replace 'undefined' with blank
      if (destIndex == undefined)
        destIndex = ""
      
      dataRow[destIndex] = val
      if (i == 0) 
        skippedDataCols.splice(skippedDataCols.indexOf(col),1) //Remove column which has been used
    }
    
    reArrangedData.push(dataRow)
  }
  console.log("Data Rearranged")
  console.log("Columns not found in data: " + skippedCols)
  console.log("Columns not found in destination: " + skippedDataCols)
  
  return reArrangedData
}



/**
 * Returns the starting column of a sheet by finding the smallest value in the provided dictionary
 * 
 * @param {Dictionary}
 * @return (number)
 */

function getStartCol_ (indices){

  let keys = Object.keys(indices)
  let startCol = 1
  for(let i=0; i<keys.length; i++) {
    const currCol = indices[keys[i]] + 1
    if (currCol < startCol) startCol = currCol
  }
  return startCol
}

function checkArrayColumnConsistency(array) {
  if(array[0] == undefined){
    return
  }
  const expectedColumns = array[0].length
  for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
    if (array[rowIndex].length !== expectedColumns) {
      return "error"
    }
  }
}
