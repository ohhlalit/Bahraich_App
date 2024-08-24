


// PARSING SHEET FOR ENTRY FORM WORKSHEET //

/**
 *Sets the indices for the In Hospital Master (LBW Tracking) sheet. It also returns an array with the following three elements
 * Number of entries for each date: Count the number of entries for each date to generate the next id no. The code simply counts the number of intakes by each day
 * Latest entry data: Sorts the data by id and date and then stores the last row for each id (therefore it may pick any random last row if there are mutliple entries for a day)
 * Maximum Twin Id: It looks through all entries to find the maximum twin id to get the next twin id to be assigned
  
 */
function efw_getGlobalVars() {
  let globalVars = {inHospitalMasterIndex: {},
              phoneHomeMasterIndex: {},
              graduateMasterIndex: {},
              addressMasterIndex: {},
              staticMasterIndex: {},
              inHospitalExportable: [],
              phoneHomeExportable: [],
              addressExportable: [],
              staticExportable: []}
  
  return globalVars
}

function parseInHospitalMasterSheet(globalVars){
  
  let inHospitalMasterIndex

  formatTab("IN_HOSPITAL")
  let inHospData = getData("IN_HOSPITAL")
  inHospitalMasterIndex = inHospData[0]
  inHospCasesByIds = inHospData[1]
  let masterData = inHospData[3]
  masterData = sortTab("IN_HOSPITAL",inHospitalMasterIndex,masterData)
  
  formatTab("DIED_IN_ASMC")
  let [,,,deadBabiesData] = getData("DIED_IN_ASMC")
  deadBabiesData = sortTab("DIED_IN_ASMC",inHospitalMasterIndex,deadBabiesData)

  masterData = [...masterData, ...deadBabiesData]
  var maxTwinId = 0
  const findMaxTwinId = function (row) {
    let twinId = row[inHospitalMasterIndex.twin_id]
    if(parseInt(twinId) > maxTwinId){
      console.log('New TwinId =>', twinId )
      maxTwinId = twinId
    }
  }
  console.log("Generated Twin Ids")

  let today = new Date()
  today.setHours(0,0,0,0)
  today = today.valueOf()
  
  var entriesCountByDate = {}
  entriesCountByDate[today] = 0

  const findEntriesMadeToday = function (row) {
    let type = row[inHospitalMasterIndex.type_of_form]

    if(type == 'intake'){

      let date = row[inHospitalMasterIndex.date]
      date.setHours(0,0,0,0)
      date = date.valueOf()

      let entriesForDate = entriesCountByDate[date] || 0 //If no entries exist for that day it sets it to 0
      entriesCountByDate[date] = entriesForDate + 1 //Add one to the number of existing entries for that date
    }
  }

  

  let lastEntries = {}
  let activeId = ''

  for(let i = masterData.length - 1; i >=0; i--){ //Go from bottom
    let row = masterData[i]
    let id = String(row[inHospitalMasterIndex.id_no])

    findEntriesMadeToday(row)

    if(activeId !== id){
      lastEntries[id] = row
      findMaxTwinId(row)
      activeId = id
    }
  }
  console.log("Generated reference ID counters")

  console.log("Set In Hospital Master Index")
  globalVars.inHospitalMasterIndex = inHospitalMasterIndex
  return [lastEntries, maxTwinId + 1, entriesCountByDate]
}

function parsePhoneHomeMasterSheet(globalVars){
  
  let phoneHomeMasterIndex
  formatTab("PHONE_HOME")
  let phoneHomeData = getData("PHONE_HOME")
  phoneHomeMasterIndex = phoneHomeData[0]
  let masterData = phoneHomeData[3]
  masterData = sortTab("PHONE_HOME",phoneHomeMasterIndex,masterData)

  let lastEntries = {}
  let activeId = ''

  for(let i = masterData.length - 1; i >=0; i--){
    let row = masterData[i]
    let id = String(row[phoneHomeMasterIndex.id_no])
    if(activeId !== id){
      lastEntries[id] = row
      activeId = id
    }
  }

  console.log("Set Phone Home Master Index")

  globalVars.phoneHomeMasterIndex = phoneHomeMasterIndex
  return lastEntries
}

function parseGraduateFrom12AprMasterSheet(globalVars){
  
  let graduateMasterIndex

  formatTab("GRADUATE")
  let gradData = getData("GRADUATE")
  graduateMasterIndex = gradData[0]
  let masterData = gradData[3]
  masterData = sortTab("GRADUATE",graduateMasterIndex,masterData)

  let lastEntries = {}
  let activeId = ''

  for(let i = masterData.length - 1; i >=0; i--){
    let row = masterData[i]
    let id = String(row[graduateMasterIndex.id_no])
    if(activeId !== id){
      lastEntries[id] = row
      activeId = id
    }
  }

  console.log("Set Graduate Master Index")
  globalVars.graduateMasterIndex = graduateMasterIndex
  return lastEntries
}

function parseAddresses(globalVars){
  let addressMasterIndex
  let addressData = getData("ADDRESS")
  addressMasterIndex = addressData[0]
  let masterData = addressData[3]

  //This is likely redundant and is simply converting data to dictionary which the getdata function already provides; Check later-PG 2023/03/14
  let latestAddresses = {}
  masterData.forEach(row => {
    latestAddresses[row[addressMasterIndex.id_no]] = row
  })

  console.log("Set Address Master Index")

  globalVars.addressMasterIndex = addressMasterIndex
  return latestAddresses
}
