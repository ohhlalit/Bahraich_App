function archiveDeadBabies() {
  
  console.log("Archiving Dead Babies")
  //Get In Hospital Data 
  let [inHospIndices, inHospDataById,,] = getData("IN_HOSPITAL")
  //Get IDs of dead babies from in-hospital
  let [inHospDeadBabyIds,] = filterByColumnValue(inHospDataById,inHospIndices["where_is_the_baby_now"],"death")
  
  //Move data for babies identified dead in the in-hospital tab
  if (inHospDeadBabyIds.length > 0) {
    let inHospDeadBabyIdsAfterJuly = checkIntakeDate(inHospDeadBabyIds)
    
    makePMEntry("DEATH",inHospDataById,inHospDeadBabyIdsAfterJuly,"Auto detection in 'in-hospital'", "Automatic")

    moveData("IN_HOSPITAL","DIED_IN_ASMC",inHospDeadBabyIds,6,1)

    moveFromPhoneHomeToOthers(inHospDeadBabyIds,"PHONE_HOME_DIED_IN_ASMC","Automatic", 1)
    moveData("GRADUATE","PHONE_HOME_DIED_IN_ASMC",inHospDeadBabyIds,6,1,1)
    
    updateLastRowColumnsById_("GRAD_SUGGESTIONS",inHospDeadBabyIds,["grad_status"],[5],1)
    moveData("GRAD_SUGGESTIONS","GRAD_RESOLVED",inHospDeadBabyIds,2,1,1)
  }
  else 
    console.log("No dead babies found in 'In-hospital'. Yay!")
  
  //Move data for babies identified dead in phone/home
  let [phIndices, phDataById,,] = getData("PHONE_HOME")
  let [phDeadBabyIds,] = filterByColumnValue(phDataById,phIndices["date_to_follow_up"],"Dead")
  let [gradBabyInphonehome,] = filterByColumnValue(phDataById,phIndices["date_to_follow_up"],"grad")
  let deadBabyIdsForPMEntry = phDeadBabyIds.filter(function(id) {
    return !gradBabyInphonehome.includes(id)
  })


  if (phDeadBabyIds.length > 0) {
    let deadBabyIdsForPMEntryAfterJuly = checkIntakeDate(deadBabyIdsForPMEntry)
   
    makePMEntry("DEATH",phDataById,deadBabyIdsForPMEntryAfterJuly,"Auto detection in 'phone/home'", "Automatic")

    moveFromPhoneHomeToOthers(phDeadBabyIds,"DIED_OUT_ASMC","Automatic", 1)

    moveData("FORMULA_ACTIVE","FORMULA_BABY_DIED",phDeadBabyIds,-1,1,1)
    
    
    updateLastRowColumnsById_("GRAD_SUGGESTIONS",phDeadBabyIds,["grad_status"],[5],1)
    moveData("GRAD_SUGGESTIONS","GRAD_RESOLVED",phDeadBabyIds,2,1,1)
  }
  else
    console.log("No dead babies found in 'phone/home'. Yay!")

  //Move data for babies identified dead in grad
  let [gradIndices, gradDataById,,] = getData("GRADUATE")
  let [gradDeadBabyIds,] = filterByColumnValue(gradDataById,gradIndices["status"],"Dead",0,0)
  if (gradDeadBabyIds.length > 0) {
    
    makePMEntry("DEATH",gradDataById,gradDeadBabyIds,"Auto archive in 'graduate'", "Automatic")
    
    moveData("GRADUATE","DIED_OUT_ASMC",gradDeadBabyIds,6,1)
  }
  else
    console.log("No dead babies found in 'graduate'. Yay!")

}

function checkIntakeDate(idsArray) {
  let outputIDs = []
  const targetDate = new Date('2023-07-31') // July 31, 2023
  let date = extractIntakeDateFromId_

  for (let i = 0; i < idsArray.length; i++) {
    let id = idsArray[i]
    let date = extractIntakeDateFromId_(id)
    if(typeof date === 'string'){
      continue
    } 
    // Compare the date with the target date
    if (date > targetDate) {
      outputIDs.push(id)
    }
  }

  return outputIDs
}



function archiveDeadBabies_dbr() {
  
  console.log("Archiving Dead Babies")
  //Get In Hospital Data 
  let [inHospIndices, inHospDataById] = getData("IN_HOSPITAL_TESTING")
  //Get IDs of dead babies from in-hospital
  let inHospDeadBabyIds = filterByColumnValue(inHospDataById,inHospIndices["where_is_the_baby_now"],"death")[0]
  
  //Move data for babies identified dead in the in-hospital tab
  if (inHospDeadBabyIds.length > 0)
    moveBabies_dbr(inHospDeadBabyIds,"Died in ASMC","Auto detection in 'In-hospital'","Automatic")
  else 
    console.log("No dead babies found in 'In-hospital'. Yay!")
  
  //Move data for babies identified dead in phone/home
  let [phIndices, phDataById] = getData("PHONE_HOME_TESTING")
  let phDeadBabyIds = filterByColumnValue(phDataById,phIndices["date_to_follow_up"],"Dead")[0]


  if (phDeadBabyIds.length > 0)
    moveBabies_dbr(phDeadBabyIds,"Died out of ASMC","Auto detection in 'phone/home'","Automatic")
  else
    console.log("No dead babies found in 'phone/home'. Yay!")
}






