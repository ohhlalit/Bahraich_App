
/**
 * Moves data from source to dest for the ids provided in IDArray
 * It Add the data in the destination and then DELETES the data from the source. To only insert data in destination without deleting data from source, specify noSourceUpdate option (set equal to 1)
 * destRow is the row where the data should be added in the destination. This will work as inserting the data in the destination sheet starting from destRow
 * force allows for mis,matching column headers. The data for only those columns which are found in both source and destination would be copies. If force is not specified, (not set to 1), and if any mismatch is found, the script will throw an error
 * missingIDOk allow for the scenario where some IDs from idArray may not exist in the source
 * noSourceUpdate allows to move without deleting data from source
 * 
 * @param {string} source - The name of the source sheet in standard convention, so for "in hospital", write "IN_HOSPITAL"
 * @param {string} dest - The name of the destination sheet in standard convention, so for "in hospital", write "IN_HOSPITAL"
 * @param {Array} idArray - An Array of Ids for which data has to be moved
 * @param {number} destRow - The row where data must be inserted. -1 indicates at the bottom of the sheet
 * @param {Integer} force - If force is set to 1 the data would be forced to move. any columns not matched from source would be dropped. Any destination columns missing would be left blank
 * @param {Integer} missingIDOk - If missingIDOk is set to 1 that would ignore if any Id in the IDArray doesn't exist in the source destination.
 * @param {Integer} noSourceUpdate - If noSourceUpdate is set to 1. The data is copied to the destination sheet, instead of moving (deleting from source)
 */
function moveData(source, dest, idArray, destRow, force, missingIDOk, noSourceUpdate) {
  const numIds = idArray.length
  if (numIds == 0) {
    console.log ("No data to move from " + source + " to " + dest)
    return
  }

  console.log("Moving Data for " + numIds + " IDS from " + source + " to " + dest)
  
  let [dataIndices, casesById,,rawData]= getData(source)
  let [dataToMove, dataToLeave, idsNotFound] = filterCaseHistoryData_(casesById, idArray)
  
  for(let i=0; i<dataToMove.length; i++)
    completeArray(dataToMove[i],dataIndices)
  
  for(let i=0; i<dataToLeave.length; i++)
    completeArray(dataToLeave[i],dataIndices)

  //Check if all IDs were found. If not, throw error
  if (idsNotFound.length > 0 & missingIDOk != 1) 
    throw "Cannot move Data from " + source + " to " + dest + ". Unable to find IDs : " + idsNotFound + " in " + source
  
  if (source != dest) {
    if (dataToMove.length == 0) {
      console.log("No IDs found to move from " + source + " to " + dest)
      return
    }
    else 
      insertData(dest, destRow, dataToMove, dataIndices, force)
  }
  else
    console.log(`Deleting IDs: ${idArray} from ${source}`)
  
  if (noSourceUpdate != 1)  {
    deleteIds(source,idArray)
    console.log("Moved Data for " + numIds + " IDS from " + source + " to " + dest)
  }
  else
    console.log("Moved Data for " + numIds + " IDS from " + source + " to " + dest + " without deleting data from " + source)
  
}


/**
 * Moves all data from the source sheet to another. Essentially calls the moveData function but for all IDs present in the source sheet
 * 
 * @param {string} source - The name of the source sheet in standard convention, so for "in hospital", write "IN_HOSPITAL"
 * @param {string} dest - The name of the destination sheet in standard convention, so for "in hospital", write "IN_HOSPITAL"
 * @param {number} destRow - The row where data must be inserted. -1 indicates at the bottom of the sheet
 * @param {Integer} force - If force is set to 1 the data would be forced to move. any columns not matched from source would be dropped. Any destination columns missing would be left blank
 * @param {Integer} missingIDOk - If missingIDOk is set to 1 that would ignore if any Id in the IDArray doesn't exist in the source destination.
 * @param {Integer} noSourceUpdate - If noSourceUpdate is set to 1. The data is copied to the destination sheet, instead of moving (deleting from source)

 */

function moveAllData(source, dest, destRow, force, missingIDOk, noSourceUpdate) {
  let idArray = getIDs(source)
  moveData(source, dest, idArray, destRow, force, missingIDOk, noSourceUpdate)
}
