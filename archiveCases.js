
/**
 * Archives the selected cases (selected by checking the checkbox in the archive column) from src to dest tabs.
 * Requires the src and dest columns to be perfectly matched. Will give error if there is any mismatch between the two sheets. (Their headers should be identical)
 * If there is an error of column mismatch despite them being identical. prinout indices of both columns and pay special attention to hindi column names.
 * @param {String} src - Name of the Source tab in standard convention
 * @param {String} dest - Name of the destination tab in standard convention
 * @param {String} archiveColumn - Name of the column which contains the checkbox for which ids to archive and which to not
 */
function archiveCasesByCheckbox(src, dest, archiveColumn){
  let [indices,casesById] = getData(src)
  let [archiveIDs] = filterByColumnValue(casesById,indices[archiveColumn],true)
  moveData(src,dest,archiveIDs,-1)
}

/**
 * Achives the provided ids from source to destination and adds a timestamp column to it. The timestamp will contain the exat time when the archive function was run.
 * Make sure the columns are exactly identical other than there being a timestamp column added to the END of the archive sheet. Otherwise there would be an error
 * @param {String} src - Name of the source in standard convention
 * @param {String} dest - Name of the destination in standard convention
 * @param {Array} idArray - Array of ids to be archived. Make sure the array contains ids as strings
 */
function archiveCasesWithTimeStamp(src, dest, idArray, reason) {
  
  console.log(`Archiving ids ${idArray} from ${src} to ${dest}`)
  let [indices,casesById] = getData(src)
  let archiveData = filterCaseHistoryData_(casesById,idArray)[0]
  
  //Add timestamp at the end
  const currentTime = new Date()
  if(archiveData.length>0){
    for(let i=0; i<archiveData.length; i++){
      archiveData[i].push(currentTime)
      if(reason != undefined)
        archiveData[i].push(reason)
    }
    
    
    if(reason != undefined) {
      indices['processed_timestamp'] = archiveData[0].length - 2
      indices['reason_to_archive'] = archiveData[0].length - 1
    }
    else
      indices['processed_timestamp'] = archiveData[0].length - 1

    insertData(dest,-2,archiveData,indices,1)
    deleteIds2(src,idArray)
  }
  else
    console.log("Nothing to archive")
}
