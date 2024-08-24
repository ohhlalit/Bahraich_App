function createMasterSheet() {

    let data = getMergedDataForSideBar_dbr()
    let indices = getData("MASTER_DATA",1)
    let [docIndices, docCasesByIds,] = getData("DOCTORS_REPORT_WORKSHEET_DBR")
    
    let masterData = []
    for(let i=0; i<data.length; i++) {
        let row = []

        row[indices.last_update_date] = new Date()
        const basicAttrs = ["id_no", "twin_id", "mother", "father", "birthday", "initial_weight","ga_weeks","female", "current_status"]
        for(let j=0; j<basicAttrs.length; j++)
            row[indices[basicAttrs[j]]] = data[i][basicAttrs[j]]
        let bday = new Date(row[indices.birthday])
        bday.setHours(0,0,0,0)
        row[indices.birthday] = bday
        row[indices.intake_date] = extractIntakeDateFromId_(row[indices.id_no])
        row[indices.three_day_trend] = "not in hospital"
        let threeDayTrend 
        if(docCasesByIds[row[indices.id_no]]){
          let caseHistory = docCasesByIds[row[indices.id_no]].case_history
          threeDayTrend = caseHistory[caseHistory.length -1][docIndices.three_day_trend] 
          if(caseHistory.length -2 > -1){
          threeDayTrend = (threeDayTrend == "") ? caseHistory[caseHistory.length -2][docIndices.three_day_trend] : threeDayTrend
          }
          row[indices.three_day_trend] = (threeDayTrend != "") ? threeDayTrend : "insufficient data"
        }

        const phSource = data[i].phone_home_source_sheet
        const phData = data[i][`${phSource}_case_history`]
        const phIndices = data[i][`${phSource}_indices`]
        
        let currentStatus = phSource

        //Should simply get female from the in hospital data
        if(phData[0][0] == "No Out of Hospital Data Found") {
            //row[indices.female] = "No Out of Hospital Data Found"
            row[indices.last_baby_care_items] = "No Out of Hospital Data Found"
            currentStatus = data[i].in_hospital_source
            const inHospLastRow = data[i].in_hospital_case_history[data[i].in_hospital_case_history.length - 1]
            const inHospIndices = data[i].in_hospital_indices
            row[indices.last_phone_numbers] = inHospLastRow[inHospIndices.phone_numbers]
            row[indices.female]= inHospLastRow[inHospIndices.female]
        }
        else {
            const lastRow = phData[phData.length-1]
            row[indices.female] = lastRow[phIndices.female]
            row[indices.last_phone_numbers] = lastRow[phIndices.phone_numbers]
            row[indices.last_baby_care_items] = lastRow[phIndices.baby_care_items]

            if(phSource == "ph") {
              currentStatus= analyzePatientStatus(phData, phIndices)
              const callType = lastRow[phIndices.type]
              if(callType.indexOf("Special Call") > -1 & callType.indexOf("Special Call =>") == -1)
                currentStatus = "phSpecialCall"
            }
        }

        

        const date = new Date()
        date.setHours(0,0,0,0)
        const numDays = (date.valueOf() - bday) / (1000*60*60*24)
        let ca_weeks = Math.floor(numDays/7) + row[indices.ga_weeks]
        let ca_days = numDays%7
        if(isNaN(ca_weeks))
          ca_weeks = "Error. Check birthday and ga"
        if(isNaN(ca_weeks))
          ca_weeks = "Error. Check birthday and ga"

        row[indices.todays_pma]= ca_weeks +" W " + ca_days +" D"
        if(row[indices.ga_weeks] == ""){
          row[indices.todays_pma]= "GA (weeks) is missing"
        }

        let weightData = ms_getWeightData_(phData,phIndices,data[i].in_hospital_case_history,data[i].in_hospital_indices)

        //Last Weight
        row[indices.last_weight] = weightData.lastWeightData.weight
        row[indices.last_weight_date] = weightData.lastWeightData.date
        row[indices.last_weight_source]= weightData.lastWeightData.source

        //Last Reliable Weight
        row[indices.last_reliable_weight] = weightData.lastReliableWeightData.weight
        row[indices.last_reliable_weight_date] = weightData.lastReliableWeightData.date
        row[indices.last_reliable_weight_source]= weightData.lastReliableWeightData.source

        //Initial Weight
        if(row[indices.initial_weight] =="" || row[indices.initial_weight] == undefined){
          row[indices.initial_weight] = weightData.initialWeightData.weight
        }
        row[indices.initial_weight_date] = weightData.initialWeightData.date

        //Adjust for missing weights
        if(row[indices.last_weight]==-1){
          row[indices.last_weight] = "No last Weight present"
          row[indices.last_weight_date] = "No last Weight present"
          row[indices.last_weight_source]= "No last Weight present"
        }

        if(row[indices.last_reliable_weight]==-1){
          row[indices.last_reliable_weight] = "No last Reliable Weight present"
          row[indices.last_reliable_weight_date] = "No last Reliable Weight present"
          row[indices.last_reliable_weight_source]= "No last Reliable Weight present"
        }
        if(row[indices.initial_weight]==-1){
          row[indices.initial_weight] = "No Initial Weight present"
          
        }
        if(row[indices.initial_weight_date] == -1){
          row[indices.initial_weight_date] = "No Initial Weight present"
        }

        //Some values are stored as 1/0 while some as yes/no..making them consistent
        if(String(row[indices.female]).trim() == "")
          row[indices.sex] = ""
        if(row[indices.female] == 1 || String(row[indices.female]).toLowerCase()== "yes")
          row[indices.sex] = "Female"
        else if(row[indices.female] == 0 || String(row[indices.female]).toLowerCase()== "no")
          row[indices.sex] = "Male"



        // last update date
        if(row[indices.current_status]== "phone/home active" || row[indices.current_status]== "phone/home active (special calls)"){
          row[indices.last_update_date_phone_home] = ms_getLastUpdateDate (phData,phIndices)
         
        }

        if(row[indices.current_status] == "in ASMC"){
          row[indices.three_day_trend] = (row[indices.three_day_trend] != "not in hospital") ? row[indices.three_day_trend] : "insufficient data"
        }

        if(row[indices.current_status] =="grad"){
          row[indices.current_status] = checkIfDiedAfterGrad(phData,phIndices)
        }

        const addData = data[i].address_case_history
        const addIndices = data[i].address_indices
        
        if(addData[0][0] == "No Address Data Found") {
            row[indices.address] = "No Address Data Found"
            row[indices.block] = "No Address Data Found"
            row[indices.religion] = "No Address Data Found"
        }
        else {
            const lastRow = addData[addData.length-1]
            row[indices.address] = data[i].address
            row[indices.caste] = lastRow[addIndices.caste]
            row[indices.block] = lastRow[addIndices.block]
            row[indices.religion] = lastRow[addIndices.religion]
            row[indices.map_link] = lastRow[addIndices.map_link]
        }
        ms_completeRow(row, indices)
        masterData.push(row)
    }

    updateDataRows("MASTER_DATA",masterData,indices)


}

function ms_completeRow(row, indices) {
  row = completeArray(row,indices)
  for(let i=0; i<row.length; i++) {
    if(String(row[i]).trim() == "")
      row[i] = "Missing"
  }
}

function ms_getCurrentStatus_(phSource) {
  
  let phSourceName
  if(phSource == "inHospital")
    phSourceName = "in ASMC"
  else if(phSource == "died" | phSource == "diedInAsmc")
    phSourceName = "died in ASMC"
  else if(phSource == "diedOutAsmc")
    phSourceName = "died out ASMC"
  else if(phSource == "ph")
    phSourceName = "phone/home active"
  else if(phSource == "phSpecialCall")
    phSourceName = "phone/home active (special calls)"
  else if(phSource == "dontFollow")
    phSourceName = "do not follow"
  else if(phSource == "diedOutAsmc")
    phSourceName = "died out ASMC"
  else if(phSource == "diedOutAsmc")
    phSourceName = "died out ASMC"
  else
    phSourceName = phSource
  
  return phSourceName
}



function ms_getWeightData_(caseHistory, indices, inHospCaseHistory, inHospIndices) { 
  
  let lastWeightData = {date: -1, weight: -1, source:""}
  let lastReliableWeightData = {date: -1, weight: -1, source: ""}
  let initialWeightData  = {date: -1, weight: -1, source: ""}

  if(caseHistory[0][0] != "No Out of Hospital Data Found") { //Check phone home data if it exists
    for(i=caseHistory.length-1; i>=0; i--) {
      let weight = caseHistory[i][indices.weight]
      
      if(!(weight > 0)) //If there is no weight recorded, no point moving forward
        continue
      
      let dt = new Date(caseHistory[i][indices.date])
      let source = caseHistory[i][indices.type]

      if(source.indexOf("xit") > -1 || source.indexOf("reIntake") > -1)
        source = "hospital"
      if(source.indexOf("home") > -1)
        source = "home visit"
      

      if (lastWeightData.weight == -1) { //Only updates the first value found
        lastWeightData.date = dt
        lastWeightData.weight = weight
        lastWeightData.source = source
      }

      if (lastReliableWeightData.weight == -1 && (source == "hospital" || source == "home visit")) {
        lastReliableWeightData.date = dt
        lastReliableWeightData.weight = weight
        lastReliableWeightData.source = source
        break //Nothing to do after last reliable weight data is found
      }
    }
  }

  //Look for reliable weight in inhosp case history
  for(i=inHospCaseHistory.length-1; i>=0; i--) {
    let weight = inHospCaseHistory[i][inHospIndices.weight]
    
    if(!(weight > 0))
      continue
    
    let dt = new Date(inHospCaseHistory[i][inHospIndices.date])
    let source = "in patient"

    if(lastWeightData.weight == -1 || lastWeightData.date < dt) {
      lastWeightData.date = dt
      lastWeightData.weight = weight
      lastWeightData.source = source
    }

    if(lastReliableWeightData.weight == -1 || lastReliableWeightData.date < dt) {
      lastReliableWeightData.date = dt
      lastReliableWeightData.weight = weight
      lastReliableWeightData.source = source
    }
    
    if(initialWeightData.weight == -1 || initialWeightData.date > dt) {
      initialWeightData.date = dt
      initialWeightData.weight = weight
      initialWeightData.source = source
    }
  }

  return {'lastWeightData':lastWeightData, 'lastReliableWeightData':lastReliableWeightData, 'initialWeightData': initialWeightData}
}



function ms_getLastUpdateDate (phData,phIndices){
  let lastUpdateDate ="not found"
  for(i=phData.length-1; i>=0; i--) {
    let type = phData[i][phIndices.type].toString().toLowerCase().trim() 
    if(lastUpdateDate =="not found" &&(type == "home" || type == "hospital" || phData[i][phIndices.result_of_call].toString().toLowerCase().trim() == "hospital call log")){
      lastUpdateDate =  new Date(phData[i][phIndices.date])
    }

    if(lastUpdateDate =="not found" && type == "phone"){
      if(phData[i][phIndices.result_of_call].toString().toLowerCase().trim() == "complete"){
        lastUpdateDate =  new Date(phData[i][phIndices.date])
      }else if (phData[i][phIndices.result_of_call].toString().toLowerCase().trim() == "incomplete"){
        let ad = phData[i][phIndices.feeding_upar_ka_dudh] !=""
        let ae = phData[i][phIndices.fever] !=""
        let af = phData[i][phIndices.jaundice] != ""
        let ag = phData[i][phIndices.pees_less_than_4_times] != ""
        let ah = phData[i][phIndices.breathing_problems] != ""

        if (ad && ae && af && ag && ah){
          lastUpdateDate =  new Date(phData[i][phIndices.date])
        }

      }
    }
  }
  return lastUpdateDate
}



function checkIfDiedAfterGrad(phData, phIndices) {
  let status = "grad";

  let deadBaby = phData.filter(function (row) {
    return row[phIndices.date_to_follow_up] === "Dead";
  });

  if (deadBaby.length > 0) {
    status = "died after graduation";
  }

  return status;
}


























