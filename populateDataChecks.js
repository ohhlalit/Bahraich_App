function populateDataChecksTabs(sheetName, caseData) {
  
  let tabName = getTabNameFromSheetName(sheetName)
  console.log(tabName)
  let id = String(caseData.id_no)
  console.log("Populating ID:", id)
  
  //Get case history
  let caseHistory = caseData.in_hospital_case_history
  let indices = caseData.in_hospital_indices
  console.log("Case History Source", caseData.in_hospital_source)
  let data = []

  //Get last row data
  data.push(caseHistory[caseHistory.length-1])
  
  //Add address information
  data[0].push(caseData.address)
  indices["पता"] = data[0].length-1
  data[0].push(caseData.block)
  indices["block"] = data[0].length-1
    
  //Before inserting check if the id already exists; If it does, give error
  
  for(let i=0; i<DATE_COLS.length; i++) {
    const dateCol = DATE_COLS[i]
    if(indices[dateCol] != undefined) {
      const dtFormat = new Date(data[0][indices[dateCol]])
      if (dtFormat != "Invalid Date")
        data[0][indices[dateCol]] = dtFormat
    }
  }
  delete indices["notes"]
  console.log("Inserting Data", data)
  console.log("Final Indices", indices)
  insertData(tabName,-1,data,indices,1)
  
}