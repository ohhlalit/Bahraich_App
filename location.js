function exportLocationSubmission() {
  let [indices, , , subData] = getData("LOCATION_SUBMISSION");
  let [proIndices, , , proData] = getData("LOCATION_PROCESSED");

  // Extract _uuid values from proData
  let processedUUIDs = proData.map(row => row['_uuid']);

  // Filter subData to exclude rows with _uuid present in processedUUIDs
  subData = subData.filter(row => !processedUUIDs.includes(row['_uuid']));
  let update = 0
  // Further filter subData to exclude rows where caseById[id].case_history is undefined
  if (subData.length > 0) {
    let [addIndices, caseById] = getData("ADDRESSES");
    subData = subData.filter(row => {
      let id = String(row[indices.id_no]);
      if (caseById[id].case_history === undefined) {
        console.log(`Dropping row for ID no. ${id} as it is not in the database`)
        return false // Drop this row
      }
      return true // Keep this row
    })

    for (let i = 0; i < subData.length; i++) {
      let id = String(subData[i][indices.id_no])
      let coordinates = ''
      let mapLink = ''

      if (subData[i][indices.record_your_current_location] !== '') {
        coordinates = `${subData[i][indices._record_your_current_location_latitude]} ${subData[i][indices._record_your_current_location_longitude]}`
      } else {
        mapLink = subData[i][indices.paste_the_map_link]
      }

      let mapInfo = caseById[id].case_history[0][addIndices.map_link]
      let resultString = '';
      if (coordinates) resultString += `Coordinates: ${coordinates}\n`
      if (mapLink) resultString += `Map Link: ${mapLink}\n`
      if (mapInfo) resultString += `${mapInfo}`

      for (let j = 0; j < caseById[id].case_history.length; j++) {
        caseById[id].case_history[j][addIndices.map_link] = resultString
        update = 1
      }
    }
    if(update){
      updateDataRowWithCasesById("ADDRESSES", caseById, addIndices, 1)
      insertData('LOCATION_PROCESSED', -2, subData, indices, 1, proIndices)
    }
  }
}
