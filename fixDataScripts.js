function checkDuplicateIDs() {
  let [indices, dataById,,] = getData("IN_HOSPITAL")
  let ids = Object.keys(dataById)

  let constantFields = ["intial_weight"]
  let totalMismatch = 0
  for(let i=0; i<ids.length; i++) {
    const caseData = dataById[ids[i]].case_history
    let flag = 0
    for(let j=0; j<caseData.length; j++) {
      for(let k=0; k<constantFields.length; k++) {
        const staticVal = String(dataById[ids[i]][constantFields[k]]).trim()
        const val = String(dataById[ids[i]].case_history[j][indices[constantFields[k]]]).trim()
        if(val != staticVal) {
          console.log(`Duplicates found within ID: ${ids[i]} when matching ${constantFields[k]}. The constant value is ${staticVal} while the other is ${val}`)
          flag = 1
          totalMismatch++
          break
        }
      }
      if (flag == 1)
        break
    }
  }
  console.log(`Total number of Duplicate IDs: ${totalMismatch}`)
}




function completeStaticField(name, field) {

  let [indices,casesById,,] = getData(name)
  console.log(indices)
  console.log(indices[field])
  
  let ids = Object.keys(casesById)
  let blank = 0
  for(let i=0; i<ids.length; i++) {
    let id = ids[i]
    let caseData = casesById[id].case_history
    let staticVal = ""
    for(let j=0; j<caseData.length; j++) {
      let val = caseData[j][indices[field]]
      if (id == "22082802")
        console.log(val)
      if (val != "")
        staticVal = val
    }
    if (staticVal == "") {
      console.log(`Blank Initial Weight: ${id}; Mother: ${casesById[id].mother}; Father: ${casesById[id].father}`)
      blank++
    }
    for(let j=0; j<caseData.length; j++) {
      let val = caseData[j][indices[field]]
      if (val == "" | val == undefined){
        console.log(`Undefined value found for id: ${id}. Switching to ${staticVal}`)
        console.log(`Value before: ${casesById[id].case_history[j][indices[field]]}`)
        casesById[id].case_history[j][indices[field]] = staticVal
        console.log(`Value after: ${casesById[id].case_history[j][indices[field]]}`)
      }
    }


    
  }
  console.log(`Total IDs with Blank initial weight: ${blank}`)
  //Data has been updated
  let [updatedData,notFoundData,notFoundIds] = filterCaseHistoryData_(casesById,ids)
  console.log(updatedData.length)
  console.log(notFoundData.length)
  console.log(notFoundIds.length)
  updateDataRows(name,updatedData)
}


function fixStaticField(name, field, srcName, srcField) {

  let [,srcCasesById] = getData(srcName)

  let [indices,casesById,,rawData] = getData(name)
  
  let ids = Object.keys(casesById)
  for(let i=0; i<ids.length; i++) {
    let id = ids[i]
    let caseData = casesById[id].case_history
    let staticVal = srcCasesById[id][srcField]
    for(let j=0; j<caseData.length; j++)
      caseData[j][indices[field]] = staticVal
    
    casesById[id].case_history = caseData
  }

  let [data] = filterCaseHistoryData_(casesById)
  let orderedIds = getOrderedIds_(rawData,indices.id_no)
  //Sort left data in the original order of ids
  let orderKey = [{column: indices.id_no, ascending: 'custom', blanksAtBottom: true, sortArray: orderedIds}]
  data = sortData(data,orderKey)
    
  
  //Data has been updated
  console.log(rawData.length)
  console.log(data.length)
  updateDataRows(name,data)
}

function updatetst () {
  fixStaticField("FORMULA_ACTIVE","ga", "IN_HOSPITAL", "ga_weeks")

}



function fixYears1(name) {

  let [indices,,,rawData] = getData(name)
  let today = new Date()
  
  for(let i=0; i<rawData.length; i++){ //Scan all Rows
    for(let j=0; j<DATE_COLS.length;j++){ //For all Date Columns
      let dtCol = DATE_COLS[j]
      let field = rawData[i][indices[dtCol]]
      if(field > today) //If the vALUE OF A DATE COLUMN IS GREATER THAN TODAY'S DATE, THAT IMPLIES IT MUST BE FROM 2022 AND ACCIDENTALLY CHANGED TO 2023
        field.setYear(2022) //cHANGE YEAR TO 2022
      if(field != undefined) //For non date entries (text entry) field may become undefined, so don't replace
        rawData[i][indices[dtCol]] = field
    }
  }
  updateDataRows(name, rawData)

}

function fixYears2(name) {

  let [indices,,,rawData] = getData(name)
  
  for(let i=0; i<rawData.length; i++){ //Scan all Rows
    let idYear = String(rawData[i][indices.id_no]).substring(0,2)
    for(let j=0; j<DATE_COLS.length;j++){ //For all Date Columns
      let dtCol = DATE_COLS[j]
      let field = rawData[i][indices[dtCol]]
      if(idYear != "23" & idYear != "22") { //If Id doesn't start with 22 or 23, then it is the old system of IDs and therefore must be 2022
        try {
          field.setYear(2022) //cHANGE YEAR TO 2022
        } catch (e) {
          field = undefined
        }
      }
      if(field != undefined) //For non date entries (text entry) field may become undefined, so don't replace
        rawData[i][indices[dtCol]] = field
    }
  }
  updateDataRows(name, rawData)

}

function fixYears3(name) {

  let [indices,,,rawData] = getData(name)
  
  for(let i=0; i<rawData.length; i++){ //Scan all Rows
    let bday = rawData[i][indices.birthday]
    let dt = rawData[i][indices.date]
    let dtFollowUp = rawData[i][indices.date_to_follow_up]
    if(dt < bday & String(dt).trim() != '') //If Id doesn't start with 22 or 23, then it is the old system of IDs and therefore must be 2022
      dt.setYear(2022) //cHANGE YEAR TO 2022
    if(dtFollowUp < bday & String(dtFollowUp).trim() != '') //If Id doesn't start with 22 or 23, then it is the old system of IDs and therefore must be 2022
      dtFollowUp.setYear(2022) //cHANGE YEAR TO 2022
    
    rawData[i][indices.date] = dt
    rawData[i][indices.date_to_follow_up] = dtFollowUp
  }

  updateDataRows(name, rawData)

}

function fixGrad() {
  fixYears3("GRADUATE")
}