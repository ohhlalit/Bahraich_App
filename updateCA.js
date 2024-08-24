
/**
 * 
 * @param {String} name - Name of the sheet in standard convention
 * 
 * Updates the columns "CA (days)" and "CA (weeks)" in the provided sheet using GA/Birthday information from the Basic Information Sheet.
 * The sheet needs to have date column and either one of CA weeks or CA days for this to work.
 */
function updateCAbyTab(name, noDate, basicInfo) {
    let [indices,,,data] = getData(name)
    
    let ca_days_col = indices.ca_days
    let ca_weeks_col = indices.ca_weeks
    let pma_col = indices.pma
    let pma_weeks_col = indices.pma_weeks

    if(ca_days_col == undefined & ca_weeks_col == undefined & pma_col == undefined & pma_weeks_col == undefined)
      throw `Cannot update ${name} as there is no CA Days or CA Weeks or PMA Column`
    // if(indices.date == undefined & indices.delivery_date == undefined & noDate != 1)
    //     throw `Cannot dynamically update CA. There is no ${'date'} column in ${name}`

    if(basicInfo == undefined)
        basicInfo = getData("STATIC")[1]

    let ca_days = []
    let ca_weeks = []
    let pmas = []
    let pma_weeks = []

    let ga_w = []
    let ga_d = []
    let ga_wd = []

    let dt
    if(noDate)
      dt = new Date()

              

    for(let j=0; j<data.length; j++) {
      
      let id = String(data[j][indices.id_no])
      let ca_day = ""
      let ca_week = ""
      let pma = ""
      let pma_week = ""

      if(basicInfo[id] != undefined) {
        //throw `Cannot Find Basic Information for ${id}. Please check the basic information sheet to ensure ${id} exists in database.`
      
        let ga_weeks = basicInfo[id].ga_weeks
        let ga_days = basicInfo[id].ga_days
        ga_w.push([ga_weeks])
        ga_d.push([ga_days])
        ga_wd.push([`${ga_weeks}W ${ga_days}D`])

        
        if(ga_weeks > 0) {
          if(noDate != 1) {
            if(name.includes("FORMULA"))
              dt = data[j][indices.delivery_date]
            else if(name.includes("COMPLIMENTARY"))
              dt = data[j][indices.processed_timestamp]
            else
              dt = data[j][indices.date]
          }
          try {
            let caData = computeCA_(ga_days,ga_weeks,basicInfo[id].birthday,dt)
            ca_week = caData.caWeeks
            ca_day = caData.caDays
            pma = caData.caWD
            if(ca_day > 3)
              pma_week = ca_week + 1
            else
              pma_week = ca_week
          } catch(e) {
            console.log("Cannot compute")
          }
        }
      }
      ca_days.push([ca_day])
      ca_weeks.push([ca_week])
      pmas.push([pma])
      pma_weeks.push([pma_week])
    }
  
    let row = eval(name+"_HEADER_INDEX") + 2
    let tab = getTab_(name)
    
    if(ca_weeks_col != undefined) {
      tab.getRange(row,ca_weeks_col + 1,ca_weeks.length,1).setValues(ca_weeks)
      console.log("Updated CA Weeks")
    }
      
    if(ca_days_col != undefined) {
      tab.getRange(row,ca_days_col + 1,ca_days.length,1).setValues(ca_days)
      console.log("Updated CA Days")
    }

    if(pma_col != undefined) {
      tab.getRange(row,pma_col + 1,pmas.length,1).setValues(pmas)
      console.log("Updated PMA")
    }

    if(pma_weeks_col != undefined) {
      tab.getRange(row,pma_weeks_col + 1,pma_weeks.length,1).setValues(pma_weeks)
      console.log("Updated PMA (Weeks)")
    }

    if(!(name.includes("PHONE_HOME") | name.includes("IN_HOSPITAL"))) {
      let ga_weeks_col = indices.ga_weeks
      if(ga_weeks_col != undefined) {
          tab.getRange(row,ga_weeks_col + 1,ga_w.length,1).setValues(ga_w)
          console.log("Updated GA Weeks")
      }
  
      let ga_days_col = indices.ga_days
      if(ga_days_col != undefined) {
          tab.getRange(row,ga_days_col + 1,ga_d.length,1).setValues(ga_d)
          console.log("Updated GA Days")
      }
      
      let ga_wd_col = indices.ga
      if(ga_wd_col != undefined) {
          tab.getRange(row,ga_wd_col + 1,ga_wd.length,1).setValues(ga_wd)
          console.log("Updated GA WD")
      }
    }
}


function addGACAinWDFormat_caseObj_(indices, casesByID) {
  
  for(let caseObj of Object.values(casesByID)) {
    sidebar_addGACAinWDFormat_(caseObj.case_history,indices)
    let lastRow = caseObj.case_history[caseObj.case_history.length-1]
    caseObj["ga"] = lastRow[indices.ga]
    caseObj["pma"] = lastRow[indices.pma]
    caseObj["indices"] = indices
  }
}