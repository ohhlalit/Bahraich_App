function t45(){
  let [indices,,,missingdata] = getData("MISSING")
  let[,,,data] = getData("ARCHIVE_ADDRESS")
  let count =0
  let sheet = SpreadsheetApp.openById("1MTrqGvbcVY2D4foCWVUaaH83Fc5KVuOOyqBpXN7tUdA").getSheetByName("missing address active")
  let archiveColumn = sheet.getRange('L1:L500')
  for (let i =0; i<missingdata.length; i++){
    for(let j =0; j <data.length; j++){
      if(missingdata[i][indices.id_no].toString()==data[j][0].toString()){
        archiveColumn.getCell(i + 2, 1).setValue(1)
        count++
      }
    
    }
  }
  
  console.log("no. of ids found in archive", count)
  
}

function checkMissingExits() {
  let missingIDs = getIDs("MISSING")
  
  let[inHospIndices,inHospCases] = getData("IN_HOSPITAL")
  let [foundInHospCases, ,notfoundIds] = filterCasesById_(inHospCases,missingIDs) //See which of the missing ids are in in-hospital

  let[diedAsmcIndices,diedCases] = getData("DIED_IN_ASMC")
  let [foundInDiedAsmcCases, ,notfoundIdsInDied] = filterCasesById_(diedCases,missingIDs) //See which of the missing ids are in died in ASMC

  let [inHospExitIds] = filterByColumnValue(foundInHospCases,inHospIndices.type_of_form,"xit",0,1) //Check out of those in hospital cases which have missing address how many have an exit form
  let [diedInAsmcExitIds] = filterByColumnValue(foundInDiedAsmcCases,diedAsmcIndices.type_of_form,"xit",0,1) //Check same thing for babies in diedinAsmc

  console.log("Total Missing Ids:", missingIDs.length) 
  console.log("Ids found in InHospital:", Object.keys(foundInHospCases).length) 
  console.log("Ids Not found in InHospital:", notfoundIds.length)
  console.log("Exit Forms found in In Hospital:", inHospExitIds.length) 
  console.log("Ids found in DiedInASMC:", Object.keys(foundInDiedAsmcCases).length) 
  console.log("Ids Not found in DiedInASMC:", notfoundIdsInDied.length)
  console.log("Exit Forms found in Died in ASMC:", diedInAsmcExitIds.length)

  //Check overlapping ids between in hospital and died in asmc
  let inHospIDs = Object.keys(inHospCases)
  let [overlappingCases] = filterCasesById_(diedCases,inHospIDs)
  console.log("Total number of overlapping cases:", Object.keys(overlappingCases).length)
  console.log("Overlapping IDs between Died in ASMC and In Hospital:", Object.keys(overlappingCases))
  

}

function t7879(){
  let [a, ,,entryData] = getData("IN_HOSPITAL_SUBMISSIONS_EXPORTED_OLD")
  let [b,,, data] = getData("MISSING")
  console.log(a)
  let intakeData = entryData.filter(function(row) {
    return row[a.type_of_form] === "intake"
  })

  let exitData = entryData.filter(function(row) {
    return row[a.type_of_form].toString().trim().toLowerCase() === "exit"
  })
  
  let count = 0

  var sheet = SpreadsheetApp.openById("1MTrqGvbcVY2D4foCWVUaaH83Fc5KVuOOyqBpXN7tUdA").getSheetByName("missing address active")
  // var intakeblockColumn = sheet.getRange('G1:G500')
  // var addressIntakeColumn = sheet.getRange('H1:H500')
  var testColumn = sheet.getRange('K1:K500')
  var exitblockColumn = sheet.getRange('E1:E500')
  var addressExitColumn = sheet.getRange('G1:G500')
  

  
  for (let i =0; i<data.length; i++){
    for(let j =0; j <intakeData.length; j++){
      if(data[i][b.mother].toString()===intakeData[j][a.mother].toString() && data[i][b.father].toString()===intakeData[j][a.father].toString()){
        count++
        if(data[i][b.intake_date]===intakeData[j][a.date]){
          console.log("date don't match", data[i][b.id_no])
        }

        // intakeblockColumn.getCell(i + 2, 1).setValue(intakeData[j][a.block])
        // addressIntakeColumn.getCell(i + 2, 1).setValue(intakeData[j][a.address_on_intake])
        // testColumn.getCell(i + 2, 1).setValue(intakeData[j][a.mother])
        if(intakeData[j][a.block]!="" || intakeData[j][a.address_on_intake] != ""){
          //count++
        }
      }
    }
    
  }
  

  let countExit = 0
  for (let i =0; i<data.length; i++){
    for(let j =0; j <exitData.length; j++){
      
      if (data[i][b.id_no].toString().trim() === exitData[j][a.ref_id__exit]?.toString().trim()){
        
        countExit++

        // exitblockColumn.getCell(i + 2, 1).setValue(exitData[j][a.block_exit])
        // addressExitColumn.getCell(i + 2, 1).setValue(exitData[j][a.address])
        // testColumn.getCell(i + 2, 1).setValue(exitData[j][a.ref_id_exit])
        
        if(exitData[j][a.block_exit]!="" || exitData[j][a.address] != ""){
          //countExit++
        }
      }
    }
    
  }
  console.log("total id found in intake", count, data.length)
  console.log("total id found in exit", countExit, exitData.length)
  
}



// function trimDates() {
//   var spreadsheetId = "1sfHtQanFG5i4fSfgVg7YL9YLRABvrGMeBSO5YtQdk7c";
//   var sheetName = "grad resolved";
//   var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
//   var dateColumn = sheet.getRange('K1:K' + sheet.getLastRow());
//   var dates = dateColumn.getValues();
//   var count = 0;

//   for (var i = 1; i < dates.length; i++) {
//     var date = dates[i][0];
//     if (typeof date === 'object' && date instanceof Date) {
//       var trimmedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
//       count++;
//       dateColumn.getCell(i + 1, 1).setValue(trimmedDate); // Uncomment this line to set trimmed date values in the same column
//     } else if (typeof date === 'string') {
//       var trimmedDate = date.split('T')[0];
//       count++;
//       dateColumn.getCell(i + 1, 1).setValue(trimmedDate); // Uncomment this line to set trimmed date values in the same column
//     }
//   }

//   console.log("Count: " + count);
// }
