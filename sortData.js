/**
 * Custom sort function for case history data. It returns the order of baby ids based on sorting on the last row
 * 
 * @param {Array} data - A 2-dimensional array on which sort has to be performed
 * @param {Array} orderKey - Array of the order in which sort has to be performed.Each element of the array is of the form {column: <columnIndex>, ascending: <true/false/custom>, blanksAtBottom: <true/false>} a dictionary with three elements. It will take a fourth element sortArray : [<Ordered array of values to sort in>] if ascending is set to custom.First element 'column' gives the index of the element to be sorted on. Second element 'ascending' if set to true will be ascending sort, otherwise descending sort. Third element 'blanksAtBottom' if set to true will keep blanks at bottom else at the top
 * 
 * @return {Array} - Array containing the order of babies to be sorted on
 * 
 * 
 */
//Check why this sort function alters the casesById object. For now always use a reference so it works
function sortCasesById(casesByIdOriginal, orderKey, lastRowPos, string) {
  
  let casesById = JSON.parse(JSON.stringify(casesByIdOriginal))
  
  console.log("Getting Baby Ids in Sorted Order")
  let [indices, lastRowData] = getLastRowData_(casesById, lastRowPos)
  lastRowData = sortData(lastRowData,orderKey)
  let orderedIds = []
  
  for(let i=0; i<lastRowData.length; i++) {
    const id = lastRowData[i][indices.id_no]
    orderedIds.push(String(id))
  }
  return orderedIds
}
/**
 * Custom sort function which takes an array as the sorting key and sorts the provided data according to the order key.
 * 
 * So to say sort on indices 3 and 5, with 3 being ascending and blanks at top, whereas 5 being descending with blanks at bottom, we will construct the following:
 * let orderKey = [{column: 3, ascending: true, blanksAtBottom: false}, {column: 5, ascending: false, blanksAtBottom: true}]
 * 
 * For a custom sort on say column 3, with values A, B, C, D, in the order of D, A , C, B, we will set
 * let orderKey = [{column: 3, ascending: 'custom', blanksAtBottom: false, sortArray: ['D','A','C','B']}]
 * 
 * @param {Array} data - A 2-dimensional array on which sort has to be performed
 * @param {Array} orderKey - Array of the order in which sort has to be performed.Each element of the array is of the form {column: <columnIndex>, ascending: <true/false/custom>, blanksAtBottom: <true/false>} a dictionary with three elements. It will take a fourth element sortArray : [<Ordered array of values to sort in>] if ascending is set to custom.
 * First element 'column' gives the index of the element to be sorted on
 * Second element 'ascending' if set to true will be ascending sort, otherwise descending sort
 * Third element 'blanksAtBottom' if set to true will keep blanks at bottom else at the top
 */

function sortData(data, orderKey) {
  
  //Check for any sort keys
  let processedOrderKey = []
  let addedIndices = []
  for(let i=0; i<orderKey.length; i++) {
    let key = orderKey[i]
    if (key.ascending == 'custom') {
      let [newData, sortIndex] = addSortValues_(data, key.sortArray, key.column)
      data = newData
      addedIndices.push(sortIndex)
      let newKey = {column: sortIndex, ascending: true, blanksAtBottom: key.blanksAtBottom}
      processedOrderKey.push(newKey) 
    }
    else
      processedOrderKey.push(key)
 
  }
  
  console.log("Sorting Key =>", processedOrderKey)
  data = data.sort((row1, row2) => sortDataFn_(row1, row2, processedOrderKey))
  data = removeIndices_(data, addedIndices)
  return data
}




function addSortValues_(data, sortArray, colIndex) {
  //console.log("Adding New Index for sorting on", sortArray)

  let noFoundValue = 1000000 //This makes it so that values not found in sortArray are put at the bottom
  let newData = []
  
  for(let i=0; i<data.length; i++) {
    let row = data[i]
    let val = sortArray.indexOf(String(row[colIndex].valueOf()))
    if(val == -1) {
      if(row[colIndex] == '')
        row.push('')
      else
        row.push(noFoundValue)
    }
    else
      row.push(val + 1) //Values + 1, so the top value is 1, then 2 and so on..not found values being noFoundValue
    newData.push(row)
  }
  return [newData, newData[0].length-1]
}
/**
 * Helper function for the main sortData function
 */
function sortDataFn_(row1, row2, orderKey) {
let compareResult = 0

for(let i=0; i<orderKey.length; i++) { //Compare values one by one
  let keyIndex = orderKey[i]['column']
  let ascending = orderKey[i]['ascending']
  let blanksAtBottom = orderKey[i]['blanksAtBottom']

  
  let compareValue = compareValues_(row1[keyIndex], row2[keyIndex], ascending, blanksAtBottom)
  compareResult = compareResult || compareValue //this will return the first non zero value (that is this will sort in the order of keys provided)
}

return compareResult

}
/**
 * This is a helper function for sortDataFn_ which compare two given values and returns a comparaison result based on ascending and blanksAtBottom specification
 */
function compareValues_(v1, v2, ascending, blanksAtBottom) {

  //First convert objects to values (relevant for dates)
  v1 = v1.valueOf()
  v2 = v2.valueOf()
  
  //Now check if either of them is a string, then apply the trim function (to check for blanks later)
  if (typeof v1 == "string")
    v1 = v1.trim().toLowerCase()
  if (typeof v2 == "string")
    v2 = v2.trim().toLowerCase()
  
  /* Now compare. The sort function has a simple rule: 
     If output is 1, the first element will go down; 
     If output is -1, the second element will go down;
     If output is 0, the order is preserved

  */

  let r
  if(v1 == v2) //Equal--> Preserve order --> return 0
    r = 0
  else if(v1 == '' & typeof v1 == "string") { //v1 is blank, JS thinks 0 is same as blank, hence the check for type makes sure it is indeed blank (a string). Now need to check whether to put at bottom or top
    if (blanksAtBottom == true)
      r = 1
    else
      r = -1
  }
  else if(v2 == `` & typeof v2 == "string") { //v2 is blank
    if (blanksAtBottom == true)
      r = -1
    else
      r = 1
  }
  else if(v1 > v2) { //No blanks possible, so this is non-blank values comparison. Check if sort has to be ascending or descending
    if (ascending == true)
      r = 1
    else
      r = -1
  }
  else {
    if (ascending == true)
      r = -1
    else
      r = 1
  }
  return r
}