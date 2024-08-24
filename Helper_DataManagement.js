
/**
 * Copies tabs from a given sheet to a new sheet. Simply list the name of the sheets (in standard convention) in sourceTabs and destTabs in matched order.
 * Set force equal to 1 to match the data when copying
 */

function copySheet() {
    let sourceTabs = ["PHONE_HOME_COPY"]
    let destTabs = ["PHONE_HOME"]
    let force = 1 //Turn force to 0 if the expext data format to be concordant (identical copies for instance-Potentially better to use 'Make a Copy' function directly in sheets)
    for(let i=0; i<sourceTabs.length; i++) {
        let [indices,,,data] = getData(sourceTabs[i])
        insertData(destTabs[i],-1,data,indices)
        //updateDataRows(destTabs[i],data,indices,force)
    }
}

function checkData() {
  let [indices, databyID,,] = getData("PHONE_HOME")
  let originalIDS = Object.keys(databyID)
  let [, databyIDOld,,] = getData("PHONE_HOME_COPY")
  let oldIDS = Object.keys(databyIDOld)

  console.log("Current Ids", originalIDS)
  console.log("Old Ids", oldIDS)
  

  let oldCaseHistory = databyIDOld["23033002"].case_history
  let newCaseHistory = databyID["23033002"].case_history
  
  console.log("Length before merging:", oldCaseHistory.length)
  for(let i=0; i<newCaseHistory.length; i++) {
    let row = newCaseHistory[i]
    let dt = row[indices.date]
    console.log("Looking for date:", dt)
    let flag = 0
    for(let j=0; j<oldCaseHistory.length; j++) {
      let oldDt = oldCaseHistory[j][indices.date]
      if(dt.valueOf() == oldDt.valueOf())
        flag = 1
    }
    if (flag == 0) {
      console.log("Row not found for dt:", dt)
      oldCaseHistory.push(row)
    }

  }
  console.log("Length of old history:", oldCaseHistory.length)
  console.log("Length after merging:", newCaseHistory.length)
  // databyID["23033002"].case_history = oldCaseHistory
  
  // let [newData,,] = filterCaseHistoryData_(databyID,originalIDS)
  // updateDataRows("PHONE_HOME",newData)
  // // console.log(missingData)
  // insertData("PHONE_HOME",-1,missingData)

}

function keepSheets () {
  let sheetsToKeep = ["incorrect rows from died in ASMC","Death Files Not Found","in hospital unique","phone/home unique"]
  let ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheets = ss.getSheets()
  for(let i=0; i<sheets.length; i++) {
    let sheetName = sheets[i].getSheetName()
    console.log()
    if(sheetsToKeep.indexOf(sheetName) > -1)
      ss.deleteSheet(sheets[i])
  }
}


function addCurrentStatusToStatic() {

  let [indices,,,staticData] = getData("STATIC")

  let mergedData = getMergedDataForSideBar_dbr()

  for(let i=0; i<staticData.length; i++) {
    const id = String(staticData[i][indices.id_no])
    console.log("Finding status for:",id)
    for(let j=0; j<mergedData.length ; j++)
      if(mergedData[j].id_no == id) {
        staticData[i][indices.current_status] = mergedData[j].current_status
        if(mergedData[j].current_status == "" || mergedData[j].current_status == undefined)
          console.warn(`Status for ${id} set to ${mergedData[j].current_status}`)
        else
          console.log(`Status for ${id} set to ${mergedData[j].current_status}`)
        break
      }
  }
  updateDataRows("STATIC",staticData,indices)
}

function buildStaticData() {
  let [indices,casesById] = getData("IN_HOSPITAL")
  let [, casesById2] = getData("DIED_IN_ASMC")
  let dataRows = []
  for(let [,caseData] of Object.entries(casesById))
    dataRows.push(caseData.case_history.pop())
  for(let [,caseData] of Object.entries(casesById2))
    dataRows.push(caseData.case_history.pop())
  updateDataRows("STATIC",dataRows,indices,1)

  let [,addCasesById] = getData("ADDRESS_TESTING")
  let [dataIndices,,,data] = getData("STATIC")
  for(let i=0; i<data.length; i++){
    const id = data[i][dataIndices.id_no]
    const addData = addCasesById[id]
    if(addData != undefined){
      const attrs = ["scale", "ther", "nifty", "kmc_wrap", "address","block", "caste", "religion"]
      for(let j=0; j<attrs.length; j++)
        data[i][dataIndices[attrs[j]]] = addData[attrs[j]]
    }
  }
  updateDataRows("STATIC",data,dataIndices)
}

function syncStaticDatabase() {
  
  let processed_timestamp = new Date("1900-01-01")
  
  //Sync existing processing sheets
  let activeResolved = ["HOME_VISIT","PRIORITY_CALLS", "OPD_VISITS","SUPPLIES_RETURN","FORMULA"]
  let copySheets = ["COMPLIMENTARY_FEEDING","GRAD_SUGGESTIONS","GRAD_RESOLVED"]
  for(let sh of activeResolved) {
    let wrds = ["_ACTIVE", "_RESOLVED"]
    for(wrd of wrds) {
      let [ind,,,d] = getData(sh+wrd)
      updateDataRows(sh+wrd+"_DBR",d,ind,1)
    }
  }
  for(let sh of copySheets) {
    let [ind,,,d] = getData(sh)
    updateDataRows(sh+"_DBR",d,ind,1)
  }
    

  console.warn("DBR Finished Basic Copying")
  //Clear tabs
  clearData_("PHONE_HOME_TESTING")
  clearData_("PHONE_HOME_ARCHIVE_TESTING")
  clearData_("IN_HOSPITAL_TESTING")
  clearData_("IN_HOSPITAL_ARCHIVE_TESTING")

  //Sync Phone Home
  let tabs = ["DO_NOT_FOLLOW","DO_NOT_FOLLOW_MEET_CRITERIA","GRADUATE","OLD_GRADUATE","PHONE_HOME_DIED_IN_ASMC","DIED_OUT_ASMC","UNREACHABLE","REFUSAL"]

  let tabMapping = {"DO_NOT_FOLLOW": "DNF Does NOT Meets Criteria",
                    "DO_NOT_FOLLOW_MEET_CRITERIA": "DNF Meets Criteria",
                    "OLD_GRADUATE": "Graduated",
                    "GRADUATE": "Graduated",
                    "PHONE_HOME_DIED_IN_ASMC": "Died in ASMC",
                    "DIED_OUT_ASMC": "Died out of ASMC",
                    "UNREACHABLE": "Unreachable",
                    "REFUSAL": "Refusal" }
  
  

  //Add phone/home archive data
  let [gradIndices,gradCases] = getData("GRAD_RESOLVED")
  let gradLimitIds = filterByColumnValue(gradCases,gradIndices.grad_status,5)[0]
  console.log(gradLimitIds)
  
  let phoneHomeDataSets = []
  let ids = []
  for(let i=0; i<tabs.length; i++) {
    const reason_to_archive = tabMapping[tabs[i]]
    let [phaIndices,phaCasesById,,phaData] = getData(tabs[i])
    
    phaIndices['reason_to_archive'] = phaData[0].length
    phaIndices['processed_timestamp'] = phaData[0].length + 1

    for(let j=0; j<phaData.length; j++) {
      if(reason_to_archive == "Graduated" & gradLimitIds.indexOf(String(phaData[j][phaIndices.id_no])) > -1)
        phaData[j].push("Grad (Limits)")
      else
        phaData[j].push(reason_to_archive)

      phaData[j].push(processed_timestamp)
    }

    insertData("PHONE_HOME_ARCHIVE_TESTING",-1,phaData,phaIndices,1)
    
    addLastObsCol_(phaCasesById,phaCasesById,'baby_care_items',phaIndices.baby_care_items,phaIndices)
    phoneHomeDataSets.push(phaCasesById)
    ids = getArrayUnion_(ids,Object.keys(phaCasesById))

  }

  //Add phone/home data
  let [phOriginalIndices,phOriginalData] = getData("PHONE_HOME")  
  moveData("PHONE_HOME","PHONE_HOME_TESTING",Object.keys(phOriginalData),-1,1,0,1)  
  addLastObsCol_(phOriginalData,phOriginalData,'baby_care_items',phOriginalIndices.baby_care_items,phOriginalIndices)
  phoneHomeDataSets.push(phOriginalData)
  ids = getArrayUnion_(ids,Object.keys(phOriginalData))

  console.warn("DBR Finished Phone/Home")


  let intakeRows = []
  let exitRows = []
  

  let [inHospIndices,inHospDataById,,inHospData] = getData("IN_HOSPITAL")
  ids = getArrayUnion_(ids,Object.keys(inHospDataById))

  inHospIndices['reason_to_archive'] = getMinAndMaxValuesInDict(inHospIndices).maxVal + 1
  inHospIndices['processed_timestamp'] = inHospIndices['reason_to_archive'] + 1

  let archiveData = []
  let activeData = []

  let phArchiveData = getData("PHONE_HOME_ARCHIVE_TESTING")[1]
  
  for(let i=0; i<inHospData.length; i++){
    const typ = inHospData[i][inHospIndices.type_of_form]
    let row = completeArray(inHospData[i], inHospIndices)

    if(typ == "intake")
      intakeRows.push(row)
    if(typ.includes("xit"))
      exitRows.push(row)

    const id = String(row[inHospIndices.id_no])
    if (phArchiveData[id] != undefined) {
      row[inHospIndices.reason_to_archive] = phArchiveData[id].reason_to_archive
      row[inHospIndices.processed_timestamp] = phArchiveData[id].processed_timestamp
      archiveData.push(row)
    }
    else
      activeData.push(row)
  }
  
  updateDataRows("IN_HOSPITAL_TESTING",activeData,inHospIndices,1)  
  
  let [,inHospDiedById,,inHospDiedData] = getData("DIED_IN_ASMC")
  ids = getArrayUnion_(ids,Object.keys(inHospDiedById))

  for(let i=0; i<inHospDiedData.length; i++) {
    
    let row = completeArray(inHospDiedData[i],inHospIndices)

    row[inHospIndices.reason_to_archive] = "Died in ASMC"
    row[inHospIndices.processed_timestamp] = processed_timestamp
    archiveData.push(row)

    const typ = inHospDiedData[i][inHospIndices.type_of_form]
    if(typ == "intake")
      intakeRows.push(row)
    if(typ.includes("xit"))
      exitRows.push(row)
  }

  updateDataRows("IN_HOSPITAL_ARCHIVE_TESTING",archiveData,inHospIndices,1)
  
  updateDataRows("INTAKE",intakeRows,inHospIndices,1)
  updateDataRows("EXIT",exitRows,inHospIndices,1)

  console.warn("DBR Finished In Hospital")
  //Sync Address Tab (split exit/intake differently)
  let [addIndices,addDataById] = getData("ADDRESS")
  let newAddressIndices = getIndices("ADDRESSES")
  let newAddressData = []
  let bcIndices = getIndices("BABYCARE_ITEMS")
  let bcData = []

  for(const [id,addData] of Object.entries(addDataById)){
    const caseHistory = addData.case_history
    let row = []
    let babyCareItemsId = ""
    for(let i=0; i<caseHistory.length; i++){
      row[newAddressIndices.id_no] = id
      row[newAddressIndices.block] = caseHistory[i][addIndices.block]
      
      let babyCareItems = ""
      
      if(String(caseHistory[i][addIndices.scale]).toLowerCase().includes("y"))
        babyCareItems = babyCareItems + " Scale;"
      if(String(caseHistory[i][addIndices.ther]).toLowerCase().includes("y"))
        babyCareItems = babyCareItems + " Thermometer;"
      if(String(caseHistory[i][addIndices.nifty]).toLowerCase().includes("y"))
        babyCareItems = babyCareItems + " Nifty;"
      if(String(caseHistory[i][addIndices.kmc_wrap]).toLowerCase().includes("y"))
        babyCareItems = babyCareItems + " KMC Wrap;"
      
      babyCareItemsId = babyCareItemsId || babyCareItems
      if (babyCareItems.length > 0)
        babyCareItems = babyCareItems.substring(1,babyCareItems.length)
      const addressIntake = caseHistory[i][addIndices.address_intake]
      if (addressIntake != ""){
        let newRow = [...row]
        newRow[newAddressIndices.address] = addressIntake
        newRow[newAddressIndices.entry_type] = "intake"
        newRow[newAddressIndices.date] = 0 //The zero date is a placeholder for now and can later be sourced from lbw tracking, but it simportant so exit rows are the last row
        completeArray(newRow,newAddressIndices)
        newAddressData.push(newRow)
      }
      
      const addressExit = caseHistory[i][addIndices.address_exit]
      if (addressExit != ""){
        let newRow = [...row]
        newRow[newAddressIndices.address] = addressExit
        newRow[newAddressIndices.entry_type] = "exit"
        newRow[newAddressIndices.date] = 1
        completeArray(newRow,newAddressIndices)
        newAddressData.push(newRow)
      }
      
      if (addressExit == "" & addressIntake == ""){
        row[newAddressIndices.entry_type] = "unknown"
        row[newAddressIndices.date] = -1
        completeArray(row,newAddressIndices)
        newAddressData.push(row)
      }
    }

    //Get row for baby care items
    let bcRow = []
    bcRow[bcIndices.id_no] = id
    bcRow[bcIndices.date] = -1
    bcRow[bcIndices.entry_type] = "exit"
    bcRow[bcIndices.baby_care_items] = babyCareItemsId
    bcRow[bcIndices.scale] = babyCareItemsId.indexOf("Scale") > -1 ? "yes":"no"
    bcRow[bcIndices.thermometer] = babyCareItemsId.indexOf("Thermometer") > -1 ? "yes":"no"
    bcRow[bcIndices.nifty] = babyCareItemsId.indexOf("Nifty") > -1 ? "yes":"no"
    bcRow[bcIndices.kmc_wrap] = babyCareItemsId.indexOf("KMC") > -1 ? "yes":"no"

    bcData.push(bcRow)
  }

  updateDataRows("ADDRESSES",newAddressData,newAddressIndices)
  updateDataRows("BABYCARE_ITEMS",bcData,bcIndices)
  
  console.warn("DBR Finished Address and Baby Care")
  
  //Update Basic Information
  let staticIndices = getIndices("STATIC")
  let staticData = []


  console.log(ids)
  for(let i=0; i<ids.length; i++) {
    let id = ids[i]


    let row = []
    let caseObj = inHospDataById[id] || inHospDiedById[id]

    if(caseObj == undefined) {
      for(let phDataSet of phoneHomeDataSets) {
        if (phDataSet[id] != undefined) {
          caseObj = phDataSet[id]
          break
        }
      }
    }

    if(caseObj == undefined)
      throw `Couldn't find case object for the id : ${id}. Something is wrong`

    let phCaseObj
    
    for(let phDataSet of phoneHomeDataSets) {
      if (phDataSet[id] != undefined) {
        phCaseObj = phDataSet[id]
        break
      }
    }

    let addCaseObj = addDataById[id]

    for(const [attr, index] of Object.entries(staticIndices))
      row[index] = caseObj[attr]

    let intakeDate = extractIntakeDateFromId_(id)
    if (String(intakeDate) == "Old Format; Cannot extract intake date" || String(intakeDate) == "Cannot extract intake date, check the format")
      intakeDate = caseObj.case_history[0][caseObj.indices.date]
    intakeDate.setHours(0,0,0,0)
    row[staticIndices.intake_date] = intakeDate
    
    if(row[staticIndices.initial_weight] != "" && row[staticIndices.initial_weight] != undefined)
      row[staticIndices.initial_weight_date] = caseObj.case_history[0][caseObj.indices.date]

    if(addCaseObj != undefined) {
      row[staticIndices.block] = addCaseObj.block
      row[staticIndices.caste] = addCaseObj.caste
      row[staticIndices.religion] = addCaseObj.religion
      row[staticIndices.address] = addCaseObj.address_exit || addCaseObj.address_intake
    }

    if(phCaseObj != undefined) {
      row[staticIndices.phone_numbers] = phCaseObj.phone_numbers
      row[staticIndices.last_baby_care_items] = phCaseObj.last_baby_care_items
    }
    else
      row[staticIndices.phone_numbers] = caseObj.phone_numbers
    
    if(String(row[staticIndices.female]).trim() == "1")
      row[staticIndices.female] = "yes"
    
    if(String(row[staticIndices.female]).trim() == "0")
      row[staticIndices.female] = "no"
    
    staticData.push(row)
  }
  updateDataRows("STATIC",staticData,staticIndices,1)
  importBirthOrders_()
  console.warn("BASIC INFORMATION UPDATED")

  updateCADays()
  console.warn("CA UPDATED")

  console.warn("DBR FINISHED SYNCING")
}

function updateCADays() {

  

  let tabs = ["IN_HOSPITAL_TESTING","IN_HOSPITAL_ARCHIVE_TESTING","PHONE_HOME_TESTING","PHONE_HOME_ARCHIVE_TESTING"]
  for(let i=0; i<tabs.length; i++) {
    updateCAbyTab(tabs[i])
  }
}



function checkEmptyCols(name) {
  console.log("Checking Empty Columns for:", name)
  let [indices,,,data] = getData(name)
  for(col in indices) {
    let flag = 0
    for(let i=0; i<data.length; i++) {
      if(String(data[i][indices[col]]).trim() == "")
        continue
      flag = 1
      break
    }
    if (flag ==0)
      console.log("Empty column found:", col)
  }
}

function addMissingRows() {
  let [indices,,,data] = getData("IN_HOSPITAL")
  let [,,,oldData] = getData("IN_HOSPITAL_COPY")
  console.log(data.length)
  console.log(oldData.length)
  let missingRows = []
  for(let i=0; i<oldData.length; i++){
    const dt = oldData[i][indices.date].valueOf()
    const id = oldData[i][indices.id_no]
    let flag = 0
    for(let j=0; j<data.length; j++){
      if(id == data[j][indices.id_no] && dt == data[j][indices.date].valueOf()){
        flag =1
        break
      }
    }
    if (flag == 0)
      missingRows.push(oldData[i])
  }

  insertData("IN_HOSPITAL",-1,missingRows,indices)

}

function checkInHospitalLastRow(attr, numDays) {

  let [,casesById] = getData("IN_HOSPITAL")
  let [indices,lastRowData] = getLastRowData_(casesById)
  
  let today = new Date()
  today.setHours(0,0,0,0)
  today = today.valueOf()

  let data = []

  for(let i=0; i<lastRowData.length; i++) {
    const row = lastRowData[i]
    row[indices.birthday] = new Date(row[indices.birthday])
    row[indices.date] = new Date(row[indices.date])
    if(attr == undefined) {
      const dt = row[indices.date]
      dt.setHours(0,0,0,0)
      if(String(row[indices.type_of_form]).toLowerCase().indexOf("xit") == -1 && (today -dt) >= (1000*60*60*24*numDays))
        data.push(row)
    }
    else {
      if(String(row[indices[attr]]) == "")
        data.push(row)
    }
  }
  if(attr == undefined)
    updateDataRows("IN_HOSPITAL_CHECK_EXIT",data,indices,1)
  else
    updateDataRows("IN_HOSPITAL_CHECK_ATTR",data,indices,1)
}

//we link in Hospital data check tool  to the Basic Information in the new database. 
function checkDBR(attr, numDays) {
  let [static_indices, static_data] = getData('STATIC')
  let [,casesById] = getData("INTAKE")
  let [indices,lastRowData] = getLastRowData_(casesById)

  //store static ids
  let static_ids = Object.keys(static_data) 

  let data = []
  for(let i=0; i<lastRowData.length; i++) {
    const row = lastRowData[i]
    //row[indices.birthday] = new Date(row[indices.birthday])
    //row[indices.date] = new Date(row[indices.date])
    let id = row[indices.id_no]

    //loop through static ids 
    for (let i = 0; i < static_ids.length; i++) {
      let id_no = static_ids[i];
      let caseData = static_data[id_no].case_history;

      if (id_no == id){
        for (let k = 0; k < caseData.length; k++) {
          //store the rows and information needed
          let caseRow = caseData[k];
          let mother = caseRow[static_indices.mother]
          newRow = [id, mother]

          if(attr == undefined) {
            if(String(row[indices.type_of_form]).toLowerCase().indexOf("xit") == -1){
              data.push(newRow)
            }
          }
          else {
            if(String(row[indices[attr]]) == "")
            data.push(newRow)
          }
        }
      }
    }
    
  }

  if (attr == 'place_of_birth'){
    clearData_("DBR_BIRTHPLACE")
    insertData('DBR_BIRTHPLACE', -1, data)
  }
  else if (attr == 'mothers_doctor'){
    clearData_("DBR_MOTHERS_DOCTOR")
    insertData('DBR_MOTHERS_DOCTOR', -1, data)
  }

  
}


function fix_dateColumns(sheetName, columnName, splitChar) {
  let [indices,,,rawData] = getData(sheetName)
  for(let i=0; i<rawData.length; i++) {
    const stringDate = rawData[i][indices[columnName]]
    console.log(stringDate)
    if(String(stringDate).trim() != "" && typeof(stringDate) == "string") {
      const [day, month, year] = stringDate.split(splitChar);
      const dateObject = new Date(year, month - 1, day);
      rawData[i][indices[columnName]] = dateObject
    }
  }

  updateDataRows(sheetName,rawData,indices)
}

function importBirthOrders_() {
  let a = getData("IN_HOSPITAL")[1]
  let [basicIndices,basicInfoData] = getData("STATIC")
  
  for(const [id,caseData] of Object.entries(a)) {
    for(let i=0; i<caseData.case_history.length; i++) {
      if(String(caseData.case_history[i][caseData.indices.birth_order]).trim() != "") {
        console.log(`For ID: ${id} and twin id: ${caseData.twin_id}, found a birth order of ${caseData.case_history[i][caseData.indices.birth_order]} when type is ${caseData.case_history[i][caseData.indices.type_of_form]} and attribute is ${caseData.birth_order}`)
        basicInfoData[id].case_history[0][basicIndices.birth_order] = caseData.case_history[i][caseData.indices.birth_order]
      }
      break
    }
  }

  a = getData("DIED_IN_ASMC")[1]
  for(const [id,caseData] of Object.entries(a)) {
    for(let i=0; i<caseData.case_history.length; i++) {
      if(String(caseData.case_history[i][caseData.indices.birth_order]).trim() != "") {
        console.log(`For ID: ${id} and twin id: ${caseData.twin_id}, found a birth order of ${caseData.case_history[i][caseData.indices.birth_order]} when type is ${caseData.case_history[i][caseData.indices.type_of_form]} and attribute is ${caseData.birth_order}`)
        basicInfoData[id].case_history[0][basicIndices.birth_order] = caseData.case_history[i][caseData.indices.birth_order]
      }
      break
    }
  }
  
  updateDataRowWithCasesById("STATIC",basicInfoData,basicIndices)

}

function deleteRowsAndCols_caseIdSearch() {
  
  let suffixes = ["IN_HOSPITAL","PHONE_HOME","ADDRESS"]

  for(let i=1; i<=13; i++) {
    for(let j=0; j<suffixes.length; j++) {
      const suff = suffixes[j]
      let tabName = `CASE_SEARCH_${i}_${suff}`  
      let tab = getTab(tabName)

      //Delete rows and columns
      let rng = tab.getDataRange()
      let nColumns = rng.getNumColumns() - 5
      let nRows = rng.getNumRows() - 4
      if(nColumns > 0)
        tab.deleteColumns(5,nColumns)
      if(nRows > 0)
        tab.deleteRows(4,nRows)
      
      //Copy from master tab
      let masterTab = getTab(`CASE_SEARCH_DBR_${suff}`)
      let data = masterTab.getRange("1:2").getValues()
      console.log(data)
      console.log(data.length)
      console.log(data[0].length)
      console.log(data[1].length)
      tab.getRange(1,1,data.length,data[0].length).setValues(data)

    }
  }
}


