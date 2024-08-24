function generatePreFilledCaseSheet() {
  let [,casesByIds,]= getData("MASTER_DATA")
  let [indices,inHosCasesById,]= getData("IN_HOSPITAL_TESTING")
  let [docIndices,docReportCasebyId,] = getData("DOCTORS_REPORT_WORKSHEET_DBR")
  let idsArrary = Object.keys(docReportCasebyId)

  let folder = [KMC7_PNC_CASESHEET,KMC10_CASESHEET,MISC_CASESHEET]
  for(i =0; i < folder.length;i++){
    deleteAllFilesInFolder(folder[i])
    console.log(folder[i],"files deleted")
  }
  
  
  for(let i=0; i< idsArrary.length ; i++){
    let id = idsArrary[i]
    let caseData = casesByIds[id]
    let hosData = inHosCasesById[id]
    let docReportData = docReportCasebyId[id]
    if(caseData != undefined && hosData != undefined){
      let [prefillTable,notes2ndPage,kmcGoals,breathing] = cs_createPreFilledtable(caseData, hosData, indices, docReportData,docIndices)
      let status = cs_fillTable(prefillTable,notes2ndPage,kmcGoals,breathing)
      console.log(id,status)
      let folderName = cs_getFolderName(docReportData,docIndices,hosData,indices)
     saveDoc(caseData,folderName,CASESHEET_MASTER)
      
    }
  }
  
  folder = [KMC10_CASESHEET,KMC7_PNC_CASESHEET]
  for(let i = 0; i < folder.length ;i++){
    mergeDocs(folder[i])
    console.log(folder[i],"merged file created.")
  }
}



function cs_getFolderName(docReportData,docIndices,hosData,hospIndices){
  let casesheetStarted = checkifCaseSheetStarted(hosData,hospIndices)
  let location = docReportData.where_is_the_baby_now

  if(location ==""|| location == undefined){
    if(docReportData.case_history.length >=2){
      location = docReportData.case_history[docReportData.case_history.length-2][docIndices.where_is_the_baby_now]
    }
  }
  if(location ==""|| location == undefined){
    if(docReportData.case_history.length >=3){
      location = docReportData.case_history[docReportData.case_history.length-3][docIndices.where_is_the_baby_now]
    }
  }
  let folderName
  if(location == "KMC10"){
    folderName = KMC10_CASESHEET
    console.log(docReportData.id_no)
  }
  if(location == "KMC7"||location =="3rd floor"||location =="307"|| location=="309"||location=="ayushman"||location =="corridor/lift/lobby"|| location=="lobby & corridor"){
    folderName = KMC7_PNC_CASESHEET
  }
  if(location == "SNCU"){
    if(casesheetStarted){
      folderName = KMC7_PNC_CASESHEET
    }
  }
  if(folderName == undefined){
    folderName = MISC_CASESHEET
  }
  console.log("location",location,"folder name", folderName)
  return folderName
}

function cs_createPreFilledtable(caseData, hosData,indices, docReportData,docIndices){

  //console.log(caseData.id_no)
  let motherDoctors = hosData.case_history[0][indices.mothers_doctor]
  if(hosData.case_history[0][indices.is_the_baby_inborn] == 0){
    motherDoctors ="Outborn"
  }else{
    if(motherDoctors == "" || motherDoctors == "Other ASMC Dr."){
      motherDoctors ="Dr. missing"
    }
    if(motherDoctors == ""){
      motherDoctors ="Dr. _______"
    }
  }
  
  let chartNumber = getChartNUM(caseData.initial_weight, docReportData.age,hosData.ga_weeks)
  
  if (!isNaN(chartNumber) && chartNumber == "NA" || chartNumber == undefined){
    chartNumber ="_____"
  }

  let gender = caseData.female
  gender = gender.toLowerCase().trim()
  if(gender == "yes"){
    gender = "Female"
  }else if(gender == "no"){
    gender = "Male"
  }else{
    gender = " □M  □F "
  }

  let multiple = hosData.twin_id
  let twin
  let birthOrder = hosData.case_history[0][indices.birth_order]
  if(multiple == 0){
    twin = "Single"
  }else{
    if(birthOrder == 1){
      twin = "Twin 1"
    }
    if(birthOrder == 2){
      twin = "Twin 2"
    }
    if(birthOrder == 3){
      twin = "Twin 3"
    }
    
  }
  if(twin == undefined){
    twin = " [□1st □2nd twin] "
  }


  let oneDaytrend = docReportData.daily_change
  const pattern = / - age.*/
  if(typeof oneDaytrend === 'string')
    oneDaytrend = oneDaytrend.replace(pattern, '')
  if(oneDaytrend == "")
    oneDaytrend = "_____________"

  let threeDayTrend = docReportData.three_day_trend
  if(typeof threeDayTrend === 'string')
    threeDayTrend = threeDayTrend.replace(pattern, '')

  if(threeDayTrend == "")
    threeDayTrend = "________"

  let birthday = cs_formatDate(caseData.birthday)
  let todayDateobject = new Date()
  todayDateobject.setHours(0,0,0,0)
  todayDate = cs_formatDate(todayDateobject)
  let ca = (caseData.todays_pma != "GA (weeks) is missing") ? caseData.todays_pma : ""
  let gaWeeks = (caseData.ga_weeks != "Missing") ? caseData.ga_weeks : "  "
  let gaDays = (caseData.ga_days != "") ? caseData.ga_days : "  "
  let dFollowed = calculateDFollowed(hosData.case_history,indices)
  
  let age = dateDifferenceInWeeksAndDays(caseData.birthday,todayDateobject)
  let initialWeight = (caseData.initial_weight !="No Initial Weight present") ? caseData.initial_weight : " "
  let yestWeight = ""
  if(docReportData.case_history.length >=2){
    yestWeight = docReportData.case_history[docReportData.case_history.length-2][docIndices.weight]
  }
  let mother = removeContentInBrackets(caseData.mother)
  let camorethan32weeks = processPMA(ca)
  
  
  let prefillTable = [
    ["Case sheet:  " + todayDate + `      ID No.:  ${caseData.id_no}       ${gender}     ${twin}       chart# ${chartNumber}        mL^: _________       d followed: ${dFollowed}         ${camorethan32weeks}`],
    [`m:  ${mother} `  , `skip`, `${birthday}`, `1d^: ${oneDaytrend} | 3d^: ${threeDayTrend}`, "skip"],
    [`f:  ${caseData.father}`, `skip`,`${gaWeeks} W ${gaDays} D`, `initial weight: ${initialWeight}` , ''],
    ["skip", `skip`, `${age}`, `yest. weight:  ${yestWeight}`, ''],
    ['', `skip`,`${ca}`, 'skip', ''],
    ['',`OBG: ${motherDoctors}`, 'skip', 'skip']
  ]
  
  let notes2ndPage = `Mother: ${caseData.mother}              Father: ${caseData.father}               Date: ${todayDate}                ${twin} \nWA Note:\n\n`

  let caseHistory = docReportData.case_history
  let kmcGoals
  if(caseHistory.length >=2)
    kmcGoals = caseHistory[caseHistory.length-2][docIndices.kmc_recommended]
  if(kmcGoals == undefined || kmcGoals ==""){
    kmcGoals = "KMC goal:"
  }else{
    kmcGoals = "KMC goal: " + kmcGoals
  }

  let caWeek = getPMAinweeks(ca)
  let breathing
  if(caWeek <32){
    breathing ="☑ needed"
  }else{
    breathing ="□ needed"
  }
  
  return [prefillTable,notes2ndPage,kmcGoals,breathing]
}


function cs_fillTable (prefillTable,notes2ndPage,kmcGoals,breathing){
  let document = DocumentApp.openById(CASESHEET_MASTER)
  let range = document.getBody()
  let tables = range.getTables()
  let table = tables[0]
  
  for(let rowIndex = 0; rowIndex < prefillTable.length; rowIndex++){
    let row = table.getRow(rowIndex)
    for(let colIndex = 0; colIndex < prefillTable[rowIndex].length; colIndex ++){
      //console.log(`${rowIndex}:${colIndex} -> ${prefillTable[rowIndex][colIndex]}`)
      if(prefillTable[rowIndex][colIndex] === undefined ||prefillTable[rowIndex][colIndex] == "skip") 
        continue
      else
        row.getCell(colIndex).setText(prefillTable[rowIndex][colIndex])

    }
  }

  let table2 = tables[3]
  table2.getRow(0).getCell(0).setText(notes2ndPage).setBold(true)

  let table1 = tables[2]
  table1.getRow(13).getCell(6).setText(kmcGoals)
  table1.getRow(1).getCell(7).setText(breathing).setBold(true)
  table1.getRow(5).getCell(7).setText(breathing).setBold(true)
  table1.getRow(9).getCell(7).setText(breathing).setBold(true)


  document.saveAndClose()
  return "done"
}


function generatePreFilledKMC() {
  
  let [,casesByIds,]= getData("MASTER_DATA")
  let [indices,inHosCasesById,]= getData("IN_HOSPITAL_TESTING")
  let [docIndices,docReportCasebyId,] = getData("DOCTORS_REPORT_WORKSHEET_DBR")
  let idsArrary = Object.keys(docReportCasebyId)
  let folder = [SNCU_STEPDOWN]
  for(i =0; i <= folder.length-1;i++){
    deleteAllFilesInFolder(folder[i])
  }
  
  for(let i=0; i<idsArrary.length ; i++){ 
    let id = idsArrary[i]
    let caseData = casesByIds[id]
    let hosData = inHosCasesById[id]
    let docReportData = docReportCasebyId[id]
    if(caseData != undefined && hosData != undefined){
      let folderName = kmc_getFolderName(docReportData,docIndices,hosData,indices)
      if(folderName == MICS_KMC){
        continue
      }
      let [prefillTable,notes2ndPage] = kmc_createPreFilledtable(caseData, hosData, indices, docReportData,docIndices)
      let status = kmc_fillTable(prefillTable,notes2ndPage)
      console.log(id,status)
      
      saveDoc(caseData, folderName,KMC_MASTER_FORM)
    }
  }
  
  mergeDocs(SNCU_STEPDOWN)
  
}

function kmc_createPreFilledtable(caseData, hosData,indices, docReportData,docIndices){

  let motherDoctors = hosData.case_history[0][indices.mothers_doctor]
  if(hosData.case_history[0][indices.is_the_baby_inborn] == 0){
    motherDoctors ="Outborn"
  }else{
    if(motherDoctors == "" || motherDoctors == "Other ASMC Dr."){
      motherDoctors ="Dr. missing"
    }
    if(motherDoctors == ""){
      motherDoctors ="Dr. _______"
    }
  }
  //let lastWeight = (caseData.last_weight != "No last Weight present") ? caseData.last_weight : "         "

  
  let gender = caseData.female
  gender = gender.toLowerCase().trim()
  if(gender == "yes"){
    gender = "Female"
  }else if(gender == "no"){
    gender = "Male"
  }else{
    gender = " □M  □F "
  }

  let multiple = hosData.twin_id
  let twin
  let birthOrder = hosData.case_history[0][indices.birth_order]
  if(multiple == 0){
    twin = "Single"
  }else{
    if(birthOrder == 1){
      twin = "Twin 1"
    }
    if(birthOrder == 2){
      twin = "Twin 2"
    }
    if(birthOrder == 3){
      twin = "Twin 3"
    }
    
  }
  if(twin == undefined){
    twin = " [□1st □2nd twin] "
  }

  let birthday = cs_formatDate(caseData.birthday)
  let todayDateobject = new Date()
  todayDateobject.setHours(0,0,0,0)
  todayDate = cs_formatDate(todayDateobject)
  let ca = (caseData.todays_pma != "GA (weeks) is missing") ? caseData.todays_pma : ""
  let gaWeeks = (caseData.ga_weeks != "Missing") ? caseData.ga_weeks : "  "
  let gaDays = (caseData.ga_days != "") ? caseData.ga_days : "  "
  let dFollowed = calculateDFollowed(hosData.case_history,indices)
  let initialWeight = (caseData.initial_weight !="No Initial Weight present") ? caseData.initial_weight : " "
  let yestWeight = ""
  if(docReportData.case_history.length >=2){
    yestWeight = docReportData.case_history[docReportData.case_history.length-2][docIndices.weight]
  }
  let mother = removeContentInBrackets(caseData.mother)
  
  let age = dateDifferenceInWeeksAndDays(caseData.birthday,todayDateobject)
  let prefillTable =  [ [ `KMC Stepdown Form   date:    ${todayDate}                 ID No.:  ${caseData.id_no}                  ${gender}                  ${twin}                                       d followed: ${dFollowed}`],
    [ 'skip',"skip",'skip',mother,'skip','skip','skip','skip','skip','skip','skip','skip',birthday,'skip','skip','skip','skip','feed quant & freq' ],
    [ 'f:                                      ',
      'skip',
      'skip',
      caseData.father,
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      initialWeight,
      'skip' ],
    [ 'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      `${gaWeeks} W ${gaDays} D`,
      'skip',
      'skip',
      'skip',
      yestWeight,
      'skip' ],
    [ 'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      age,
      'skip',
      'skip',
      'skip',
      'skip',
      'skip' ],
    [ `OBG: ${motherDoctors}`,
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      `${ca}`,
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip',
      'skip' ] ]



  
  let notes2ndPage = `Mother: ${caseData.mother}              Father: ${caseData.father}               Date: ${todayDate}                ${twin} \nWA Note:\n\n`
  
  return [prefillTable,notes2ndPage]
  
}

function kmc_fillTable (prefillTable,notes2ndPage){
  let document = DocumentApp.openById(KMC_MASTER_FORM)
  let range = document.getBody()
  let tables = range.getTables()
  let table = tables[0]
  
  for(let rowIndex = 0; rowIndex < prefillTable.length; rowIndex++){
    let row = table.getRow(rowIndex)
    for(let colIndex = 0; colIndex < prefillTable[rowIndex].length; colIndex ++){
      //console.log(`${rowIndex}:${colIndex} -> ${prefillTable[rowIndex][colIndex]}`)
      if(prefillTable[rowIndex][colIndex] === undefined ||prefillTable[rowIndex][colIndex] == "skip"){
        continue
      }
      else{
        row.getCell(colIndex).setText(prefillTable[rowIndex][colIndex]).setBold(true)
      }

    }
  }

  let table2 = tables[2]
  table2.getRow(0).getCell(0).setText(notes2ndPage).setBold(true)

  document.saveAndClose()
  return "done"
}


function kmc_getFolderName(docReportData,docIndices,hosData,hospIndices){
  let casesheetStarted = checkifCaseSheetStarted(hosData,hospIndices)
  let location = docReportData.where_is_the_baby_now
  if(location ==""|| location == undefined){
    if(docReportData.case_history.length >=2)
      location = docReportData.case_history[docReportData.case_history.length-2][docIndices.where_is_the_baby_now]
  }
  if(location ==""|| location == undefined){
    if(docReportData.case_history.length >=3)
      location = docReportData.case_history[docReportData.case_history.length-3][docIndices.where_is_the_baby_now]
  }
  let folderName
  if(location=="SNCU" & !casesheetStarted){
    folderName = SNCU_STEPDOWN
  }
  if(folderName == undefined){
    folderName = MICS_KMC
  }
  return folderName
}



//Helper Functions

function checkifCaseSheetStarted(hosData,hospIndices){
  let caseData = hosData.case_history
  let caseSheet = false
  
  for (let rowIndex = 0; rowIndex < caseData.length; rowIndex++) {
    const type = caseData[rowIndex][hospIndices.type_of_form].toLowerCase() 
    if (type === "case sheet") {
      caseSheet = true
    } 
  }
  caseSheet = calculateDFollowed(caseData,hospIndices,1)
  return caseSheet
}

function deleteAllFilesInFolder(folderName) {
  var myFolder = DriveApp.getFoldersByName(folderName).next();
  deleteFilesInFolder(myFolder);
}

function deleteFilesInFolder(folder) {
  var allFiles = folder.getFiles();
  while (allFiles.hasNext()) {
    var file = allFiles.next();
    file.setTrashed(true);
  }

  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    var subfolder = subfolders.next();
    deleteFilesInFolder(subfolder);
  }
}


function saveDoc(caseData, folderName,docID,docName) {
  if(docName == undefined){
    docName = `${caseData.id_no}:${caseData.mother}:${caseData.father}`; // Replace with your desired document name
  }
  // Get the folder where you want to save the document
  var folder = DriveApp.getFoldersByName(folderName).next(); // Use .next() to get the first matching folder

  // Make a copy of the document as a new Google Doc
  var doc = DriveApp.getFileById(docID)
  var docCopy = doc.makeCopy(docName,folder)
}

function mergeDocs(folderName,returnMergedID) {
  let doclist = getFolderFileIds(folderName)
  console.log(doclist)
  if(doclist.length <= 0){
    return
  }
  var folder = DriveApp.getFoldersByName(folderName).next();
  var doc = DriveApp.getFileById(doclist[0])
  let mergedoc = doc.makeCopy(`0.merged ${cs_formatDate(new Date(),1)}`,folder)
  let mergeID = mergedoc.getId()
  
  for(let i =1; i< doclist.length; i++){
    merge2Docs(mergeID,doclist[i])
  }
  if(returnMergedID == 1){
    return mergeID
  }
  saveDocAsPDF(folderName,mergeID,`0.merged ${cs_formatDate(new Date(),1)}`)
  
}

function saveDocAsPDF(folderName,docid,docname) {
  let doc =  DocumentApp.openById(docid)
  let pdfName = docname
  
  // Get the folder where you want to save the PDF
  var folder = DriveApp.getFoldersByName(folderName).next();

  // Generate the PDF
  var blob = doc.getAs('application/pdf')
  
  // Save the PDF to the folder with the desired name
  var pdfFile = folder.createFile(blob).setName(pdfName + '.pdf')
  
  var pdfUrl = pdfFile.getUrl(); // Get the URL of the PDF file

  Logger.log("PDF saved to Drive with name: " + pdfFile.getName())
  Logger.log("PDF URL: " + pdfUrl)
  //return pdfUrl // Return the PDF URL
}


function getFolderFileIds(folderName) {
  var folder = DriveApp.getFoldersByName(folderName).next();
  var fileIds = [];

  // Get a list of all files in the folder
  var files = folder.getFiles();

  while (files.hasNext()) {
    var file = files.next();
    var fileId = file.getId();

    // Convert the file ID to a string and add it to the array
    fileIds.push(fileId.toString());
  }

  return fileIds;
}

function merge2Docs(id1, idx) {
  let doc = DocumentApp.openById(id1) 
  let body = doc.getBody();

  var otherBody = DocumentApp.openById(idx).getBody();
  
  var totalElements = otherBody.getNumChildren();
  
  
  for (var j = 0; j < totalElements; ++j) {
      
      var element = otherBody.getChild(j).copy();
      var type = element.getType();
      if (type == DocumentApp.ElementType.PARAGRAPH)
        continue //Skips entering paragraph which in this case is just empty space
      else if (type == DocumentApp.ElementType.TABLE)
        body.appendTable(element);
      else if (type == DocumentApp.ElementType.LIST_ITEM)
        body.appendListItem(element);
      else if (type == DocumentApp.ElementType.INLINE_IMAGE) {
        var image = element.asInlineImage();
        var blob = image.getBlob();
        var imageFile = folder.createFile(blob);
        combinedDoc.getBody().appendImage(imageFile.getBlob());
      }
      else
        throw new Error('Unknown element type: ' + type);
  }
  
  doc.saveAndClose()
  
}


//helper for data formating

function getChartNUM(initialWeight, age, ga) {
  
  if (age > 7)
    return "NA"

  if(initialWeight >= 1000 & initialWeight < 1500 & ga <=34) {
    return 1
  }

  if(initialWeight >= 1000 & initialWeight < 1500 & ga > 34) {
    return 3
  }
  
  if(initialWeight >= 1500 & ga <= 34) {
    return 2
  }

  if(initialWeight >= 1500 & ga > 34) {
    return 4
  }
}


function cs_formatDate(date,ddmmyyFormat) {
  var day = date.getDate()
  var month = date.getMonth() + 1 // Months are 0-based, so add 1
  var year = date.getFullYear()

  // Pad day and month with leading zeros if needed
  day = String(day).padStart(2, '0')
  month = String(month).padStart(2, '0')
  if(ddmmyyFormat){
    return day + month + year
  }

  return day + '/' + month + '/' + year
}

function calculateDFollowed(caseData, indices,caseSheetIndex) {
  let lastRetakeIndex = -1
  let lastCaseSheetIndex
  let dFollowed

  for (let rowIndex = 0; rowIndex < caseData.length; rowIndex++) {
    const type = caseData[rowIndex][indices.type_of_form].toLowerCase() 
    if (type === "reintake")
      lastRetakeIndex = rowIndex
    if (type === "case sheet")
      lastCaseSheetIndex = rowIndex
  }

  if(caseSheetIndex)
    return lastCaseSheetIndex > lastRetakeIndex

 if(lastRetakeIndex == -1)
  dFollowed = caseData.length-1
 
 if(lastRetakeIndex != -1)
  dFollowed = caseData.length -lastRetakeIndex -1

 if(dFollowed == undefined)
  dFollowed = "______"
 
 return dFollowed
  
}

function dateDifferenceInWeeksAndDays(date1, date2) {
  var timeDiff = Math.abs(date1.getTime() - date2.getTime());
  var oneWeekInMillis = 1000 * 60 * 60 * 24 * 7;
  
  var weeks = Math.floor(timeDiff / oneWeekInMillis);
  var days = Math.floor((timeDiff % oneWeekInMillis) / (1000 * 60 * 60 * 24));
  
  var result = weeks + " W " + days + " D"
  return result
}

function removeContentInBrackets(inputString) {
  var startIndex = inputString.indexOf("(");
  var endIndex = inputString.indexOf(")");

  // If round brackets are not found, try square brackets
  if (startIndex === -1 || (endIndex !== -1 && endIndex < startIndex)) {
    startIndex = inputString.indexOf("[");
    endIndex = inputString.indexOf("]");
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    var contentInBrackets = inputString.substring(startIndex + 1, endIndex);
    var resultString = inputString.replace(inputString.substring(startIndex, endIndex + 1), '');
    return resultString;
  } 
  else
    return inputString;
}


function processPMA(inputString) {
  // Check if the input string is empty
  if (inputString === "") {
    return inputString;
  }
  // Use a regular expression to extract weeks and days
  var regex = /(\d+) W (\d+) D/;
  var match = inputString.match(regex);

  // Check if the regular expression matched
  if (match) {
    var weeks = parseInt(match[1], 10);
    var days = parseInt(match[2], 10);

    // Check if PMA is 32 weeks or less
    if (weeks < 32 || (weeks === 32 && days === 0)) {
      // If 32 weeks or less, add the bolded and circled text
      return "(32W or less)";
    } else {
      // If more than 32 weeks, add the text without modification
      return "";
    }
  } else {
    // If the input string doesn't match the expected pattern, return it as it is
    return "";
  }
}

function getPMAinweeks(ca){
  if(ca == ""){
    return 999
  }
  let parts = ca.split(" ")
  let firstTwoDigits = parts[0].substring(0, 2)
  return firstTwoDigits
}