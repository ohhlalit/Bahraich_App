/**
 * Clears the data in the given sheet. It leaves the formatting and headers intact.
 * Function should ideally be used only as a part of move data
 */
function clearData_(name) {
  console.log("Clearing Data from " + name)
  const tab = getTab_(name)
  const startRow = eval(name+"_HEADER_INDEX") + 2 //Add 2 to get starting row number of data as the header index only gives index
  const endRow = tab.getLastRow()
  
  
  if (endRow >= startRow) {
    console.log(`Clearing Rows ${startRow} to ${endRow}`)
    let filter = tab.getFilter()
    if (filter != null) {
      console.log("Filter found. Removing")
      filter.remove()
    }
    try {
      tab.deleteRows(startRow,endRow - startRow + 1)
    } catch (e) {
      console.log("Error Caused --> " + e)
      console.log("Inserting blank row to resolve")
      tab.insertRowAfter(endRow)
      console.log("Clearing any carryover content from the inserted row")
      tab.getRange(`${endRow+1}:${endRow+1}`).clearContent()
      tab.deleteRows(startRow,endRow - startRow + 1)
    }

    
    console.log("Cleared Data from " + name)
  }
  else
    console.log("Sheet already empty. Nothing to clear")
}

/**
 * Deletes the data for the provided ids from the given tab. It preserves tha order of the ids in the tab
 * @param {String} name - The name of the tab from which ids are to be deleted in standard convention
 * @param {Array} idArray - The array of ids who are to be deleted
 */
function deleteIds(name, idArray) {
  
  deleteIds2(name,idArray)
  //Moving to self deletes the data in idArray
  //moveData(name,name,idArray)
  
}

function filterRemovingAddingCode_() {
  //Remove Filter and save information to restore later
    let filter = tab.getFilter()
    let filterExists = 0
    let filterRange
    let filterStartCol
    let filterNumColumns
    let filterCriterias = []
    if (filter != null) {
      console.log("Filter found: Removing")
      filterExists = 1
      filterRange = filter.getRange().getA1Notation()
      filterStartCol = filter.getRange().getColumn()
      filterNumColumns = filter.getRange().getNumColumns()
      for(let i=0; i<filterNumColumns; i++)
        filterCriterias.push(filter.getColumnFilterCriteria(i+filterStartCol))
      filter.remove()
    }
    
  //Add filter back if exists
    if(filterExists) {
      console.log("Restoring filter")
      tab.getRange(filterRange).createFilter()
      filter = tab.getFilter()
      for(let i=0; i<filterNumColumns; i++)
        filter.setColumnFilterCriteria(i+filterStartCol, filterCriterias[i])
    }

}

function deleteIds2(name,idArray) {
  
  console.log(`Deleting IDs ${idArray} from ${name}`)

  let [indices,,,data] = getData(name)
  let rowAdjuster = eval(name+"_HEADER_INDEX") + 2 //Add this to data index to get row numbers
  let rows = []
  for(let i=0; i<data.length; i++) {
    let id = String(data[i][indices.id_no])
    if(idArray.indexOf(id) > -1)
      rows.push(i + rowAdjuster)
  }

  console.log("Deleting the following rows:", rows)
  
  let rowClusters = getRowClusters(rows)
  let startingRows = rowClusters.startingRows
  let numberOfRows = rowClusters.numberOfRows
  let tab = getTab_(name)
  for(let i=0; i<startingRows.length; i++)
    tab.deleteRows(startingRows[i],numberOfRows[i])

  console.log(`Deleted IDs ${idArray} from ${name}`)
}

/**
 * 
 * @param {Array} rows - An array containing row numbers
 * The function return sa dictionary whose keys are starting rows and the value is the number of row including that row.
 * So [3,4,5,8,9,10,11,20,21,50] would return {3:3, 8:4,20:2.50:1}. This is mostly to be used in deleting rows or for formatting a cluster of rows
 */
function getRowClusters(rows) {

  
  let startingRows = [rows[0]]
  let numberRows = [1]
  for(let i=1; i<rows.length; i++) {
    let lastRow = rows[i-1]
    let currentRow = rows[i]
    if(currentRow - lastRow == 1)
      numberRows[numberRows.length-1] = numberRows[numberRows.length-1] + 1 
    else {
      numberRows.push(1)
      startingRows.push(currentRow)
    }
  }
  //Return reverse because we want to start deleting from the highest number rows
  return {startingRows: startingRows.reverse(), numberOfRows:numberRows.reverse()}
}

getRowClusters([3,4,5,8,9,10,11,20,21,50])