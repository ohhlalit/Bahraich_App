
function syncDoctorsReport(dbr) {
  dbr = 1
  console.log("Syncing Doctors Report")
  //DBR
  let suff = ""
  let suff2 = ""
  if (dbr) {
    suff = "_DBR"
    suff2 = "_TESTING"
  }

  let [reportIndices, reportCases] = getData("DOCTORS_REPORT_WORKSHEET" + suff)
  let [archiveIndices, archiveCases] = getData("DOCTORS_REPORT_ARCHIVE" + suff)
  let [inHospIndices, inHospCases] = getData("IN_HOSPITAL" + suff2)
  let inHospCasesMaster = getElement_(inHospCases) //Create a deep copy of the inHospCases to be used later for extracting static data

  //Delete blank rows from doctors report
  delete reportCases['']
  // reportCases = drpt_deduplicate(reportCases) //De-duplicate data; shouldn't be needed but leaving in here just in case: PG
  
  

  let reportIds = Object.keys(reportCases)
  let inHospIds = Object.keys(inHospCases)
  let archiveIds = Object.keys(archiveCases)
  console.log("Number of Original cases", inHospIds.length)
  //Update reportIds
  console.log("Updating Data for existing IDs in Doctor's Report")
  let [updatedReportCasesIndices, updatedReportCases] = mergeCaseHistoryData(inHospCases,inHospIndices,reportCases, reportIndices,reportIds)

  

  //Select Active Cases (latest row at least 2 days old)
  let filterDate = new Date()
  filterDate.setDate(filterDate.getDate() - 2)
  filterDate.setHours(0,0,0,0)
  console.log("Filter date:", filterDate)
  for(let i=0; i<inHospIds.length; i++) {
    if(inHospCases[inHospIds[i]].date.valueOf() < filterDate.valueOf()) {
      //console.log(`Deleting ID ${inHospIds[i]} as the date is ${inHospCases[inHospIds[i]].date} and filter date is ${filterDate}`)
      delete inHospCases[inHospIds[i]]
    }
  }
  
  inHospIds = Object.keys(inHospCases)
  console.log(`After removing cases whose last row was more than 2 days old, number of cases left: ${inHospIds.length}`)
  
  //Add new Ids
  let newIds = []
  for(let i=0; i<inHospIds.length; i++){
    let id = inHospIds[i]
    if(reportIds.indexOf(id) != -1) //Only proceed if this isn't already present in the report id
      continue
    else {
      if(archiveIds.indexOf(id) != -1){ //If present in archive, check if there is more recent data available
        if(inHospCases[id].date.valueOf() > archiveCases[id].date.valueOf()) { //Check if latest date is greater (that is new information has come in)
          newIds.push(id)
          console.log(`New data found for id ${id}. Latest row in In Hospital => ${inHospCases[id].date} whereas in Archive it is ${archiveCases[id].date}`)
        }
        else
          continue
      }
      else //If not present in archive, this is a new id
        newIds.push(id)
    }
  }

  console.log("New IDs =>", newIds)
  //Add data from new Ids 
  console.log("Adding Data for new IDs in Doctor's Report")
  let [newCasesIndices, newCases] = mergeCaseHistoryData(inHospCases,inHospIndices,archiveCases, archiveIndices,newIds)

  //Merge (append rather) the updated and the new ids (skip id array as we want the whole data)
  let [mergedIndices, mergedCases] = mergeCaseHistoryData(updatedReportCases,updatedReportCasesIndices,newCases,newCasesIndices)


  //Update all exisiting Ids with fixed data from LBW Tracking (mother, father, ga, initial weight)
  console.log("Updating static data for all IDs")
  let mergedIds = Object.keys(mergedCases)
  for(let i=0; i<mergedIds.length; i++) {
    let id = mergedIds[i]
    console.log(id)
    let caseData = inHospCasesMaster[id]
    if(caseData == undefined) //All cases must be in LBW Tracking - In Hospital
      console.error(`Cannot find ID ${id} in the "in-hospital" sheet. Please check`)
    else {
      let bday = caseData.birthday //As Case Data comes from getElement_() function, the date objects are converted to values, so convert them back
      bday = new Date(bday)

      let birthplace = drpt_getBirthplace_(caseData)
      mergedCases = updateColumnsById_(mergedCases,mergedIndices,[id],
                                      ["initial_weight", "birthday", "mother", "father", "ga_weeks", "birthplace"],
                                      [caseData.initial_weight, bday, caseData.mother, caseData.father, caseData.ga_weeks, birthplace])
    }
  }

  console.log(`A total of ${Object.keys(mergedCases).length} IDs are present in the doctor's report`)
  //Get the last baby room
  console.log("Adding Last Room Information")
  let mergedDataWithLastRoom = addLastObsCol_(mergedCases,mergedCases,"baby_room",mergedIndices.where_is_the_baby_now,mergedIndices)
  mergedIndices = mergedDataWithLastRoom[0]
  mergedCases = mergedDataWithLastRoom[1]
  
  //Archive cases based on the last known room
  mergedCases = archiveDoctorsReport(mergedCases, mergedIndices, dbr)
  
  //Update report
  calculateAndUpdateDoctorsReport_(mergedIndices,mergedCases,0,0,dbr)
}

function archiveDoctorsReport(casesById, indices, dbr) {
  
  let suff = ""
  if (dbr)
    suff = "_DBR"

  let [deadIds] = filterByColumnValue(casesById, indices.where_is_the_baby_now,"death",0,1)
  let [exitIds] = filterByColumnValue(casesById, indices.last_baby_room,"exit",1,1)
  let archiveIds = [...exitIds, ...deadIds]
  if (archiveIds.length > 0) {
    console.log("Archiving the following Ids:", archiveIds)
    let [archiveData] = filterCaseHistoryData_(casesById,archiveIds)
    //console.log(archiveData)
    insertData("DOCTORS_REPORT_ARCHIVE"+suff,-2,archiveData,indices,1)
    
    
    for(let i=0; i<archiveIds.length; i++)
      delete casesById[archiveIds[i]]
  }
  else
    console.log("Nothing to archive")  
  
  return casesById
}

/**
 * Generates the report for the doctors' report. Not to be run directly. Only to be used bia the printout rows tab of doctors' report
 * @param {number} reportDate - Date for which report is generated
 */
function printDoctorsReport(reportDate, dbr) {

  let suff = ""
  if (dbr)
    suff = "_DBR"

  let d = new Date(reportDate)
  console.log("Generating Report for Date", reportDate)
  console.log("Generating Report for Date", d)
  let [indices,,,data] = getData("DOCTORS_REPORT_WORKSHEET" + suff)
  let printData = []
  indices["nurse_notes_extra_space"] = data[0].length
  let extraSpace = "\n\n\n\n\n\n\n\n\n\n"
  for(let i=0; i<data.length; i++){
    let row = data[i]
    row[indices.questions_for_doctor] = row[indices.questions_for_doctor] + extraSpace
    let date = new Date(row[indices.date])
    date.setHours(0,0,0,0)
     date = date.valueOf()
    if(date == reportDate)
      printData.push(row)
  }

  //Sort by rooms (same as drs report)
  let printIndices = getIndices("DOCTORS_REPORT_PRINTOUT"+suff)
  let orderKey = drpt_getSortOrderKey(indices, "where_is_the_baby_now")
  printData = sortData(printData,orderKey)
  

  updateDataRows("DOCTORS_REPORT_PRINTOUT"+suff,printData,indices,1)
}


function reCalculateDoctorsReport(gaVerifiedIds, dbr) {
  let tabName = "DOCTORS_REPORT_WORKSHEET"
  if (dbr)
    tabName = "DOCTORS_REPORT_WORKSHEET_DBR"

  let [reportIndices, reportCases,,rawData] = getData(tabName)
  delete reportCases[''] //Remove the blank rows before further processing
  
  if(gaVerifiedIds != undefined)
    reportCases = updateColumnsById_(reportCases,reportIndices,gaVerifiedIds,["ga_status"],["verified ga"])
  calculateAndUpdateDoctorsReport_(reportIndices, reportCases,reCalculation = true, rawData, dbr)
  
}

function calculateAndUpdateDoctorsReport_(reportIndices, reportCases, reCalculation, rawData, dbr){
  let suff = ""
  if(dbr)
    suff = "_DBR"

  let orderedIds = []
  let lastRowIndices = []
  let collapseStatuses = []
  if (reCalculation != true) { //Do these operations (sorting sheet; adding extra row) only if NOT recalculating
    //Sort Data
    
    let orderKey = drpt_getSortOrderKey(reportIndices, "last_baby_room")
    orderedIds = sortCasesById(reportCases,orderKey, 0)
    
    //Add new row for the doctor's report
    reportCases = drpt_addTodaysRowForDoctorReport_(reportCases, reportIndices, dbr)
  }
  else {
    //Get the current order of ids
    for(let i=0; i<rawData.length; i++) { //For current order, will need to scan rawData; the dictionary orders keys alphabetically, destroying the natural order
      const id = rawData[i][reportIndices.id_no]
      if(orderedIds.indexOf(id) == -1)
        orderedIds.push(String(id))
    }

    //Get status of the groups (open or collapsed) to restore later
    let rangeIndices = getFirstAndLastRowIndices_(rawData,reportIndices.id_no)
    lastRowIndices = rangeIndices[1] //The expand icon is located in the last row of each baby
    firstRowIndices = rangeIndices[0] // to handle single row
    collapseStatuses = getGroupStatus_("DOCTORS_REPORT_WORKSHEET"+suff,lastRowIndices,firstRowIndices)
  }
     
  //Add derived variables for the doctor's report
  reportCases = drpt_addDerivedVariables_(reportCases, reportIndices, dbr)
   
  //Convert reportCases to case history format to update data
  let [reportCaseHistoryData]  = filterCaseHistoryData_(reportCases)
 

  idsArray = reportCaseHistoryData.map(row => row[reportIndices.id_no])
  
  
  //Sort Data by ordered IDs
  orderKey = [{column: reportIndices.id_no, ascending: 'custom', blanksAtBottom: true, sortArray: orderedIds},
              {column: reportIndices.date, ascending: true, blanksAtBottom: true}]
  reportCaseHistoryData = sortData(reportCaseHistoryData,orderKey)
  
  
  //Add blank row
  reportCaseHistoryData = addBlankRow_(reportCaseHistoryData,reportIndices.id_no)
  
  //Update data
  updateDataRows("DOCTORS_REPORT_WORKSHEET"+suff,reportCaseHistoryData,reportIndices,1)
  

  //Group rows
  groupRows_("DOCTORS_REPORT_WORKSHEET"+suff)

  //Hide actual header column (leave the 'label' header column visible)
  getTab_("DOCTORS_REPORT_WORKSHEET"+suff).hideRows(eval("DOCTORS_REPORT_WORKSHEET_HEADER_INDEX") + 1)

  if(reCalculation) //In case of recalculation, restore the status of each baby
    restoreGroupStatuses_("DOCTORS_REPORT_WORKSHEET"+suff,lastRowIndices,collapseStatuses,firstRowIndices)
}

/**
 * Adds a new row (today's row) to each baby in the doctor's report. It uses data from the previous last row
 */

function drpt_addTodaysRowForDoctorReport_(casesById, indices, dbr) {

  let fieldsToCopy = ['id_no','mother', 'father', 'birthday', 'ga_weeks', 'initial_weight', 'birthplace']
  if(dbr)
    fieldsToCopy = [...fieldsToCopy, ...["ga_weeks","ga"]]

  let today = new Date()
  console.log(today)
  today.setHours(0,0,0,0)
  console.log(`Adding a Row for Today: ${today}`)

  let ids = Object.keys(casesById)

  for(let i=0; i<ids.length; i++){
    let id = ids[i]
    let lastRow = casesById[id].case_history[casesById[id].case_history.length - 1]
    if(lastRow[indices.date].valueOf() < today.valueOf()) {
      let row = new Array(lastRow.length).fill('')
      console.log(`Inserting row of length: ${row.length} for ID: ${id}`)
      for(j=0; j<fieldsToCopy.length; j++)
        row[indices[fieldsToCopy[j]]] = lastRow[indices[fieldsToCopy[j]]]
      row[indices.date] = today
      casesById[id].case_history.push(row)
      
    }
  }
return casesById
}

/**
 * Adds different variables that require computation
 */
function drpt_addDerivedVariables_(casesById, indices, dbr) {
  
  console.log("Adding Derived Variables for all Ids in Doctor's Report")
  
  let ids = Object.keys(casesById)

  for(let i=0; i<ids.length; i++){
    console.log("Adding data for id:", ids[i])
    let caseHistory = casesById[ids[i]].case_history
    const firstRow = caseHistory[0]
    
    const initialWeight =  firstRow[indices.initial_weight]
    const ga = firstRow[indices.ga_weeks]

    let ga_days = 0
    if(dbr) 
      ga_days = firstRow[indices.ga_days] || 0

    const female =  firstRow[indices.female]
    const existingStatus = firstRow[indices.ga_status]
    //Get status by GA and weight
    let status = drpt_getWeightForGAStatus_(initialWeight,ga,ga_days,female) //Change later if both ga weeks and ga days are avilable; for now setting ga days to be 0
    
    //If GA has been verified by a manager (verified ga is already present) then remove verify ga grom the status
    if(existingStatus.indexOf("verified ga") > -1) {
      if (status.indexOf("verify ga") > -1)
        status = status.substring(0,status.indexOf("verify ga")) + "verified ga" 
      else
        status = status + "verified ga"
    }


    for(let j=0; j<caseHistory.length; j++) {
      const row = caseHistory[j]
      const todayWeight = row[indices.weight]

      //Date
      let todayDate =  row[indices.date]
      //console.log(todayDate)
      todayDate.setHours(0,0,0,0)
      todayDate = todayDate.valueOf()
      //Birthday
      let bday =  row[indices.birthday]
      bday.setHours(0,0,0,0)
      bday = bday.valueOf()
      //Set Age
      const age = (todayDate - bday)/(1000*60*60*24)
      casesById[ids[i]].case_history[j][indices.age] = age
      
      //Compute ca
      let ca
      if(ga > 0)
        ca = ga +  + Math.floor((age+3)/7)
      else
        ca = ""

      let caData
      if(dbr) {
        casesById[ids[i]].case_history[j][indices.age_wd] = Math.floor(age/7) +"W " + age%7 +"D"
        casesById[ids[i]].case_history[j][indices.ga] = ga +"W " + ga_days + "D"
        
        caData = computeCA_(ga_days,ga,bday,todayDate,1)
        casesById[ids[i]].case_history[j][indices.ca_weeks] = caData.caWeeks
        casesById[ids[i]].case_history[j][indices.ca_days] = caData.caDays
        casesById[ids[i]].case_history[j][indices.pma] = caData.caWD
        ca = caData.caWeeks
      }
      
      
      casesById[ids[i]].case_history[j][indices.corrected_age] = ca
      
      casesById[ids[i]].case_history[j][indices.ga_status] = status

      let weightPattern = [] //Array to store weightPattern; Day -1 would be index 0, -2 in 1 and -3 in 2
      let feedConsPattern = []
      let feedReqPattern = []

      for(k=j-1;k>0;k--){ //Go to earlier dates and store patterns for different variables for computation
        const prevRow = caseHistory[k]
        const dt =  prevRow[indices.date].valueOf()
        const index = (todayDate-dt)/(1000*60*60*24) - 1 //Yesterday would be index 0
        
        const weight = prevRow[indices.weight]
        if(index > -1 & (weightPattern[index] == "" | weightPattern[index] == undefined))
          weightPattern[index] = weight
        
        const feedCons = prevRow[indices.if_ebm_total_ml_consumed]
        if(index > -1 & (feedConsPattern[index] == "" | feedConsPattern[index] == undefined))
          feedConsPattern[index] = feedCons
        
        const feedReq = prevRow[indices.ml_required]
        if(index > -1 & (feedReqPattern[index] == "" | feedReqPattern[index] == undefined))
          feedReqPattern[index] = feedReq
      }
      const nDays = casesById[ids[i]].case_history[j][indices.num_of_days_for_trend]
      let [dailyChange, threeDayChange, nDayChange, weightGainValue] = drpt_computeWeightChanges_(todayWeight, initialWeight, weightPattern, age, nDays, ca)

      casesById[ids[i]].case_history[j][indices.daily_change] = dailyChange
      casesById[ids[i]].case_history[j][indices.three_day_trend] = threeDayChange
      casesById[ids[i]].case_history[j][indices.n_day_trend] = nDayChange


      //Enter simple weight change in gm
      casesById[ids[i]].case_history[j][indices.gm_gained_lost] = (weightPattern[0] > 0 && todayWeight > 0) ? todayWeight - weightPattern[0] : ""
      

      //Rewrite if data is available else leave it as is (In recalculation, it will retain whatever data already exists in that column as feed consumption form lbw tracking isn't avilable)
      casesById[ids[i]].case_history[j][indices.ml_consumed_yesterday] = feedConsPattern[0] || casesById[ids[i]].case_history[j][indices.ml_consumed_yesterday] //Yesterday's feed is in index 0
      const feedReqYest = feedReqPattern[0] 

      //Compute calculated feed quantity
      const todayFeed = casesById[ids[i]].case_history[j][indices.todays_feed] || 150 //Default value for today's feed is 150
      const fdReq = drpt_computeFeedRequired_(initialWeight,todayWeight,todayFeed,age,ga)[age]
      //console.log(`Feed Required: ${fdReq} for id: ${ids[i]} and date: ${todayDate} when using ${initialWeight}, ${todayWeight}, ${todayFeed}, ${age}, ${ga}.`)
      const feedRequired = Math.round(fdReq) || ""
      
      casesById[ids[i]].case_history[j][indices.ml_required] = feedRequired

      let propCons = Math.round(casesById[ids[i]].case_history[j][indices.ml_consumed_yesterday] * 100/ feedReqYest) || ""

      if (propCons == "Infinity" ){
        propCons = ""
      }
      
      if (propCons != "" & propCons != "Infinity"){
        propCons = propCons + "%"
      }
      casesById[ids[i]].case_history[j][indices.proportion_consumed_of_required_yesterday] = propCons
      
      if(dbr)
        casesById[ids[i]].case_history[j][indices.kmc_recommended] = drpt_getRecommendedKMC_(todayWeight, weightGainValue, caData.caWeeks)
      else
        casesById[ids[i]].case_history[j][indices.kmc_recommended] = drpt_getRecommendedKMC_(todayWeight, weightGainValue, ca)

      casesById[ids[i]].case_history[j][indices.keywords_from_notes] = matchKeywords_(row[indices.notes], ["egnorg", "sepsis", "flat", "invert", "infection", "letharg", "short"]) || row[indices.keywords_from_notes]

      casesById[ids[i]].case_history[j][indices.milk_type] = casesById[ids[i]].case_history[j][indices.milk_type]
    }
  }

  return casesById

}

/**
 * Intermediary function which calls upon other functions to compute weight changes
 */
function drpt_computeWeightChanges_(todayWeight, initialWeight, weightPattern, age, nDays, ca){
  
  //DailyChange
  
  let threeDayWeightChange = drpt_computeNDayWeightChangeInitialRef_(todayWeight, initialWeight, weightPattern, age, 3, ca)
  let [dailyChange, dailyChangeVal] = drpt_computeNDayWeightChange_(todayWeight, weightPattern, 1, ca)
  let [nDayWeightChange] = drpt_computeNDayWeightChange_(todayWeight, weightPattern, nDays, ca)
  return [dailyChange, threeDayWeightChange, nDayWeightChange, dailyChangeVal]
}

/**
 * Computes N Day weight change using initial weight as a reference (used for 3-day trend, can be modified to N day trend if needed)
 */
function drpt_computeNDayWeightChangeInitialRef_(todayWeight, initialWeight, weightPattern, age, n, ca) {

if(n==0)
  return ""

//Weight Change
let weightChange = ""
if(todayWeight != "" & todayWeight != undefined & todayWeight!= 0 & initialWeight != "" & initialWeight != undefined & initialWeight != 0){
  if(todayWeight < initialWeight)
    weightChange = `${Math.round((initialWeight - todayWeight)*(100/initialWeight))}% Loss - age${age}d`
  else if(todayWeight == initialWeight)
    weightChange = 0
  else {
    let highestWeight
    let highestWeightDay
    let tMinusNWeight
    let tMinusNDay
    for(let i=weightPattern.length-1; i>=n-1; i--){ //Check upto N days ago what the highest weight is
      const weight = weightPattern[i]
      if(weight != undefined & weight != "" & weight != 0 & (highestWeight == undefined | weight > highestWeight))       {
        highestWeight = weight
        highestWeightDay = i + 1
      }
      if(weight != "" & weight != undefined & weight != 0) {
        tMinusNWeight = weight
        tMinusNDay = i+1
      }
    }
    if (highestWeight == undefined)
      weightChange = "Gain"
    else if (todayWeight > tMinusNWeight) {
      if(ca >= 40)
        weightChange = `${Math.round((todayWeight - tMinusNWeight)/tMinusNDay)} gm/day`
      else
        weightChange = `${Math.round(((todayWeight - tMinusNWeight)*(1000/tMinusNWeight))/tMinusNDay)} gm/kg/day`
    }
    else if(tMinusNWeight == todayWeight)
      weightChange = 0
    else
      weightChange = `${Math.round((highestWeight - todayWeight)*(100/highestWeight))}% Loss - ${highestWeightDay}d ago`
    
  }
}


return weightChange

}

/**
 * Computes gain/loss in weight by comparing today's weight to the weight N days ago (used to compute # days trend and daily change)
 */
function drpt_computeNDayWeightChange_(todayWeight, weightPattern, n, ca) {

const minusNDayWeight = weightPattern[n-1] //Yesterday's weight (n=1) is stored in index 0
let change = ""
let changeVal = 0
if(todayWeight != "" & todayWeight != undefined & todayWeight!= 0 & minusNDayWeight != "" & minusNDayWeight != undefined & minusNDayWeight != 0){
  if(todayWeight < minusNDayWeight)
    change = `${Math.round((minusNDayWeight - todayWeight)*(100/minusNDayWeight))}% Loss`
  else if(todayWeight > minusNDayWeight) {
    if(ca >= 40)
      changeVal = Math.round((todayWeight - minusNDayWeight)/n) //Update change value to compute recommended KMC later
    else
      changeVal = Math.round((todayWeight - minusNDayWeight)*(1000/minusNDayWeight)/n) //Update change value to compute recommended KMC later
    if(ca >= 40) {
      if( n == 1)
        change = `${changeVal} gm Gain`
      else
        change = `${changeVal} gm/day`
    }
    else {
      if( n == 1)
        change = `${changeVal} gm/kg Gain`
      else
        change = `${changeVal} gm/kg/day`
    }
  }
  else
    change = 0
}
else
  change = ""

return [change, changeVal]
}

/**
 * Returns the Required feed as per the charts
 */
function drpt_computeFeedRequired_(initialWeight, todayWeight, todayFeed, age, ga) {
  
  let feedChartByAge = {}
  if (age > 7) {
    feedChartByAge[age] = todayWeight*todayFeed/1000
    return feedChartByAge
  }
    
  if(initialWeight >= 1000 & initialWeight < 1500 & ga <=34) {
    if (todayWeight >= 1000 & todayWeight < 1100)
      feedChartByAge = {1: 80, 2: 95, 3: 110, 4: 125, 5: 140, 6: 150, 7: 150}
    if (todayWeight >= 1100 & todayWeight < 1200)
      feedChartByAge = {1: 88, 2: 104.5, 3: 121, 4: 137.5, 5: 154, 6: 165, 7: 165}
    if (todayWeight >= 1200 & todayWeight < 1300)
      feedChartByAge = {1: 96, 2: 114, 3: 132, 4: 150, 5: 168, 6: 180, 7: 180}
    if (todayWeight >= 1300 & todayWeight < 1400)
      feedChartByAge = {1: 104, 2: 123.5, 3: 143, 4: 162.5, 5: 182, 6: 195, 7: 195}
    if (todayWeight >= 1400 & todayWeight < 1500)
      feedChartByAge = {1: 112, 2: 133, 3: 154, 4: 175, 5: 196, 6: 210, 7: 210}
    if (todayWeight >= 1500 & todayWeight < 1600)
      feedChartByAge = {1: 120, 2: 142.5, 3: 165, 4: 187.5, 5: 210, 6: 225, 7: 225}
    if (todayWeight >= 1600 & todayWeight < 1700)
      feedChartByAge = {1: 0, 2: 152, 3: 176, 4: 200, 5: 224, 6: 240, 7: 240}
    if (todayWeight >= 1700 & todayWeight < 1800)
      feedChartByAge = {1: 0, 2: 0, 3: 187, 4: 212.5, 5: 238, 6: 255, 7: 255}
    if (todayWeight >= 1800)
      feedChartByAge = {1: 0, 2: 0, 3: 0, 4: 225, 5: 252, 6: 270, 7: 270, chartNum: 1}
  }

  if(initialWeight >= 1000 & initialWeight < 1500 & ga > 34) {
    if (todayWeight >= 1000 & todayWeight < 1100)
      feedChartByAge = {1: 80, 2: 102, 3: 125, 4: 150, 5: 150, 6: 150, 7: 150}
    if (todayWeight >= 1100 & todayWeight < 1200)
      feedChartByAge = {1: 88, 2: 114, 3: 140, 4: 165, 5: 165, 6: 165, 7: 165}
    if (todayWeight >= 1200 & todayWeight < 1300)
      feedChartByAge = {1: 96, 2: 124, 3: 152, 4: 180, 5: 180, 6: 180, 7: 180}
    if (todayWeight >= 1300 & todayWeight < 1400)
      feedChartByAge = {1: 104, 2: 134, 3: 164, 4: 195, 5: 195, 6: 195, 7: 195}
    if (todayWeight >= 1400 & todayWeight < 1500)
      feedChartByAge = {1: 112, 2: 145, 3: 177, 4: 210, 5: 210, 6: 210, 7: 210}
    if (todayWeight >= 1500 & todayWeight < 1600)
      feedChartByAge = {1: 120, 2: 155, 3: 190, 4: 225, 5: 225, 6: 225, 7: 225}
    if (todayWeight >= 1600 & todayWeight < 1700)
      feedChartByAge = {1: 0, 2: 165, 3: 202, 4: 240, 5: 240, 6: 240, 7: 240}
    if (todayWeight >= 1700 & todayWeight < 1800)
      feedChartByAge = {1: 0, 2: 0, 3: 215, 4: 255, 5: 255, 6: 255, 7: 255}
    if (todayWeight >= 1800)
      feedChartByAge = {1: 0, 2: 0, 3: 0, 4: 270, 5: 270, 6: 270, 7: 270}
  }
  
  if(initialWeight >= 1500 & ga <= 34) {
    if (todayWeight >= 1400 & todayWeight < 1500)
      feedChartByAge = {1: 0, 2: 105, 3: 126, 4: 147, 5: 168, 6: 189, 7: 210}
    if (todayWeight >= 1500 & todayWeight < 1600)
      feedChartByAge = {1: 90, 2: 112.5, 3: 135, 4: 157.5, 5: 180, 6: 202.5, 7: 225}
    if (todayWeight >= 1600 & todayWeight < 1700)
      feedChartByAge = {1: 96, 2: 120, 3: 144, 4: 168, 5: 192, 6: 216, 7: 240}
    if (todayWeight >= 1700 & todayWeight < 1800)
      feedChartByAge = {1: 102, 2: 127.5, 3: 153, 4: 178.5, 5: 204, 6: 229.5, 7: 255}
    if (todayWeight >= 1800 & todayWeight < 1900)
      feedChartByAge = {1: 108, 2: 135, 3: 162, 4: 189, 5: 216, 6: 243, 7: 270}
    if (todayWeight >= 1900 & todayWeight < 2000)
      feedChartByAge = {1: 114, 2: 142.5, 3: 171, 4: 199.5, 5: 228, 6: 256.5, 7: 285}
    if (todayWeight >= 2000 & todayWeight < 2100)
      feedChartByAge = {1: 120, 2: 150, 3: 180, 4: 210, 5: 240, 6: 270, 7: 300}
    if (todayWeight >= 2100 & todayWeight < 2200)
      feedChartByAge = {1: 126, 2: 157.5, 3: 189, 4: 220.5, 5: 252, 6: 283.5, 7: 315}
    if (todayWeight >= 2200 & todayWeight < 2300)
      feedChartByAge = {1: 132, 2: 165, 3: 198, 4: 231, 5: 264, 6: 297, 7: 330}
    if (todayWeight >= 2300 & todayWeight < 2400)
      feedChartByAge = {1: 138, 2: 172.5, 3: 207, 4: 241.5, 5: 276, 6: 310.5, 7: 345}
    if (todayWeight >= 2400 & todayWeight < 2500)
      feedChartByAge = {1: 144, 2: 180, 3: 216, 4: 252, 5: 288, 6: 324, 7: 360}
    if (todayWeight >= 2500)
      feedChartByAge = {1: 150, 2: 187.5, 3: 225, 4: 262.5, 5: 300, 6: 337.5, 7: 375}
  }

  if(initialWeight >= 1500 & ga > 34) {
    if (todayWeight >= 1400 & todayWeight < 1500)
      feedChartByAge = {1: 0, 2: 126, 3: 172, 4: 210, 5: 210, 6: 210, 7: 210}
    if (todayWeight >= 1500 & todayWeight < 1600)
      feedChartByAge = {1: 90, 2: 135, 3: 180, 4: 225, 5: 225, 6: 225, 7: 225}
    if (todayWeight >= 1600 & todayWeight < 1700)
      feedChartByAge = {1: 96, 2: 144, 3: 192, 4: 240, 5: 240, 6: 240, 7: 240}
    if (todayWeight >= 1700 & todayWeight < 1800)
      feedChartByAge = {1: 102, 2: 153, 3: 204, 4: 255, 5: 255, 6: 255, 7: 255}
    if (todayWeight >= 1800 & todayWeight < 1900)
      feedChartByAge = {1: 108, 2: 162, 3: 216, 4: 270, 5: 270, 6: 270, 7: 270}
    if (todayWeight >= 1900 & todayWeight < 2000)
      feedChartByAge = {1: 114, 2: 171, 3: 228, 4: 285, 5: 285, 6: 285, 7: 285}
    if (todayWeight >= 2000 & todayWeight < 2100)
      feedChartByAge = {1: 120, 2: 180, 3: 240, 4: 300, 5: 300, 6: 300, 7: 300}
    if (todayWeight >= 2100 & todayWeight < 2200)
      feedChartByAge = {1: 126, 2: 189, 3: 252, 4: 315, 5: 315, 6: 315, 7: 315}
    if (todayWeight >= 2200 & todayWeight < 2300)
      feedChartByAge = {1: 132, 2: 198, 3: 264, 4: 330, 5: 330, 6: 330, 7: 330}
    if (todayWeight >= 2300 & todayWeight < 2400)
      feedChartByAge = {1: 138, 2: 207, 3: 276, 4: 345, 5: 345, 6: 345, 7: 345}
    if (todayWeight >= 2400 & todayWeight < 2500)
      feedChartByAge = {1: 144, 2: 216, 3: 288, 4: 360, 5: 360, 6: 360, 7: 360}
    if (todayWeight >= 2500)
      feedChartByAge = {1: 150, 2: 225, 3: 300, 4: 375, 5: 375, 6: 375, 7: 375}  
  }

  return feedChartByAge
}

/**
 * Returns the required number of KMC hours as per charts
 */
function drpt_getRecommendedKMC_(todayWeight, weightGainValue, ca) {

  if (todayWeight == "" | todayWeight == 0 | todayWeight == undefined)
    return ""
  else if(todayWeight < 1200)
    return 15
  else if(todayWeight >= 1200 & todayWeight < 1500){
    if(ca < 32) {
      if(weightGainValue > 10)
        return 12
      else
        return 15
    }
    else if(ca >=32 & ca < 34)
      return 12
    else {
      if(weightGainValue > 10)
        return 10
      else
        return 12
    }
  }
  else if(todayWeight >= 1500 & todayWeight < 1800){
    if(ca < 32)
      return 12
    else
      return 8
  }
  else {
    if(ca < 32)
      return 12
    else
      return 8
  }
}

/**
 * Returns what the status of the baby according to its GA and initial weight should be (references to the development charts hard-coded here) - SGA, ok, verify (suspicious)
 * @param {number} initialWeight - Initial Weight
 * @param {number} ga_weeks - Gestational Age in weeks
 * @param {number} ga_days - Gestational Age in days
 * @param {number} female - Dummy variable for if baby is female (1) or male (0)
 * @returns {String} - The status of the baby conjointed by ",. So if baby is both SGA and needs GA verification because too small, it will return sga, verify
 */

function drpt_getWeightForGAStatus_(initialWeight,ga_weeks,ga_days, female) {
  console.log(`Initial Weight: ${initialWeight}; GA Weeks: ${ga_weeks}; GA Days: ${ga_days}; Female: ${female}`)
  if((ga_days == "" & ga_days != 0) | ga_weeks == "" | ga_weeks == "Missing" | initialWeight == "")
    return "missing data"
  if(ga_weeks < 24)
    return "verify ga"
  let referenceWeightChart
  if(female == "no") //Set to boys only if we explicitly know that the sex is male
    referenceWeightChart = SIZE_REFERENCES_BOYS
  else
    referenceWeightChart = SIZE_REFERENCES_GIRLS
  
  //Anything above 42 weeks must use 42W + 6D reference
  if (ga_weeks > 42) {
    ga_weeks = 42
    ga_days = 6
  }
  
  const weight_5th_pct = referenceWeightChart[ga_weeks][ga_days][5] * 1000
  const weight_10th_pct = referenceWeightChart[ga_weeks][ga_days][10] * 1000
  const weight_90th_pct = referenceWeightChart[ga_weeks][ga_days][90] * 1000
  
  let status = "ok"
  if(initialWeight < weight_10th_pct)
    status = "sga"
  if (initialWeight > weight_90th_pct | initialWeight < weight_5th_pct)
    status = status + "verify ga"
  
  
  return status

}

    




function drpt_getSortOrderKey(reportIndices, roomkey){
  let orderKey = [{column: reportIndices[roomkey], ascending: 'custom', blanksAtBottom: false,
                    sortArray: ["don't know",
                                "labour wards",
                                "corridor",
                                "lobby & corridor",
                                "corridor/lift/lobby",
                                "3rd floor",
                                "4th floor",
                                "307",
                                "309",
                                "ayushman",
                                "SNCU",
                                "KMC7",
                                "KMC10",
                                "Exit",
                                "exit: prepared",
                                "exit: some preparation",
                                "exit: not prepared",
                                "exit from SNCU", 
                                "Death"]},
                    {column: reportIndices.id_no, ascending: true, blanksAtBottom: false,}]
  return orderKey
}

function drpt_getBirthplace_(caseData) {
  
  let birthplace = "missing"

  const caseHistory = caseData.case_history
  const indices = caseData.indices
  for(let i=0; i<caseHistory.length; i++) {
    const row =  caseHistory[i]
    const birthplace_row = row[indices.place_of_birth]
    const inborn = row[indices.is_the_baby_inborn]
    //We assume that the same row will have both the information on inborn as well as birthplace (the intake row essentially)
    //In all cases this should be the first row but still running the loop just in case
    if(inborn == 1) {
      birthplace = "inborn"
      return birthplace //Return (and end search)
    }
    else if (birthplace_row != "") { //Assign first non missing birthplace
      birthplace = String(birthplace_row).toLowerCase()
      break
    }
  }

  if(birthplace.indexOf("chc") > -1 | birthplace.indexOf("other") > -1)
    birthplace = "other public"
  else if (birthplace.indexOf("private") > -1)
    birthplace = "private"
  else if (birthplace.indexOf("home") > -1)
    birthplace = "home"
  else if (birthplace.indexOf("transit") > -1)
    birthplace = "transit"

  return birthplace
}

//Function to deduplicate doctor's report rows. Now with the modified merge case history funciton we shouldn't need this but still putting it in as a just in case
function drpt_deduplicate(reportCases) {
  
  let ids= Object.keys(reportCases)
  
  for(let i=0; i<ids.length; i++) {
    console.log("Deduplicating ID:", ids[i])
    let caseData = reportCases[ids[i]]
    const indices = caseData.indices
    
    let newCaseHistory = []
    const oldCaseHistory = caseData.case_history
    newCaseHistory.push(oldCaseHistory[0]) //Initialize with the first row
    
    for(let j=1; j<oldCaseHistory.length; j++) {
      const row = oldCaseHistory[j]
      let lastRow = newCaseHistory[newCaseHistory.length-1]

      const lastDt = lastRow[indices.date]
      const currentDt = row[indices.date]
      console.log(`Comparing ${lastDt} to ${currentDt}`)
      if(lastDt.valueOf() == currentDt.valueOf()) { //Perform merge
        for(let k=0; k<row.length; k++) {
          const lastElement = lastRow[k].valueOf()
          const currentElement = row[k].valueOf()
          if(lastElement == currentElement)
            continue
          else if(lastElement != "" && currentElement != "") {
            console.warn(`Conflicting entries for ID: ${ids[i]} in column index: ${k} with values ${lastElement} and ${currentElement} `)
            newCaseHistory.push(row)
            break    
          }
          else
            newCaseHistory[newCaseHistory.length-1][k] = lastRow[k] || row[k] //Take on whichever element is non empty
        }
      }
      else //Found a new row (assumes data is sorted on date)
        newCaseHistory.push(row)
    }
    console.log(`Original length: ${oldCaseHistory.length}; New length: ${newCaseHistory.length}`)
    reportCases[ids[i]].case_history = newCaseHistory
    console.log("Updated Length:", reportCases[ids[i]].case_history.length)
  }

  return reportCases

}