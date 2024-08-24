// this function updates address of supplies return active if they are empty. it retrives it from Address tab.

//Can use this function for now. Check if it makes sense to you and let me know if you have doubts/questions
function updateAddressInSupplyReturn() {
  let [indices,,,data] = getData("SUPPLIES_RETURN_ACTIVE");
  let [addIndices,addCases] = getData("ADDRESS");

  for(let i = 0; i < data.length; i++) {
    const id = data[i][indices.id_no]
    let addData = addCases[id]?.case_history || []
    let address = "";
    let block = "";

    for(let j = 0; j < addData.length; j++) {
      block = addData[j][addIndices.block] || block;
      address = addData[j][addIndices.address_exit] || addData[j][addIndices.address_intake] || address;
    }

    data[i][indices.block] = data[i][indices.block] || block;
    data[i][indices.address] = data[i][indices.address] || address;
  }

  updateDataRows("SUPPLIES_RETURN_ACTIVE", data, indices);
}

function updateAddressInSupplyReturn_dbr() {
  let [indices,,,data] = getData("SUPPLIES_RETURN_ACTIVE_DBR");
  let basicInfo = getData("STATIC")[1]

  for(let i = 0; i < data.length; i++) {
    const id = String(data[i][indices.id_no])
    data[i][indices.block] = basicInfo[id].block
    data[i][indices.address] = basicInfo[id].address
  }

  updateDataRows("SUPPLIES_RETURN_ACTIVE_DBR", data, indices);
}


function updatebabyStatusInFormulaActive_dbr() {
  let [indices, caseById,] = getData("PHONE_HOME_TESTING")
  let [, masterCaseByID,] = getData("MASTER_DATA_TESTING")
  let [formulaIndices,formulaCasesByIDs,,data]= getData("FORMULA_ACTIVE_DBR")
  
  let babiesStatus ={}
  let ids = Object.keys(formulaCasesByIDs)
  //console.log(ids)

  for(let i =0; i< ids.length;i++){
    let id = ids[i]
    let babystatus = masterCaseByID[id].current_status
    babiesStatus[id] = babystatus
  }

  for(let i = 0; i< ids.length ; i++){
    let id = ids[i]
    if(babiesStatus[id] =="phone/home active" || babiesStatus[id] =="phone/home active (special calls)"){
      babiesStatus[id] = "Active"
      let caseHistory = caseById[id].case_history
      for(let j =0; j< caseHistory.length ; j++){
        let dateToFollowUp = caseHistory[j][indices.date_to_follow_up]
        if(dateToFollowUp =="grad wt pending"){
          babiesStatus[id] = "grad wt pending"
        }
      }
    }
  }
  
  for(let i = 0; i < data.length; i++) {
    const id = String(data[i][formulaIndices.id_no])
    data[i][formulaIndices.baby_status] = babiesStatus[id]
  }
  updateDataRows("FORMULA_ACTIVE_DBR", data, formulaIndices)

}



function updateLastWeightInSupplyReturn_dbr() {
  let [,masterCaseByID,]= getData("MASTER_DATA")
  let [indices,,,data] = getData("SUPPLIES_RETURN_ACTIVE_DBR")
  

  for(let i =0; i < data.length ; i++){
    let babyStatus = String(data[i][indices.reason_for_pickup]).toLowerCase()
    if(babyStatus.includes("grad")){
      let id = String(data[i][indices.id_no])
      data[i][indices.last_weight] = masterCaseByID[id].last_weight
    }
  }
  updateDataRows("SUPPLIES_RETURN_ACTIVE_DBR", data, indices)
}
