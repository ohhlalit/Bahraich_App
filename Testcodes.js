function deletedup(){
  
  let ids = getIDs("DOCTORS_REPORT_WORKSHEET_DBR")
  let [indices,databyId,,data2] = getData("STATIC")
  let inasmc = filterByColumnValue(databyId,indices["current_status"], "in ASMC")[0]
  let print = []
  for (let i =0;i<inasmc.length; i++){
    if(!ids.includes(inasmc[i])){
      print.push(inasmc[i])
    }
  }
  console.log(print)
}


function findDuplicateRows(arr) {
  let seenRows = new Set();
  let duplicateRows = new Set();

  for (let i = 0; i < arr.length; i++) {
    let rowString = JSON.stringify(arr[i]);
      if (seenRows.has(rowString)) {
          duplicateRows.add(rowString);
        } else {
          seenRows.add(rowString);
        }
  }

  // Convert the duplicate row strings back to arrays
  return Array.from(duplicateRows).map(row => JSON.parse(row));
}
function basicinfocorrection() {
  let [dataIndices,caseById,] = getData("STATIC")
  
  let count = 0;
  let ids = Object.keys(caseById);
  let dataList = [];

  for (let i = 0; i < ids.length; i++) {
    let id = ids[i];
    let caseHistory = caseById[id].case_history;

    if (caseHistory.length > 1) {
      count += 1;

      let allIdentical = caseHistory.every(row => JSON.stringify(row) === JSON.stringify(caseHistory[0]));

      if (!allIdentical) {
        console.log("ID with non-matching rows in static:", id);
      }
      
      dataList.push(caseHistory[0]); // Add only one of the rows
    } else {
      dataList.push(caseHistory[0]); // Add the single row
    }
  }

  console.log("Total IDs with more than 1 row:", count);
  

}
function twinID(){
  let[indices,casesById,] = getData('STATIC')
  let [destInd,,,data] = getData('PROCESS_MONITORING_MASTER')

  for(let i =0; i<data.length; i++){
    if(casesById[String(data[i][destInd.id_no])]){
      data[i][destInd.twin_id] = String(casesById[String(data[i][destInd.id_no])].twin_id)
      let type = data[i][destInd.final_status]
      data[i][destInd.participated] = (type == 'GRADUATED' || type == 'DEATH') ? '1' : '0'

    }
  }
  clearData_("PROCESS_MONITORING_MASTER")
  insertData('PROCESS_MONITORING_MASTER',-2,data,destInd,1,destInd)
}

function getingInitialWeight() {
  return
  let [staticIndices, casesById] = getData("STATIC");
  let [destInd, , , data] = getData("HOME_VISIT_ACTIVE_DBR");
  
  for (let i = 0; i < data.length; i++) {
    if (casesById[String(data[i][destInd.id_no])]) {
      data[i][destInd.initial_weight] = casesById[String(data[i][destInd.id_no])].initial_weight;
      console.log(casesById[String(data[i][destInd.id_no])].initial_weight, "initial weight for id:", data[i][destInd.id_no]);
    }
  }
  clearData_("HOME_VISIT_ACTIVE_DBR");
  insertData("HOME_VISIT_ACTIVE_DBR", -2, data, destInd, 1, destInd);
}





function timingcheck() {
  let [indices,,,data] = getData("PHONE_HOME_TESTING")
  console.log(indices)
  console.log(data.length)
}




function analyzePatientStatus(caseData, indices) {
  let lastExitIndex = -1
  let lastRetakeIndex = -1

  for (let rowIndex = 0; rowIndex < caseData.length; rowIndex++) {
    const type = caseData[rowIndex][indices.type].toLowerCase()
    let death = caseData[rowIndex][indices.date_to_follow_up]
    if(death == "Dead"){
      return "died out ASMC"
    }
    if (type.includes("exit")) {
      lastExitIndex = rowIndex
    } else if (type === "reintake") {
      lastRetakeIndex = rowIndex
    } 
  }

  if(lastRetakeIndex > lastExitIndex){
    return "in ASMC"
  }else{
    return "phone/home active"
  }

  
}

//trying clash once again git / clasp


function dufhkjd() {
  let a = getData("IN_HOSPITAL")
  console.log(a)
  let b = getData("IN_HOSPITAL_TESTING")
  console.log("Prankur TestPrint")
}




function testData() {
  let data = getMergedDataForSideBar21(1)
  console.log(Object.keys(data[0]))
  console.log(data[0].current_status)
}

function testRules() {
  // let tab = getTab_("DOCTORS_REPORT_ORIGINAL_WORKSHEET")
  // let rules = tab.getConditionalFormatRules()
  // for(i=0; i<rules.length; i++){
  //   let rule = rules[i]
  //   console.log("Rule No.", i)
  //   console.log(rule.getBooleanCondition().getCriteriaValues())
  //   let ranges = rule.getRanges()
  //   for(let j=0; j<ranges.length; j++)
  //     console.log(ranges[j].getA1Notation())
  // }

  var tab = getTab_("DOCTORS_REPORT_WORKSHEET")
  var range = tab.getDataRange()
  var rule = SpreadsheetApp.newConditionalFormatRule().withCriteria(SpreadsheetApp.BooleanCriteria.CUSTOM_FORMULA)

}

function testDoctorsReport(){
  let [,data,,] = getData("DOCTORS_REPORT_WORKSHEET")
  let [fdata,,] = filterCaseHistoryData_(data,Object.keys(data))
  console.log(fdata)
  updateDataRows("DOCTORS_REPORT_WORKSHEET",fdata)
}




function testMaster() {
  let a = [[100, 'A'], [200, 'B'],[300, 'C'],[400, 'D'], [500, '']]
  let orderKey = [{column: 1, ascending: 'custom', blanksAtBottom: false, sortArray: ['D', '', 'C', 'B']}]
  a = sortData(a, orderKey)
  console.log(a)
}

function dictTest() {
  let a = {'name' : "Lalit",
          'university' : "Ashoka",
          'department' : "Economics"}

  console.log(a)
  console.log(a.department)

}


let a = 20

function testing10 () {
  let a = 10
  console.log("Changed value of a")
  console.log(a)
}


function readingData() {
  let [indices,,,] = getData("PHONE_HOME")
  //let indices = inHospExportData[0]
  console.log(indices)
  return
  console.log(data)
  console.log(`Name of mother ${data[0][2]}`)
  console.log(`Name of mother ${data[0][indices["mother"]]}`)
}




function test2 () {
  //let [indices,,,submissions] = getData("IN_HOSPITAL_SUBMISSIONS")
  //let [indices,,,submissions] = getData("PHONE_HOME_SUBMISSIONS")
  // let [indices,,,submissions] = getData("ADDRESS")
  // let [indices2,,,submissions2] = getData("IN_HOSPITAL")
  let [indices3,,,] = getData("PHONE_HOME")
  // let [indices4,,,] = getData("GRADUATE")
  
  //console.log(indices)
  // console.log(indices2)
  console.log(indices3)
  // console.log(indices4)
  // //console.log(indices4
  
  
}


function test1000 () {
  let a = ""
  let b = a[0]
  console.log(b)
  let c = []
  console.log(c[0])

}


function ifTest_(arr, b) {
  let a = [...arr]
  a[2] = -1
  b = -1
  console.log(a)
}

function fillArray () {
  let arr = [4,1,10,47,90]
  let a = 10
  console.log(arr)
  ifTest_(arr,a)
  console.log(arr)
  console.log(a)
}

function myFunctionTest() {
  let dict = {'rambo':20,
              'b':30,
              'c':{'q':1, 'w':[1,2,3]}}
  let a = dict['alpha']
  console.log(a)
  if(a==undefined)
    a = ""
  console.log(`Value of a: ${a}`)

  console.log(dict)
  dict['alpha_'+ Object.keys(dict)[0]] = 20
  console.log(dict)
  let copy = JSON.parse(JSON.stringify(dict))
  copy['rambo'] = 100
  copy['c'].q = 20
  copy['c'].w[0] = 200
  console.log(dict)
  console.log(copy)

}

function sortCheck() {
  x = [[1,5],
       [2,3],
       [0,6],
       [20,0],
       [1,3],
       [0,1]]
  console.log(x.last())
}

function iterCheck() {
  let j
  for(let i=0; i<10; i++) {
    console.log(j)
    j = i > j || i
  }
}

function t3 () {
  let a = 2
  let b = 3
  let [c, d]= [5,6]
  console.log(c)
  console.log(d)
  [c, d] = [a,b]
  console.log(c)
  console.log(d)
}

function emptyArray() {
  let a = [1,2,5]
  while (a.length != 0) {
    const x = a.pop()
    switch (x) {

      case 1:
        console.log("First")
        break
      case 2:
        console.log("Second")
        break
      case 5:
        console.log("Fifth")
        break
    }
  }
  
  
}

function getcol() {
  console.log(parseColumn_("notes (about feeding, KMC, health of mother and baby, circumstances of leaving hospital"))
}
