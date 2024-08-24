
function populatePendingHvTabs(sheetName, caseData, dbr) {
  
  let suff = ""
  if(dbr)
    suff = "_DBR"
  let tabName = getTabNameFromSheetName(sheetName)
  
  console.log(tabName)
  if(tabName.includes("RESOLVED"))
    throw `Cannot add baby to a Resolved Sheet. Please go to an Active Sheet and try again.`
  let id = String(caseData.id_no)
  console.log("Populating ID:", id)
  
  //Get case history
  let caseHistory = caseData[`${caseData.phone_home_source_sheet}_case_history`]
  if(String(caseHistory[0][0]) == "No Out of Hospital Data Found")
    throw "No Out of Hospital Data available for this baby. Please check the id and try again."
  let indices = caseData[`${caseData.phone_home_source_sheet}_indices`]
  console.log("Case History Source", caseData.phone_home_source_sheet)
  let data = []

  //Get last row data
  data.push(caseHistory[caseHistory.length-1])
  
  //Add address information
  data[0].push(caseData.address)
  indices["पता"] = data[0].length-1
  data[0].push(caseData.block)
  indices["block"] = data[0].length-1
  
  if(dbr) //Add combined PMA information for the latest row
    data[0][indices.pma] = caseData.pma
     
  //Add additional information depending on the calling tab
  switch (tabName) {
    case "HOME_VISIT_ACTIVE":
      //Add last home visit date
      let dataById = {}
      dataById[id] = {'case_history': caseHistory}
      console.log("Data before", dataById)
      dataById = addLastHVDate_(dataById,dataById,indices.type,indices.date)
      console.log("Data after", dataById)
      data[0].push(dataById[id].last_hv_date)
      indices['last_hv_date'] = data[0].length-1
      break

    case "COMPLIMENTARY_FEEDING":
      //Get formula
      if(dbr) {
        indices["pma_weeks"] = data[0].length-1
        data[0][indices.pma_weeks] = caseData.ca_days > 3 ? caseData.ca_weeks + 1 : caseData.ca_weeks
      }

      let formulaDataById = getData("FORMULA_ACTIVE"+suff)[1]
      let formulaVal
      if(id in formulaDataById)
        formulaVal = formulaDataById[id].self_yes_no
      else
        formulaVal = "Not found in formula-active sheet"
      data[0].push(formulaVal)
      indices['self_yes_no'] = data[0].length-1
      break
    
    case "FORMULA_ACTIVE":
      //Get formula
      if (dbr) {
        indices["pma_weeks"] = data[0].length-1
        data[0][indices.pma_weeks] = caseData.ca_days > 3 ? caseData.ca_weeks + 1 : caseData.ca_weeks
      }

      
      
      let frmlaDataById = getData("FORMULA_ACTIVE"+suff)[1]
      let babyData = frmlaDataById[id]
      
      if(babyData != undefined) {
        
        //Add the following variables to data from existing row
        const metricsToKeep = ["formula_prescription_yesno", "which_formula", "route", "date_first_added"]
        for(let i=0; i<metricsToKeep.length; i++) {
          let formulaVal = frmlaDataById[id][metricsToKeep[i]]

          data[0].push(formulaVal)
          indices[metricsToKeep[i]] = data[0].length-1
        }
        
        //Compute PMA based on last formula delivery date and change the value
        if(dbr & String(frmlaDataById[id]["delivery_date"]).trim() != "") {
          let caData = computeCA_(caseData.ga_days,caseData.ga_weeks,caseData.birthday, frmlaDataById[id]["delivery_date"])
          if (caData.caDays >3)
            data[0][indices.pma_weeks] = caData.caWeeks + 1
          else
            data[0][indices.pma_weeks] = caData.caWeeks 
        }
          
        //Archive row
        moveData("FORMULA_ACTIVE"+suff,"FORMULA_RESOLVED"+suff,[id],-2,1)
      }
      else{
        let dt = new Date()
        data[0].push(dt) 
        indices["date_first_added"] = data[0].length-1
        console.log("Baby Data Not found in Formula-Active")
      }
      break

      case "OPD_VISITS_ACTIVE":
        //Remove status information
        data[0][indices.status] = ""
        break
    
  }
  
  //Before inserting check if the id already exists; If it does, give error
  let ids = getIDs(tabName+suff)
  console.log(ids)
  if(ids.indexOf(id) > -1)
    throw `ID: ${id} already exists in the sheet. Please work with the existing entry or select a different ID.`
  
  for(let i=0; i<DATE_COLS.length; i++) {
    const dateCol = DATE_COLS[i]
    if(indices[dateCol] != undefined) {
      const dtFormat = new Date(data[0][indices[dateCol]])
      if (dtFormat != "Invalid Date")
        data[0][indices[dateCol]] = dtFormat
    }
  }
  console.log("Inserting Data", data)
  console.log("Final Indices", indices)
  insertData(tabName+suff,-2,data,indices,1)
   
  
}