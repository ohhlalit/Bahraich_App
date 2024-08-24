// to create daily entry and exit info with hospital staff

function generateDailyReport(date) {
  let [indices, caseById, , data] = getData("IN_HOSPITAL");
  let [, addCaseById,] = getData("ADDRESS");

  if (date === undefined) {
    date = new Date();
    date.setDate(date.getDate() - 1)
  }
  deleteAllFilesInFolder(ENTRY_TEMP_FOLDER)
  deleteAllFilesInFolder(EXIT_TEMP_FOLDER)

  let todayEntrydata = getEntryOrExitByData(data, indices, date, "intake")
  let todayExitdata = getEntryOrExitByData(data,indices,date,"exit")

  for(let i =0 ; i < todayEntrydata.length; i++){
    let rowData = todayEntrydata[i]
    let table = createTableForEntry(rowData,indices,addCaseById[rowData[indices.id_no]])
    let status = entry_fillTable(table, ENTRY_REPORT)
    console.log(status,rowData[indices.id_no])
    saveDoc(0 ,ENTRY_TEMP_FOLDER,ENTRY_REPORT,String(rowData[indices.id_no]))
  }

  for(let i =0; i < todayExitdata.length ; i++){
    let rowData = todayExitdata[i]
    let table = createTableForExit(rowData,indices,addCaseById[rowData[indices.id_no]])
    let status = entry_fillTable(table, EXIT_REPORT)
    console.log(status,rowData[indices.id_no])
    saveDoc(0 ,EXIT_TEMP_FOLDER,EXIT_REPORT,String(rowData[indices.id_no]))
  }

  let entryMergeId = mergeDocs(ENTRY_TEMP_FOLDER,1)
  let exitMergeId = mergeDocs(EXIT_TEMP_FOLDER,1)

  let yearFolderName = date.getFullYear().toString() + " IER";
  let monthFolderName = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + " IER" ;
  let dayFolderName = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0') + " IER";

  // Create year folder
  createFolder(PARENT_FOLDER_INTAKE_EXIT_REPORT, yearFolderName);

  // Create month folder
  createFolder(yearFolderName, monthFolderName);

  // Create day folder
  createFolder(monthFolderName, dayFolderName);

  let yyyymmdd = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0')

  if(entryMergeId != undefined){
    saveDocAsPDF(dayFolderName,entryMergeId,yyyymmdd + "_Intake_Report ")
  }
  if(exitMergeId != undefined){
    saveDocAsPDF(dayFolderName,exitMergeId,yyyymmdd + "_Exit_Report " )
  }


}

function entry_fillTable(prefillTable,docID){
  let document = DocumentApp.openById(docID)
  let range = document.getBody()
  let tables = range.getTables()
  let table = tables[0]
  for(let rowIndex = 0; rowIndex < prefillTable.length; rowIndex++){
    let row = table.getRow(rowIndex)
    for(let colIndex = 0; colIndex < prefillTable[rowIndex].length; colIndex ++){
      //console.log(`${rowIndex}:${colIndex} -> ${prefillTable[rowIndex][colIndex]}`)
      if(prefillTable[rowIndex][colIndex] === undefined ||prefillTable[rowIndex][colIndex] == ""){
        continue
      }
      else{
        row.getCell(colIndex).setText(prefillTable[rowIndex][colIndex]).setBold(true)
      }

    }
  }
  document.saveAndClose()
  return "done"
}

function getEntryOrExitByData(data, indices, date, typeOfData) {
  let typeData = data.filter(function (row) {
    return row[indices.type_of_form] === typeOfData;
  })

  let filteredData = typeData.filter(function (row) {
    let rowDate = cs_formatDate(new Date(row[indices.date]))
    let comparisonDate = cs_formatDate(date)

    return rowDate === comparisonDate
  })

  return filteredData
}


function createTableForEntry (rowData,indices,addCaseData){
  let gender = rowData[indices.female]
  gender = gender.toLowerCase().trim()
  if(gender == "yes"){
    gender = "Female"
  }else if(gender == "no"){
    gender = "Male"
  }else{
    gender = " □M  □F "
  }

  let ga
  if(rowData[indices.ga_weeks] != "" || rowData[indices.ga_days] != "" ){
    ga = rowData[indices.ga_weeks] + " W " +  rowData[indices.ga_days] + " D"
  }else{
    ga = "GA (weeks) is missing"
  }


  let table = [["",`${rowData[indices.mother]}`],
               ["",`${addCaseData.address_intake}`],
               ["",`${rowData[indices.phone_numbers]}`],
               ["",`${rowData[indices.place_of_birth]}`],
               ["",`${rowData[indices.type_of_birth]}`],
               ["",`${rowData[indices.initial_weight]}`],
               ["",`${gender}`],
               ["",`${ga}`],
               ["",`${rowData[indices.living_girls]}`],
               ["",`${rowData[indices.living_boys]}`],
               ["",`${rowData[indices.miscarriage]}`],
               ["",`${rowData[indices.sb]}`],
               ["",`${rowData[indices.nnm]}`],
               ["",`${rowData[indices.child_deaths]}`],
               ["",`${rowData[indices.notes]}`]]


return table

}

function createTableForExit (rowData,indices,addCaseData){
  let table = [["",`${rowData[indices.mother]}`],
               ["",`${cs_formatDate(rowData[indices.date])}`],
               ["",`${addCaseData.address_exit}`],
               ["",`${rowData[indices.weight]}`],
               ["",`${rowData[indices.where_is_the_baby_now]}`]]

  return table
}

function createFolder(parentFolderName, newFolderName) {

  // Get the parent folder by name
  var parentFolder = DriveApp.getFoldersByName(parentFolderName);

  // Check if the parent folder exists
  if (parentFolder.hasNext()) {
    // Get the first (and presumably only) folder with the specified name
    var folder = parentFolder.next();

    // Check if folder with the same name already exists within the parent folder
    var existingFolder = folder.getFoldersByName(newFolderName);
    if (existingFolder.hasNext()) {
      Logger.log("Folder already exists: " + newFolderName);
    } else {
      // Create a new folder within the parent folder
      var newFolder = folder.createFolder(newFolderName);
      Logger.log("Folder created: " + newFolderName);
    }
  } else {
    Logger.log("Parent folder not found: " + parentFolderName);
  }
}

