/**Add a blank row to the case history of all ids in the provided caseHistoryData
 * 
 * @param {Array} caseHistoryData - data in 2D Array Format
 * @return {Array} - returns data in 2D Array Format
 */

function addBlankRow_(caseHistoryData, idCol) {
  console.log("Adding Blank Rows for all Ids")
  let [firstRowIndices, lastRowIndices] = getFirstAndLastRowIndices_(caseHistoryData, idCol)
  let newCaseHistory = []
  let emptyRow = new Array(caseHistoryData[0].length).fill('')
  for(let i=0; i<caseHistoryData.length; i++) {
    const row = caseHistoryData[i]
    newCaseHistory.push(row)
    if(lastRowIndices.indexOf(i) >-1) //Found end of an id. Insert empty row
      newCaseHistory.push(emptyRow)
  }
  return newCaseHistory
}


/**
 * Removes the given indices (columns) from a 2D data
 * 
 * @param {Array} data - the D2D datset from which columns are to be deleted
 */

function removeIndices_(data, indices) {

  let newData = []
  for(let i=0; i<data.length; i++){
    let row = data[i]
    let newRow = []
    for(let j=0; j<row.length; j++){
      if(indices.indexOf(j) == -1)
        newRow.push(row[j])
    }
    newData.push(newRow)
  }

  return newData
}

/**
 * Adds address to the data using address_intake and address_exit tabs
 * If address at exit is missing then address at intake is supplied as the current address
 * 
 * @param {Dictionary} dataById
 * @return {Dictionary}
 */
function addAddress_(dataById) {

  let ids = Object.keys(dataById)
  for(let i=0; i<ids.length; i++){
    let addressCaseHistory = dataById[ids[i]].case_history
    let addressIndices = dataById[ids[i]].indices

    let address
    let block
    
    for(let j=addressCaseHistory.length-1; j>=0;j--) {
      address = address || addressCaseHistory[j][addressIndices.address_exit] || addressCaseHistory[j][addressIndices.address_intake]
      block = block || addressCaseHistory[j][addressIndices.block]
    }

    dataById[ids[i]].address = address || ""
    dataById[ids[i]].block = block || ""
  }
  return dataById
}

function addAddressToMergedData_(mergedData) {
  let ids = Object.keys(mergedData)
  for(let i=0; i<ids.length; i++)
    mergedData[ids[i]].address = mergedData[ids[i]].address_exit || mergedData[ids[i]].address_intake || ""
  return mergedData
}
/**
 * Adds Last Home Visit Date to the provided dataset
 * 
 * @param {Dictionary} dataById
 * @param {Dictionary} phDataById
 * @param {number} typeIndex
 * @param {number} dataIndex
 * @return {Dictionary}
 */
function addLastHVDate_(dataById, phDataById, typeIndex, dateIndex) {

  let ids = Object.keys(dataById)
  for(let i=0; i<ids.length; i++) {
    let id = ids[i]
    let last_hv_date = "Not Found"
    
    if(phDataById[id] != undefined) {
      let caseHistory = getElement_(phDataById[id].case_history)
      for (let j = caseHistory.length-1; j>=0; j--) {
        let typ = caseHistory[j][typeIndex].toLowerCase()
        if(typ.includes("home")) {
          last_hv_date = caseHistory[j][dateIndex]
          break
        }
      }
    }
    dataById[id].last_hv_date = last_hv_date
  }
  return dataById
}

/**
 * Adds Last Obs Col Val in Secondary Data to the provided dataset
 * 
 * @param {Dictionary} dataById
 * @param {Dictionary} secondaryDataById
 * @param {number} typeIndex
 * @return {Dictionary}
 */
function addLastObsCol_(dataById, secondaryDataById, colName, colIndex, dataIndices) {

  let ids = Object.keys(dataById)
  for(let i=0; i<ids.length; i++) {
    let id = ids[i]
    
    if(secondaryDataById[id] != undefined) {
      let caseHistory = secondaryDataById[id].case_history 
      dataById[id]["last_"+ colName] = caseHistory[caseHistory.length-1][colIndex]
      for (let j = caseHistory.length-1; j>=0; j--) {
        let val = caseHistory[j][colIndex]
        if (val != "") {
          dataById[id]["last_"+ colName] = val
          break
        }
      }
    }
    else {
      dataById[id]["last_"+ colName] = "ID Not found in Secondary Data"
    }
  }
  if(dataIndices == undefined)
    return dataById
  else {
    const newColIndex = dataById[ids[0]].case_history[0].length
    dataIndices["last_" + colName] = newColIndex
    console.log(`New Index added for last_${colName}: ${newColIndex}`)
    console.log("New Indices", dataIndices)
    for(let i=0; i<ids.length; i++) {
      const id = ids[i]
      let caseHistory = dataById[id].case_history
      const val = dataById[id]["last_" + colName]
      console.log(`Added last_${colName} for id: ${id} : ${val}`)
      for(let j=0; j<caseHistory.length; j++)
        dataById[id].case_history[j][dataIndices["last_"+colName]] = val
    }
    return [dataIndices, dataById]
  }
}

/**
 * Returns an Array with perfectly balanced size.
 * To be used when a given 2D array may have rows with unequal lengths
 * This program enters blanks to the ends of the shorter rows to make a perfectly balanced 2D Array
 * 
 * @param (Array) arr
 * @return (Array)
 */
function balance2dArray_(arr) {
  
  let maxLength = 0
  for(let i=0; i<arr.length;i++) { //Find max length across all rows
    if(arr[i].length > maxLength)
      maxLength = arr[i].length
  }

  for(let i=0; i<arr.length; i++) {
    let row = arr[i]
    if (row.length<maxLength) { //If the given row is smaller than the max dimension of array, add blanks to the end of it
      for(let j=row.length; j<maxLength;j++)
        row[j] = ""
    }
    arr[i] = row
  }

  return arr
}

/**
 * Returns an array with two arrays. The first one contains indices of the first rows of all ids for the given dataset and the second contains the indices of the last rows of all ids
 * 
 * @param {Array} data
 * @param {number} idCol
 * @return {Array}
 */
function getFirstAndLastRowIndices_(data, idCol) {
  console.log("Getting First and Last Row Indices")
  let firstRows = []
  let lastRows = []
  let completedIDs = []
  const ids = data.map(row => row[idCol])
  console.log(ids)
  for(let i=0; i<ids.length; i++) {
    const id = ids[i]
    if (completedIDs.indexOf(id) == -1 & id != '') {
      const firstIndex = ids.indexOf(id) 
      const lastIndex = ids.lastIndexOf(id)
      firstRows.push(firstIndex)
      lastRows.push(lastIndex)
      completedIDs.push(id)
      console.log(`First and Last Row Index for ID: ${id} is ${firstIndex}:${lastIndex}`)
    }
  }
  console.log("Finished computing First and Last Row Indices")
  return [firstRows, lastRows]
}



/**
 * Groups given data into dictionary with keys as unique values of the provided column
 */

function groupBy_(data, col) {
  //Function to convert data into dictionary with keys being unique elements of the given column number (key)
  return data.reduce(function(dataSet, row) {
    (dataSet[row[col]] = dataSet[row[col]] || []).push(row);
    return dataSet;
  }, {});
};




/**
 * Returns values of a column of the provided dataset. If toString is set to 1, the values are converted to string
 * Must do for ID as all IDs stored as dictionary keys are converted to string
 * 
 * @param {Array} data
 * @param {Integer} col
 * @param {number} toString 
 * @return {Array}
 */
function getColumn_(data, col, toString) {
  if (data == undefined) return undefined

  let colData = []
  for(let i=0; i<data.length; i++) {
    let val = data[i][col]
    if(toString == 1)
      val = val.toString()
    colData.push(val)
  }

  return colData
}


function getTime() {
  let time = new Date()
  const timezone = { timeZone: 'Asia/Kolkata' }
  time = time.toLocaleString('en-US', timezone)

  return time
}

/**
 * Compare two given dictionaries. Comes in handy when moving data from one sheet to another but want to make sure they have the exact same headers
 */

function compareDictionaries(d1, d2) {

  let keys1 = Object.keys(d1)
  let keys2 = Object.keys(d2)

  if(keys1.length != keys2.length)
    return false
  else {
    for(let i=0; i<keys1.length; i++) {
      const key = keys1[i]
      if (d1[key] != d2[key])
        return false
    }
  }

  return true
}


/**Complete the dimension of the given array to match the indices
 * 
 */
function completeArray(data, indices) {

  let keys = Object.keys(indices)
  let maxVal = 0 
  for(let i=0; i<keys.length; i++) {
    const val = indices[keys[i]]
    if(val > maxVal)
      maxVal = val
  }
  //console.log(maxVal)
  //console.log(data[maxVal])
  if (data[maxVal] == undefined) {
    data[maxVal] = ""
  }
  return data 
}

function complete2DArray(array2D,indices) {
  let arr = []
  for(row of array2D)
    arr.push(completeArray(row, indices))
  return arr
}

/**
 * Compares if two given arrays are same (1-demnsional, so comparing rows)
 */
function compareArrays(array1, array2) {
  if (array1 == undefined | array2 == undefined)
    return false
  var is_same = (array1.length == array2.length) && array1.every(function(element, index) {
return element.valueOf() === array2[index].valueOf();
})
  return is_same
}

/**
 * Returns a union of two arrays (removes duplicates)
 */

function getArrayUnion_(array1, array2) {
  //Merge Arrays
  let mergedArrays = [...array1, ...array2]
  //Remove Duplicates
  mergedArrays = new Set(mergedArrays)
  //Convert back to Array
  mergedArrays = [...mergedArrays]

  return mergedArrays
}


function getElement_(element, preserveDates){
  let clone = JSON.parse(JSON.stringify(element))
  if(preserveDates == 1) {
    for(let i=0; i<DATE_COLS.length; i++) {
      const dateCol = DATE_COLS[i]
      if (dateCol in clone)
        try {
          clone[dateCol] = new Date(clone[dateCol])
        } catch(e) {
          clone[dateCol] = clone[dateCol]
        }
    }
  }
  return clone
}

/**
 * To be used mostly for Case ID Search or any other application where data is to be correctly displayed in Google Sheets.
 * Takes date in 2D Array format and converts all date columns (see const DATE_COLS to check which columns it changes) to make the date columns correspond to google sheet format. 
 * Changes all other columns to string.
 * @param {*} dataArray - Data in 2D Array format
 * @param {*} dataIndices - Indices of the corresponding 2D Array
 * @returns - 2D Array with date format fixed (ready to be inserted in google sheets in appropriate format)
 */
function fixDisplayFormat_(dataArray, dataIndices) {
  console.log("Fixing Display Format")
  let dateCols = DATE_COLS
  console.log(dataIndices)
  let cols = Object.keys(dataIndices)
  for(let i=0;i<cols.length; i++) {
    let col = cols[i]
    let index = dataIndices[col]
    if(dateCols.indexOf(col) > -1) {
      console.log(col)
      for(let j=0;j<dataArray.length; j++) {
        console.log(dataArray[j][index])
        let dtFix = new Date(dataArray[j][index])
        //console.log(`Pre Date: ${dtFix}`)
        dtFix.setHours(0,0,0,0)
        //console.log(`Post Date: ${dtFix}`)
        if (dtFix != "Invalid Date")
          dataArray[j][index] = dtFix
      }
    }
    else {
      for(let j=0;j<dataArray.length; j++)
        dataArray[j][index] = String(dataArray[j][index])
    }
  }
  return dataArray
}
  

/**
 * Looks for keywords from the keywordArray in the provided sentence and returns an array with the keywords which were found in the sentence.
 * If no word is found it returns an empty array.
 * This is a partial match function so if the sentence is "the baby was lighter" and the keyword is "light" it would match it.
 * @param {String} sentence - Sentence in which keyword is to be found
 * @param {Array} keywordArray - An array with the keywords that are to be searched in the sentence
 * @returns {Array} Array of matched keywords from keywordArray
 */

function matchKeywords_(sentence, keywordArray) {

  let matchedArray = []
  if (sentence == undefined)
    return matchedArray
  if (keywordArray == undefined)
    throw 'Cannot perform match. No Keyword Array provided.'
  for(let i=0; i<keywordArray.length;i++) {
    if(String(sentence).indexOf(keywordArray[i]) > -1)
      matchedArray.push(keywordArray[i])
  }
  return matchedArray
}

/**
 * 
 * @param {Dictionary} caseHistory - case history of a baby from any of the sheets. Use the .case_history construct to get this object
 * @param {Array} conditionArray - An Array with each element being a dictionary containing three keys and of the following form: {columnIndex: 1, matchArray: ["yes", "maybe"], partialMatch = 1}
 * partialMatch can be skipped if not desired
 * @param {number} allTrue - Set to 1 if the codnitions are AND (all should be true) or 0 if OR (any one condition being true should count)
 * @param {number} dateIndex - Index of the date column. If provided, the function will count only unique days. If skipped, all rows for which the condition is true would be counted.
 * @returns {number} - Number of rows for which condition is true
 */
function conditionCounter_(caseHistory,conditionArray, allTrue, dateIndex, id) {

  let counter = 0
  let dtCounted = []
  for(let i=0; i<caseHistory.length; i++) {
    let row = caseHistory[i]
    let rowConditionTrue = 0
    for(let j=0; j<conditionArray.length; j++) {
      let condition = conditionArray[j]
      let columnVal = row[condition.columnIndex]
      let matchArray = condition.matchArray
      let partialMatch = condition.partialMatch
      if(partialMatch != 1 & matchArray.indexOf(columnVal) > -1)
        rowConditionTrue++
      else if(partialMatch == 1 & matchKeywords_(columnVal,matchArray).length > 0)
        rowConditionTrue++
    }
    if((allTrue == 1 & rowConditionTrue == conditionArray.length) || (allTrue != 1 & rowConditionTrue > 0)) {
      if(dateIndex != undefined && dtCounted.indexOf(row[dateIndex]) == -1) {
        dtCounted.push(row[dateIndex])
        counter++
      }
      
      else
        counter++
    }
  }
  return counter
  
}


/**
 * Converts an Array of case iobjects to a dictionary with ID No. as the keys. Must contain id_no as one of the elements
 * @param {Array} caseObjArr -Array of baby objects (the 4th element of the getData(..) function)
 * @returns {Dict} - The second element of the getData(..) function
 */
function convertCaseObjArrToDict_(caseObjArr) {
  let casesById = {}
  for(let i=0; i<caseObjArr.length; i++)
      casesById[caseObjArr[i].id_no] = caseObjArr[i]
  return casesById
}


function extractIntakeDateFromId_(idNumber) {
  idNumber = String(idNumber)
  if (idNumber == undefined)
    return "Cannot extract intake date, check the format"
  if(idNumber.length > 8)
    return "Old Format; Cannot extract intake date"
  var year = idNumber.substring(0, 2) // Extract the first two digits as the year
  var month = idNumber.substring(2, 4)  // Extract the next two digits as the month
  var day = idNumber.substring(4, 6)  // Extract the last two digits as the day

  var initialDate = new Date(`20${year}-${month}-${day}`)  // Create a new Date object with the extracted year, month, and day

  return initialDate
}


/**
 * Assign a dummy value (1/0) to variable after comparisng lhs to rhs (simply checks if lhs is contained in rhs)
 * Requires lhs to be a string or a number and rhs can be a string or an array.
 * @param {String} lhs - The value to be compared
 * @param {Any} rhs - The string to be comapred to, or the dictionary whose keys are to be searched, or the array which is to be searched
 * @param {String} type - specified if rhs is an Array or a Dictionary. Don't specificy if lhs and rhs are both numbers or strings
 * @returns 
 */
function getDummy_(lhs, rhs, type) {
  let variable = 0
  if(type == undefined && lhs == rhs)
    variable = 1
  else if(type == "Dict" && lhs in rhs)
    variable = 1
  else if(type == "Array" && rhs.indexOf(lhs) > -1)
    variable = 1
  
  return variable
}

function getOrderedIds_(rawData, idNoIndex) {
  let orderedIds = []
  for(let i=0; i<rawData.length; i++) { //For current order, will need to scan rawData; the dictionary orders keys alphabetically, destroying the natural order
    const id = rawData[i][idNoIndex].valueOf()
    if(orderedIds.indexOf(id) == -1)
      orderedIds.push(id)
  }

  return orderedIds
}

/**
 * 
 * @param {Array} caseHistoryArray - Case history array of the 
 * @returns - 2D array with all values replaced by .valueOf()
 */
function getValue_(caseHistoryArray) {
  for(let i=0; i<caseHistoryArray.length; i++) {
    for(let j=0; j<caseHistoryArray[i].length;j++)
        caseHistoryArray[i][j] = caseHistoryArray[i][j].valueOf()
  }

  return caseHistoryArray
}


function getMinAndMaxValuesInDict(dict) {
  let keys = Object.keys(dict)
  let minVal = dict[keys[0]]
  let maxVal = dict[keys[0]]
  
  for(let i=0; i<keys.length; i++) {
    const val = dict[keys[i]]
    if(val < minVal)
      minVal = val
    if(val > maxVal)
      maxVal = val

  }

  return {'minVal': minVal, 'maxVal': maxVal}
}

/**
 * 
 * @param {Number} gaDays - GA (Days) of the baby
 * @param {Number} gaWeeks - GA (Weeks) of the baby
 * @param {Number} birthday - The birthdate of the baby. This is NOT a date object and is the inherent value of the dat (obtained after applying valueOf())
 * @param {Date/Number} refDate - The reference date for which CA is to be computed. This must be a date type object if noDate is not specified
 * @param {Number} noDate - Specify this option if the refDate that you have passed is a value instead of Date
 * 
 * The function returns the value of CA for the baby with the given GA on the provided Reference date.
 * The return object is a dictionary with three attributes: caWeeks, caDays and then the combined CA-caWD which displays CA in WxD format
 */
function computeCA_(gaDays,gaWeeks,birthday,refDate, noDate) {

  birthday = birthday.valueOf()

  let caWeeks
  let caDays

  if(String(gaWeeks).trim() == "" | String(gaWeeks).trim() == "Missing" | String(birthday).trim() == "") {
    caWeeks = ""
    caDays = ""
  }
  else {
    if(refDate == undefined)
      refDate = new Date()
    if(noDate != 1){
      refDate.setHours(0,0,0,0) //Set hours to 0 to avoid any time in the date
      refDate = refDate.valueOf()
    }
    
    if(String(gaDays).trim() == "")
      gaDays = 0
    const numDays = (refDate - birthday) / (1000*60*60*24)
    caWeeks = Math.floor(numDays/7) + gaWeeks
    caDays =  numDays%7 + gaDays
    if(caDays >= 7) {
      caWeeks = caWeeks + 1
      caDays = caDays - 7
    }
  }
  return {'caDays': caDays, 'caWeeks': caWeeks, 'caWD':`${caWeeks}W ${caDays}D`}

}

function getColorRows_(color, length, numRows) {
  let colorRow = []
  for(let i=0; i<length; i++)
    colorRow.push(COLORS[color])
  
  let colorRows = []
  for(let i=0; i<numRows; i++)
    colorRows.push(colorRow)
  
  return colorRows
}
  // function getNotes(id, date, indices, casesById) {
//   console.log(`Getting notes for ${id} and date ${date}`)
//   let targetDate = new Date(2023,4,30)
//   if (date.valueOf() != targetDate.valueOf())
//     return ["", ""]

//   let caseObj = casesById[id]
//   if (caseObj == undefined) {
//     console.log(`couldn't find ${id}`)
//     return ["", ""]
//   }
//   targetDate = new Date(2023,4,29)
//   let caseHistory = caseObj.case_history
//   for(let j=0; j<caseHistory.length; j++) {
//     let dt = caseHistory[j][indices.date]
//     dt.setHours(0,0,0,0)
    
//     if(dt.valueOf() == targetDate.valueOf())
//       return [caseHistory[j][indices.managers_notes], caseHistory[j][indices.questions_for_doctor]]
//   }
// }

// function removeDuplicates()  {
//   let tabname = "DOCTORS_REPORT_WORKSHEET"
//   let [indices,,,data] = getData(tabname)
//   let newData = []

//   for (let i=0; i<10; i++) {
//     let row = data[i]
//     console.log(`Basic Extract date in index ${i} if ${row[indices.date]}`)
//     row = getElement_(data[i])
//     console.log(`Deep copy Extract date in index ${i} if ${row[indices.date]}`)
//   }
//   return
//   for(let i=0; i<data.length; i++) {
//     let row = getElement_(data[i])
//     if(compareArrays(newData[newData.length-1], row))
//       console.log("Same Array found skipping at:", i)
//     else
//       newData.push(row)
//   }
//   console.log(data)
//   console.log(newData)

//   console.log(`Old Length was ${data.length} while new length is ${newData.length}`)
//   updateDataRows("DOCTORS_REPORT_WORKSHEET_NEW",newData,indices)
// }
